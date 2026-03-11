import type { AnyZodObject, ZodEffects } from "zod";
import type { Request, Response, NextFunction } from "express";

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;
type RequestTarget = "body" | "query" | "params";

/**
 * Zod validation middleware factory.
 * Parses and strips unknown keys from the specified request target.
 * On failure, throws a ZodError which is caught by the global errorHandler.
 *
 * @example
 * router.post('/', validate(createOrderSchema), orderController.create)
 * router.get('/', validate(paginationSchema, 'query'), orderController.list)
 */
export function validate(schema: ZodSchema, target: RequestTarget = "body") {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      // Replace with parsed value (strips unknown fields, coerces types)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any)[target] = parsed;
      next();
    } catch (err) {
      // ZodError — passed to global errorHandler for consistent formatting
      next(err);
    }
  };
}
