import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "./features/auth/pages/VerifyEmailPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
<<<<<<< HEAD
=======
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
>>>>>>> 2a564adc68ac47dd66695dca5f97c489ab0f0de2
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AuthSessionBootstrap } from "./features/auth/components/AuthSessionBootstrap";
import { Toaster, toast } from "react-hot-toast";
import { queryClient, setMutationSuccessHandler } from "./lib/query-client";
import { ROUTES } from "./lib/routes";

const AgricultureOverviewPage = lazy(() =>
  import("./features/plant-management/pages/AgricultureOverviewPage"),
);
const DashboardPage = lazy(() =>
  import("./features/metrics-view/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ZoneDetailMetricsPage = lazy(() =>
  import("./features/metrics-view/pages/ZoneDetailMetricsPage").then((module) => ({
    default: module.ZoneDetailMetricsPage,
  })),
);
const DeviceDetailPage = lazy(() =>
  import("./features/device-detail/pages/DeviceDetailPage").then((module) => ({
    default: module.DeviceDetailPage,
  })),
);
const DeviceIndexRedirect = lazy(() =>
  import("./features/device-onboarding/pages/DeviceIndexRedirect").then((module) => ({
    default: module.DeviceIndexRedirect,
  })),
);
const DeviceOnboardingPage = lazy(() =>
  import("./features/device-onboarding/pages/DeviceOnboardingPage").then((module) => ({
    default: module.DeviceOnboardingPage,
  })),
);
const DiagnosisHistoryPage = lazy(() =>
  import("./features/disease-diagnosis/pages/DiagnosisHistoryPage").then((module) => ({
    default: module.DiagnosisHistoryPage,
  })),
);
const DiseaseDiagnosisPage = lazy(() =>
  import("./features/disease-diagnosis/pages/DiseaseDiagnosisPage").then((module) => ({
    default: module.DiseaseDiagnosisPage,
  })),
);
const PlantDetailPage = lazy(() =>
  import("./features/plant-management/pages/PlantDetailPage").then((module) => ({
    default: module.PlantDetailPage,
  })),
);
const PlantListPage = lazy(() =>
  import("./features/plant-management/pages/PlantListPage").then((module) => ({
    default: module.PlantListPage,
  })),
);
const PlantEventsCalendarPage = lazy(() =>
  import("./features/plant-management/pages/PlantEventsCalendarPage").then((module) => ({
    default: module.PlantEventsCalendarPage,
  })),
);
const TreatmentPlanDetailPage = lazy(() =>
  import("./features/plant-management/pages/TreatmentPlanDetailPage").then((module) => ({
    default: module.TreatmentPlanDetailPage,
  })),
);
const TreatmentPlansPage = lazy(() =>
  import("./features/plant-management/pages/TreatmentPlansPage").then((module) => ({
    default: module.TreatmentPlansPage,
  })),
);
const AiAssistantPage = lazy(() =>
  import("./features/rag-assistant/pages/AiAssistantPage").then((module) => ({
    default: module.AiAssistantPage,
  })),
);
const RagTreatmentPlansPage = lazy(() =>
  import("./features/rag-assistant/pages/RagTreatmentPlansPage").then((module) => ({
    default: module.RagTreatmentPlansPage,
  })),
);
const AlertsPage = lazy(() =>
  import("./features/alerts/pages/AlertsPage").then((module) => ({
    default: module.AlertsPage,
  })),
);
const AlertRulesPage = lazy(() =>
  import("./features/alert-rules/pages/AlertRulesPage").then((module) => ({
    default: module.AlertRulesPage,
  })),
);
const CommunityView = lazy(() =>
  import("./features/community/pages/CommunityView").then((module) => ({
    default: module.CommunityView,
  })),
);
const SearchPage = lazy(() =>
  import("./features/search/pages/SearchPage").then((module) => ({
    default: module.SearchPage,
  })),
);
const SettingsView = lazy(() =>
  import("./features/settings/pages/SettingsView").then((module) => ({
    default: module.SettingsView,
  })),
);

const PageLoader = () => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
    Đang tải trang...
  </div>
);

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
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="agriculture-overview"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AgricultureOverviewPage />
                  </Suspense>
                }
              />
              <Route
                path="metrics/:zoneId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ZoneDetailMetricsPage />
                  </Suspense>
                }
              />
              <Route
                path="alerts"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AlertsPage />
                  </Suspense>
                }
              />
              <Route
                path="alert-rules"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AlertRulesPage />
                  </Suspense>
                }
              />
              <Route
                path="devices"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DeviceIndexRedirect />
                  </Suspense>
                }
              />
              <Route
                path="devices/onboarding"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DeviceOnboardingPage />
                  </Suspense>
                }
              />
              <Route
                path="devices/:deviceId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DeviceDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="plants"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PlantListPage />
                  </Suspense>
                }
              />
              <Route
                path="plants/:plantId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PlantDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="treatment-plans"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TreatmentPlansPage />
                  </Suspense>
                }
              />
              <Route
                path="treatment-plans/:planId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TreatmentPlanDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="plant-events/calendar"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PlantEventsCalendarPage />
                  </Suspense>
                }
              />
              <Route
                path="disease-diagnosis"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DiseaseDiagnosisPage />
                  </Suspense>
                }
              />
              <Route
                path="disease-diagnosis/history"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DiagnosisHistoryPage />
                  </Suspense>
                }
              />
              <Route
                path="ai-assistant"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AiAssistantPage />
                  </Suspense>
                }
              />
              <Route
                path="ai-assistant/treatment-plans"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RagTreatmentPlansPage />
                  </Suspense>
                }
              />
              <Route
                path="search"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SearchPage />
                  </Suspense>
                }
              />
              <Route
                path="community"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CommunityView />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SettingsView />
                  </Suspense>
                }
              />
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
