import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "@/components/layouts/PublicLayout";
import AppShell from "@/components/layouts/AppShell";
import RequireAuth from "@/components/layouts/RequireAuth";

// Public pages
import LandingPage from "@/pages/LandingPage";
import ProductPage from "@/pages/public/ProductPage";
import SolutionsPage from "@/pages/public/SolutionsPage";
import SolutionDetailPage from "@/pages/public/SolutionDetailPage";
import PricingPage from "@/pages/public/PricingPage";
import CaseStudiesPage from "@/pages/public/CaseStudiesPage";
import BlogPage from "@/pages/public/BlogPage";
import AboutPage from "@/pages/public/AboutPage";
import SecurityPage from "@/pages/public/SecurityPage";
import DocsPage from "@/pages/public/DocsPage";
import ContactPage from "@/pages/public/ContactPage";

// Auth pages
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

// App pages
import AppEntryPage from "@/pages/app/AppEntryPage";
import OnboardingPage from "@/pages/OnboardingPage";
import WorkspacesPage from "@/pages/app/WorkspacesPage";
import HelpPage from "@/pages/app/HelpPage";
import ChangelogPage from "@/pages/app/ChangelogPage";
import StatusPage from "@/pages/app/StatusPage";
import ProfileSettingsPage from "@/pages/app/ProfileSettingsPage";

// Workspace pages
import OverviewPage from "@/pages/app/workspace/OverviewPage";
import BrandsPage from "@/pages/app/workspace/BrandsPage";
import BrandNewPage from "@/pages/app/workspace/BrandNewPage";
import BrandDetailPage from "@/pages/app/workspace/BrandDetailPage";
import ProjectsPage from "@/pages/app/workspace/ProjectsPage";
import ProjectNewPage from "@/pages/app/workspace/ProjectNewPage";
import ProjectDetailPage from "@/pages/app/workspace/ProjectDetailPage";
import CreatePage from "@/pages/app/workspace/CreatePage";
import CreateBulkPage from "@/pages/app/workspace/CreateBulkPage";
import CreateTemplatesPage from "@/pages/app/workspace/CreateTemplatesPage";
import LibraryPage from "@/pages/app/workspace/LibraryPage";
import AssetDetailPage from "@/pages/app/workspace/AssetDetailPage";
import PublishPage from "@/pages/app/workspace/PublishPage";
import PublishJobPage from "@/pages/app/workspace/PublishJobPage";
import PublishChannelsPage from "@/pages/app/workspace/PublishChannelsPage";
import ChannelDetailPage from "@/pages/app/workspace/ChannelDetailPage";
import InsightsPage from "@/pages/app/workspace/InsightsPage";
import LogsPage from "@/pages/app/workspace/LogsPage";
import AIHubPage from "@/pages/app/workspace/AIHubPage";
import IntegrationsPage from "@/pages/app/workspace/IntegrationsPage";
import ConnectorsPage from "@/pages/app/workspace/ConnectorsPage";
import WebhooksPage from "@/pages/app/workspace/WebhooksPage";
import ApiKeysPage from "@/pages/app/workspace/ApiKeysPage";
import MembersPage from "@/pages/app/workspace/MembersPage";
import RolesPage from "@/pages/app/workspace/RolesPage";
import BillingPage from "@/pages/app/workspace/BillingPage";
import UsagePage from "@/pages/app/workspace/UsagePage";
import AuditLogPage from "@/pages/app/workspace/AuditLogPage";
import SettingsPage from "@/pages/app/workspace/SettingsPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public marketing routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/product" element={<ProductPage />} />
            <Route path="/solutions" element={<SolutionsPage />}>
              <Route path="amazon" element={<SolutionDetailPage name="Amazon" />} />
              <Route path="bol" element={<SolutionDetailPage name="Bol.com" />} />
              <Route path="multi-marketplace" element={<SolutionDetailPage name="Multi-Marketplace" />} />
            </Route>
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/case-studies" element={<CaseStudiesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Convenience auth redirects */}
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?tab=signup" replace />} />

          {/* Auth routes (no layout) */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Legacy dashboard redirect */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />

          {/* App routes (require auth) */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/app" element={<AppEntryPage />} />
              <Route path="/app/onboarding" element={<OnboardingPage />} />
              <Route path="/app/workspaces" element={<WorkspacesPage />} />

              {/* Workspace-scoped routes */}
              <Route path="/app/workspace/:workspaceId">
                <Route path="overview" element={<OverviewPage />} />
                <Route path="brands" element={<BrandsPage />} />
                <Route path="brands/new" element={<BrandNewPage />} />
                <Route path="brands/:brandId" element={<BrandDetailPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/new" element={<ProjectNewPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="create" element={<CreatePage />}>
                  <Route path="bulk" element={<CreateBulkPage />} />
                  <Route path="templates" element={<CreateTemplatesPage />} />
                </Route>
                <Route path="library" element={<LibraryPage />} />
                <Route path="library/:assetId" element={<AssetDetailPage />} />
                <Route path="publish" element={<PublishPage />}>
                  <Route path="jobs/:jobId" element={<PublishJobPage />} />
                  <Route path="channels" element={<PublishChannelsPage />}>
                    <Route path="bol" element={<ChannelDetailPage name="Bol.com" />} />
                    <Route path="amazon" element={<ChannelDetailPage name="Amazon" />} />
                    <Route path="shopify" element={<ChannelDetailPage name="Shopify" />} />
                  </Route>
                </Route>
                <Route path="insights" element={<InsightsPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="ai-hub" element={<AIHubPage />} />
                <Route path="integrations" element={<IntegrationsPage />}>
                  <Route path="connectors" element={<ConnectorsPage />} />
                  <Route path="webhooks" element={<WebhooksPage />} />
                  <Route path="api-keys" element={<ApiKeysPage />} />
                </Route>
                <Route path="members" element={<MembersPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="usage" element={<UsagePage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* App utility routes */}
              <Route path="/app/help" element={<HelpPage />} />
              <Route path="/app/changelog" element={<ChangelogPage />} />
              <Route path="/app/status" element={<StatusPage />} />
              <Route path="/app/settings/profile" element={<ProfileSettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
