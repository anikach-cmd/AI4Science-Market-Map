import { FOUNDED_YEAR_LEGEND } from "../utils/foundedYear";

/** Legend for the optional founded-year corner dot shown on chips. */
export function Legend() {
  return (
    <div className="legend-founded-year">
      <span className="legend-founded-year-title">Founded:</span>
      {FOUNDED_YEAR_LEGEND.map((b) => (
        <span key={b.label} className="legend-founded-year-item">
          <span
            className="legend-founded-year-dot"
            style={{ backgroundColor: b.color }}
          />
          {b.label}
        </span>
      ))}
    </div>
  );
}
