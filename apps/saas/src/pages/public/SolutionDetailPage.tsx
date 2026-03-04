import { Card } from "@/components/ui/card";
import { Globe } from "lucide-react";

export default function SolutionDetailPage({ name }: { name: string }) {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">{name}</h1>
        <p className="text-muted-foreground mb-12">AI-powered content optimization for {name}.</p>
        <Card className="p-12 flex flex-col items-center gap-4">
          <Globe className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Solution details coming soon.</p>
        </Card>
      </div>
    </section>
  );
}
