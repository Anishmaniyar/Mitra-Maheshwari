import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MediaFrame } from "./LandingSections";

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
    <section id="home" className="lp-hero">
      <div className="lp-shell lp-hero__grid">
        <div className="lp-hero__copy">
          <h1
            className={loadClass(loaded, "type-display lp-hero__title")}
            style={loaded ? { transitionDelay: "90ms" } : undefined}
          >
            Serving Society.{" "}
            <span className="lp-hero__accent">Connecting Our Community.</span>
          </h1>
          <p
            className={loadClass(loaded, "type-lead lp-hero__lead")}
            style={loaded ? { transitionDelay: "180ms" } : undefined}
          >
            27+ years of service through healthcare, education and community
            initiatives.
          </p>
          <div
            className={loadClass(loaded, "lp-cta lp-cta--left")}
            style={loaded ? { transitionDelay: "270ms" } : undefined}
          >
            <Link to="/register" className="btn btn--primary btn--lg">
              Join the Community <span aria-hidden="true">→</span>
            </Link>
            <a href="#initiatives" className="btn btn--secondary btn--lg">
              Explore Our Work <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div
          className={loadClass(loaded, "lp-hero__visual")}
          style={loaded ? { transitionDelay: "180ms" } : undefined}
        >
          <div className="lp-hero__frame">
            <MediaFrame label="Community photograph" className="lp-media--hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
