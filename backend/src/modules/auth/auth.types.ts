import { UserRole, UserStatus } from '@prisma/client';

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginInput {
  identifier: string; // phone or email
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}
