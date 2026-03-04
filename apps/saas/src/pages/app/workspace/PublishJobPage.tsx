import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function PublishJobPage() {
  const { jobId } = useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Publish Job</h1>
      <p className="text-muted-foreground mb-8 text-sm">Job ID: {jobId}</p>
      <Card className="p-12 flex flex-col items-center gap-4 text-center">
        <Send className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Job details coming soon.</p>
      </Card>
    </div>
  );
}
