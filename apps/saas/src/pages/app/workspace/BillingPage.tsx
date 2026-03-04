import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { CreditCard, Receipt, BarChart3 } from "lucide-react";

const sections = [
  { icon: CreditCard, title: "Plan Overview", description: "View and manage your current subscription plan." },
  { icon: Receipt, title: "Invoice History", description: "Download past invoices and payment records." },
  { icon: BarChart3, title: "Credit Usage", description: "Monitor AI credit consumption and limits." },
];

export default function BillingPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Billing</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage subscription and payment methods.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-6 flex items-start gap-4">
            <s.icon className="h-8 w-8 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
