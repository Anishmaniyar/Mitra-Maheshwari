import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Logo } from "../common/Logo";

interface HeaderProps {
  variant: "public" | "app";
}

export function Header({ variant }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (variant === "app") {
    return (
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/dashboard" aria-label="Dashboard home" className="header-logo-link">
            <Logo className="logo--hide-text-sm" />
          </Link>
          <nav className="site-nav" aria-label="Main">
            <NavLink to="/dashboard" end className="nav-link">
              Dashboard
            </NavLink>
            <NavLink to="/family" className="nav-link">
              Family
            </NavLink>
            <NavLink to="/payments" className="nav-link">
              Payments
            </NavLink>
          </nav>
          <div className="site-header__user">
            {user && (
              <span className="site-header__user-chip">
                <span className="avatar" aria-hidden="true">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
                <span className="site-header__greeting">{user.firstName}</span>
              </span>
            )}
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" aria-label="Mitra Maheshwari Seva Pratishthan home">
          <Logo />
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <a href="#about" className="nav-link">About</a>
          <a href="#programs" className="nav-link">Programs</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>
        <div className="site-nav__actions">
          <Link to="/register" className="btn btn--ghost btn--sm hide-sm">
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
        <a href="#about" className="nav-link" onClick={() => setMenuOpen(false)}>About</a>
        <a href="#programs" className="nav-link" onClick={() => setMenuOpen(false)}>Programs</a>
        <a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</a>
        <Link to="/register" className="btn btn--secondary" onClick={() => setMenuOpen(false)}>
          Member Login
        </Link>
      </div>
    </header>
  );
}