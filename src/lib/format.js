// Driver Neon mengembalikan kolom tipe INTERVAL sebagai object,
// contoh: { hours: 1, minutes: 23, seconds: 45 } — bukan string.
// Function ini ubah jadi string "HH:MM:SS" yang aman dirender ke UI atau PDF.
export function formatInterval(interval) {
  if (!interval) return "-";
  if (typeof interval === "string") return interval; // sudah string, biarkan

  const hours = Math.floor(interval.hours || 0);
  const minutes = Math.floor(interval.minutes || 0);
  const seconds = Math.floor(interval.seconds || 0);

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
