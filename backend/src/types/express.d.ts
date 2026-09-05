import type { AuthContext } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth middleware after JWT verification. */
      auth?: AuthContext;
    }
  }
}

export {};