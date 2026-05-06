// Shared CSV export utility (client-side only)

// Escape a value for CSV and wrap in quotes if needed
export function escapeCSV(value: unknown): string {
  // Treat null/undefined as empty string
  if (value == null) value = "";
  // Ensure it's a string
  const s = String(value);
  // If contains quotes, commas, or newlines, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function downloadCSV<T>(
  filename: string,
  data: T[],
  columns: { header: string; accessor: (item: T) => string | number }[]
): void {
  // Build header
  const header = columns.map((c) => escapeCSV(c.header)).join(",");
  // Build rows
  const rows = data.map((item) =>
    columns.map((c) => escapeCSV(String(c.accessor(item) ?? ""))).join(",")
  );

  const csvContent = "\uFEFF" + [header, ...rows].join("\r\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
