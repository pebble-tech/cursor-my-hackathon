import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { CERTIFICATE_TEMPLATE_CONFIG } from '@base/core/config/certificate';
import { formatNameForCertificate } from '@base/core/utils/certificate-name';
import { Button } from '@base/ui/components/button';

import { exportCertificateAsPDF } from '~/utils/certificate-export';

interface CertificateDisplayProps {
  participantName: string;
}

export function CertificateDisplay({ participantName }: CertificateDisplayProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formattedName = formatNameForCertificate(participantName);
  const { nameArea, font, displayScale, image } = CERTIFICATE_TEMPLATE_CONFIG;

  const scaledWidth = image.width * displayScale;
  const scaledHeight = image.height * displayScale;

  const handleExportPDF = async () => {
    if (!certificateRef.current || !imageLoaded) return;

    setIsExporting(true);
    try {
      await exportCertificateAsPDF(certificateRef.current, participantName);
      toast.success('Certificate downloaded');
    } catch {
      toast.error('Failed to export certificate');
    } finally {
      setIsExporting(false);
    }
  };

  const namePositionX = nameArea.centerX * displayScale;
  const namePositionY = nameArea.centerY * displayScale;
  const scaledFontSize = formattedName.fontSize * displayScale;
  const lineHeight = scaledFontSize * 1.2;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div
          ref={certificateRef}
          className="relative bg-white"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
        >
          <img
            src="/certificate-participant-template.png"
            alt="Certificate template"
            className="absolute inset-0 h-full w-full object-contain"
            crossOrigin="anonymous"
            onLoad={() => setImageLoaded(true)}
          />
          <div
            className="absolute flex flex-col items-center justify-center text-center"
            style={{
              left: `${namePositionX}px`,
              top: `${namePositionY}px`,
              transform: 'translate(-50%, -50%)',
              maxWidth: `${nameArea.maxWidth * displayScale}px`,
              fontFamily: font.family,
              fontSize: `${scaledFontSize}px`,
              fontWeight: font.weight,
              color: font.color,
              lineHeight: `${lineHeight}px`,
              textTransform: 'uppercase',
            }}
          >
            {formattedName.lines.map((line, index) => (
              <div key={index} style={{ height: `${lineHeight}px` }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={handleExportPDF} disabled={isExporting || !imageLoaded}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </div>
    </div>
  );
}
