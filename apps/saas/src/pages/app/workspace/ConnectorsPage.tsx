import { Card } from "@/components/ui/card";
import { Plug } from "lucide-react";

export default function ConnectorsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Connectors</h1>
      <p className="text-muted-foreground mb-8">Manage marketplace and service connectors.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Plug className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Connectors coming soon.</p>
      </Card>
    </div>
  );
}
