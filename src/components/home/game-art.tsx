import type { GameId } from "@/types";

/** Small illustrative SVG per game, used on cards and headers. */
export function GameArt({ id, size = 96 }: { id: GameId; size?: number }) {
  switch (id) {
    case "aviator":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
          <path d="M6 82 C 30 78, 52 60, 84 18" stroke="#ff5c9a" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 8" />
          <g transform="translate(60 14) rotate(-35 18 18)">
            <path d="M0 18 L34 6 L40 18 L34 30 Z" fill="#ff2d55" />
            <path d="M14 18 L26 -2 L30 2 L24 18 L30 34 L26 38 Z" fill="#ff8aa6" />
            <circle cx="33" cy="18" r="3" fill="#fff" opacity=".8" />
          </g>
        </svg>
      );
    case "color-prediction":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
          <circle cx="34" cy="38" r="24" fill="#22e58b" opacity=".9" />
          <circle cx="62" cy="38" r="24" fill="#ff2d55" opacity=".85" style={{ mixBlendMode: "screen" }} />
          <circle cx="48" cy="62" r="24" fill="#a78bfa" opacity=".85" style={{ mixBlendMode: "screen" }} />
        </svg>
      );
    case "number-wheel":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
          <circle cx="48" cy="48" r="38" fill="#0c0818" stroke="#22d3ee" strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={48 + Math.sin(a) * 12}
                y1={48 - Math.cos(a) * 12}
                x2={48 + Math.sin(a) * 36}
                y2={48 - Math.cos(a) * 36}
                stroke={i % 2 ? "#ff2d55" : "#22d3ee"}
                strokeWidth="5"
                opacity=".75"
              />
            );
          })}
          <circle cx="48" cy="48" r="10" fill="#ffc83d" />
          <path d="M48 4 L54 16 L42 16 Z" fill="#fff" />
        </svg>
      );
    case "ludo":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden>
          <rect x="8" y="8" width="38" height="38" rx="8" fill="#ff2d55" />
          <rect x="50" y="8" width="38" height="38" rx="8" fill="#22e58b" />
          <rect x="8" y="50" width="38" height="38" rx="8" fill="#ffc83d" />
          <rect x="50" y="50" width="38" height="38" rx="8" fill="#3b82f6" />
          <circle cx="27" cy="27" r="9" fill="#fff" opacity=".85" />
          <circle cx="69" cy="27" r="9" fill="#fff" opacity=".85" />
          <circle cx="27" cy="69" r="9" fill="#fff" opacity=".85" />
          <circle cx="69" cy="69" r="9" fill="#fff" opacity=".85" />
        </svg>
      );
  }
}
