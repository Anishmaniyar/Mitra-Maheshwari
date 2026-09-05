import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import DashboardPage from "../pages/DashboardPage";
import FamilyPage from "../pages/FamilyPage";
import LandingPage from "../pages/LandingPage";
import MemberDetailsPage from "../pages/MemberDetailsPage";
import OtpVerificationPage from "../pages/OtpVerificationPage";
import PaymentsPage from "../pages/PaymentsPage";
import VerifyMemberPage from "../pages/VerifyMemberPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<VerifyMemberPage />} />
      <Route path="/register/details" element={<MemberDetailsPage />} />
      <Route path="/register/verify" element={<OtpVerificationPage />} />

      {/* Authenticated */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <FamilyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}