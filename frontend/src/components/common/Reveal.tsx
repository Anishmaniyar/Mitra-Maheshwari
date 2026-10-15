import type { ReactNode } from "react";
import { useRevealOnce } from "../../hooks/useRevealOnce";

interface RevealProps {
  children: ReactNode;
  /** Applied alongside `.reveal` so callers can keep their own layout classes. */
  className?: string;
  /** Stagger in milliseconds for items revealed together. */
  delay?: number;
}

/**
 * Fades and lifts its children in once they scroll into view. Uses a single
 * IntersectionObserver per instance and disconnects after the first reveal, so
 * nothing keeps observing while the visitor reads the page. Falls back to
 * "already visible" when IntersectionObserver is unavailable and respects
 * `prefers-reduced-motion` (handled in CSS).
 */
export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const [ref, visible] = useRevealOnce<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
