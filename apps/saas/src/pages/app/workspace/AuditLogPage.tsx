import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { ScrollText, ShieldCheck, FileCheck } from "lucide-react";

const sections = [
  { icon: ScrollText, title: "Activity Logs", description: "Track all user and system actions in real time." },
  { icon: ShieldCheck, title: "Security Settings", description: "Configure 2FA, IP allow-lists, and session policies." },
  { icon: FileCheck, title: "Compliance", description: "GDPR/CCPA reports and data-processing records." },
];

export default function AuditLogPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Audit Log</h1>
      <p className="text-muted-foreground text-sm mb-8">Track all workspace activity for compliance.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
