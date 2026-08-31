import type { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
  companyId: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
