import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/auth.js';
import { TokenExpiredException, UnauthorizedException } from '../utils/errors.js';

export const jwtAuthenticateSDK = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedException('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    next(new Error('JWT_SECRET is not configured'));
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS512'] }) as JwtPayload;
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new TokenExpiredException());
      return;
    }
    next(new UnauthorizedException('Invalid token'));
  }
};
