import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

export default function ProjectNewPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-2">Create Project</h1>
      <p className="text-muted-foreground mb-8">Set up a new project.</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Project creation form coming soon.</p>
      </Card>
    </div>
  );
}
