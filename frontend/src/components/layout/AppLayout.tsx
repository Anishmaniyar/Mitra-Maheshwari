import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MemberShell } from "./MemberShell";

interface AppLayoutProps {
  variant: "public" | "app";
  children: ReactNode;
}

export function AppLayout({ variant, children }: AppLayoutProps) {
  if (variant === "app") {
    return (
      <MemberShell>
        <main>{children}</main>
      </MemberShell>
    );
  }

  return (
    <>
      <Header variant={variant} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
