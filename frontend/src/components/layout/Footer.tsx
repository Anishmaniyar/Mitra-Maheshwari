import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";

export function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="container">
        <div className="site-footer__grid site-footer__grid--landing">
          <div className="stack">
            <Logo />
            <p className="muted" style={{ fontSize: "var(--font-size-sm)", maxWidth: "22rem" }}>
              Serving society and bringing our community closer.
            </p>
          </div>
          <nav aria-label="Organisation">
            <h3>Organisation</h3>
            <ul>
              <li><Link to="/#about">About Us</Link></li>
              <li><Link to="/#initiatives">Our Initiatives</Link></li>
              <li><Link to="/#contact">Contact</Link></li>
            </ul>
          </nav>
          <nav aria-label="Community">
            <h3>Community</h3>
            <ul>
              <li><Link to="/#community">Community Platform</Link></li>
              <li><Link to="/login">Member Login</Link></li>
              <li><Link to="/register">Join the Community</Link></li>
            </ul>
          </nav>
        </div>
        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            © 2026 Mitra Maheshwari Seva Pratishthan.
          </p>
        </div>
      </div>
    </footer>
  );
}
