export type QRStyleOptions = {
  width: number;
  height: number;
  type: 'svg' | 'canvas';
  margin: number;
  imageOptions: {
    crossOrigin: string;
    margin: number;
    imageSize: number;
    hideBackgroundDots: boolean;
  };
  dotsOptions: {
    color: string;
    type: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
  };
  backgroundOptions: {
    color: string;
  };
  cornersSquareOptions: {
    color: string;
    type: 'dot' | 'square' | 'extra-rounded';
  };
  cornersDotOptions: {
    color: string;
    type: 'dot' | 'square';
  };
  qrOptions: {
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  };
};

export const QR_STYLE_OPTIONS: Omit<QRStyleOptions, 'type'> = {
  width: 300,
  height: 300,
  margin: 10,
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 8,
    imageSize: 0.4,
    hideBackgroundDots: true,
  },
  dotsOptions: {
    color: '#18181b',
    type: 'rounded',
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  cornersSquareOptions: {
    color: '#18181b',
    type: 'extra-rounded',
  },
  cornersDotOptions: {
    color: '#18181b',
    type: 'dot',
  },
  qrOptions: {
    errorCorrectionLevel: 'H',
  },
};

export function getLogoUrl(baseUrl?: string): string {
  if (baseUrl) {
    return `${baseUrl}/cursor-logo.png`;
  }
  return '/cursor-logo.png';
}
