import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section className="form-section">
      <h2 className="form-section-title">{title}</h2>
      <div className="stack">{children}</div>
    </section>
  );
}