export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatKcal(value: number | null | undefined): string {
  if (value == null) return '0';
  return Math.round(value).toLocaleString('vi-VN');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}
