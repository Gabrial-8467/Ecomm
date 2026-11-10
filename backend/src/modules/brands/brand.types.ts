export interface CreateBrandInput {
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
  isActive?: boolean;
}
