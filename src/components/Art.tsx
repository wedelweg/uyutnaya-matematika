import pompompurin from "../assets/pompompurin.png";
import myMelody from "../assets/my-melody.png";
import type { CSSProperties, ReactNode } from "react";
import { ITEM_NAMES, rowsLabel, removedRowsLabel } from "../content/strings";
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
      </>
    ),
    map: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="16" cy="17" r="3" />
      </>
    ),
    heart: (
      <path d="M12 20S2 14 2 8c0-6 8-6 10-1 2-5 10-5 10 1 0 6-10 12-10 12Z" />
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    star: <path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" />,
    leaf: (
      <>
        <path d="M5 19C-2 7 10 3 21 3c0 13-7 20-16 16ZM5 19 16 8" />
      </>
    ),
    check: <path d="m4 12 5 5L20 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    cloud: <path d="M6 18a5 5 0 1 1 0-10 6 6 0 0 1 12-1 5.5 5.5 0 1 1 1 11Z" />,
    flower: (
      <>
        <path d="M12 14v8m0-3 5-3" />
        <circle cx="12" cy="8" r="6" />
        <circle cx="12" cy="8" r="2" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.star}
    </svg>
  );
}
// Retain legacy profile keys so existing progress and backups stay compatible.
export function Mascot({
  pet = "bunny",
  className = "",
}: {
  pet?: "cat" | "bunny";
  className?: string;
}) {
  return (
    <img
      className={`mascot ${className}`}
      src={pet === "bunny" ? pompompurin : myMelody}
      alt={pet === "bunny" ? "Pompompurin" : "My Melody"}
      width={330}
      height={340}
      draggable={false}
    />
  );
}
export function Item({
  id,
  className = "",
}: {
  id: number;
  className?: string;
}) {
  const items: ReactNode[] = [
    <path d="M32 51 10 32C-2 14 20 3 32 20 44 3 66 14 54 32Z" fill="#E8B5C9" />,
    <>
      <path
        d="M33 41V14m0 16c-15 0-18-13-18-13 15-1 18 13 18 13Zm0-6c14 0 17-14 17-14-14-1-17 14-17 14Z"
        fill="#A5BE96"
        stroke="#65825D"
        strokeWidth="2"
      />
      <path d="m17 38 4 22h24l4-22Z" fill="#D7AD86" />
    </>,
    <>
      <path d="M32 28v29M19 59h26" stroke="#977A58" strokeWidth="4" />
      <path
        d="m32 3 7 14 16 2-12 11 3 16-14-8-14 8 3-16L9 19l16-2Z"
        fill="#F4D57A"
      />
    </>,
    <>
      <path d="M8 12h45v43H8Z" fill="#B9CCBE" />
      <path
        d="M8 22h45M8 34h45M19 12v43M40 12v43"
        stroke="#F7F1DF"
        strokeWidth="3"
      />
      <path
        d="m9 55-2 5m11-5-1 5m10-5v5m10-5v5m12-5 1 5"
        stroke="#8BA495"
        strokeWidth="2"
      />
    </>,
    <>
      <path d="M46 22h7c15 0 11 24-7 21" stroke="#B88870" strokeWidth="5" />
      <path d="M10 20h38v26c0 16-38 16-38 0Z" fill="#E9B7A3" />
      <ellipse cx="29" cy="20" rx="19" ry="5" fill="#8B6549" />
      <path
        d="M23 9c-5-6 3-5 0-11m13 11c-5-6 3-5 0-11"
        stroke="#C5B09E"
        strokeWidth="2"
      />
    </>,
    <>
      <rect x="8" y="6" width="48" height="52" rx="5" fill="#B99575" />
      <rect x="14" y="12" width="36" height="40" rx="2" fill="#D9D0E6" />
      <path d="M39 20c-24-4-24 26 0 24-12-5-13-17 0-24" fill="#FFF3C3" />
    </>,
    <>
      <path d="M29 23 5 10v41l24-14 4-1 26 15V10L35 23Z" fill="#D7B5CE" />
      <circle cx="32" cy="30" r="8" fill="#B18BA8" />
    </>,
    <path
      d="M15 51c-25-5-12-29 1-27 2-27 33-27 34-3 21-1 24 29 4 30Z"
      fill="#F8F4ED"
      stroke="#CEBDB1"
      strokeWidth="2"
    />,
    <>
      <rect x="8" y="10" width="12" height="46" rx="3" fill="#C4B4D3" />
      <rect x="22" y="5" width="14" height="51" rx="3" fill="#E4B7AD" />
      <path d="m39 16 12-3 10 40-12 3Z" fill="#B2C7B2" />
      <path d="M11 20h6m8 0h8M11 47h6m8 0h8" stroke="#FFF7E9" strokeWidth="3" />
    </>,
    <>
      <path d="M0 9q32 40 64 0" stroke="#9A8168" strokeWidth="2" />
      {[9, 23, 40, 55].map((x, i) => (
        <path
          key={x}
          transform={`translate(${x} ${i === 0 || i === 3 ? 16 : 25}) scale(.5)`}
          d="m0 0 5 10 12 2-9 8 2 11-10-5-10 5 2-11-9-8 12-2Z"
          fill={i % 2 ? "#CDB3DB" : "#EBC77E"}
        />
      ))}
    </>,
    <>
      <path
        d="M8 20c0-15 48-15 48 0 0 23-17 41-24 41S8 43 8 20"
        fill="#DA9FA7"
      />
      <path d="m16 12 8-9 9 7 10-7 7 10-18 9Z" fill="#9BB18A" />
      {[18, 32, 46, 25, 39, 32].map((x, i) => (
        <path
          key={i}
          d={`m${x} ${25 + Math.floor(i / 3) * 12} 0 3`}
          stroke="#FFE7C4"
          strokeWidth="2"
        />
      ))}
    </>,
    <>
      <path
        d="M32 42V11m0 21H16V20m16 5h15V12"
        stroke="#8FA883"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path d="m17 40 5 21h23l4-21Z" fill="#D7B5CE" />
    </>,
    <>
      <path
        d="M32 16C4-6-9 24 13 32-9 47 13 73 32 49 49 73 73 47 51 32 73 11 48-6 32 16"
        fill="#E8D9A2"
      />
      <circle cx="32" cy="33" r="12" fill="#BBA1C7" />
    </>,
    <>
      <ellipse cx="32" cy="54" rx="29" ry="7" fill="#D7CAB6" />
      <path d="m16 19-6 31c6 9 38 9 44 0l-6-31Z" fill="#F5D78F" />
      <ellipse cx="32" cy="19" rx="16" ry="6" fill="#A47A50" />
      <path
        d="M24 35v3m16-3v3"
        stroke="#73513C"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>,
    <path
      d="m32 4 9 17 18 3-13 14 3 20-17-9-17 9 3-20L5 24l18-3Z"
      fill="#F3D68A"
      stroke="#CFAB69"
      strokeWidth="2"
    />,
    <>
      <path d="M17 29V18c0-20 30-20 30 0v11" stroke="#A78666" strokeWidth="4" />
      <path d="m6 26 7 34h39l6-34Z" fill="#C8A783" />
      <path
        d="M9 36h47M12 47h42M23 28v30m16-30v30"
        stroke="#F0DABB"
        strokeWidth="3"
      />
    </>,
  ];
  return (
    <svg
      className={className}
      viewBox="-4 -4 72 72"
      role="img"
      aria-label={ITEM_NAMES[id]}
    >
      {items[id]}
    </svg>
  );
}
export function Room({
  pet,
  rewards,
  slots,
}: {
  pet: "cat" | "bunny";
  rewards: number[];
  slots?: (number | null)[];
}) {
  return (
    <div
      className={`room-art pet-${pet}`}
      role="img"
      aria-label={`Gemütliches Zimmer mit sonnigem Fenster, Kissen und ${pet === "bunny" ? "Pompompurin" : "My Melody"}`}
    >
      <svg viewBox="0 0 600 410" className="room-scene" aria-hidden="true">
        <defs>
          <pattern
            id="wall"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M15 0v30"
              stroke="#EADFC8"
              strokeWidth=".7"
              opacity=".45"
            />
          </pattern>
          <linearGradient id="sky" x2="0" y2="1">
            <stop stopColor="#DFEBDD" />
            <stop offset="1" stopColor="#F7EFCD" />
          </linearGradient>
        </defs>
        <rect
          width="600"
          height="410"
          rx="24"
          fill="var(--room-wall,#F5EDD9)"
        />
        <path d="M0 0h600v286H0Z" fill="url(#wall)" />
        <path d="M0 286h600v124H0Z" fill="var(--room-floor,#EAD8BB)" />
        <path d="M0 286h600" stroke="#C6A982" strokeWidth="5" />
        <path
          d="M70 286 15 410m150-124-25 124m132-124v124m109-124 20 124m80-124 60 124M0 344h600"
          stroke="#CDAE86"
          opacity=".35"
        />
        <rect x="307" y="40" width="205" height="184" rx="81" fill="#D4B796" />
        <rect
          x="319"
          y="51"
          width="181"
          height="162"
          rx="72"
          fill="url(#sky)"
        />
        <circle cx="448" cy="95" r="24" fill="#FBE6A4" />
        <path d="M318 190q35-55 87-3 43-45 95-5v32H318Z" fill="#B5C5A2" />
        <path d="M409 51v162m-90-73h181" stroke="#E2C9A4" strokeWidth="9" />
        <path
          d="M302 39c-16 44-3 104-16 161 26 2 48-28 51-67-5-26 5-63 14-94M479 39c13 32 7 82 14 117 7 26 20 41 41 44-10-59 0-105-13-161"
          fill="var(--room-curtain,#E8BFC2)"
        />
        <path d="m302 150 28 5m165-1 26-4" stroke="#B9878C" strokeWidth="4" />
        <path
          d="M298 224h224"
          stroke="#BA9474"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M61 146h155v9H61Z" fill="#B99778" />
        <path d="M78 154v12m120-12v12" stroke="#B99778" strokeWidth="5" />
        <rect x="86" y="94" width="29" height="51" rx="5" fill="#C7B4D4" />
        <rect x="118" y="104" width="23" height="41" rx="4" fill="#AABCA8" />
        <path d="M92 104h17m15 10h11" stroke="#FFF7E7" strokeWidth="2" />
        <rect x="58" y="193" width="172" height="115" rx="30" fill="#D1B3B3" />
        <rect x="45" y="240" width="202" height="71" rx="25" fill="#E9CCD0" />
        <path d="M62 306v17m166-17v17" stroke="#927359" strokeWidth="8" />
        <rect
          x="74"
          y="213"
          width="57"
          height="46"
          rx="17"
          transform="rotate(-9 74 213)"
          fill="#FFF0CE"
        />
        <rect
          x="153"
          y="206"
          width="55"
          height="49"
          rx="16"
          transform="rotate(12 153 206)"
          fill="#D5C4DD"
        />
        <ellipse
          cx="341"
          cy="355"
          rx="155"
          ry="36"
          fill="var(--room-rug,#C4CFB4)"
        />
        <ellipse
          cx="341"
          cy="355"
          rx="141"
          ry="29"
          fill="none"
          stroke="#E5E9D6"
          strokeWidth="2"
        />
        <path d="M488 272h65l-6 55h-53Z" fill="#C9A784" />
        <path
          d="M520 277v-67m0 33c-39 2-47-31-47-31 43 0 47 31 47 31m0-8c33-3 42-32 42-32-36-1-42 32-42 32"
          fill="#9CAB83"
          stroke="#7E966F"
          strokeWidth="3"
        />
        <path
          d="M52 47q90 68 182-1"
          fill="none"
          stroke="#B69A78"
          strokeWidth="1.5"
        />
        {[73, 114, 155, 200].map((x, i) => (
          <g
            key={x}
            transform={`translate(${x} ${i === 0 || i === 3 ? 61 : 76})`}
          >
            <path
              d="m0 0 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z"
              fill={i % 2 ? "#CFB3D5" : "#E6C674"}
            />
          </g>
        ))}
      </svg>
      <div className="room-mascot">
        <Mascot pet={pet} />
      </div>
      {(slots ?? rewards.slice(-8)).map((id, i) =>
        id === null ? null : (
          <Item key={id} id={id} className={`room-item item-position-${i}`} />
        ),
      )}
      <span className="scene-caption">Platz für kleine Entdeckungen</span>
    </div>
  );
}
export function DotArray({
  a,
  b,
  split = 0,
  rotate = false,
  removedRows = 0,
}: {
  a: number;
  b: number;
  split?: number;
  rotate?: boolean;
  removedRows?: number;
}) {
  const rows = rotate ? b : a,
    cols = rotate ? a : b;
  return (
    <div className="array-wrap">
      <div
        className="dot-array"
        role="img"
        aria-label={
          removedRows
            ? removedRowsLabel(rows, cols, removedRows)
            : rowsLabel(rows, cols)
        }
        style={{ "--cols": Math.max(cols, 1) } as CSSProperties}
      >
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className={`dot-row ${split && r >= split ? "second" : ""} ${removedRows && r >= rows - removedRows ? "removed" : ""}`}
            style={split && r === split ? { marginTop: 10 } : undefined}
          >
            {Array.from({ length: cols }, (_, c) => (
              <span key={c} className="dot" />
            ))}
            {cols === 0 && <span className="empty-group">∅</span>}
          </div>
        ))}
      </div>
      <p className="array-caption">
        {removedRows
          ? removedRowsLabel(rows, cols, removedRows)
          : rowsLabel(rows, cols)}
      </p>
    </div>
  );
}
