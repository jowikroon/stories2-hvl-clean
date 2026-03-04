import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Kanban, GitBranch } from "lucide-react";

const sections = [
  { icon: Kanban, title: "Kanban Boards", description: "Visualize project tasks in drag-and-drop columns." },
  { icon: GitBranch, title: "Version Timeline", description: "Track changes and content evolution over time." },
];

export default function ProjectsPage() {
  return (
    <div>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Projects</h1>
          <p className="text-muted-foreground text-sm">Organize work into projects.</p>
        </div>
        <Link to="new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Project</Button>
        </Link>
      </div>
      <Card className="p-12 flex flex-col items-center gap-4 text-center mb-8">
        <FolderKanban className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">No projects yet. Create one to start organizing content.</p>
      </Card>
      <h2 className="text-lg font-semibold mb-4">Coming Soon</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-6 flex items-start gap-4">
            <s.icon className="h-7 w-7 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1 text-sm">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
