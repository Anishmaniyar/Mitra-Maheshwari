import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** narrow restricts the width for forms and focused content. */
  narrow?: boolean;
  /** Optional page-specific layout hooks (spacing, grid). */
  className?: string;
}

export function PageContainer({ children, narrow = false, className = "" }: PageContainerProps) {
  const classes = [narrow ? "container content" : "container", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}