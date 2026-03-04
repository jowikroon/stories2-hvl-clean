import { Card } from "@/components/ui/card";
import { Key } from "lucide-react";

export default function ApiKeysPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">API Keys</h1>
      <p className="text-muted-foreground mb-8">Manage programmatic access to your workspace.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Key className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">API key management coming soon (Enterprise).</p>
      </Card>
    </div>
  );
}
