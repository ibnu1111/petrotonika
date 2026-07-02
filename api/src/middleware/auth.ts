import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-that-is-long-enough';
    const decoded = jwt.verify(token, secret) as { id: number; username: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

export const generateToken = (user: { id: number; username: string; role: string }) => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-that-is-long-enough';
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};
