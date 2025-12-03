import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

type QRScannerProps = {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  paused?: boolean;
};

export function QRScanner({ onScan, onError, paused = false }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isScanningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scannerId = 'qr-scanner-container';
    container.innerHTML = `<div id="${scannerId}"></div>`;

    const html5Qrcode = new Html5Qrcode(scannerId);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      facingMode: 'environment' as const,
    };

    html5Qrcode
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (!isScanningRef.current) return;
          isScanningRef.current = false;
          onScanRef.current(decodedText);
        },
        () => {}
      )
      .then(() => {
        scannerRef.current = html5Qrcode;
        setIsInitialized(true);
        isScanningRef.current = true;
      })
      .catch((err) => {
        const errorMessage = err.message || 'Failed to start camera';
        setError(errorMessage);
        if (onErrorRef.current) {
          onErrorRef.current(errorMessage);
        }
      });

    return () => {
      isScanningRef.current = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
          })
          .catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!scannerRef.current || !isInitialized) return;

    if (paused) {
      isScanningRef.current = false;
    } else {
      isScanningRef.current = true;
    }
  }, [paused, isInitialized]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8">
        <p className="text-sm font-medium text-red-800">Camera Error</p>
        <p className="mt-2 text-xs text-red-600">{error}</p>
        <p className="mt-4 text-xs text-red-600">
          Please ensure camera permissions are granted and try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="rounded-lg border border-gray-200 bg-gray-50" />
    </div>
  );
}
