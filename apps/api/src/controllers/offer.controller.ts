import type { Request, Response } from "express";
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";
import {
  createOffer,
  listOffers,
  getOfferById,
  getOfferByCode,
  updateOffer,
  deleteOffer,
  previewOffer,
} from "../services/offer.service";

export async function listOffersHandler(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const isActiveRaw = req.query.isActive;
  const isActive =
    isActiveRaw !== undefined ? isActiveRaw === "true" : undefined;

  const { offers, total } = await listOffers({ page, limit, isActive });
  sendPaginated(res, offers, { page, limit, total });
}

export async function getOfferHandler(req: Request, res: Response) {
  const offer = await getOfferById(req.params.id);
  sendSuccess(res, offer);
}

export async function getOfferByCodeHandler(req: Request, res: Response) {
  const offer = await getOfferByCode(req.params.code.toUpperCase());
  sendSuccess(res, offer);
}

export async function previewOfferHandler(req: Request, res: Response) {
  const { code, orderTotal } = req.body as { code: string; orderTotal: number };
  const result = await previewOffer(code.toUpperCase(), orderTotal);
  sendSuccess(
    res,
    result,
    200,
    result.applicable ? "Offer applicable" : result.reason,
  );
}

export async function createOfferHandler(req: Request, res: Response) {
  const offer = await createOffer(req.body);
  sendCreated(res, offer, "Offer created");
}

export async function updateOfferHandler(req: Request, res: Response) {
  const offer = await updateOffer(req.params.id, req.body);
  sendSuccess(res, offer, 200, "Offer updated");
}

export async function deleteOfferHandler(req: Request, res: Response) {
  await deleteOffer(req.params.id);
  sendNoContent(res);
}
