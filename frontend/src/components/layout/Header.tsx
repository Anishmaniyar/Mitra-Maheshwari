import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo } from "../common/Logo";
import { LpIcon, LP_PATHS } from "../common/LpIcon";
import { useTheme } from "../../hooks/useTheme";

interface HeaderProps {
  variant: "public" | "app";
}

const PUBLIC_LINKS = [
  { to: "/about", label: "About" },
  { to: "/community", label: "Community" },
  { to: "/programs", label: "Programs" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header({ variant }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();

  // Authenticated pages use MemberShell (sidebar) instead of this header.
  if (variant === "app") return null;

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" aria-label="Mitra Maheshwari Seva Pratishthan home">
          <Logo />
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {PUBLIC_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            >
              {link.label}
            </NavLink>
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
            <LpIcon d={theme === "dark" ? LP_PATHS.sun : LP_PATHS.moon} />
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
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      <div className={`container mobile-nav ${menuOpen ? "is-open" : ""}`} id="mobile-nav">
        {PUBLIC_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </NavLink>
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
