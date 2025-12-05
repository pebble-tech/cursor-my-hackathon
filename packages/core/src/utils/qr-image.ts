import { Jimp } from 'jimp';
import QRCode from 'qrcode';

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

async function generateQRWithLogo(qrCodeValue: string, width: number, margin: number): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(qrCodeValue, {
    width,
    margin,
    ...QR_STYLE,
  });

  const logoUrl = getLogoUrl(env.APP_BASE_URL);
  const logoSize = Math.floor(width * LOGO_SIZE_RATIO);
  const logoPosition = Math.floor((width - logoSize) / 2);

  const qrImage = await Jimp.read(qrBuffer);
  const logoImage = await Jimp.read(logoUrl);

  logoImage.resize({ w: logoSize, h: logoSize });
  qrImage.composite(logoImage, logoPosition, logoPosition);

  return qrImage.getBuffer('image/png');
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
