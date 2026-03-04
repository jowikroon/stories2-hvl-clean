import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { UserPlus, ShieldCheck } from "lucide-react";

const sections = [
  { icon: UserPlus, title: "Invite Users", description: "Send invitations and manage pending requests." },
  { icon: ShieldCheck, title: "Role Assignments", description: "Assign roles and set granular permissions." },
];

export default function MembersPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Members</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage workspace members and invitations.</p>
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
