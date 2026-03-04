import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function RolesPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Roles</h1>
      <p className="text-muted-foreground text-sm mb-8">Configure workspace roles and permissions.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Roles management coming soon.</p>
      </Card>
    </div>
  );
}
