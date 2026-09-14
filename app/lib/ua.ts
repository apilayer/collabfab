/** Minimal UA sniffing — enough to label a marker, no dependency required. */
export function parseUa(ua: string | null) {
  if (!ua) return { os: null, browser: null, device: null };
  const s = ua;

  const os =
    /Windows NT 10/.test(s) ? "Windows"
    : /Windows/.test(s) ? "Windows"
    : /iPhone|iPad|iPod/.test(s) ? "iOS"
    : /Mac OS X|Macintosh/.test(s) ? "Mac OS"
    : /Android/.test(s) ? "Android"
    : /CrOS/.test(s) ? "ChromeOS"
    : /Linux/.test(s) ? "Linux"
    : null;

  const browser =
    /Edg\//.test(s) ? "Edge"
    : /OPR\/|Opera/.test(s) ? "Opera"
    : /Firefox\//.test(s) ? "Firefox"
    : /Chrome\//.test(s) ? "Chrome"
    : /Safari\//.test(s) ? "Safari"
    : null;

  const device =
    /iPad|Tablet/.test(s) ? "Tablet"
    : /Mobi|iPhone|Android.*Mobile/.test(s) ? "Mobile"
    : "Desktop";

  return { os, browser, device };
}
