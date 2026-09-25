import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { FlowSteps } from "../common/FlowSteps";
import { Logo } from "../common/Logo";

interface OnboardingLayoutProps {
  /** 1 | 2 | 3 — drives the progress indicator. */
  step: 1 | 2 | 3;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  /** Back control for the current step. Only rendered where the existing
   *  flow already offers a way back. */
  back?: { to: string } | { onClick: () => void };
  children: ReactNode;
}

/**
 * Full-page onboarding shell shared by every registration step: brand on top,
 * then back + current step, the progress bars, the page heading and finally the
 * form body. Deliberately restrained — no card, no decoration.
 */
export function OnboardingLayout({
  step,
  eyebrow,
  title,
  lead,
  back,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="onb">
      <div className="onb-shell">
        <div className="onb-head">
          <Logo />
        </div>

        <div className="onb-topbar">
          {back && "to" in back ? (
            <Link to={back.to} className="onb-back">
              <span aria-hidden="true">←</span> Back
            </Link>
          ) : back ? (
            <button type="button" className="onb-back" onClick={back.onClick}>
              <span aria-hidden="true">←</span> Back
            </button>
          ) : (
            <span className="onb-back onb-back--empty" aria-hidden="true" />
          )}
          <span className="home-eyebrow">{eyebrow}</span>
        </div>

        <FlowSteps current={step} />

        <div className="onb-intro">
          <h1 className="home-display">{title}</h1>
          <p className="home-lead">{lead}</p>
        </div>

        <div className="onb-body">{children}</div>
      </div>
    </div>
  );
}
