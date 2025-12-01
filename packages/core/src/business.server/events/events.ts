import { createHmac, timingSafeEqual } from 'crypto';

import { env } from '~/config/env';

type QRPayload = {
  participantId: string;
  type: 'permanent';
  signature: string;
};

type VerifyResult =
  | { valid: true; participantId: string }
  | { valid: false; error: string };

function createSignature(participantId: string): string {
  return createHmac('sha256', env.QR_SECRET_KEY)
    .update(`${participantId}:permanent`)
    .digest('hex');
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

export function generateQRCodeValue(participantId: string): string {
  const signature = createSignature(participantId);
  const payload: QRPayload = {
    participantId,
    type: 'permanent',
    signature,
  };
  return base64UrlEncode(JSON.stringify(payload));
}

export function verifyQRCodeValue(qrValue: string): VerifyResult {
  try {
    const decoded = base64UrlDecode(qrValue);
    const payload = JSON.parse(decoded) as unknown;

    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('participantId' in payload) ||
      !('type' in payload) ||
      !('signature' in payload)
    ) {
      return { valid: false, error: 'Invalid payload structure' };
    }

    const { participantId, type, signature } = payload as QRPayload;

    if (typeof participantId !== 'string' || typeof signature !== 'string') {
      return { valid: false, error: 'Invalid payload types' };
    }

    if (type !== 'permanent') {
      return { valid: false, error: 'Invalid QR type' };
    }

    const expectedSignature = createSignature(participantId);

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: 'Invalid signature' };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, participantId };
  } catch {
    return { valid: false, error: 'Failed to decode QR value' };
  }
}

