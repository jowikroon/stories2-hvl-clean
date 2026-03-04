import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Outlet, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import PublishingPage from "@/pages/PublishingPage";
import { CalendarClock, CheckSquare, MonitorSmartphone } from "lucide-react";

const sections = [
  { icon: CalendarClock, title: "Scheduling Queue", description: "Schedule content for future publication." },
  { icon: CheckSquare, title: "Approval Workflows", description: "Set up review and approval chains." },
  { icon: MonitorSmartphone, title: "Preview Simulator", description: "Preview how listings appear on each channel." },
];

export default function PublishPage() {
  const location = useLocation();
  const isIndex = location.pathname.endsWith("/publish");

  if (!isIndex) return <><Breadcrumbs /><Outlet /></>;

  return (
    <div>
      <Breadcrumbs />
      <PublishingPage />
      <h2 className="text-lg font-semibold mt-10 mb-4">Capabilities</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-6 flex items-start gap-4">
            <s.icon className="h-7 w-7 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1 text-sm">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
