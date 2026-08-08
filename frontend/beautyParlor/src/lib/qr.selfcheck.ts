/**
 * Round-trips the booking pass: encode the /manage URL as a QR, decode it back
 * with the same library the studio scanner uses, and pull the reference out.
 * If this fails, reception scans a code that does not open the appointment.
 *
 *   npx esbuild --bundle src/lib/qr.selfcheck.ts --platform=node \
 *     --format=cjs --outfile=qrcheck.cjs && node qrcheck.cjs
 *
 * (cjs, because the qrcode package requires "fs" lazily for its PNG writer.)
 */

import assert from "node:assert/strict";

import QRCode from "qrcode";
import jsQR from "jsqr";

import { refFromScan } from "./passRef";

/** Renders a QR's module matrix into an RGBA bitmap jsQR can read. */
function rasterise(text: string, scale = 4, quiet = 4) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const side = (size + quiet * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!qr.modules.get(x, y)) continue;

      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = (x + quiet) * scale + dx;
          const py = (y + quiet) * scale + dy;
          const at = (py * side + px) * 4;
          data[at] = data[at + 1] = data[at + 2] = 0;
        }
      }
    }
  }

  return { data, side };
}

const REF = "BBH-UWH99";
const PASS_URL = `https://browbeautyhub.com.au/manage?ref=${REF}`;

const { data, side } = rasterise(PASS_URL);
const decoded = jsQR(data, side, side);

assert.ok(decoded, "the generated pass did not decode");
assert.equal(decoded.data, PASS_URL, "the pass decoded to different content");
assert.equal(
  refFromScan(decoded.data),
  REF,
  "the reference could not be read back out of the scan"
);

/* what the scanner has to cope with at the desk */

assert.equal(refFromScan(`${PASS_URL}&utm_source=qr`), REF, "extra query params");
assert.equal(refFromScan("bbh-uwh99"), REF, "typed in lower case");
assert.equal(refFromScan("  BBH-UWH99  "), REF, "padded with spaces");
assert.equal(refFromScan("http://localhost:5173/manage?ref=BBH-UWH99"), REF, "dev origin");
assert.equal(refFromScan("BBH-UWH9"), null, "too short to be a reference");
assert.equal(refFromScan("https://example.com/"), null, "an unrelated QR");
assert.equal(refFromScan(""), null, "nothing scanned");

console.log("qr pass self-check passed");
