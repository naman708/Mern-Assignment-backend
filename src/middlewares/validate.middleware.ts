import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/**
 * Runs a set of express-validator chains and, if any fail, throws a 422 with a
 * compact `{ field, message }[]` list. Keeps controllers free of validation glue.
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(chains.map((chain) => chain.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const details = result.array().map((err) => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
    }));
    throw ApiError.unprocessable('Validation failed', details);
  };
}
