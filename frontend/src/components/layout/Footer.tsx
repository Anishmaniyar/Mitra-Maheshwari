import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";

export function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container">
        <div className="site-footer__grid site-footer__grid--landing">
          <div className="stack">
            <Logo />
            <p className="muted" style={{ fontSize: "var(--font-size-sm)", maxWidth: "22rem" }}>
              A digital community platform connecting families, services and opportunities.
            </p>
          </div>
          <nav aria-label="Community">
            <h3>Community</h3>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/programs">Programs</Link></li>
            </ul>
          </nav>
          <nav aria-label="Platform">
            <h3>Platform</h3>
            <ul>
              <li><Link to="/login">Member Login</Link></li>
              <li><Link to="/register">Join the Community</Link></li>
              <li><Link to="/programs">Membership</Link></li>
            </ul>
          </nav>
          <nav aria-label="Support">
            <h3>Support</h3>
            <ul>
              <li><Link to="/contact">Contact</Link></li>
              <li><span className="muted">Privacy</span></li>
              <li><span className="muted">Terms</span></li>
            </ul>
          </nav>
        </div>
        <p className="site-footer__copyright">© 2026 Mitra Maheshwari Seva Pratishthan</p>
      </div>
    </footer>
  );
}
