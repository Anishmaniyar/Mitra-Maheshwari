import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** narrow restricts the width for forms and focused content. */
  narrow?: boolean;
}

export function PageContainer({ children, narrow = false }: PageContainerProps) {
  return <div className={narrow ? "container content" : "container"}>{children}</div>;
}