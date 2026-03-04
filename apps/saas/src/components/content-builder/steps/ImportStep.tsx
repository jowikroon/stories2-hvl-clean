import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCsv, csvRowsToProductInputs } from "@/lib/content-builder/csv-parser";
import type { ProductInput } from "@/lib/content-builder/types";
import DemoLoader from "../DemoLoader";

interface ImportStepProps {
  products: ProductInput[];
  onProductsChange: (products: ProductInput[]) => void;
  onComplete: () => void;
}

export default function ImportStep({ products, onProductsChange, onComplete }: ImportStepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualSku, setManualSku] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualBrand, setManualBrand] = useState("");
  const [manualEan, setManualEan] = useState("");

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length === 0) {
          setParseError("No data rows found in the file. Make sure it has a header row and at least one data row.");
          return;
        }
        const inputs = csvRowsToProductInputs(rows);
        onProductsChange([...products, ...inputs]);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Failed to parse file");
      }
    };
    reader.readAsText(file);
  }, [products, onProductsChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const addManualProduct = () => {
    if (!manualName.trim()) return;
    const input: ProductInput = {
      id: crypto.randomUUID(),
      sku: manualSku.trim() || `SKU-${products.length + 1}`,
      product_name: manualName.trim(),
      brand: manualBrand.trim() || undefined,
      ean_gtin: manualEan.trim() || undefined,
      specs: {},
      images: [],
      certifications: [],
    };
    onProductsChange([...products, input]);
    setManualSku("");
    setManualName("");
    setManualBrand("");
    setManualEan("");
  };

  const removeProduct = (id: string) => {
    onProductsChange(products.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Import Product Data</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file with your product data, or add products manually.
        </p>
      </div>

      {/* Demo loader */}
      <DemoLoader onLoad={(demoProducts) => onProductsChange([...products, ...demoProducts])} />

      {/* CSV Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
        }`}
      >
        <input
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Drop a CSV file here, or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports CSV, TSV. Columns: SKU, Product Name, Brand, EAN/GTIN, and any spec columns.
        </p>
      </div>

      {parseError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{parseError}</p>
        </div>
      )}

      {/* Manual entry toggle */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showManual ? "Hide manual entry" : "Or add manually"}
        </button>
        <div className="h-px flex-1 bg-border" />
      </div>

      {showManual && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs">SKU</Label>
            <Input
              placeholder="e.g. ABS-17336"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Product Name *</Label>
            <Input
              placeholder="e.g. ABS Brake Disc Front"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Brand</Label>
            <Input
              placeholder="e.g. ABS"
              value={manualBrand}
              onChange={(e) => setManualBrand(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">EAN/GTIN</Label>
              <Input
                placeholder="e.g. 8717109173369"
                value={manualEan}
                onChange={(e) => setManualEan(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={addManualProduct} size="sm" disabled={!manualName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Product list */}
      {products.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {products.length} product{products.length !== 1 ? "s" : ""} loaded
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onProductsChange([])}
              className="text-xs text-destructive hover:text-destructive"
            >
              Clear all
            </Button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Brand</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">EAN</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Specs</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 50).map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{p.product_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{p.brand ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.ean_gtin ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{Object.keys(p.specs).length}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeProduct(p.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length > 50 && (
              <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                Showing 50 of {products.length} products
              </p>
            )}
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="flex justify-end">
        <Button
          onClick={onComplete}
          disabled={products.length === 0}
          size="lg"
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Continue with {products.length} product{products.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
