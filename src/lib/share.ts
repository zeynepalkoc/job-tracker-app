import type { AppData } from "../types/app";

function toUrlSafeBase64(str: string) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ".");
}
function fromUrlSafeBase64(b64: string) {
  const norm = b64.replaceAll("-", "+").replaceAll("_", "/").replaceAll(".", "=");
  return decodeURIComponent(escape(atob(norm)));
}

export function createShareLink(data: AppData) {
  const base = `${location.origin}${location.pathname}`;
  const packed = toUrlSafeBase64(JSON.stringify(data));
  return `${base}?sharePacked=${packed}`;
}

export function loadSharedData(): { data: AppData | null; readOnly: boolean } {
  const params = new URLSearchParams(location.search);
  const packed = params.get("sharePacked");
  if (!packed) return { data: null, readOnly: false };

  try {
    const json = fromUrlSafeBase64(packed);
    const data = JSON.parse(json) as AppData;
    return { data, readOnly: true };
  } catch {
    return { data: null, readOnly: true };
  }
}
