import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 does not forward rejections from async handlers to the error
// middleware. Wrap async handlers so thrown/rejected errors reach next(err).
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
