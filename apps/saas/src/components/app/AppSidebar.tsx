import {
  LayoutDashboard,
  Tag,
  FolderKanban,
  Sparkles,
  Library,
  Send,
  BarChart3,
  Brain,
  Plug,
  ScrollText,
  Users,
  Shield,
  CreditCard,
  Activity,
  Settings,
  HelpCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const primaryItems = [
  { icon: LayoutDashboard, label: "Overview", segment: "overview" },
  { icon: Tag, label: "Brands", segment: "brands" },
  { icon: FolderKanban, label: "Projects", segment: "projects" },
  { icon: Sparkles, label: "Create", segment: "create" },
  { icon: Library, label: "Library", segment: "library" },
  { icon: Send, label: "Publish", segment: "publish" },
  { icon: BarChart3, label: "Insights", segment: "insights" },
  { icon: ScrollText, label: "Logs", segment: "logs" },
  { icon: Brain, label: "AI Hub", segment: "ai-hub" },
  { icon: Plug, label: "Integrations", segment: "integrations" },
];

const utilityItems = [
  { icon: Users, label: "Members", segment: "members" },
  { icon: Shield, label: "Roles", segment: "roles" },
  { icon: CreditCard, label: "Billing", segment: "billing" },
  { icon: Activity, label: "Audit Log", segment: "audit-log" },
  { icon: Settings, label: "Settings", segment: "settings" },
];

export default function AppSidebar() {
  const { currentWorkspace } = useWorkspace();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const base = `/app/workspace/${currentWorkspace?.id ?? ""}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.segment}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${base}/${item.segment}`}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utilityItems.map((item) => (
                <SidebarMenuItem key={item.segment}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${base}/${item.segment}`}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/app/help"
                className="hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                {!collapsed && <span>Help & Support</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-sidebar-foreground/70"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Log out"}
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
