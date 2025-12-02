import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

import { QR_STYLE_OPTIONS, getLogoUrl } from '@base/core/config/qr';

type QRCodeDisplayProps = {
  value: string;
  size?: number;
};

export function QRCodeDisplay({ value, size = 300 }: QRCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const qrCode = new QRCodeStyling({
      ...QR_STYLE_OPTIONS,
      width: size,
      height: size,
      data: value,
      image: getLogoUrl(),
      type: 'svg',
    });

    container.innerHTML = '';
    qrCode.append(container);
    qrCodeRef.current = qrCode;
    setIsLoading(false);

    return () => {
      container.innerHTML = '';
    };
  }, [value, size]);

  return (
    <div className="flex items-center justify-center">
      {isLoading && <div className="animate-pulse rounded-lg bg-gray-100" style={{ width: size, height: size }} />}
      <div ref={containerRef} className={isLoading ? 'hidden' : ''} />
    </div>
  );
}
