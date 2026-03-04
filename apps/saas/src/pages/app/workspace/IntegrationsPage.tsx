import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Plug, Webhook, Key } from "lucide-react";

const sections = [
  { label: "Connectors", segment: "connectors", icon: Plug, desc: "Connect external services." },
  { label: "Webhooks", segment: "webhooks", icon: Webhook, desc: "Manage webhook endpoints." },
  { label: "API Keys", segment: "api-keys", icon: Key, desc: "Enterprise API key management." },
];

export default function IntegrationsPage() {
  const location = useLocation();
  const isIndex = location.pathname.endsWith("/integrations");

  if (!isIndex) return <><Breadcrumbs /><Outlet /></>;

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">Integrations</h1>
      <p className="text-muted-foreground text-sm mb-8">Connect your tools and services.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link key={s.segment} to={s.segment}>
            <Card className="p-6 hover:border-primary/30 transition-colors">
              <s.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{s.label}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
