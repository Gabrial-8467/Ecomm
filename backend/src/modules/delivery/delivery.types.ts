export interface CreateDeliveryZoneInput {
  name: string;
  city: string;
  state: string;
  pincodes: string[];
  deliveryCharge: number;
  minimumOrder?: number;
  estimatedDays?: number;
  isActive?: boolean;
}

export interface UpdateDeliveryZoneInput {
  name?: string;
  city?: string;
  state?: string;
  pincodes?: string[];
  deliveryCharge?: number;
  minimumOrder?: number;
  estimatedDays?: number;
  isActive?: boolean;
}

export interface PincodeValidationResult {
  serviceable: boolean;
  zone?: {
    id: string;
    name: string;
    city: string;
    state: string;
    deliveryCharge: number;
    minimumOrder: number;
    estimatedDays: number;
  };
  message?: string;
}
