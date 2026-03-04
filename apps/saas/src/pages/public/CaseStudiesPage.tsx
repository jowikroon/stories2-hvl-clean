import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function CaseStudiesPage() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">Case Studies</h1>
        <p className="text-muted-foreground mb-12">Real results from real brands.</p>
        <Card className="p-12 flex flex-col items-center gap-4">
          <Trophy className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Case studies coming soon.</p>
        </Card>
      </div>
    </section>
  );
}
