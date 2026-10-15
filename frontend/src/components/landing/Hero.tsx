import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LP_PATHS, LpIcon } from "../common/LpIcon";

const aiTools = [
  { icon: "search" as const, title: "Member discovery", text: "Find members and families across the community." },
  { icon: "drop" as const, title: "Blood donors", text: "Matching donors when someone needs help." },
  { icon: "briefcase" as const, title: "Services", text: "Businesses and professionals offered by members." },
];

function loadClass(loaded: boolean, extra = "") {
  return `lp-load${loaded ? " is-loaded" : ""}${extra ? ` ${extra}` : ""}`;
}

export function Hero() {
  // Load-only entrance: flip once 100ms after mount, never on scroll.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="hero" className="lp-hero">
      <div className="lp-shell" style={{ position: "relative" }}>
        <div className="lp-hero__center">
          <span className={loadClass(loaded, "lp-load--logo home-eyebrow")} style={loaded ? { transitionDelay: "0ms" } : undefined}>
            Mitra Maheshwari Seva Pratishthan
          </span>
          <h1 className={loadClass(loaded, "page-heading")} style={{ marginTop: "1rem", ...(loaded ? { transitionDelay: "100ms" } : {}) }}>
            Closer families. A stronger community.
          </h1>
          <p className={loadClass(loaded, "home-lead")} style={loaded ? { transitionDelay: "200ms" } : undefined}>
            Family connections, community support and essential services in one
            member-verified home.
          </p>
          <div className={loadClass(loaded, "home-cta")} style={loaded ? { transitionDelay: "300ms" } : undefined}>
            <Link to="/register" className="btn btn--primary btn--lg">
              Join the Community <span aria-hidden="true">→</span>
            </Link>
            <Link to="/login" className="btn btn--secondary btn--lg">
              Member Login
            </Link>
          </div>
          <ul className={loadClass(loaded, "home-trust")} style={{ listStyle: "none", padding: 0, ...(loaded ? { transitionDelay: "400ms" } : {}) }}>
            {aiTools.map((t) => (
              <li key={t.title}>
                <LpIcon d={LP_PATHS[t.icon]} />
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
