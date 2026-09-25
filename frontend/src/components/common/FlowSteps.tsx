import { LpIcon, LP_PATHS } from "./LpIcon";

const STEPS = ["Find Your Record", "Review Details", "Verify OTP"] as const;

export function FlowSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flow-steps" aria-label="Registration progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "is-done" : n === current ? "is-active" : "";
        return (
          <li key={label} className={`flow-step ${state}`.trim()} aria-current={n === current ? "step" : undefined}>
            <span className="flow-step__bar" aria-hidden="true" />
            <span className="flow-step__label">
              <span className="flow-step__dot" aria-hidden="true">
                {n < current ? <LpIcon d={LP_PATHS.check} /> : n}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
