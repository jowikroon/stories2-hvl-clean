import { Card } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";

export default function CreateTemplatesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Templates</h1>
      <p className="text-muted-foreground mb-8">Start from a pre-built content template.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <LayoutTemplate className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Templates coming soon.</p>
      </Card>
    </div>
  );
}
