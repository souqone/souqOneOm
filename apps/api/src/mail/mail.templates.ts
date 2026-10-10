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
