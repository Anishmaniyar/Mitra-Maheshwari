import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AdminRoute, ProtectedRoute } from "../components/common/ProtectedRoute";
import AboutPage from "../pages/AboutPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminLoginPage from "../pages/AdminLoginPage";
import BloodPage from "../pages/BloodPage";
import CommunityPage from "../pages/CommunityPage";
import ContactPage from "../pages/ContactPage";
import DashboardPage from "../pages/DashboardPage";
import DiscoverPage from "../pages/DiscoverPage";
import FamilyPage from "../pages/FamilyPage";
import InvitePage from "../pages/InvitePage";
import LandingPage from "../pages/LandingPage";
import MatrimonyPage from "../pages/MatrimonyPage";
import MemberDetailsPage from "../pages/MemberDetailsPage";
import MemberLoginPage from "../pages/MemberLoginPage";
import MembershipPage from "../pages/MembershipPage";
import NotificationsPage from "../pages/NotificationsPage";
import OtpVerificationPage from "../pages/OtpVerificationPage";
import PaymentsPage from "../pages/PaymentsPage";
import ProfilePage from "../pages/ProfilePage";
import ProgramsPage from "../pages/ProgramsPage";
import ServicesPage from "../pages/ServicesPage";
import SettingsPage from "../pages/SettingsPage";
import VerifyMemberPage from "../pages/VerifyMemberPage";

function Protected({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<MemberLoginPage />} />
      <Route path="/register" element={<VerifyMemberPage />} />
      <Route path="/join" element={<VerifyMemberPage />} />
      <Route path="/register/details" element={<MemberDetailsPage />} />
      <Route path="/register/verify" element={<OtpVerificationPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Authenticated member portal */}
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/family" element={<Protected><FamilyPage /></Protected>} />
      <Route path="/discover" element={<Protected><DiscoverPage /></Protected>} />
      <Route path="/blood" element={<Protected><BloodPage /></Protected>} />
      <Route path="/services" element={<Protected><ServicesPage /></Protected>} />
      <Route path="/matrimony" element={<Protected><MatrimonyPage /></Protected>} />
      <Route path="/membership" element={<Protected><MembershipPage /></Protected>} />
      <Route path="/payments" element={<Protected><PaymentsPage /></Protected>} />
      <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
