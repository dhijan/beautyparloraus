import type { Studio } from "../../api/bookingApi";

interface StudioBarProps {
  studios: Studio[];
  studio: string;
  onChange: (key: string) => void;
}

/** Scope switcher for the studio console. Pair with useStudioScope. */
function StudioBar({ studios, studio, onChange }: StudioBarProps) {
  return (
    <div className="studio-pills">
      {[{ k: "all", short: "All" }, ...studios].map((s) => (
        <button
          key={s.k}
          className={studio === s.k ? "active" : ""}
          onClick={() => onChange(s.k)}
        >
          {s.short}
        </button>
      ))}
    </div>
  );
}

export default StudioBar;
