/**
 * WhatsApp Business messaging client.
 *
 * Supports two providers, switched via WHATSAPP_PROVIDER env var:
 *   • meta   — Meta WhatsApp Cloud API  (production, official)
 *   • twilio — Twilio WhatsApp sandbox  (testing / lower-volume)
 *
 * For Meta, marketing messages MUST use pre-approved templates.
 * Provide `templateName` + `templateParams` for template messages,
 * or omit for a free-text message (utility / session window only).
 */

import { env } from "../config/env";
import { logger } from "../config/logger";

export interface WhatsAppPayload {
  /** Recipient in E.164 format — e.g. +919876543210 */
  to: string;
  /** Free-form text body (session / opted-in only) */
  text?: string;
  /** Approved template name (required for marketing outside session window) */
  templateName?: string;
  /** Positional variable substitutions for the template, e.g. ["Ayush", "50%"] */
  templateParams?: string[];
  /** ISO 639-1 language code for template; defaults to "en" */
  templateLanguage?: string;
}

// ── Meta Cloud API ─────────────────────────────────────────────────────────────

async function sendViaMeta(payload: WhatsAppPayload): Promise<void> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "Meta WhatsApp credentials are not configured " +
        "(WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)",
    );
  }

  // Strip the leading '+' — Meta expects digits-only recipient
  const recipient = payload.to.replace(/^\+/, "");

  const body = payload.templateName
    ? {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: payload.templateName,
          language: {
            code: payload.templateLanguage ?? "en",
          },
          ...(payload.templateParams?.length
            ? {
                components: [
                  {
                    type: "body",
                    parameters: payload.templateParams.map((value) => ({
                      type: "text",
                      text: value,
                    })),
                  },
                ],
              }
            : {}),
        },
      }
    : {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: payload.text ?? "" },
      };

  const url = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Meta WhatsApp API error ${res.status}: ${errBody}`);
  }
}

// ── Twilio WhatsApp ────────────────────────────────────────────────────────────

async function sendViaTwilio(payload: WhatsAppPayload): Promise<void> {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_WHATSAPP_FROM
  ) {
    throw new Error(
      "Twilio WhatsApp credentials are not configured " +
        "(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)",
    );
  }

  const { default: Twilio } = await import("twilio");
  const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  const body = payload.templateName
    ? // Twilio Content Templates use the Content SID, but simple templates can
      // be sent as text with variables substituted by the caller
      (payload.text ?? payload.templateName)
    : (payload.text ?? "");

  await client.messages.create({
    from: env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${payload.to}`,
    body,
  });
}

// ── Public interface ── ────────────────────────────────────────────────────────

/**
 * Send a single WhatsApp message.
 * Throws on hard errors (bad credentials, 4xx from provider).
 * The caller is responsible for retry logic.
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppPayload,
): Promise<void> {
  if (env.WHATSAPP_PROVIDER === "twilio") {
    return sendViaTwilio(payload);
  }
  return sendViaMeta(payload);
}

/**
 * Send to multiple recipients in parallel batches.
 * Respects WhatsApp Cloud API rate limits (~80 msg/s for meta).
 *
 * @param recipients  Array of E.164 phone numbers
 * @param payload     Message content (without `to`)
 * @param batchSize   Messages per batch (default 50)
 * @param delayMs     Pause between batches in ms (default 1 000)
 * @returns           { sent, failed } counts
 */
export async function broadcastWhatsApp(
  recipients: string[],
  payload: Omit<WhatsAppPayload, "to">,
  batchSize = 50,
  delayMs = 1_000,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((to) => sendWhatsAppMessage({ ...payload, to })),
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        sent++;
      } else {
        failed++;
        logger.warn("WhatsApp send failed", { reason: r.reason });
      }
    }

    // Rate-limit pause between batches (skip after last batch)
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { sent, failed };
}
