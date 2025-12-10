import { Resend } from 'resend';

import { env } from '~/config/env';
import { logError, logInfo } from '~/utils/logging';

const resend = new Resend(env.RESEND_API_KEY);

type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentId?: string;
};

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
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
      attachments: params.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        contentId: att.contentId,
      })),
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

type BatchEmailItem = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type BatchEmailResult =
  | {
      success: true;
      results: Array<
        { emailIndex: number; success: true; messageId: string } | { emailIndex: number; success: false; error: string }
      >;
    }
  | {
      success: false;
      error: string;
    };

export const BATCH_SIZE = 100;

export async function sendBatchEmails(
  emails: BatchEmailItem[],
  options?: { batchValidation?: 'strict' | 'permissive' }
): Promise<BatchEmailResult> {
  if (emails.length > BATCH_SIZE) {
    return {
      success: false,
      error: `Batch size exceeds maximum of ${BATCH_SIZE} emails`,
    };
  }

  try {
    const batchEmails = emails.map((email) => ({
      from: env.EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }));

    const { data, error } = await resend.batch.send(batchEmails, {
      batchValidation: options?.batchValidation ?? 'permissive',
    });

    if (error) {
      logError('Failed to send batch emails', { error, count: emails.length });
      return { success: false, error: error.message };
    }

    const results: Array<
      { emailIndex: number; success: true; messageId: string } | { emailIndex: number; success: false; error: string }
    > = [];

    if (data?.data) {
      data.data.forEach((result, index) => {
        if (result.id) {
          results.push({
            emailIndex: index,
            success: true,
            messageId: result.id,
          });
        } else {
          results.push({
            emailIndex: index,
            success: false,
            error: 'No message ID returned',
          });
        }
      });
    }

    const responseData = data as { errors?: Array<{ index?: number; message?: string }> } | undefined;
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      for (const errorItem of responseData.errors) {
        const index = errorItem.index ?? -1;
        if (index >= 0 && index < emails.length) {
          results[index] = {
            emailIndex: index,
            success: false,
            error: errorItem.message ?? 'Unknown error',
          };
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logInfo('Batch emails sent', {
      total: emails.length,
      success: successCount,
      failed: failureCount,
    });

    return { success: true, results };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logError('Batch email sending threw exception', { error: errorMessage, count: emails.length });
    return { success: false, error: errorMessage };
  }
}
