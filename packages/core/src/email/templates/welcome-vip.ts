import { sendEmail } from '~/email/client';
import { generateQRCodeBuffer } from '~/utils/qr-image';

type SendVIPWelcomeEmailParams = {
  to: string;
  name: string;
  qrCodeValue: string;
};

const QR_CODE_CONTENT_ID = 'qr-code';

export async function sendVIPWelcomeEmail({ to, name, qrCodeValue }: SendVIPWelcomeEmailParams) {
  const greeting = `Hi ${name}`;

  const qrCodeBuffer = await generateQRCodeBuffer(qrCodeValue, { width: 300, margin: 2 });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cursor Hackathon - VIP Pass</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 32px;">
              <div style="display: inline-block; padding: 6px 12px; background-color: #fef3c7; border-radius: 9999px; margin-bottom: 16px;">
                <span style="font-size: 12px; font-weight: 600; color: #92400e;">VIP GUEST</span>
              </div>
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">Welcome to Cursor Hackathon!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #3f3f46;">${greeting},</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">You're registered as a VIP guest for the Cursor Hackathon. We're honored to have you join us!</p>
              
              <div style="margin: 28px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #18181b;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #18181b;">Event Details</p>
                <p style="margin: 0 0 4px; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>Date:</strong> December 6-7, 2025</p>
                <p style="margin: 0; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>Venue:</strong> Level 2, Monash University Malaysia</p>
              </div>

              <h2 style="margin: 28px 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">Your VIP QR Code</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #3f3f46;">Show this QR code at food stations to receive your complimentary meals. Your QR code is permanent and never expires.</p>
              
              <div style="text-align: center; padding: 20px; background-color: #fafafa; border-radius: 8px; margin-bottom: 24px;">
                <img src="cid:${QR_CODE_CONTENT_ID}" alt="Your VIP QR Code" width="200" height="200" style="display: block; margin: 0 auto; border-radius: 4px;" />
              </div>
              
              <div style="margin: 24px 0; padding: 16px; background-color: #fefce8; border-radius: 8px; border: 1px solid #fef08a;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #854d0e;">Food Schedule</p>
                <p style="margin: 0 0 4px; font-size: 13px; line-height: 20px; color: #713f12;"><strong>Day 1 (Dec 6):</strong> Lunch, Dinner, Midnight Snack</p>
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #713f12;"><strong>Day 2 (Dec 7):</strong> Breakfast, Lunch</p>
              </div>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #71717a;">Save this email or screenshot your QR code for easy access during the event.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `${greeting},

Welcome to Cursor Hackathon - VIP Guest!

You're registered as a VIP guest for the Cursor Hackathon. We're honored to have you join us!

EVENT DETAILS
Date: December 6-7, 2025
Venue: Level 2, Monash University Malaysia

YOUR VIP QR CODE
Show your QR code at food stations to receive your complimentary meals. Your QR code is permanent and never expires.

(QR code is embedded in the HTML version of this email. Please view in an email client that supports HTML to see your QR code.)

FOOD SCHEDULE
Day 1 (Dec 6): Lunch, Dinner, Midnight Snack
Day 2 (Dec 7): Breakfast, Lunch

Save this email or screenshot your QR code for easy access during the event.`;

  return sendEmail({
    to,
    subject: 'Welcome to Cursor Hackathon - Your VIP Pass',
    html,
    text,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        contentId: QR_CODE_CONTENT_ID,
      },
    ],
  });
}
