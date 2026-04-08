import { useState, useEffect } from "react";
import type { Material } from "@/types/quote";
import { defaultMaterials } from "@/data/materials";

const STORAGE_KEY = "garden-materials";
const MATERIALS_VERSION_KEY = "garden-materials-version";
const CURRENT_VERSION = "2"; // bump to force refresh from defaults

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>(() => {
    const savedVersion = localStorage.getItem(MATERIALS_VERSION_KEY);
    if (savedVersion === CURRENT_VERSION) {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultMaterials;
    }
    // Version mismatch — reset to current defaults
    localStorage.setItem(MATERIALS_VERSION_KEY, CURRENT_VERSION);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
    return defaultMaterials;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
  }, [materials]);

  const addMaterial = (material: Material) => {
    setMaterials((prev) => [...prev, material]);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const resetToDefaults = () => {
    setMaterials(defaultMaterials);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
    localStorage.setItem(MATERIALS_VERSION_KEY, CURRENT_VERSION);
  };

  return { materials, addMaterial, updateMaterial, deleteMaterial, resetToDefaults };
}
