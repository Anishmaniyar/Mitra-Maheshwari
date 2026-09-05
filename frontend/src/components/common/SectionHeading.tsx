import type { ElementType, ReactNode } from "react";

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  as?: ElementType;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  as: Tag = "h2",
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`section-heading ${className}`.trim()}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag>{title}</Tag>
      {description && <p>{description}</p>}
    </div>
  );
}