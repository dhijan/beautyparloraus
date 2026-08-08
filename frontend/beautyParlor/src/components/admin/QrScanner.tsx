import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

import { refFromScan } from "../../lib/passRef";

// Chrome on Android and macOS ships the Barcode Detection API; Windows does
// not, so jsQR decodes the frames there. Same loop either way.
interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

const getDetectorCtor = () =>
  (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;

interface QrScannerProps {
  onScan: (reference: string) => void;
  onClose: () => void;
}

function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let live = true;

    const Detector = getDetectorCtor();
    const native = Detector ? new Detector({ formats: ["qr_code"] }) : null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    /** Returns the raw text of any QR in the current video frame. */
    const readFrame = async (video: HTMLVideoElement) => {
      if (native) {
        const hits = await native.detect(video);
        return hits.map((h) => h.rawValue);
      }

      if (!ctx || !video.videoWidth) return [];

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hit = jsQR(image.data, image.width, image.height);

      return hit ? [hit.data] : [];
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((granted) => {
        if (!live) {
          granted.getTracks().forEach((t) => t.stop());
          return;
        }

        stream = granted;

        if (videoRef.current) {
          videoRef.current.srcObject = granted;
          videoRef.current.play().catch(() => {});
        }

        const tick = async () => {
          if (!live || !videoRef.current) return;

          try {
            const found = await readFrame(videoRef.current);
            const ref = found.map(refFromScan).find(Boolean);

            if (ref) {
              live = false;
              onScan(ref);
              return;
            }
          } catch {
            // A dropped frame is not worth stopping the loop for.
          }

          frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        setError(
          "No camera access. Allow the camera for this site, or type the reference below."
        );
      });

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onScan]);

  return (
    <div className="studio-scanner">
      <div className="studio-scanner-head">
        <span className="studio-eyebrow">Scan a pass</span>
        <button
          className="studio-icon-btn"
          onClick={onClose}
          aria-label="Close scanner"
        >
          ×
        </button>
      </div>

      {error ? (
        <p className="studio-note">{error}</p>
      ) : (
        <div className="studio-scanner-video">
          <video ref={videoRef} muted playsInline />
          <span className="studio-scanner-frame" aria-hidden="true"></span>
        </div>
      )}

      <form
        className="studio-scanner-manual"
        onSubmit={(e) => {
          e.preventDefault();
          const ref = refFromScan(manual);
          if (ref) onScan(ref);
          else setError(`"${manual}" is not a Brow Beauty Hub reference.`);
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value.toUpperCase())}
          placeholder="BBH-XXXXX"
          aria-label="Booking reference"
        />
        <button type="submit">Look up</button>
      </form>
    </div>
  );
}

export default QrScanner;
