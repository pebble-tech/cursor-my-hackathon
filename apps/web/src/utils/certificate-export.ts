import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import { CERTIFICATE_TEMPLATE_CONFIG } from '@base/core/config/certificate';

export async function exportCertificateAsPDF(element: HTMLElement, filename: string): Promise<void> {
  const imageDataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CERTIFICATE_TEMPLATE_CONFIG.a4.width, CERTIFICATE_TEMPLATE_CONFIG.a4.height],
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imageDataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  pdf.save(`certificate-${sanitizedFilename}.pdf`);
}
