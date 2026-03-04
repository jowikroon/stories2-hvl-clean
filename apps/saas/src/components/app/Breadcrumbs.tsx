import { useLocation, Link } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  overview: "Overview",
  brands: "Brands",
  projects: "Projects",
  create: "Create",
  library: "Library",
  publish: "Publish",
  insights: "Insights",
  logs: "Logs",
  "ai-hub": "AI Hub",
  integrations: "Integrations",
  members: "Members",
  roles: "Roles",
  billing: "Billing",
  usage: "Usage",
  "audit-log": "Audit Log",
  settings: "Settings",
  connectors: "Connectors",
  webhooks: "Webhooks",
  "api-keys": "API Keys",
  channels: "Channels",
  bulk: "Bulk",
  templates: "Templates",
  new: "New",
  bol: "Bol.com",
  amazon: "Amazon",
  shopify: "Shopify",
  jobs: "Jobs",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const { currentWorkspace } = useWorkspace();

  const parts = location.pathname.split("/").filter(Boolean);
  // Expected: ["app", "workspace", ":id", "section", ...]
  const wsIndex = parts.indexOf("workspace");
  if (wsIndex === -1) return null;

  const crumbs = parts.slice(wsIndex + 2); // after workspaceId
  if (crumbs.length === 0) return null;

  const basePath = `/app/workspace/${currentWorkspace?.id ?? parts[wsIndex + 1]}`;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to={`${basePath}/overview`} className="hover:text-foreground transition-colors">
        {currentWorkspace?.name ?? "Workspace"}
      </Link>
      {crumbs.map((crumb, i) => {
        const path = `${basePath}/${crumbs.slice(0, i + 1).join("/")}`;
        const isLast = i === crumbs.length - 1;
        const label = labelMap[crumb] ?? crumb;
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
