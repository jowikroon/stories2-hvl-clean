import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AboutPage() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">About</h1>
        <p className="text-muted-foreground mb-12">Building the future of marketplace commerce.</p>
        <Card className="p-12 flex flex-col items-center gap-4">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">About page coming soon.</p>
        </Card>
      </div>
    </section>
  );
}
