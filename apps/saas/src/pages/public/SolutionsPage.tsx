import { Card } from "@/components/ui/card";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";

const solutions = [
  { label: "Amazon", to: "/solutions/amazon", desc: "Optimize listings for the world's largest marketplace." },
  { label: "Bol.com", to: "/solutions/bol", desc: "Tailored content for the Benelux leader." },
  { label: "Multi-Marketplace", to: "/solutions/multi-marketplace", desc: "Publish once, sell everywhere." },
];

export default function SolutionsPage() {
  const location = useLocation();
  const isIndex = location.pathname === "/solutions";

  if (!isIndex) return <Outlet />;

  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Solutions</h1>
          <p className="text-muted-foreground">Marketplace-specific content strategies powered by AI.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((s) => (
            <Link key={s.to} to={s.to}>
              <Card className="p-6 hover:border-primary/30 transition-colors h-full">
                <Globe className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{s.label}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
