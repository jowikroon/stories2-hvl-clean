import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground mb-12">Get in touch with our team.</p>
        <Card className="p-12 flex flex-col items-center gap-4">
          <Mail className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Contact form coming soon.</p>
        </Card>
      </div>
    </section>
  );
}
