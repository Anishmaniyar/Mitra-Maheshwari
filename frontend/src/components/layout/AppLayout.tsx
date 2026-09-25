import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MemberShell } from "./MemberShell";

interface AppLayoutProps {
  /** public: marketing chrome · app: member portal · plain: focused flow
   *  (onboarding) where the page brings its own minimal header. */
  variant: "public" | "app" | "plain";
  children: ReactNode;
}

export function AppLayout({ variant, children }: AppLayoutProps) {
  // MemberShell already renders the <main> landmark for the portal.
  if (variant === "app") return <MemberShell>{children}</MemberShell>;

  // Focused flows (register / login / verify) render their own header.
  if (variant === "plain") return <main>{children}</main>;

  return (
    <>
      <Header variant={variant} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
