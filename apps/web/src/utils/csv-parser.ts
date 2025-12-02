import Papa from 'papaparse';

export type ParsedParticipant = {
  name: string;
  email: string;
  lumaId?: string;
};

export type ParsedRow = {
  row: number;
  data: ParsedParticipant;
  valid: boolean;
  error?: string;
};

export type CSVParseResult = {
  success: boolean;
  rows: ParsedRow[];
  validCount: number;
  invalidCount: number;
  error?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseParticipantsCSV(csvContent: string): CSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: `CSV parsing error: ${result.errors[0].message}`,
    };
  }

  const headers = result.meta.fields?.map((f) => f.toLowerCase()) || [];

  if (!headers.includes('email')) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: 'Missing required column: email',
    };
  }

  if (!headers.includes('name')) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: 'Missing required column: name',
    };
  }

  const rows: ParsedRow[] = [];
  let validCount = 0;
  let invalidCount = 0;

  result.data.forEach((row, index) => {
    const email = (row['email'] || '').trim();
    const name = (row['name'] || '').trim();
    const lumaId = (row['luma_id'] || row['lumaid'] || '').trim() || undefined;

    const parsedRow: ParsedRow = {
      row: index + 1,
      data: { name, email, lumaId },
      valid: true,
    };

    if (!email) {
      parsedRow.valid = false;
      parsedRow.error = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      parsedRow.valid = false;
      parsedRow.error = 'Invalid email format';
    } else if (!name) {
      parsedRow.valid = false;
      parsedRow.error = 'Name is required';
    }

    if (parsedRow.valid) {
      validCount++;
    } else {
      invalidCount++;
    }

    rows.push(parsedRow);
  });

  return {
    success: true,
    rows,
    validCount,
    invalidCount,
  };
}

export function generateSkippedRowsCSV(skippedRows: Array<{ row: number; email: string; reason: string }>): string {
  const data = skippedRows.map((r) => ({
    row: r.row,
    email: r.email,
    reason: r.reason,
  }));

  return Papa.unparse(data);
}
