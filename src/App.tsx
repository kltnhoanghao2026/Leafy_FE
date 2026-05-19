import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "./features/auth/pages/VerifyEmailPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AuthSessionBootstrap } from "./features/auth/components/AuthSessionBootstrap";
import { Toaster, toast } from "react-hot-toast";
import { queryClient, setMutationSuccessHandler } from "./lib/query-client";
import { ROUTES } from "./lib/routes";
import { I18nProvider } from "./i18n";
import { WebSocketProvider } from "./providers/WebSocketProvider";
import { FarmOverviewPage, FarmPlotDetailPage, FarmZoneDetailPage } from "./features/admin/farm";
import { ContentModerationPage } from "./features/admin/content-moderation";
import { SystemHealthPage } from "./features/admin/health";
import { AnalyticsDashboardPage } from "./features/admin/analytics";
import { PlantEventsPage, PlantsPage, SpeciesPage, PlantDetailPage as AdminPlantDetailPage, SpeciesDetailPage, PlantEventDetailPage, DiseasePage } from "./features/admin/plant-disease";
import { ProfileManagementPage, ProfileDetailPage } from "./features/admin/profiles";
import { CertificateApprovalPage } from "./features/admin/certificates";
import { DataSeedingPage } from "./features/admin/seeding";
import { DataSyncPage } from "./features/admin/sync";
import { IotDemoToolsPage } from "./features/admin/iot-demo/IotDemoToolsPage";
import { IotCameraSchedulesPage } from "./features/admin/iot-camera-schedules/IotCameraSchedulesPage";
import { AdminCameraBatchUploadPage } from "./features/admin/camera-batch-upload/AdminCameraBatchUploadPage";
import { isIotDemoToolsEnabled } from "./features/admin/iot-demo/iotDemo.api";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminOverviewPage } from "./features/admin/overview";
import { UserManagementPage } from "./features/admin/users";

import { DiseasePredictionPage } from "./features/disease-detection";
import { DocumentIngestionPage } from "./features/admin/knowledge-base";

const AgricultureOverviewPage = lazy(() =>
  import("./features/plant-management/overview/pages/AgricultureOverviewPage"),
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
  import("./features/plant-management/plant/pages/PlantDetailPage").then((module) => ({
    default: module.PlantDetailPage,
  })),
);
const PlantListPage = lazy(() =>
  import("./features/plant-management/plant/pages/PlantListPage").then((module) => ({
    default: module.PlantListPage,
  })),
);
const PlantEventsCalendarPage = lazy(() =>
  import("./features/plant-management/calendarview/pages/PlantEventsCalendarPage").then((module) => ({
    default: module.PlantEventsCalendarPage,
  })),
);
const PlanDetailPage = lazy(() =>
  import("./features/plant-management/plan/pages/PlanDetailPage").then((module) => ({
    default: module.PlanDetailPage,
  })),
);
const PlansPage = lazy(() =>
  import("./features/plant-management/plan/pages/PlansPage").then((module) => ({
    default: module.PlansPage,
  })),
);
const CreatePlanPage = lazy(() =>
  import("./features/plant-management/plan/pages/CreatePlanPage").then((module) => ({
    default: module.CreatePlanPage,
  })),
);
const RagChatPage = lazy(() =>
  import("./features/rag-chat/pages/RagChatPage").then((module) => ({
    default: module.RagChatPage,
  })),
);
const RagPlanDetailPage = lazy(() =>
  import("./features/rag-chat/pages/RagPlanDetailPage").then((module) => ({
    default: module.RagPlanDetailPage,
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
const CommunityPlanViewPage = lazy(() =>
  import("./features/community/pages/CommunityPlanViewPage").then((module) => ({
    default: module.CommunityPlanViewPage,
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
const ChatPage = lazy(() =>
  import("./features/chat/pages/ChatPage").then((module) => ({
    default: module.ChatPage,
  })),
);
const ExpertsPage = lazy(() =>
  import("./features/profiles/pages/ExpertsPage").then((module) => ({
    default: module.ExpertsPage,
  })),
);
const PendingRequestsPage = lazy(() =>
  import("./features/profiles/pages/PendingRequestsPage").then((module) => ({
    default: module.PendingRequestsPage,
  })),
);
const MyProfilePage = lazy(() =>
  import("./features/profiles/pages/MyProfilePage").then((module) => ({
    default: module.MyProfilePage,
  })),
);
const UserProfilePage = lazy(() =>
  import('./features/profiles/pages/UserProfilePage').then((module) => ({
    default: module.UserProfilePage,
  }))
);
const NotificationsPage = lazy(() =>
  import('./features/notifications/pages/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  }))
);
const GroupJoinPage = lazy(() =>
  import('./features/chat/pages/GroupJoinPage').then((module) => ({
    default: module.GroupJoinPage,
  }))
);

const ConsultingDashboardPage = lazy(() =>
  import('./features/consulting/pages/ConsultingDashboardPage').then((module) => ({
    default: module.ConsultingDashboardPage,
  }))
);
const ConsultingFarmerPage = lazy(() =>
  import('./features/consulting/pages/ConsultingFarmerPage').then((module) => ({
    default: module.ConsultingFarmerPage,
  }))
);const ConsultingCreatePlanPage = lazy(() =>
  import('./features/consulting/pages/ConsultingCreatePlanPage').then((module) => ({
    default: module.ConsultingCreatePlanPage,
  })),
);const ConsultingFarmPlotPage = lazy(() =>
  import('./features/consulting/pages/ConsultingFarmPlotPage').then((module) => ({
    default: module.ConsultingFarmPlotPage,
  }))
);
const ConsultingFarmZonePage = lazy(() =>
  import('./features/consulting/pages/ConsultingFarmZonePage').then((module) => ({
    default: module.ConsultingFarmZonePage,
  }))
);
const ConsultingPlantPage = lazy(() =>
  import('./features/consulting/pages/ConsultingPlantPage').then((module) => ({
    default: module.ConsultingPlantPage,
  }))
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
      <I18nProvider>
        <WebSocketProvider>
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
              <Route path="disease-prediction" element={<DiseasePredictionPage />} />
              <Route
                path="rag-panel/treatment-plans/:planId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RagPlanDetailPage />
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
                path="plans"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PlansPage />
                  </Suspense>
                }
              />
              <Route
                path="plans/create"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CreatePlanPage />
                  </Suspense>
                }
              />
              <Route
                path="plans/:planId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PlanDetailPage />
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
                path="rag-panel"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <RagChatPage />
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
                path="community/plans/:planId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CommunityPlanViewPage />
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
                path="experts"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ExpertsPage />
                  </Suspense>
                }
              />
              <Route
                path="pending-requests"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PendingRequestsPage />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MyProfilePage />
                  </Suspense>
                }
              />
              <Route
                path="profile/:profileId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <UserProfilePage />
                  </Suspense>
                }
              />
              <Route
                path="chat"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ChatPage />
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
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <NotificationsPage />
                  </Suspense>
                }
              />
              <Route
                path="consulting"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConsultingDashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="consulting/:farmerProfileId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConsultingFarmerPage />
                  </Suspense>
                }
              />
              <Route
                path="consulting/:farmerProfileId/plans/create"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConsultingCreatePlanPage />
                  </Suspense>
                }
              />
              <Route
                path="consulting/:farmerProfileId/farms/:farmPlotId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConsultingFarmPlotPage />
                  </Suspense>
                }
              />
              <Route
                path="consulting/:farmerProfileId/farms/:farmPlotId/zones/:farmZoneId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConsultingFarmZonePage />
                  </Suspense>
                }
              />
              <Route
                path="consulting/:farmerProfileId/plants/:plantId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConsultingPlantPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          {/* Join link — protected but no layout wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="chat/join/:token"
              element={
                <Suspense fallback={<PageLoader />}>
                  <GroupJoinPage />
                </Suspense>
              }
            />
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
              <Route path="plants/:id" element={<AdminPlantDetailPage />} />
              
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
              {isIotDemoToolsEnabled() && (
                <Route
                  path="iot-demo-tools"
                  element={<IotDemoToolsPage />}
                />
              )}
              <Route
                path="iot-camera-schedules"
                element={<IotCameraSchedulesPage />}
              />
              <Route
                path="iot-camera-batch-upload"
                element={<AdminCameraBatchUploadPage />}
              />
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
        </WebSocketProvider>
      </I18nProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
