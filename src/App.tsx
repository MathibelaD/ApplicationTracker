import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { useAuth } from "./auth/AuthProvider";
import { Spinner } from "./components/ui/Button";
import { AppLayout } from "./layouts/AppLayout";
import { ApplicationDetail } from "./pages/ApplicationDetail";
import { EditApplicationPage, NewApplicationPage } from "./pages/ApplicationForm";
import { Applications } from "./pages/Applications";
import { Cvs } from "./pages/Cvs";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { SignIn } from "./pages/auth/SignIn";
import { SignUp } from "./pages/auth/SignUp";
import { NotFound } from "./pages/states";

function FullScreenSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, recovering } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenSpinner />;
  if (recovering) return <Navigate to="/reset-password" replace />;
  if (!session) return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { session, loading, recovering } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (recovering) return <Navigate to="/reset-password" replace />;
  if (session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<GuestOnly><SignIn /></GuestOnly>} />
        <Route path="/sign-up" element={<GuestOnly><SignUp /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/new" element={<NewApplicationPage />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="applications/:id/edit" element={<EditApplicationPage />} />
          <Route path="cvs" element={<Cvs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
