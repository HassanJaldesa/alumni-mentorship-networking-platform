// Dates are shown in Kenyan time whatever the server's own time zone is.
const TIME_ZONE = "Africa/Nairobi";

export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: TIME_ZONE,
  });
}

export function formatTime(value: Date | string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE,
  });
}

export function formatDateTime(value: Date | string): string {
  return `${formatDate(value)}, ${formatTime(value)}`;
}
