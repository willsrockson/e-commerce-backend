
export const verificationEmailHTML = `
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
              👉 Verify My Email
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



export const verificationCodeEmailHTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: linear-gradient(to bottom right, #f0f9ff, #e0f2fe); margin: 0; padding: 40px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" 
      style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <tr>
        <td style="background-color: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
            Tonmame
          </h1>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 30px;">
          <h2 style="color: #111827; margin-bottom: 16px;">Hi [Full Name],</h2>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 24px;">
            For your security, please use the verification code below to complete your email confirmation:
          </p>

          <!-- Code Box -->
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="display: inline-block; background-color: #f3f4f6; color: #111827; padding: 16px 32px; border-radius: 8px; font-size: 28px; letter-spacing: 6px; font-weight: bold; box-shadow: inset 0 0 6px rgba(0,0,0,0.05);">
              [Verification Code]
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px; text-align: center;">
            This code will expire in <strong>5 minutes</strong>.  
          </p>

          <p style="margin-top: 32px; color: #374151;">
            Thanks,<br>
            The Tonmame Team
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          You’re receiving this email because you recently signed up for Tonmame.  
          If you didn’t request this, you can safely ignore it.
        </td>
      </tr>
    </table>
  </body>
</html>
`;

