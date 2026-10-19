import { VERIFICATION_CODE_TTL_MINUTES } from '../auth/auth.constants';

export const BRAND_NAME = 'SouqOne';
export const BRAND_LOGO_URL = 'https://res.cloudinary.com/souqone/image/upload/brand/logo.png';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validateCode(code: string): string {
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Invalid verification code: must be a 6-digit numeric string');
  }
  return escapeHtml(code);
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

/**
 * Builds official Arabic verification email matching Direction C.
 */
export function buildVerificationEmail({ code }: { code: string }): EmailTemplateResult {
  const safeCode = validateCode(code);
  const ttlMinutes = VERIFICATION_CODE_TTL_MINUTES;
  const currentYear = new Date().getFullYear();

  const subject = `رمز التحقق من البريد الإلكتروني — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #FFFFFF;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 480px) {
      .outer-shell {
        padding: 20px 16px !important;
      }
      .card-shell {
        width: 100% !important;
      }
      .content-block {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    أكد بريدكم الإلكتروني في ${BRAND_NAME}. ينتهي الرمز خلال ${ttlMinutes} دقيقة.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Outer Centering Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <!-- Main Card Container (Max 600px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">رمز التحقق من البريد الإلكتروني</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 440px; margin: 0 auto; text-align: center;">
                
      <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">عزيزي المستخدم،</p>
      <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">نرحب بانضمامكم إلى منصة <bdi dir="ltr">${BRAND_NAME}</bdi>. يرجى استخدام رمز التحقق التالي لتأكيد بريدكم الإلكتروني وإتمام إنشاء الحساب:</p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 20px auto 20px auto;">
        <tr>
          <td align="center" style="border: 1.5px solid #009CB5; border-radius: 8px; padding: 16px 28px; text-align: center; background-color: #FFFFFF;">
            <div dir="ltr" id="otp-box" style="font-family: 'Courier New', Courier, monospace, Tahoma; font-size: 34px; font-weight: bold; letter-spacing: 12px; color: #11232E; text-align: center; unicode-bidi: isolate;"><bdi dir="ltr">${safeCode}</bdi></div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">ينتهي هذا الرمز خلال <bdi dir="ltr">${ttlMinutes}</bdi> دقيقة من وقت إرساله.</p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
    
              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME}</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار، يسعدنا تواصلكم عبر البريد: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

عزيزي المستخدم،

نرحب بانضمامكم إلى منصة ${BRAND_NAME}. يرجى استخدام رمز التحقق التالي لتأكيد بريدكم الإلكتروني وإتمام إنشاء الحساب:

الرمز: ${safeCode}

ينتهي هذا الرمز خلال ${ttlMinutes} دقيقة من وقت إرساله.
إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
للمساعدة والاستفسار: support@souqoneom.com
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official Arabic password reset email matching Direction C.
 */
export function buildPasswordResetEmail({ code }: { code: string }): EmailTemplateResult {
  const safeCode = validateCode(code);
  const ttlMinutes = VERIFICATION_CODE_TTL_MINUTES;
  const currentYear = new Date().getFullYear();

  const subject = `طلب استعادة كلمة المرور — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #FFFFFF;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 480px) {
      .outer-shell {
        padding: 20px 16px !important;
      }
      .card-shell {
        width: 100% !important;
      }
      .content-block {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    تلقينا طلباً لإعادة تعيين كلمة المرور. ينتهي الرمز خلال ${ttlMinutes} دقيقة.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Outer Centering Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <!-- Main Card Container (Max 600px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">استعادة كلمة المرور</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 440px; margin: 0 auto; text-align: center;">
                
      <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">عزيزي المستخدم،</p>
      <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابكم في <bdi dir="ltr">${BRAND_NAME}</bdi>. يرجى إدخال الرمز التالي في التطبيق للمتابعة:</p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 20px auto 20px auto;">
        <tr>
          <td align="center" style="border: 1.5px solid #009CB5; border-radius: 8px; padding: 16px 28px; text-align: center; background-color: #FFFFFF;">
            <div dir="ltr" id="otp-box" style="font-family: 'Courier New', Courier, monospace, Tahoma; font-size: 34px; font-weight: bold; letter-spacing: 12px; color: #11232E; text-align: center; unicode-bidi: isolate;"><bdi dir="ltr">${safeCode}</bdi></div>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">ينتهي هذا الرمز خلال <bdi dir="ltr">${ttlMinutes}</bdi> دقيقة من وقت إرساله.</p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة، وستبقى كلمة المرور الحالية صالحة دون تغيير.</p>
    
              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME}</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار، يسعدنا تواصلكم عبر البريد: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

عزيزي المستخدم،

تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابكم في ${BRAND_NAME}. يرجى إدخال الرمز التالي في التطبيق للمتابعة:

الرمز: ${safeCode}

ينتهي هذا الرمز خلال ${ttlMinutes} دقيقة من وقت إرساله.
إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة، وستبقى كلمة المرور الحالية صالحة دون تغيير.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
للمساعدة والاستفسار: support@souqoneom.com
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Formats a given Date instance into the official Oman timezone (Asia/Muscat).
 * Formatted cleanly with Gregorian calendar and standard numerals.
 */
export function formatOmanDate(date: Date, locale: 'ar' | 'en' = 'ar'): string {
  const d = date instanceof Date ? date : new Date(date);
  if (locale === 'ar') {
    return new Intl.DateTimeFormat('ar-OM-u-nu-latn', {
      timeZone: 'Asia/Muscat',
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(d);
  }
  return new Intl.DateTimeFormat('en-OM', {
    timeZone: 'Asia/Muscat',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Resolves trimmed display name with fallback for empty/whitespace input.
 * Returns raw unescaped string so that plain-text email bodies receive unescaped characters.
 */
function resolveDisplayName(name?: string | null, fallback = 'المستخدم'): string {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return fallback;
  }
  return name.trim();
}

/**
 * Builds official deletion request confirmation email (5-day grace period).
 */
export function buildDeletionRequestEmail({
  displayName,
  scheduledAt,
}: {
  displayName?: string | null;
  scheduledAt: Date;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const formattedDateAr = formatOmanDate(scheduledAt, 'ar');
  const formattedDateEn = formatOmanDate(scheduledAt, 'en');
  const currentYear = new Date().getFullYear();

  const subject = `تم استلام طلب حذف حسابك — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    تم استلام طلب حذف حسابكم في ${BRAND_NAME}. موعد الحذف النهائي المجدول: ${formattedDateAr}.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">طلب حذف الحساب</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">تلقينا طلباً لحذف حسابكم وبياناتكم في منصة <bdi dir="ltr">${BRAND_NAME}</bdi> (سوق ون). تم إخفاء كافة إعلاناتكم وخدماتكم من الظهور العام ومحرك البحث فوراً.</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 20px auto; width: 100%; max-width: 460px; background-color: #F8FAFC; border: 1.5px solid #009CB5; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 16px 20px; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #007A8F;">موعد الحذف النهائي المجدول (فترة سماح 5 أيام):</p>
                      <p style="margin: 0 0 6px 0; font-size: 16px; font-weight: bold; color: #11232E; direction: rtl;"><bdi dir="rtl">${formattedDateAr} (بتوقيت عُمان)</bdi></p>
                      <p style="margin: 0; font-size: 13px; color: #64748B; direction: ltr;"><bdi dir="ltr">${formattedDateEn} (Oman Time — Asia/Muscat)</bdi></p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.7; color: #11232E; text-align: center;"><strong>طريقة إلغاء الحذف:</strong> إذا كنتم ترغبون في الاحتفاظ بحسابكم، يمكنكم إلغاء الطلب في أي وقت قبل حلول الموعد أعلاه من داخل التطبيق: <strong>الإعدادات ثم حذف الحساب</strong> ثم الضغط على <strong>إلغاء طلب الحذف</strong>.</p>
                <p style="margin: 0 0 18px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">إذا لم تكونوا أنتم من قدّم هذا الطلب، يرجى فتح التطبيق فوراً لإلغائه وتأمين حسابكم أو التواصل معنا عبر: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Account Deletion Request Received — ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, we received a request to delete your ${BRAND_NAME} account. All your active listings and services have been hidden immediately.</p>
                  <p style="margin: 0 0 8px 0;">Scheduled permanent deletion date: <strong>${formattedDateEn}</strong> (Oman Time — Asia/Muscat).</p>
                  <p style="margin: 0 0 8px 0;"><strong>How to cancel:</strong> From the app: Settings then Delete Account, then tap <strong>Cancel Deletion</strong>.</p>
                  <p style="margin: 0;">If you did not request this, please contact us immediately at: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

تلقينا طلباً لحذف حسابكم وبياناتكم الشخصية في منصة ${BRAND_NAME} (سوق ون).
تم إخفاء كافة إعلاناتكم وخدماتكم من الظهور العام ومحرك البحث فوراً.

موعد الحذف النهائي المجدول (فترة سماح 5 أيام):
- بتوقيت عُمان: ${formattedDateAr}
- بتوقيت عُمان: ${formattedDateEn} (Asia/Muscat)

طريقة إلغاء الحذف:
إذا كنتم ترغبون في الاحتفاظ بحسابكم، يمكنكم إلغاء الطلب في أي وقت قبل حلول الموعد أعلاه من داخل التطبيق: الإعدادات ثم حذف الحساب ثم الضغط على "إلغاء طلب الحذف".

إذا لم تكونوا أنتم من قدّم هذا الطلب، يرجى فتح التطبيق فوراً لإلغائه وتأمين حسابكم أو التواصل معنا عبر: support@souqoneom.com.

---
Account Deletion Request Received — ${BRAND_NAME}

Hello ${rawNameEn},
We received a request to delete your ${BRAND_NAME} account.
All your active listings and services have been hidden immediately.
Scheduled deletion date: ${formattedDateEn} (Oman Time — Asia/Muscat).

To cancel: From the app: Settings then Delete Account, then tap "Cancel Deletion".
For support: support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official deletion cancellation confirmation email.
 */
export function buildDeletionCancelledEmail({
  displayName,
}: {
  displayName?: string | null;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const currentYear = new Date().getFullYear();

  const subject = `تم إلغاء طلب حذف حسابك بنجاح — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    تم إلغاء طلب حذف حسابكم في ${BRAND_NAME} واستعادة كافة الخدمات بنجاح.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">إلغاء حذف الحساب</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">نود إشعاركم بأنه قد تم إلغاء طلب حذف حسابكم في منصة <bdi dir="ltr">${BRAND_NAME}</bdi> (سوق ون) بنجاح.</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto; width: 100%; max-width: 460px; background-color: #F0FDF4; border: 1.5px solid #22C55E; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; font-weight: bold; color: #15803D;">حسابكم نشط الآن بالكامل، وتمت استعادة ظهور إعلاناتكم وخدماتكم السابقة في السوق العام ومحرك البحث.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">إذا لم تكونوا أنتم من قام بإلغاء هذا الطلب، أو كانت لديكم أي استفسارات، يسعدنا تواصلكم فوراً عبر البريد: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Account Deletion Request Cancelled — ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, your request to delete your ${BRAND_NAME} account has been successfully cancelled.</p>
                  <p style="margin: 0 0 8px 0;">Your account is now fully active, and your previous listings and services have been restored to public view.</p>
                  <p style="margin: 0;">For assistance: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

نود إشعاركم بأنه قد تم إلغاء طلب حذف حسابكم في منصة ${BRAND_NAME} (سوق ون) بنجاح.
حسابكم نشط الآن بالكامل، وتمت استعادة ظهور إعلاناتكم وخدماتكم السابقة في السوق العام ومحرك البحث.

إذا لم تكونوا أنتم من قام بإلغاء هذا الطلب، يرجى التواصل معنا عبر: support@souqoneom.com.

---
Account Deletion Request Cancelled — ${BRAND_NAME}

Hello ${rawNameEn},
Your request to delete your ${BRAND_NAME} account has been successfully cancelled.
Your account is fully active and your listings and services have been restored.
For support: support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official final deletion confirmation email.
 */
export function buildFinalDeletionEmail({
  displayName,
}: {
  displayName?: string | null;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const currentYear = new Date().getFullYear();

  const subject = `تم حذف حسابك — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    تم اكتمال حذف حسابكم وبياناتكم الشخصية في ${BRAND_NAME}.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">تم حذف الحساب</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">نود إشعاركم بأنه قد تم اكتمال حذف حسابكم وبياناتكم الشخصية في منصة <bdi dir="ltr">${BRAND_NAME}</bdi> (سوق ون) بنجاح.</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto; width: 100%; max-width: 460px; background-color: #F8FAFC; border: 1.5px solid #009CB5; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 16px 20px; text-align: center;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #11232E;">تم إنهاء الجلسات النشطة ومسح بيانات الملف الشخصي وإزالة الإعلانات من الظهور العام.</p>
                      <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #4A5568;">الرسائل التي أرسلتموها ضمن محادثات الأطراف الأخرى تبقى محفوظة لديهم دون ربطها باسمكم وتظهر باسم «مستخدم محذوف».</p>
                      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4A5568;">نود إشعاركم بأن بعض السجلات المالية وسجلات تدقيق الأمان المتبقية لا تتضمن بياناتكم الشخصية المباشرة وتُحفظ لأغراض محاسبية وأمنية.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.7; color: #4A5568; text-align: center;">أصبح بريدكم الإلكتروني الآن متاحاً في حال رغبتم في إنشاء حساب جديد مستقبلاً. شكراً لثقتكم السابقة بمنصة سوق ون.</p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">لأي استفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Account Deleted — ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, your ${BRAND_NAME} account and personal data have been deleted. Active sessions have been revoked and listings removed from public view.</p>
                  <p style="margin: 0 0 8px 0;">Please note that messages sent within conversations with other users remain visible to them without being linked to your name, appearing as "Deleted user".</p>
                  <p style="margin: 0 0 8px 0;">Please note that certain financial and security audit records are retained for accounting and security purposes and do not contain your direct personal data.</p>
                  <p style="margin: 0;">Your email address is now released and may be used to register a new account at any time. For support: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

نود إشعاركم بأنه قد تم اكتمال حذف حسابكم وبياناتكم الشخصية في منصة ${BRAND_NAME} (سوق ون) بنجاح.
تم إنهاء الجلسات النشطة ومسح بيانات الملف الشخصي وإزالة الإعلانات من الظهور العام.

الرسائل التي أرسلتموها ضمن محادثات الأطراف الأخرى تبقى محفوظة لديهم دون ربطها باسمكم وتظهر باسم «مستخدم محذوف».
نود إشعاركم بأن بعض السجلات المالية وسجلات تدقيق الأمان المتبقية لا تتضمن بياناتكم الشخصية المباشرة وتُحفظ لأغراض محاسبية وأمنية.

أصبح بريدكم الإلكتروني الآن متاحاً في حال رغبتم في إنشاء حساب جديد مستقبلاً.
شكراً لثقتكم السابقة بمنصة سوق ون.
لأي استفسار: support@souqoneom.com.

---
Account Deleted — ${BRAND_NAME}

Hello ${rawNameEn},
Your ${BRAND_NAME} account and personal data have been deleted. Active sessions have been revoked and listings removed from public view.

Messages sent within conversations with other users remain without being linked to your name, appearing as "Deleted user".
Please note that certain financial and security audit records are retained for accounting and security purposes and do not contain your direct personal data.
Your email address is now released and may be used to register a new account at any time.
For support: support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official password changed confirmation email.
 */
export function buildPasswordChangedEmail({
  displayName,
  changedAt,
}: {
  displayName?: string | null;
  changedAt: Date;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const formattedDateAr = formatOmanDate(changedAt, 'ar');
  const formattedDateEn = formatOmanDate(changedAt, 'en');
  const currentYear = new Date().getFullYear();

  const subject = `تم تغيير كلمة المرور — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    إشعار تأكيد تغيير كلمة المرور الخاصة بحسابكم في ${BRAND_NAME}.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">تأكيد تغيير كلمة المرور</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">تم تغيير كلمة المرور الخاصة بحسابكم في <bdi dir="ltr">${BRAND_NAME}</bdi> بتاريخ <bdi dir="rtl">${formattedDateAr}</bdi>.</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto; width: 100%; max-width: 460px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">إذا كنتم قد قمتم بهذا الإجراء بأنفسكم، فلا داعي لاتخاذ أي خطوة أخرى.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #B91C1C; text-align: center;">إذا لم تكونوا أنتم من قام بذلك، يرجى التواصل فوراً مع فريق الدعم عبر <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Password Changed — ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, your ${BRAND_NAME} account password was successfully changed on ${formattedDateEn}.</p>
                  <p style="margin: 0;">If you did not make this change, please contact support immediately at <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

تم تغيير كلمة المرور الخاصة بحسابكم في ${BRAND_NAME} بتاريخ ${formattedDateAr}.
إذا كنتم قد قمتم بهذا الإجراء بأنفسكم، فلا داعي لاتخاذ أي خطوة أخرى.

إذا لم تكونوا أنتم من قام بذلك، يرجى التواصل فوراً مع فريق الدعم عبر support@souqoneom.com.

---
Password Changed — ${BRAND_NAME}

Hello ${rawNameEn},
Your ${BRAND_NAME} account password was successfully changed on ${formattedDateEn}.
If you did not make this change, please contact support immediately at support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official welcome email for newly registered or verified users.
 */
export function buildWelcomeEmail({
  displayName,
}: {
  displayName?: string | null;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const currentYear = new Date().getFullYear();

  const subject = `مرحباً بكم في ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    يسعدنا انضمامكم إلى منصة ${BRAND_NAME}.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">أهلاً بكم في ${BRAND_NAME}</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">يسعدنا انضمامكم إلى منصة <bdi dir="ltr">${BRAND_NAME}</bdi>، سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان.</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto; width: 100%; max-width: 460px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #1E293B;">تم تفعيل حسابكم بنجاح، ويمكنكم الآن تصفح ونشر الإعلانات في مختلف الأقسام، بما في ذلك السيارات، الحافلات، المعدات، المشغّلون، الوظائف، قطع الغيار، والخدمات عبر التطبيق.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">نتمنى لكم تجربة موفقة، ويسعدنا دائماً تقديم المساعدة عبر فريق الدعم: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Welcome to ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, welcome to ${BRAND_NAME}, the online marketplace for listings and services in the Sultanate of Oman.</p>
                  <p style="margin: 0 0 8px 0;">Your account is now active across all categories including Cars, Buses, Equipment, Operators, Jobs, Spare Parts, and Services.</p>
                  <p style="margin: 0;">For assistance: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

يسعدنا انضمامكم إلى منصة ${BRAND_NAME}، سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان.
تم تفعيل حسابكم بنجاح، ويمكنكم الآن تصفح ونشر الإعلانات في مختلف الأقسام، بما في ذلك السيارات، الحافلات، المعدات، المشغّلون، الوظائف، قطع الغيار، والخدمات عبر التطبيق.

نتمنى لكم تجربة موفقة، ويسعدنا دائماً تقديم المساعدة عبر فريق الدعم: support@souqoneom.com.

---
Welcome to ${BRAND_NAME}

Hello ${rawNameEn},
Welcome to ${BRAND_NAME}, the online marketplace for listings and services in the Sultanate of Oman.
Your account is now active across all categories including Cars, Buses, Equipment, Operators, Jobs, Spare Parts, and Services.
For assistance: support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official temporary account suspension notice email.
 */
export function buildAccountSuspendedEmail({
  displayName,
  suspendedUntil,
}: {
  displayName?: string | null;
  suspendedUntil?: Date | null;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const currentYear = new Date().getFullYear();

  const hasSuspensionDate = suspendedUntil instanceof Date && !isNaN(suspendedUntil.getTime());
  const formattedUntilAr = hasSuspensionDate ? formatOmanDate(suspendedUntil!, 'ar') : '';
  const formattedUntilEn = hasSuspensionDate ? formatOmanDate(suspendedUntil!, 'en') : '';

  const subject = `إشعار إيقاف الحساب مؤقتاً — ${BRAND_NAME}`;

  const dateSentenceAr = hasSuspensionDate
    ? ` تنتهي مدة الإيقاف بتاريخ <bdi dir="rtl">${formattedUntilAr}</bdi>.`
    : '';
  const dateSentenceTextAr = hasSuspensionDate
    ? ` تنتهي مدة الإيقاف بتاريخ ${formattedUntilAr}.`
    : '';

  const dateSentenceEn = hasSuspensionDate
    ? ` The suspension is scheduled to end on ${formattedUntilEn}.`
    : '';
  const dateSentenceTextEn = hasSuspensionDate
    ? ` The suspension is scheduled to end on ${formattedUntilEn}.`
    : '';

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    إشعار إيقاف مؤقت للحساب في ${BRAND_NAME}.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">إيقاف الحساب مؤقتاً</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">تم إيقاف حسابكم مؤقتاً للاشتباه في مخالفة سياسات الاستخدام المنصوص عليها في المنصة.${dateSentenceAr}</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto; width: 100%; max-width: 460px; background-color: #FFFBEB; border: 1.5px solid #F59E0B; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #B45309;">خلال هذه الفترة تم إخفاء إعلاناتكم وتعليق إمكانية النشر.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">للاستفسار أو تقديم التماس: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Account Temporarily Suspended — ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, your account has been temporarily suspended for review regarding terms of service policies.${dateSentenceEn}</p>
                  <p style="margin: 0 0 8px 0;">During this time, your listings are hidden and posting is paused.</p>
                  <p style="margin: 0;">For inquiries or appeals: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

تم إيقاف حسابكم مؤقتاً للاشتباه في مخالفة سياسات الاستخدام المنصوص عليها في المنصة.${dateSentenceTextAr}
خلال هذه الفترة تم إخفاء إعلاناتكم وتعليق إمكانية النشر.

للاستفسار أو تقديم التماس: support@souqoneom.com.

---
Account Temporarily Suspended — ${BRAND_NAME}

Hello ${rawNameEn},
Your account has been temporarily suspended for review regarding terms of service policies.${dateSentenceTextEn}
During this time, your listings are hidden and posting is paused.
For inquiries or appeals: support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

/**
 * Builds official permanent account ban notice email.
 */
export function buildAccountBannedEmail({
  displayName,
}: {
  displayName?: string | null;
}): EmailTemplateResult {
  const rawNameAr = resolveDisplayName(displayName, 'المستخدم');
  const rawNameEn = resolveDisplayName(displayName, 'User');
  const safeNameHtml = escapeHtml(rawNameAr);
  const safeNameEnHtml = escapeHtml(rawNameEn);
  const currentYear = new Date().getFullYear();

  const subject = `إشعار حظر الحساب — ${BRAND_NAME}`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, div, a { font-family: Tahoma, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    html, body {
      margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important;
      background-color: #FFFFFF; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer-shell { padding: 20px 16px !important; }
      .card-shell { width: 100% !important; }
      .content-block { max-width: 100% !important; }
    }
  </style>
</head>
<body dir="rtl" bgcolor="#FFFFFF" style="margin: 0 auto; padding: 0; background-color: #FFFFFF; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: center;">

  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; font-family: Tahoma, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    إشعار حظر نهائي للحساب في ${BRAND_NAME}.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" bgcolor="#FFFFFF" class="outer-shell" style="background-color: #FFFFFF; margin: 0 auto; padding: 32px 16px; direction: rtl; width: 100%;">
    <tr>
      <td align="center" style="text-align: center; direction: rtl;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" class="card-shell" style="max-width: 600px; width: 100%; margin: 0 auto; direction: rtl; text-align: center;">
          
          <!-- Logo Row -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0; text-align: center;">
              <img id="brand-logo" src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" width="130" style="display: block; width: 130px; max-width: 130px; height: auto; border: 0; margin: 0 auto;">
            </td>
          </tr>

          <!-- Subtle Turquoise Divider (2px) -->
          <tr>
            <td align="center" style="padding: 0 0 26px 0; text-align: center;">
              <div style="height: 2px; width: 100%; max-width: 520px; background-color: #009CB5; line-height: 2px; font-size: 2px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Heading Row -->
          <tr>
            <td align="center" style="padding: 0 0 18px 0; text-align: center;">
              <h1 id="mail-heading" style="margin: 0; font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; color: #11232E; line-height: 1.4; text-align: center;">إشعار حظر الحساب</h1>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td align="center" style="padding: 0 0 24px 0; text-align: center;">
              <div class="content-block" style="max-width: 480px; margin: 0 auto; text-align: center;">
                
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">مرحباً <bdi dir="rtl">${safeNameHtml}</bdi>،</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #11232E; text-align: center;">نحيطكم علماً بأنه قد تم حظر حسابكم نهائياً في منصة <bdi dir="ltr">${BRAND_NAME}</bdi> لمخالفة شروط وسياسات الاستخدام، وتم إلغاء الجلسات النشطة وإزالة إعلاناتكم.</p>
                
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto; width: 100%; max-width: 460px; background-color: #FEF2F2; border: 1.5px solid #EF4444; border-radius: 8px;">
                  <tr>
                    <td align="center" style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #991B1B;">تم إيقاف صلاحية الدخول نهائياً وإلغاء ارتباط كافة الخدمات بهذا الحساب.</p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #4A5568; text-align: center;">للاستفسار أو تقديم التماس: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>

                <!-- English Summary -->
                <div style="margin: 24px auto 0 auto; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 13px; line-height: 1.6; color: #475569; text-align: center; direction: ltr;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1E293B;">Account Banned Notice — ${BRAND_NAME}</p>
                  <p style="margin: 0 0 8px 0;">Hello ${safeNameEnHtml}, please be advised that your ${BRAND_NAME} account has been permanently banned due to violations of our terms and policies.</p>
                  <p style="margin: 0 0 8px 0;">Active sessions have been terminated and your listings removed.</p>
                  <p style="margin: 0;">For inquiries or appeals: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a>.</p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Bottom Subtle Divider -->
          <tr>
            <td align="center" style="padding: 0; text-align: center;">
              <div style="height: 1px; width: 100%; max-width: 520px; background-color: #E5E7EB; line-height: 1px; font-size: 1px; margin: 0 auto;">&nbsp;</div>
            </td>
          </tr>

          <!-- Institutional Footer Row -->
          <tr>
            <td align="center" style="padding: 20px 0 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" dir="rtl" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center" style="font-family: Tahoma, Arial, 'Segoe UI', sans-serif; font-size: 12px; line-height: 1.7; color: #4A5568; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-weight: bold; color: #11232E; font-size: 13px; text-align: center;">${BRAND_NAME} — سوق ون</p>
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #4A5568; text-align: center;">سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A5568; text-align: center;">للمساعدة والاستفسار: <a href="mailto:support@souqoneom.com" style="color: #007A8F; text-decoration: underline;"><bdi dir="ltr">support@souqoneom.com</bdi></a></p>
                    <p style="margin: 0; font-size: 11px; color: #6B7280; text-align: center;">جميع الحقوق محفوظة <bdi dir="ltr">${BRAND_NAME} ${currentYear}</bdi>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = `${subject}

مرحباً ${rawNameAr}،

نحيطكم علماً بأنه قد تم حظر حسابكم نهائياً في منصة ${BRAND_NAME} لمخالفة شروط وسياسات الاستخدام، وتم إلغاء الجلسات النشطة وإزالة إعلاناتكم.
تم إيقاف صلاحية الدخول نهائياً وإلغاء ارتباط كافة الخدمات بهذا الحساب.

للاستفسار أو تقديم التماس: support@souqoneom.com.

---
Account Banned Notice — ${BRAND_NAME}

Hello ${rawNameEn},
Please be advised that your ${BRAND_NAME} account has been permanently banned due to violations of our terms and policies.
Active sessions have been terminated and your listings removed.
For inquiries or appeals: support@souqoneom.com.

---
${BRAND_NAME}
سوق إلكتروني للإعلانات والخدمات في سلطنة عُمان
جميع الحقوق محفوظة ${BRAND_NAME} ${currentYear}.
`;

  return { subject, html, text };
}

