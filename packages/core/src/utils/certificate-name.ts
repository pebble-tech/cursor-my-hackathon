import { CERTIFICATE_TEMPLATE_CONFIG } from '~/config/certificate';

export interface FormattedName {
  lines: string[];
  fontSize: number;
}

const avgCharWidthMultiplier = 0.55;

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * avgCharWidthMultiplier;
}

function splitNameIntoTwoLines(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    const mid = Math.floor(name.length / 2);
    return [name.slice(0, mid), name.slice(mid)];
  }

  const mid = Math.floor(words.length / 2);
  const firstLine = words.slice(0, mid).join(' ');
  const secondLine = words.slice(mid).join(' ');

  return [firstLine, secondLine];
}

function calculateFontSizeForText(text: string, maxWidth: number, minSize: number, baseSize: number): number {
  const estimatedWidth = estimateTextWidth(text, baseSize);
  if (estimatedWidth <= maxWidth) {
    return baseSize;
  }

  const scaleFactor = maxWidth / estimatedWidth;
  const scaledSize = baseSize * scaleFactor;
  return Math.max(minSize, Math.floor(scaledSize));
}

export function formatNameForCertificate(name: string): FormattedName {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { lines: [''], fontSize: CERTIFICATE_TEMPLATE_CONFIG.font.baseSize };
  }

  const { nameArea, font } = CERTIFICATE_TEMPLATE_CONFIG;
  const maxWidth = nameArea.maxWidth;

  const singleLineWidth = estimateTextWidth(trimmedName, font.baseSize);
  if (singleLineWidth <= maxWidth) {
    return { lines: [trimmedName], fontSize: font.baseSize };
  }

  const widthAtMinSize = estimateTextWidth(trimmedName, font.minSize);
  if (widthAtMinSize <= maxWidth) {
    const scaledFontSize = calculateFontSizeForText(trimmedName, maxWidth, font.minSize, font.baseSize);
    return { lines: [trimmedName], fontSize: scaledFontSize };
  }

  const [firstLine, secondLine] = splitNameIntoTwoLines(trimmedName);
  const longerLine = firstLine.length > secondLine.length ? firstLine : secondLine;
  const twoLineFontSize = calculateFontSizeForText(longerLine, maxWidth, font.minSize, font.baseSize);

  return {
    lines: [firstLine, secondLine],
    fontSize: twoLineFontSize,
  };
}

export function validateCertificateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be 100 characters or less' };
  }
  return { valid: true };
}
