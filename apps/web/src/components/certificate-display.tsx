import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Printer } from 'lucide-react';

import { CERTIFICATE_CONTENT, HACKATHON_DATE } from '@base/core/config/certificate';
import type { UserRole } from '@base/core/config/constant';
import { Awards } from '@base/ui/components/award';
import { Button } from '@base/ui/components/button';

interface CertificateDisplayProps {
  participantName: string;
  role: UserRole;
}

export function CertificateDisplay({ participantName, role }: CertificateDisplayProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const content = CERTIFICATE_CONTENT[role];

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `certificate-${participantName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div ref={certificateRef} className="bg-white p-4 print:p-0">
        <Awards
          variant="certificate"
          title={content.title}
          subtitle={content.subtitle}
          recipient={participantName}
          date={HACKATHON_DATE}
        />
      </div>

      <div className="flex gap-3 print:hidden">
        <Button onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download PNG'}
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}
