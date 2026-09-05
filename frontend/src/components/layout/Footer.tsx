import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";

export function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="site-footer__grid">
          <div className="stack">
            <Logo />
            <p className="muted" style={{ fontSize: "var(--font-size-sm)" }}>
              Serving our community with care, connection and commitment.
            </p>
          </div>
          <nav aria-label="Footer">
            <h3>Navigation</h3>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#programs">Programs</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
          <nav aria-label="Community">
            <h3>Community</h3>
            <ul>
              <li><Link to="/register">Join Community</Link></li>
              <li><Link to="/register">Member Login</Link></li>
            </ul>
          </nav>
        </div>
        <p className="site-footer__copyright">© 2026 Mitra Maheshwari Seva Pratishthan</p>
      </div>
    </footer>
  );
}