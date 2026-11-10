import { DeliveryRepository } from './delivery.repository.js';
import { CreateDeliveryZoneInput, UpdateDeliveryZoneInput, PincodeValidationResult } from './delivery.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class DeliveryService {
  private deliveryRepo = new DeliveryRepository();

  async getAllZones(includeInactive = false) {
    return this.deliveryRepo.findAllZones(includeInactive);
  }

  async validatePincode(pincode: string): Promise<PincodeValidationResult> {
    const zone = await this.deliveryRepo.findZoneByPincode(pincode);

    if (!zone) {
      return {
        serviceable: false,
        message: 'Sorry, we currently do not deliver to this pincode.',
      };
    }

    return {
      serviceable: true,
      zone: {
        id: zone.id,
        name: zone.name,
        city: zone.city,
        state: zone.state,
        deliveryCharge: Number(zone.deliveryCharge),
        minimumOrder: Number(zone.minimumOrder),
        estimatedDays: zone.estimatedDays,
      },
    };
  }

  async createZone(input: CreateDeliveryZoneInput) {
    return this.deliveryRepo.create(input);
  }

  async updateZone(id: string, input: UpdateDeliveryZoneInput) {
    const zone = await this.deliveryRepo.findById(id);
    if (!zone) {
      throw new NotFoundError('Delivery zone not found');
    }
    return this.deliveryRepo.update(id, input);
  }

  async deleteZone(id: string) {
    const zone = await this.deliveryRepo.findById(id);
    if (!zone) {
      throw new NotFoundError('Delivery zone not found');
    }
    return this.deliveryRepo.delete(id);
  }
}
