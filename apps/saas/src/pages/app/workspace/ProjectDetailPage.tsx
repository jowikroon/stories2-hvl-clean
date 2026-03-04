import Breadcrumbs from "@/components/app/Breadcrumbs";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const tabs = ["overview", "assets", "publishing-queue", "history"];

export default function ProjectDetailPage() {
  const { projectId } = useParams();

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-2">Project Details</h1>
      <p className="text-muted-foreground mb-6 text-sm">Project ID: {projectId}</p>
      <Tabs defaultValue="overview">
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t.replace("-", " ")}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t} value={t}>
            <Card className="p-8 mt-4 text-center text-muted-foreground">
              <p className="capitalize">{t.replace("-", " ")} — coming soon.</p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
