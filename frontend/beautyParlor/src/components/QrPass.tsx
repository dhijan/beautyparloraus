import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { passUrlFor } from "../lib/passRef";

interface QrPassProps {
  /** Booking reference, e.g. BBH-UWH99. */
  reference: string;
  caption?: string;
}

/**
 * The pass a guest shows at reception. It encodes the /manage URL for the
 * booking, so a phone camera opens the appointment and the studio scanner
 * pulls the reference straight out of it.
 */

function QrPass({ reference, caption = "Show this at reception" }: QrPassProps) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let live = true;

    QRCode.toDataURL(passUrlFor(window.location.origin, reference), {
      width: 384,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#17140fff", light: "#ffffffff" },
    })
      .then((url) => {
        if (live) setSrc(url);
      })
      .catch(() => {
        // Rendering failed — the reference below the code is still the pass.
        if (live) setSrc("");
      });

    return () => {
      live = false;
    };
  }, [reference]);

  return (
    <div className="bbh-bk-pass">
      {src ? (
        <img src={src} alt={`QR pass for booking ${reference}`} width={192} height={192} />
      ) : (
        <div className="bbh-bk-pass-fallback" aria-hidden="true"></div>
      )}

      <span className="code">{reference}</span>
      <span className="cap">{caption}</span>
    </div>
  );
}

export default QrPass;
