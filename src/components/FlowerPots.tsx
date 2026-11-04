import { flowers, pots, perFlowers } from "../content/numbers";
export function FlowerPots({ a, b }: { a: number; b: number }) {
  return (
    <figure
      className="flower-garden"
      aria-label={`${pots(a)}. В каждом ${perFlowers(b)}.`}
    >
      <div className="flower-pots">
        {Array.from({ length: a }, (_, i) => (
          <div
            className="flower-pot-group"
            key={i}
            role="img"
            aria-label={`Горшочек ${i + 1}: ${flowers(b)}`}
          >
            <div className="flower-stems">
              {Array.from({ length: b }, (_, j) => (
                <svg
                  className="counted-flower"
                  key={j}
                  viewBox="0 0 28 55"
                  aria-hidden="true"
                >
                  <path
                    d="M14 54V20M14 40Q2 41 4 30Q13 30 14 40M14 34Q25 35 24 24Q15 25 14 34"
                    fill="#97b783"
                    stroke="#527546"
                    strokeWidth="2"
                  />
                  <path
                    d="M14 7C3-5-7 14 5 19C-3 32 14 35 16 24C29 33 36 14 24 12C29 0 14-4 14 7"
                    transform="translate(1 3) scale(.85)"
                    fill={j % 2 ? "#d8b5e7" : "#efafc1"}
                    stroke="#93627d"
                    strokeWidth="1.5"
                  />
                  <circle cx="14" cy="15" r="4" fill="#f5d578" />
                </svg>
              ))}
            </div>
            <div className="garden-pot">
              <span>{i + 1}</span>
            </div>
          </div>
        ))}
      </div>
      <figcaption>
        Один горшочек — одна группа. Посчитай цветы в каждой.
      </figcaption>
    </figure>
  );
}
