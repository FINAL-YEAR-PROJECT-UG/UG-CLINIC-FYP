import { NextFunction, Request, Response } from 'express';

const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error('Route not found') as Error & { statusCode: number };
  error.statusCode = 404;
  next(error);
};

export default notFound;
