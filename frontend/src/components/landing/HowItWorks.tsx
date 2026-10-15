import { useRevealOnce } from "../../hooks/useRevealOnce";

/* Hardcoded steps — no fetch on landing. */
const steps = [
  { title: "Enter your details", text: "Add your name and details, then verify your mobile number." },
  { title: "Complete your family profile", text: "Add family members and keep their details accurate." },
  { title: "Submit for approval", text: "Your registration is reviewed before the record goes live." },
];

export function HowItWorks() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id="how-it-works" ref={ref} className={`lp-section lp-section--tint${on}`}>
      <div className="lp-shell">
        <div className={`lp-rv${on}`} style={visible ? { transitionDelay: "0ms" } : undefined}>
          <span className="home-eyebrow">How to become a member</span>
          <h2 className="section-heading" style={{ marginTop: "0.75rem" }}>Joining takes three steps.</h2>
        </div>
        <p className={`lp-rv${on} home-sub`} style={visible ? { transitionDelay: "150ms" } : undefined}>
          Takes a few minutes. Every record is reviewed before going live.
        </p>

        <ol className="lp-timeline" style={{ marginTop: "2rem", listStyle: "none", padding: 0 }}>
          {steps.map((s, i) => (
            <li
              key={s.title}
              className={`lp-rv lp-rv--card lp-step${on}`}
              style={visible ? { transitionDelay: `${i * 150}ms` } : undefined}
            >
              <span className="lp-step__circle" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="section-title" style={{ marginTop: "1rem" }}>{s.title}</h3>
              <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9375rem" }}>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
