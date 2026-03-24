export type Product = {
  sku: string;
  name: string;
  remarks: string;
  certificate: string;
  category: string;
  capsulePrice: number;
  casePrice: number;
  capsulesPerCase: number;
  moqUnits: number | null;
  moqCases: number | null;
  varieties: {
    models: string;
    colors: string;
  };
  capsuleTypes: string;
};

export type OrderItem = {
  product: Product;
  cases: number;
};
