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
import { RagChatPage, RagTreatmentPlanDetailPage } from "./features/rag-chat";
import { DiseasePredictionPage } from "./features/disease-detection";
import { CommunityView } from "./features/community/pages/CommunityView";
import { ExpertsPage } from "./features/community/pages/ExpertsPage";
import { PendingRequestsPage } from "./features/community/pages/PendingRequestsPage";
import { SettingsView } from "./features/settings/pages/SettingsView";
import { AdminOverviewPage } from "./features/admin/overview";
import { UserManagementPage } from "./features/admin/users";
import { FarmOverviewPage, FarmPlotDetailPage, FarmZoneDetailPage } from "./features/admin/farm";
import { ContentModerationPage } from "./features/admin/content-moderation";
import { DocumentIngestionPage } from "./features/admin/knowledge-base";
import { SystemHealthPage } from "./features/admin/health";
import { AnalyticsDashboardPage } from "./features/admin/analytics";
import {

  SpeciesPage,
  PlantsPage,
  PlantEventsPage,
  PlantDetailPage,
  SpeciesDetailPage,
  PlantEventDetailPage,
  DiseasePage,
} from "./features/admin/plant-disease";
import { ProfileManagementPage, ProfileDetailPage } from "./features/admin/profiles";
import { CertificateApprovalPage } from "./features/admin/certificates";
import { DataSeedingPage } from "./features/admin/seeding";
import { DataSyncPage } from "./features/admin/sync";
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
              <Route path="rag-panel" element={<RagChatPage />} />
              <Route path="disease-prediction" element={<DiseasePredictionPage />} />
              <Route
                path="rag-panel/treatment-plans/:planId"
                element={<RagTreatmentPlanDetailPage />}
              />
              <Route path="devices" element={<DeviceManagementPage />} />
              <Route
                path="devices/onboarding"
                element={<DeviceOnboardingPage />}
              />
              <Route path="devices/:deviceId" element={<DeviceDetailPage />} />
              <Route path="community" element={<CommunityView />} />
              <Route path="experts" element={<ExpertsPage />} />
              <Route path="pending-requests" element={<PendingRequestsPage />} />
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
              <Route path="knowledge-base" element={<DocumentIngestionPage />} />
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
