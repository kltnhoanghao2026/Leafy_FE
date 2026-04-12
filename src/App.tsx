import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "./features/auth/pages/VerifyEmailPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { DashboardPage } from "./features/metrics-view/pages/DashboardPage";
import { ZoneDetailMetricsPage } from "./features/metrics-view/pages/ZoneDetailMetricsPage";
import { DeviceManagementPage } from "./features/device-management/pages/DeviceManagementPage";
import { CommunityView } from "./features/community/pages/CommunityView";
import { SettingsView } from "./features/settings/pages/SettingsView";
import { AdminOverviewPage } from "./features/admin/pages/AdminOverviewPage";
import { UserManagementPage } from "./features/admin/pages/UserManagementPage";
import { FarmOverviewPage } from "./features/admin/pages/FarmOverviewPage";
import { ContentModerationPage } from "./features/admin/pages/ContentModerationPage";
import { SystemHealthPage } from "./features/admin/pages/SystemHealthPage";
import { AnalyticsDashboardPage } from "./features/admin/pages/AnalyticsDashboardPage";
import { PlantDiseaseDBPage } from "./features/admin/pages/PlantDiseaseDBPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Toaster, toast } from "react-hot-toast";
import { queryClient, setMutationSuccessHandler } from "./lib/query-client";
import { ROUTES } from "./lib/routes";

function App() {
  useEffect(() => {
    setMutationSuccessHandler((message) => toast.success(message));
    return () => setMutationSuccessHandler(null);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Guest-only routes */}
          <Route element={<GuestOnlyRoute />}>
            <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
            <Route
              path={ROUTES.AUTH.VERIFY_EMAIL}
              element={<VerifyEmailPage />}
            />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.DASHBOARD.ROOT} element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route
                path="metrics/:zoneId"
                element={<ZoneDetailMetricsPage />}
              />
              <Route path="devices" element={<DeviceManagementPage />} />
              <Route path="community" element={<CommunityView />} />
              <Route path="settings" element={<SettingsView />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path={ROUTES.ADMIN.ROOT} element={<AdminLayout />}>
              <Route
                index
                element={<Navigate to={ROUTES.ADMIN.OVERVIEW} replace />}
              />
              <Route path="overview" element={<AdminOverviewPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="farms" element={<FarmOverviewPage />} />
              <Route path="content" element={<ContentModerationPage />} />
              <Route path="health" element={<SystemHealthPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="plants" element={<PlantDiseaseDBPage />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to={ROUTES.DASHBOARD.ROOT} replace />}
          />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff",
              color: "#111827",
              borderRadius: "16px",
              boxShadow:
                "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              padding: "16px",
              fontWeight: "bold",
              fontSize: "14px",
            },
          }}
        />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
