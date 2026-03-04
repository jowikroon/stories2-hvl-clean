import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function PricingPage() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">Pricing</h1>
        <p className="text-muted-foreground mb-12">Simple, transparent pricing that scales with you.</p>
        <Card className="p-12 flex flex-col items-center gap-4">
          <DollarSign className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Pricing plans coming soon.</p>
        </Card>
      </div>
    </section>
  );
}
