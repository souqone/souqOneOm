export interface LoginMethodsUser {
  passwordHash?: string | null;
  email?: string | null;
  emailVerifiedAt?: Date | null;
  isVerified?: boolean | null;
  googleId?: string | null;
  appleSub?: string | null;
  phoneE164?: string | null;
  phoneVerifiedAt?: Date | null;
}

export interface LoginMethodsResult {
  hasPassword: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
  hasPhone: boolean;
  totalMethods: number;
}

/**
 * Checks whether phone (WhatsApp OTP) login is available based on environment configuration,
 * mirroring the exact provider selection logic in whatsapp-sender.provider.ts.
 */
export function isPhoneLoginAvailable(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const isProd = env.NODE_ENV === 'production';
  const provider = (env.WHATSAPP_PROVIDER || '').trim().toLowerCase();
  const phoneId = (env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const token = (env.WHATSAPP_ACCESS_TOKEN || '').trim();

  if (provider === 'disabled') {
    return false;
  }

  if (isProd) {
    // In production, WhatsApp OTP requires Meta provider with credentials;
    // otherwise it falls back to DisabledWhatsappOtpSender (sending is disabled).
    return provider === 'meta' && Boolean(phoneId) && Boolean(token);
  }

  // Non-production (development, test)
  if (provider === 'meta') {
    return Boolean(phoneId && token);
  }

  // In non-production, default fallback is MockWhatsappOtpSender (sending is available)
  return true;
}

/**
 * Inspects all verified, active login methods available for a user.
 * - Password: requires passwordHash + email + (emailVerifiedAt or isVerified)
 * - Google: requires linked googleId
 * - Apple: requires linked appleSub
 * - Phone: requires phoneE164 + phoneVerifiedAt + phone login actively available
 */
export function getLoginMethods(
  user: LoginMethodsUser | null | undefined,
  env: Record<string, string | undefined> = process.env,
): LoginMethodsResult {
  if (!user) {
    return {
      hasPassword: false,
      hasGoogle: false,
      hasApple: false,
      hasPhone: false,
      totalMethods: 0,
    };
  }

  const hasPassword = Boolean(
    user.passwordHash &&
      user.email &&
      user.isVerified,
  );

  const hasGoogle = Boolean(user.googleId);
  const hasApple = Boolean(user.appleSub);

  const phoneAvailable = isPhoneLoginAvailable(env);
  const hasPhone = Boolean(user.phoneE164 && user.phoneVerifiedAt && phoneAvailable);

  const totalMethods =
    Number(hasPassword) + Number(hasGoogle) + Number(hasApple) + Number(hasPhone);

  return {
    hasPassword,
    hasGoogle,
    hasApple,
    hasPhone,
    totalMethods,
  };
}
