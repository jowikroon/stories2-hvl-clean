import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Settings, Bell, Download, BookOpen } from "lucide-react";

const sections = [
  { icon: Settings, title: "Workspace Preferences", description: "General workspace name, locale, and defaults." },
  { icon: Bell, title: "Notifications", description: "Configure email and in-app notification rules." },
  { icon: Download, title: "Data Export", description: "Export workspace data in CSV or JSON format." },
  { icon: BookOpen, title: "API Documentation", description: "Reference docs for the workspace REST API." },
];

export default function SettingsPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Workspace configuration and preferences.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-6 flex items-start gap-4">
            <s.icon className="h-8 w-8 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
