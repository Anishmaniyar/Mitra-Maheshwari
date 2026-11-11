import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";

interface AuthLayoutProps {
  eyebrow?: string;
  title: ReactNode;
  lead: ReactNode;
  /** Back control for the current stage. Only rendered where the existing
   *  flow already offers a way back. */
  back?: { to: string } | { onClick: () => void };
  /** Optional secondary line under the form (login / join cross-links). */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Two-column authentication shell: a quiet form panel on the left and sparse
 * Rajasthani arch/jharokha line-art on the right. No step indicators, progress
 * bars or upcoming-step copy — only the current stage's heading and instruction.
 */
export function AuthLayout({ eyebrow, title, lead, back, footer, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-top">
            <Link to="/" className="auth-logo" aria-label="Mitra Maheshwari Seva Pratishthan — home">
              <Logo />
            </Link>
            {back && "to" in back ? (
              <Link to={back.to} className="auth-back">
                <span aria-hidden="true">←</span> Back
              </Link>
            ) : back ? (
              <button type="button" className="auth-back" onClick={back.onClick}>
                <span aria-hidden="true">←</span> Back
              </button>
            ) : null}
          </div>

          <div className="auth-main">
            <div className="auth-head">
              {eyebrow && <span className="auth-eyebrow">{eyebrow}</span>}
              <h1 className="auth-title" id="auth-title">
                {title}
              </h1>
              <p className="auth-lead">{lead}</p>
            </div>

            <div className="auth-body">{children}</div>

            {footer && <div className="auth-footer">{footer}</div>}
          </div>
        </section>

        <aside className="auth-art">
          <AuthArtwork />
        </aside>
      </div>
    </div>
  );
}

/** Thin, muted terracotta line work: nested arches, a jharokha and a lotus. */
function AuthArtwork() {
  return (
    <svg
      className="auth-art__svg"
      viewBox="0 0 480 720"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g opacity="0.7">
        <path d="M60 660V280c0-130 80-210 180-210s180 80 180 210v380" />
        <path d="M100 660V290c0-114 64-184 140-184s140 70 140 184v370" opacity="0.7" />
        <path d="M142 660V305c0-97 44-157 98-157s98 60 98 157v355" opacity="0.55" />
      </g>

      <g opacity="0.85">
        <path d="M178 336c0-36 28-60 62-60s62 24 62 60" />
        <path d="M170 336h140" />
        <path d="M240 276v-22" />
        <circle cx="240" cy="244" r="3" />
        <path d="M188 336v122M292 336v122" />
        <path d="M188 360h104" opacity="0.5" />
        <path d="M212 360v98M240 360v98M268 360v98" opacity="0.22" />
        <path d="M172 458h136M180 470h120" />
        <path d="M172 458c0 12 8 20 18 20M308 458c0 12-8 20-18 20" opacity="0.7" />
        <path
          d="M196 470v10M216 470v10M236 470v10M256 470v10M276 470v10"
          opacity="0.35"
        />
      </g>

      <g opacity="0.45">
        <path d="M74 356v148M406 356v148" />
        <circle cx="74" cy="372" r="2.5" />
        <circle cx="74" cy="430" r="2.5" />
        <circle cx="74" cy="488" r="2.5" />
        <circle cx="406" cy="372" r="2.5" />
        <circle cx="406" cy="430" r="2.5" />
        <circle cx="406" cy="488" r="2.5" />
      </g>

      <g opacity="0.4">
        <path d="M126 214c14 0 24 10 24 24M354 214c-14 0-24 10-24 24" />
        <path d="M240 70V44M230 56l10-12 10 12" />
        <circle cx="240" cy="36" r="2.5" />
      </g>

      <g opacity="0.55">
        <path d="M40 660h400" />
        <path d="M62 680h356" opacity="0.5" />
        <path d="M86 700h308" opacity="0.3" />
      </g>

      <path
        d="M240 660c-20-12-30-30-30-48 14 8 26 20 30 36 4-16 16-28 30-36 0 18-10 36-30 48Z"
        opacity="0.5"
      />
    </svg>
  );
}
