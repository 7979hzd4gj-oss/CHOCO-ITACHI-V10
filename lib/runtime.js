let start = Date.now();
export function getUptime() {
  let diff = Date.now() - start;
  let s = Math.floor(diff / 1000);
  let h = Math.floor(s / 3600);
  let m = Math.floor((s % 3600) / 60);
  s = s % 60;
  return `${h}h ${m}m ${s}s`;
}