// Date helpers for the planning page. All wall-clock times are interpreted in
// Europe/Berlin so that values render identically on the server and the client
// (avoiding hydration mismatches) regardless of the host timezone.

const TZ = "Europe/Berlin";

/** Format an ISO timestamp as a readable German date + time. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Convert an ISO timestamp into a value for an <input type="datetime-local">. */
export function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Convert a datetime-local value (interpreted as Europe/Berlin wall time) into a
 * UTC ISO string, correctly accounting for the Berlin DST offset at that moment.
 */
export function localInputToIso(value?: string | null): string | null {
  if (!value) return null;
  const asUtc = new Date(`${value}:00Z`);
  const berlin = new Date(asUtc.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = berlin.getTime() - utc.getTime();
  return new Date(asUtc.getTime() - offsetMs).toISOString();
}
