const DE_MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const start = `${monday.getDate()}. ${sameMonth ? "" : DE_MONTHS[monday.getMonth()] + " "}${monday.getFullYear() !== sunday.getFullYear() ? monday.getFullYear() : ""}`.trim();
  const end = `${sunday.getDate()}. ${DE_MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
  return `${start} – ${end}`;
}
