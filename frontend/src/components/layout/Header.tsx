import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "../common/Logo";
import { LpIcon, LP_PATHS } from "../common/LpIcon";
import { useTheme } from "../../hooks/useTheme";

interface HeaderProps {
  variant: "public" | "app";
}

const PUBLIC_LINKS = [
  { hash: "#about", label: "About" },
  { hash: "#community", label: "Community" },
  { hash: "#contact", label: "Contact" },
] as const;

export function Header({ variant }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();

  // Transparent -> blur/border once past 40px. Passive listener, cheap toggle.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route/hash change, on Escape, and lock body scroll.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.classList.add("has-menu");
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("has-menu");
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Authenticated pages use MemberShell (sidebar) instead of this header.
  if (variant === "app") return null;

  const isActive = (hash: string) => location.hash === hash;

  // Clicking the current section again should still scroll it into view.
  const onNavClick = (hash: string) => {
    setMenuOpen(false);
    if (location.hash === hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container site-header__inner site-header__bar">
        <Link to="/" aria-label="Mitra Maheshwari Seva Pratishthan home">
          <Logo />
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.hash}
              to={`/${link.hash}`}
              className={`nav-link${isActive(link.hash) ? " is-active" : ""}`}
              aria-current={isActive(link.hash) ? "location" : undefined}
              onClick={() => onNavClick(link.hash)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-nav__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span key={theme} className="theme-icon">
              <LpIcon d={theme === "dark" ? LP_PATHS.sun : LP_PATHS.moon} />
            </span>
          </button>
          <Link to="/login" className="btn btn--ghost btn--sm hide-sm">
            Member Login
          </Link>
          <Link to="/register" className="btn btn--primary btn--sm">
            Join the Community
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      <div
        className={`container mobile-nav landing-mobile-nav ${menuOpen ? "is-open" : ""}`}
        id="mobile-nav"
      >
        {PUBLIC_LINKS.map((link) => (
          <Link
            key={link.hash}
            to={`/${link.hash}`}
            className={`nav-link${isActive(link.hash) ? " is-active" : ""}`}
            onClick={() => onNavClick(link.hash)}
          >
            {link.label}
          </Link>
        ))}
        <Link to="/login" className="btn btn--secondary" onClick={() => setMenuOpen(false)}>
          Member Login
        </Link>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={toggle}
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <Link to="/register" className="btn btn--primary" onClick={() => setMenuOpen(false)}>
          Join the Community
        </Link>
      </div>
    </header>
  );
}
