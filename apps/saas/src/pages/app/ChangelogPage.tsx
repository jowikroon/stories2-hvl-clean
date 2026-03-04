import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Changelog</h1>
      <p className="text-muted-foreground mb-8">Latest updates and improvements.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Changelog coming soon.</p>
      </Card>
    </div>
  );
}
