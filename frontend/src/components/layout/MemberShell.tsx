import { useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { DEMO_MODE } from "../../config/demo";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { Logo } from "../common/Logo";
import { LpIcon, LP_PATHS } from "../common/LpIcon";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LP_PATHS.home, end: true }],
  },
  {
    label: "My Community",
    items: [
      { to: "/family", label: "My Family", icon: LP_PATHS.users },
      { to: "/discover", label: "Discover", icon: LP_PATHS.search },
      { to: "/blood", label: "Blood Support", icon: LP_PATHS.drop },
      { to: "/services", label: "Services", icon: LP_PATHS.briefcase },
      { to: "/matrimony", label: "Matrimony", icon: LP_PATHS.heart },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/membership", label: "Membership", icon: LP_PATHS.card },
      { to: "/payments", label: "Payments", icon: LP_PATHS.receipt },
      { to: "/notifications", label: "Notifications", icon: LP_PATHS.bell },
      { to: "/profile", label: "Profile", icon: LP_PATHS.user },
    ],
  },
];

const BOTTOM_NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LP_PATHS.home, end: true },
  { to: "/family", label: "Family", icon: LP_PATHS.users },
  { to: "/discover", label: "Discover", icon: LP_PATHS.search },
  { to: "/payments", label: "Payments", icon: LP_PATHS.receipt },
  { to: "/profile", label: "Profile", icon: LP_PATHS.user },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <div className="side-nav__scroll">
      {SECTIONS.map((section) => (
        <div key={section.label} className="side-group">
          <span className="side-group__label">{section.label}</span>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `side-link${isActive ? " is-active" : ""}`}
            >
              <LpIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
      <div className="side-group">
        <span className="side-group__label">Preferences</span>
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) => `side-link${isActive ? " is-active" : ""}`}
        >
          <LpIcon d={LP_PATHS.cog} />
          Settings
        </NavLink>
        <button
          type="button"
          className="side-link side-link--button"
          onClick={toggle}
          aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <LpIcon d={theme === "dark" ? LP_PATHS.sun : LP_PATHS.moon} />
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button type="button" className="side-link side-link--button" onClick={logout}>
          <LpIcon d={LP_PATHS.logout} />
          Logout
        </button>
      </div>
    </div>
  );
}

export function MemberShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="shell">
      {/* Desktop sidebar */}
      <aside className="side" aria-label="Member navigation">
        <Link to="/dashboard" className="side__brand" aria-label="Mitra Maheshwari dashboard">
          <Logo />
        </Link>
        <SidebarNav />
        {user && (
          <div className="side__user">
            <span className="avatar" aria-hidden="true">
              {user.firstName.charAt(0).toUpperCase()}
            </span>
            <span className="side__user-text">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span>Member</span>
            </span>
          </div>
        )}
      </aside>

      <div className="shell__main">
        {/* Mobile top bar */}
        <div className="shell-topbar">
          <button
            type="button"
            className="icon-btn"
            aria-expanded={drawerOpen}
            aria-controls="member-drawer"
            aria-label="Open navigation menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <Link to="/dashboard" aria-label="Mitra Maheshwari dashboard">
            <Logo className="logo--hide-text-sm" />
          </Link>
          <span className="shell-topbar__spacer" />
          <Link to="/dashboard#updates" className="icon-btn" aria-label="Community updates">
            <LpIcon d={LP_PATHS.bell} />
          </Link>
          {user && (
            <Link to="/profile" className="site-header__user-chip" aria-label="Your profile">
              <span className="avatar" aria-hidden="true">
                {user.firstName.charAt(0).toUpperCase()}
              </span>
            </Link>
          )}
        </div>

        {DEMO_MODE && (
          <div className="container">
            <div className="notice notice--info shell-demo" role="status">
              <strong>Demo mode:</strong> You&rsquo;re viewing simulated community data — no real
              records are changed.
            </div>
          </div>
        )}

        <main className="shell__content">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="shell-bottomnav" aria-label="Primary">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `shell-bottomnav__item${isActive ? " is-active" : ""}`}
            >
              <LpIcon d={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="drawer" id="member-drawer">
          <div
            className="drawer__backdrop"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="drawer__panel" role="dialog" aria-label="Member navigation">
            <div className="drawer__head">
              <Logo />
              <button
                type="button"
                className="icon-btn"
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
