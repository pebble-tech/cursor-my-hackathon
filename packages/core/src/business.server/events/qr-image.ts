import QRCode from 'qrcode';

type GenerateQRCodeImageOptions = {
  width?: number;
  margin?: number;
};

export async function generateQRCodeDataURL(
  qrCodeValue: string,
  options: GenerateQRCodeImageOptions = {}
): Promise<string> {
  const { width = 400, margin = 2 } = options;

  return QRCode.toDataURL(qrCodeValue, {
    width,
    margin,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#18181b',
      light: '#ffffff',
    },
  });
}
