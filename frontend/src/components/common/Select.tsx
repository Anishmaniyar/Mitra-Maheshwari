import type { ReactNode, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  children: ReactNode;
}

export function Select({ invalid = false, className = "", children, ...rest }: SelectProps) {
  return (
    <select className={`select ${className}`.trim()} aria-invalid={invalid || undefined} {...rest}>
      {children}
    </select>
  );
}