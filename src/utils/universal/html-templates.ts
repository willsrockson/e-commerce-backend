import type { CodeEmailParams } from "../../types/client/types.js";

export const VerifyEmailHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <tr>
        <td style="padding: 30px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Hi [Full Name],</h2>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
            Welcome to <strong>Tonmame</strong>! Please confirm your email address by clicking the button below:
          </p>

          <p style="text-align: center; margin-bottom: 24px;">
            <a href="[Verification Link]" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
              Verify My Email
            </a>
          </p>

          <p style="color: #374151; font-size: 14px; margin-bottom: 24px;">
            Or copy and paste this link into your browser:<br>
            <a href="[Verification Link]" style="color: #2563eb;">[Verification Link]</a>
          </p>

          <p style="color: #6b7280; font-size: 13px;">
            This link will expire in <strong>15 minutes</strong> for your security.
          </p>

          <p style="margin-top: 32px; color: #374151;">
            Thanks,<br>
            The Tonmame Team
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;



export const CodeEmailTemplate = ({
  appName,
  userName,
  purposeText,
  code,
  expiresInMinutes,
}: CodeEmailParams): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>

  <body style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f3f4f6;
    margin: 0;
    padding: 40px;
    color: #111827;
  ">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      ">

      <!-- Header -->
      <tr>
        <td style="
          background-color: #2563eb;
          padding: 28px 20px;
          text-align: center;
        ">
          <h1 style="
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
          ">
            ${appName}
          </h1>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 32px 30px;">
          <h2 style="
            margin: 0 0 16px 0;
            color: #111827;
            font-size: 18px;
          ">
            Hello${userName ? ` ${userName}` : ""},
          </h2>

          <p style="
            color: #374151;
            line-height: 1.6;
            margin-bottom: 24px;
          ">
            ${purposeText}
          </p>

          <!-- Code -->
          <div style="text-align: center; margin: 28px 0;">
            <div style="
              display: inline-block;
              background-color: #f1f5f9;
              color: #1e293b;
              padding: 16px 32px;
              border-radius: 8px;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 6px;
              border: 1px solid #cbd5e1;
            ">
              ${code}
            </div>
          </div>

          <p style="
            color: #6b7280;
            font-size: 14px;
            text-align: center;
            margin-bottom: 24px;
          ">
            This code will expire in <strong>${expiresInMinutes} minutes</strong>.
            <br />
            If you did not request this, you can safely ignore this email.
          </p>

          <p style="color: #374151; margin-top: 28px;">
            Regards,<br />
            <strong>${appName} Team</strong>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="
          background-color: #f9fafb;
          padding: 16px 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        ">
          This email was sent because a code was requested for your ${appName} account.
        </td>
      </tr>

    </table>
  </body>
</html>
`;







