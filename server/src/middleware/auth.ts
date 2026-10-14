import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'stackpulse-super-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please sign in.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded) {
      res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
      return;
    }
    req.user = { id: decoded.id, email: decoded.email };
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (!err && decoded) {
      req.user = { id: decoded.id, email: decoded.email };
    }
    next();
  });
}

export function generateToken(user: { id: number; email: string }): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}
