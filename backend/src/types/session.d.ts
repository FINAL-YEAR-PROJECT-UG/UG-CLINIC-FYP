import 'express-session';

export interface SessionUserData {
  id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  studentId?: string | null;
  phone?: string | null;
  program?: string | null;
  isActive?: boolean;
  [key: string]: any;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUserData;
  }
}
