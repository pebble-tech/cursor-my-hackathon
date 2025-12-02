import { Resend } from 'resend';

import { env } from '~/config/env';
import { logError, logInfo } from '~/utils/logging';

const resend = new Resend(env.RESEND_API_KEY);

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SendEmailResult = { success: true; messageId: string } | { success: false; error: string };

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      logError('Failed to send email', { error, to: params.to, subject: params.subject });
      return { success: false, error: error.message };
    }

    logInfo('Email sent successfully', { messageId: data?.id, to: params.to });
    return { success: true, messageId: data?.id ?? '' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logError('Email sending threw exception', { error: errorMessage, to: params.to });
    return { success: false, error: errorMessage };
  }
}
