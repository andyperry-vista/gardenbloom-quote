export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number;
  unit: string;
  supplier: string;
  supplierLocation: string;
  inStock: boolean;
  notes?: string;
}

export interface QuoteLineItem {
  id: string;
  type: 'material' | 'labor' | 'misc';
  description: string;
  materialId?: string;
  quantity: number;
  unitCost: number;
  markupPercent: number;
  total: number;
}

export interface Quote {
  id: string;
  client: Client;
  items: QuoteLineItem[];
  subtotal: number;
  markupTotal: number;
  grandTotal: number;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  createdAt: string;
  notes?: string;
}
