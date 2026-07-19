import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";

/* Eager-loaded lightweight pages */
import HomePage from "./pages/HomePage";
import PracticePage from "./pages/PracticePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

/* Lazy-loaded heavier pages to reduce initial bundle size */
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CoachingPlanPage = lazy(() => import("./pages/CoachingPlanPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Auth pages render outside the app shell */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Everything else lives inside the sidebar/topbar layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route
                  path="/feedback"
                  element={
                    <ProtectedRoute>
                      <FeedbackPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coaching-plan"
                  element={
                    <ProtectedRoute>
                      <CoachingPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
