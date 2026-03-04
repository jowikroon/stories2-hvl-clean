import Breadcrumbs from "@/components/app/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Brain, Image, Globe, Cpu, FlaskConical } from "lucide-react";

const sections = [
  {
    icon: Image,
    title: "Multi-Modal Generators",
    description: "Generate text, images, and video from a single prompt.",
  },
  {
    icon: Globe,
    title: "Marketplace API Browser",
    description: "Explore and test marketplace APIs in real time.",
  },
  {
    icon: Cpu,
    title: "Custom Model Training",
    description: "Fine-tune models on your brand data for higher accuracy.",
  },
  {
    icon: FlaskConical,
    title: "Experimentation Sandbox",
    description: "Test prompts, compare outputs, and iterate safely.",
  },
];

export default function AIHubPage() {
  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl font-bold mb-1">AI Hub</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Advanced AI tools and experimentation space.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
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
