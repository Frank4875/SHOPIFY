export interface Item {
  id: string;
  itemNumber: number;
  status: 'available' | 'sold';
  soldDate?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  items: Item[];
  buyingPrice: number;
  sellingPrice: number;
}

export interface MainCategory {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

export interface Profile {
  id: string;
  email: string;
  role: 'boss' | 'worker';
  boss_id?: string;
}