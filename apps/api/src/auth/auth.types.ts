export type JwtPayload = {
  sub: string;
  email?: string;
  username: string;
  role: string;
  verified?: boolean;
  purpose?: 'email-verify';
  tv?: number;
};
