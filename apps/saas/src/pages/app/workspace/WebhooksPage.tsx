import { Card } from "@/components/ui/card";
import { Webhook } from "lucide-react";

export default function WebhooksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Webhooks</h1>
      <p className="text-muted-foreground mb-8">Configure webhook endpoints for event notifications.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Webhook className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Webhooks coming soon.</p>
      </Card>
    </div>
  );
}
