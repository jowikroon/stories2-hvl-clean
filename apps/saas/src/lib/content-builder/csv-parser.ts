import type { ProductInput } from "./types";

interface CsvRow {
  [key: string]: string;
}

const FIELD_ALIASES: Record<string, keyof ProductInput | "spec"> = {
  sku: "sku",
  "article_number": "sku",
  "article number": "sku",
  artikelnummer: "sku",
  ean: "ean_gtin",
  gtin: "ean_gtin",
  ean_gtin: "ean_gtin",
  barcode: "ean_gtin",
  brand: "brand",
  merk: "brand",
  marke: "brand",
  marque: "brand",
  product_name: "product_name",
  "product name": "product_name",
  productnaam: "product_name",
  produktname: "product_name",
  title: "product_name",
  titel: "product_name",
  category: "category_hint",
  categorie: "category_hint",
  kategorie: "category_hint",
};

export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const separator = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], separator).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, separator);
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() ?? "";
    });
    return row;
  });
}

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function csvRowsToProductInputs(rows: CsvRow[]): ProductInput[] {
  return rows.map((row, index) => {
    const input: ProductInput = {
      id: crypto.randomUUID(),
      sku: "",
      product_name: "",
      specs: {},
      images: [],
      certifications: [],
    };

    const unmapped: Record<string, string> = {};

    for (const [key, value] of Object.entries(row)) {
      if (!value) continue;
      const normalizedKey = key.toLowerCase().trim();
      const mapped = FIELD_ALIASES[normalizedKey];

      if (mapped === "sku") input.sku = value;
      else if (mapped === "ean_gtin") input.ean_gtin = value;
      else if (mapped === "brand") input.brand = value;
      else if (mapped === "product_name") input.product_name = value;
      else if (mapped === "category_hint") input.category_hint = value;
      else unmapped[key] = value;
    }

    if (!input.sku) input.sku = `SKU-${index + 1}`;
    if (!input.product_name) {
      input.product_name = input.brand
        ? `${input.brand} ${input.sku}`
        : input.sku;
    }

    input.specs = unmapped;
    return input;
  });
}

export function productInputsToCsv(inputs: ProductInput[]): string {
  if (inputs.length === 0) return "";

  const allSpecKeys = new Set<string>();
  inputs.forEach((inp) => Object.keys(inp.specs).forEach((k) => allSpecKeys.add(k)));

  const headers = ["sku", "ean_gtin", "brand", "product_name", "category_hint", ...allSpecKeys];
  const lines = [headers.join(",")];

  for (const inp of inputs) {
    const values = [
      escapeCsvValue(inp.sku),
      escapeCsvValue(inp.ean_gtin ?? ""),
      escapeCsvValue(inp.brand ?? ""),
      escapeCsvValue(inp.product_name),
      escapeCsvValue(inp.category_hint ?? ""),
      ...[...allSpecKeys].map((k) => escapeCsvValue(inp.specs[k] ?? "")),
    ];
    lines.push(values.join(","));
  }

  return lines.join("\n");
}

function escapeCsvValue(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
