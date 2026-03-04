import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function CreateBulkPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Bulk Create</h1>
      <p className="text-muted-foreground mb-8">Generate content for multiple products at once.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Layers className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Bulk creation coming soon.</p>
      </Card>
    </div>
  );
}
