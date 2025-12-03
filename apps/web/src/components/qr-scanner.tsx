import { useCallback, useEffect, useRef, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

type QRScannerProps = {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  paused?: boolean;
};

export function QRScanner({ onScan, onError, paused = false }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!paused) {
      hasScannedRef.current = false;
    }
  }, [paused]);

  const handleScan = useCallback(
    (results: { rawValue: string }[]) => {
      if (paused || hasScannedRef.current) return;

      const result = results[0];
      if (result?.rawValue) {
        hasScannedRef.current = true;
        onScan(result.rawValue);
      }
    },
    [paused, onScan]
  );

  const handleError = useCallback(
    (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      onError?.(errorMessage);
    },
    [onError]
  );

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
    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-black">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        paused={paused}
        formats={['qr_code']}
        sound={false}
        components={{ finder: true }}
        constraints={{ facingMode: 'environment' }}
      />
    </div>
  );
}
