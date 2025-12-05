import QRCode from 'qrcode';
import sharp from 'sharp';

import { env } from '~/config/env';
import { getLogoUrl } from '~/config/qr';

type GenerateQRCodeImageOptions = {
  width?: number;
  margin?: number;
};

const QR_STYLE = {
  errorCorrectionLevel: 'H' as const, // High - allows 30% data recovery for logo overlay
  color: {
    dark: '#18181b',
    light: '#ffffff',
  },
};

const LOGO_SIZE_RATIO = 0.25;

async function fetchLogo(): Promise<Buffer> {
  const logoUrl = getLogoUrl(env.APP_BASE_URL);
  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo from ${logoUrl}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateQRWithLogo(qrCodeValue: string, width: number, margin: number): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(qrCodeValue, {
    width,
    margin,
    ...QR_STYLE,
  });

  const logoBuffer = await fetchLogo();
  const logoSize = Math.floor(width * LOGO_SIZE_RATIO);
  const logoPosition = Math.floor((width - logoSize) / 2);

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  return sharp(qrBuffer)
    .composite([{ input: resizedLogo, top: logoPosition, left: logoPosition }])
    .png()
    .toBuffer();
}

export async function generateQRCodeDataURL(
  qrCodeValue: string,
  options: GenerateQRCodeImageOptions = {}
): Promise<string> {
  const { width = 400, margin = 2 } = options;
  const buffer = await generateQRWithLogo(qrCodeValue, width, margin);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export async function generateQRCodeBuffer(
  qrCodeValue: string,
  options: GenerateQRCodeImageOptions = {}
): Promise<Buffer> {
  const { width = 400, margin = 2 } = options;
  return generateQRWithLogo(qrCodeValue, width, margin);
}
