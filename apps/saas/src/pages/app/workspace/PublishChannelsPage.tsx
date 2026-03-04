import { Card } from "@/components/ui/card";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";

const channels = [
  { label: "Bol.com", segment: "bol" },
  { label: "Amazon", segment: "amazon" },
  { label: "Shopify", segment: "shopify" },
];

export default function PublishChannelsPage() {
  const location = useLocation();
  const isIndex = location.pathname.endsWith("/channels");

  if (!isIndex) return <Outlet />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Channels</h1>
      <p className="text-muted-foreground mb-8">Manage your marketplace connections.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {channels.map((ch) => (
          <Link key={ch.segment} to={ch.segment}>
            <Card className="p-6 hover:border-primary/30 transition-colors text-center">
              <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold">{ch.label}</h3>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
