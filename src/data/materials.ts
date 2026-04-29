import type { Material } from "@/types/quote";

/** Available material categories — kept even when the catalog is empty. */
export const materialCategories = [
  "Landscaping",
  "Decorative Stone",
  "Edging & Borders",
  "Paving",
  "Screening",
  "Garden Supplies",
  "Soil & Mulch",
  "Fertiliser",
  "Weed & Pest Control",
  "Turf & Lawn",
  "Retaining Wall",
  "Irrigation",
] as const;

export type MaterialCategory = (typeof materialCategories)[number];

/** Sample materials cleared — users add their own from suppliers. */
export const defaultMaterials: Material[] = [];
