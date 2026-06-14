import 'express';

/** Shape of the authenticated principal attached to the request by auth middleware. */
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
