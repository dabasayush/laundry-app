import type { Response } from "express";
import { StatusCodes } from "http-status-codes";

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = StatusCodes.OK,
  message?: string,
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({ success: true, message, data });
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string,
): Response {
  return sendSuccess(res, data, StatusCodes.CREATED, message);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  extra?: Record<string, unknown>,
): Response<PaginatedResponse<T>> {
  const { page, limit, total } = pagination;
  return res.status(StatusCodes.OK).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      ...extra,
    },
  });
}

export function sendNoContent(res: Response): Response {
  return res.status(StatusCodes.NO_CONTENT).send();
}
