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
import { DeviceDetailPage } from "./features/device-detail/pages/DeviceDetailPage";
import { DeviceOnboardingPage } from "./features/device-onboarding/pages/DeviceOnboardingPage";
import { AlertsPage } from "./features/alerts/pages/AlertsPage";
import { AlertRulesPage } from "./features/alert-rules/pages/AlertRulesPage";
import { CommunityView } from "./features/community/pages/CommunityView";
import { SettingsView } from "./features/settings/pages/SettingsView";
import { AdminOverviewPage } from "./features/admin/overview/AdminOverviewPage";
import { UserManagementPage } from "./features/admin/users/UserManagementPage";
import { FarmOverviewPage } from "./features/admin/farm/FarmOverviewPage";
import { FarmPlotDetailPage } from "./features/admin/farm/FarmPlotDetailPage";
import { FarmZoneDetailPage } from "./features/admin/farm/FarmZoneDetailPage";
import { ContentModerationPage } from "./features/admin/content-moderation/ContentModerationPage";
import { SystemHealthPage } from "./features/admin/health/SystemHealthPage";
import { AnalyticsDashboardPage } from "./features/admin/analytics/AnalyticsDashboardPage";
import {
  PlantDiseaseDBPage,
  SpeciesPage,
  PlantsPage,
  PlantEventsPage,
} from "./features/admin/plant-disease/PlantDiseaseDBPage";
import { PlantDetailPage } from "./features/admin/plant-disease/PlantDetailPage";
import { SpeciesDetailPage } from "./features/admin/plant-disease/SpeciesDetailPage";
import { PlantEventDetailPage } from "./features/admin/plant-disease/PlantEventDetailPage";
import { DiseasePage } from "./features/admin/plant-disease/DiseasePage";
import { ProfileManagementPage } from "./features/admin/profiles/ProfileManagementPage";
import { ProfileDetailPage } from "./features/admin/profiles/ProfileDetailPage";
import { CertificateApprovalPage } from "./features/admin/certificates/CertificateApprovalPage";
import DataSeedingPage from "./features/admin/seeding/DataSeedingPage";
import DataSyncPage from "./features/admin/sync/DataSyncPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AuthSessionBootstrap } from "./features/auth/components/AuthSessionBootstrap";
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
        {/* Runs before route guards: attempts silent refresh on page load */}
        <AuthSessionBootstrap />
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
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="alert-rules" element={<AlertRulesPage />} />
              <Route path="devices" element={<DeviceManagementPage />} />
              <Route
                path="devices/onboarding"
                element={<DeviceOnboardingPage />}
              />
              <Route path="devices/:deviceId" element={<DeviceDetailPage />} />
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
              <Route path="farms/:plotId" element={<FarmPlotDetailPage />} />
              <Route
                path="farms/zones/:zoneId"
                element={<FarmZoneDetailPage />}
              />
              <Route path="content" element={<ContentModerationPage />} />
              <Route path="health" element={<SystemHealthPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="plants" element={<PlantsPage />} />
              <Route path="plants/:id" element={<PlantDetailPage />} />
              <Route path="species" element={<SpeciesPage />} />
              <Route path="species/:id" element={<SpeciesDetailPage />} />
              <Route path="plant-events" element={<PlantEventsPage />} />
              <Route
                path="plant-events/:id"
                element={<PlantEventDetailPage />}
              />
              <Route path="diseases" element={<DiseasePage />} />
              <Route path="profiles" element={<ProfileManagementPage />} />
              <Route
                path="profiles/:profileId"
                element={<ProfileDetailPage />}
              />
              <Route
                path="certificates"
                element={<CertificateApprovalPage />}
              />
              <Route path="seeding" element={<DataSeedingPage />} />
              <Route path="sync" element={<DataSyncPage />} />
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
