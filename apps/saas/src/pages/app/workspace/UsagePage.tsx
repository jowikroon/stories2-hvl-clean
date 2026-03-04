import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function UsagePage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Usage</h1>
      <p className="text-muted-foreground text-sm mb-8">Monitor API calls, credits, and resource consumption.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Usage tracking coming soon.</p>
      </Card>
    </div>
  );
}
