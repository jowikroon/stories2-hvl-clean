import { useState } from "react";
import { Beaker, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCsv, csvRowsToProductInputs } from "@/lib/content-builder/csv-parser";
import type { ProductInput } from "@/lib/content-builder/types";

interface DemoLoaderProps {
  onLoad: (products: ProductInput[]) => void;
}

export default function DemoLoader({ onLoad }: DemoLoaderProps) {
  const [loading, setLoading] = useState(false);

  async function loadDemo() {
    setLoading(true);
    try {
      const resp = await fetch("/demo/connect-car-parts.csv");
      const text = await resp.text();
      const rows = parseCsv(text);
      const products = csvRowsToProductInputs(rows);
      onLoad(products);
    } catch (err) {
      console.error("Failed to load demo data:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={loadDemo}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Beaker className="h-3.5 w-3.5" />
      )}
      Load demo data (Connect Car Parts)
    </Button>
  );
}
