/**
  * Sanitizes a cell value to prevent CSV Injection (Formula Injection).
  * If a cell begins with '=', '+', '-', '@', '\t', or '\r', prefix with a single quote (').
  */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // If cell starts with dangerous formula characters, escape with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Double quotes inside fields must be escaped as ""
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  const headerRow = headers.map((h) => sanitizeCsvCell(h.label)).join(',');

  const bodyRows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key];
        if (val instanceof Date) {
          return sanitizeCsvCell(val.toISOString());
        }
        if (typeof val === 'object' && val !== null) {
          return sanitizeCsvCell(JSON.stringify(val));
        }
        return sanitizeCsvCell(val);
      })
      .join(',')
  );

  return [headerRow, ...bodyRows].join('\n');
}
