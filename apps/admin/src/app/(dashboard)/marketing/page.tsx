"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { formatDateTime } from "../../../lib/utils";
import type { Broadcast, BroadcastTarget } from "../../../types";

const TARGET_OPTIONS: {
  value: BroadcastTarget;
  label: string;
  desc: string;
}[] = [
  { value: "ALL", label: "Everyone", desc: "All registered users" },
  {
    value: "CUSTOMER",
    label: "Customers Only",
    desc: "Users with CUSTOMER role",
  },
  { value: "DRIVER", label: "Drivers Only", desc: "Users with DRIVER role" },
  {
    value: "INACTIVE",
    label: "Inactive Users",
    desc: "Users inactive for N days",
  },
  {
    value: "SELECTED",
    label: "Specific Users",
    desc: "Enter comma-separated user IDs",
  },
];

type BroadcastForm = {
  title: string;
  body: string;
  target: BroadcastTarget;
  userIds: string;
  inactiveDays: string;
};

const EMPTY_FORM: BroadcastForm = {
  title: "",
  body: "",
  target: "ALL",
  userIds: "",
  inactiveDays: "30",
};

export default function MarketingPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<BroadcastForm>(EMPTY_FORM);
  const [sentResult, setSentResult] = useState<{
    recipientCount: number;
    broadcastId: string;
  } | null>(null);

  const { data: broadcastsRes, isLoading } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: () => adminApi.listBroadcasts({ limit: 20 }),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      adminApi.sendBroadcast({
        title: form.title.trim(),
        body: form.body.trim(),
        target: form.target,
        userIds:
          form.target === "SELECTED"
            ? form.userIds
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        inactiveDays:
          form.target === "INACTIVE" ? Number(form.inactiveDays) : undefined,
      }),
    onSuccess: (result) => {
      setSentResult({
        recipientCount: result.recipientCount,
        broadcastId: result.broadcastId,
      });
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
    },
  });

  const broadcasts: Broadcast[] = broadcastsRes?.data ?? [];

  const targetLabel = (target: string) =>
    TARGET_OPTIONS.find((t) => t.value === target)?.label ?? target;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Compose Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Send Broadcast Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sentResult && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                  ✓ Sent to{" "}
                  <strong>{sentResult.recipientCount} recipients</strong>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="bc-title">Title *</Label>
                <Input
                  id="bc-title"
                  placeholder="Notification title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bc-body">Message *</Label>
                <Textarea
                  id="bc-body"
                  placeholder="Notification body text"
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bc-target">Audience *</Label>
                <Select
                  id="bc-target"
                  value={form.target}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      target: e.target.value as BroadcastTarget,
                    });
                    setSentResult(null);
                  }}
                >
                  {TARGET_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </Select>
              </div>

              {form.target === "SELECTED" && (
                <div className="space-y-1.5">
                  <Label htmlFor="bc-userids">User IDs (comma separated)</Label>
                  <Textarea
                    id="bc-userids"
                    placeholder="uuid1, uuid2, uuid3"
                    rows={3}
                    value={form.userIds}
                    onChange={(e) =>
                      setForm({ ...form, userIds: e.target.value })
                    }
                  />
                </div>
              )}

              {form.target === "INACTIVE" && (
                <div className="space-y-1.5">
                  <Label htmlFor="bc-inactive">Inactive for (days)</Label>
                  <Input
                    id="bc-inactive"
                    type="number"
                    min={1}
                    value={form.inactiveDays}
                    onChange={(e) =>
                      setForm({ ...form, inactiveDays: e.target.value })
                    }
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => {
                  setSentResult(null);
                  sendMutation.mutate();
                }}
                disabled={
                  !form.title.trim() ||
                  !form.body.trim() ||
                  sendMutation.isPending
                }
              >
                <Send size={15} className="mr-2" />
                {sendMutation.isPending ? "Sending…" : "Send Notification"}
              </Button>

              {sendMutation.isError && (
                <p className="text-sm text-destructive">
                  Failed to send. Please try again.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Broadcast History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 mb-2" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                {!isLoading && broadcasts.length === 0 && (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No broadcasts sent yet
                  </p>
                )}
                {broadcasts.map((bc) => (
                  <div key={bc.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 truncate">
                          {bc.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                          {bc.body}
                        </p>
                      </div>
                      <Badge variant="info" className="shrink-0 text-xs">
                        {targetLabel(bc.target)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {bc.sentAt
                        ? `Sent ${formatDateTime(bc.sentAt)}`
                        : `Created ${formatDateTime(bc.createdAt)}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
