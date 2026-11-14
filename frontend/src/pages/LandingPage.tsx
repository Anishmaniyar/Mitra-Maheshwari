import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Hero } from "../components/landing/Hero";
import {
  AboutSection,
  ContactSection,
  ImpactSection,
  InitiativesSection,
  MembershipSection,
  PlatformSection,
} from "../components/landing/LandingSections";

export default function LandingPage() {
  const location = useLocation();

  // Navbar links are in-page anchors; scroll to the target section after
  // navigation (React Router updates the hash without a native jump).
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    const id = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.hash]);

  return (
    <AppLayout variant="public">
      <main className="landing-scroll" style={{ minHeight: "100vh" }}>
        <Hero />
        <ImpactSection />
        <AboutSection />
        <InitiativesSection />
        <PlatformSection />
        <MembershipSection />
        <ContactSection />
      </main>
    </AppLayout>
  );
}
