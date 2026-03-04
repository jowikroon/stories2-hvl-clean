import { Card } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Help & Support</h1>
      <p className="text-muted-foreground mb-8">Get help with marketplacegrowth.nl.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <HelpCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Help center coming soon.</p>
      </Card>
    </div>
  );
}
