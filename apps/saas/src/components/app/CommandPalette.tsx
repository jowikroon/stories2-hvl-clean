import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
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
  Users,
  Shield,
  CreditCard,
  Activity,
  Settings,
  ScrollText,
  HelpCircle,
} from "lucide-react";

const navItems = [
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
  { icon: Users, label: "Members", segment: "members" },
  { icon: Shield, label: "Roles", segment: "roles" },
  { icon: CreditCard, label: "Billing", segment: "billing" },
  { icon: Activity, label: "Audit Log", segment: "audit-log" },
  { icon: Settings, label: "Settings", segment: "settings" },
  { icon: HelpCircle, label: "Help & Support", segment: "__help" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (segment: string) => {
    setOpen(false);
    if (segment === "__help") {
      navigate("/app/help");
      return;
    }
    const base = `/app/workspace/${currentWorkspace?.id ?? ""}`;
    navigate(`${base}/${segment}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.segment}
              onSelect={() => handleSelect(item.segment)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
