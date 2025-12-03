import QRCode from 'qrcode';

type GenerateQRCodeImageOptions = {
  width?: number;
  margin?: number;
};

const QR_CODE_STYLE = {
  errorCorrectionLevel: 'M' as const,
  color: {
    dark: '#18181b',
    light: '#ffffff',
  },
};

export async function generateQRCodeDataURL(
  qrCodeValue: string,
  options: GenerateQRCodeImageOptions = {}
): Promise<string> {
  const { width = 400, margin = 2 } = options;

  return QRCode.toDataURL(qrCodeValue, {
    width,
    margin,
    ...QR_CODE_STYLE,
  });
}

export async function generateQRCodeBuffer(
  qrCodeValue: string,
  options: GenerateQRCodeImageOptions = {}
): Promise<Buffer> {
  const { width = 400, margin = 2 } = options;

  return QRCode.toBuffer(qrCodeValue, {
    type: 'png',
    width,
    margin,
    ...QR_CODE_STYLE,
  });
}
