import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { Zap, FileText, Send, Library, FolderKanban, Clock, BarChart3, CreditCard } from "lucide-react";

const stats = [
  { icon: Library, label: "Total Assets", value: "0" },
  { icon: FolderKanban, label: "Active Projects", value: "0" },
  { icon: Clock, label: "Pending Publishes", value: "0" },
  { icon: CreditCard, label: "AI Credits Used", value: "0" },
];

export default function OverviewPage() {
  const { currentWorkspace } = useWorkspace();

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
      <p className="text-muted-foreground mb-8">
        {currentWorkspace ? `Workspace: ${currentWorkspace.name}` : "Your dashboard overview."}
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <s.icon className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">Quick Start</h3>
          <p className="text-sm text-muted-foreground">Generate your first product content.</p>
          <Link to="../create">
            <Button size="sm" className="gap-2"><FileText className="h-4 w-4" /> Create Content</Button>
          </Link>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <Send className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">Publish</h3>
          <p className="text-sm text-muted-foreground">Push content to your marketplaces.</p>
          <Link to="../publish">
            <Button size="sm" variant="outline">Go to Publishing</Button>
          </Link>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">Insights</h3>
          <p className="text-sm text-muted-foreground">View performance analytics.</p>
          <Link to="../insights">
            <Button size="sm" variant="outline">View Insights</Button>
          </Link>
        </Card>
      </div>

      {/* Activity feed */}
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <Card className="p-8 flex flex-col items-center gap-3 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Recent activity will appear here.</p>
      </Card>
    </div>
  );
}
