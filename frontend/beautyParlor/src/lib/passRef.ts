/**
 * Reads a booking reference out of whatever the pass encodes — the QR holds a
 * /manage?ref=… URL, but a bare code typed in at the desk works just as well.
 * Returns null when the scan is not one of ours.
 */
export function refFromScan(text: string): string | null {
  const raw = String(text).trim();

  const fromUrl = raw.match(/[?&]ref=([^&\s]+)/i);
  const candidate = fromUrl ? decodeURIComponent(fromUrl[1]) : raw;
  const match = candidate.toUpperCase().match(/BBH-[A-Z0-9]{5}/);

  return match ? match[0] : null;
}

/** The URL a pass points at, so a phone camera opens the booking. */
export const passUrlFor = (origin: string, reference: string) =>
  `${origin}/manage?ref=${encodeURIComponent(reference)}`;
