import { AddressRepository } from './address.repository.js';
import { CreateAddressInput, UpdateAddressInput } from './address.types.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';

export class AddressService {
  private addressRepo = new AddressRepository();

  async getUserAddresses(userId: string) {
    return this.addressRepo.findByUserId(userId);
  }

  async getAddressById(id: string, userId: string) {
    const address = await this.addressRepo.findById(id);
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    if (address.userId !== userId) {
      throw new ForbiddenError('Unauthorized to access this address');
    }
    return address;
  }

  async createAddress(userId: string, input: CreateAddressInput) {
    return this.addressRepo.create(userId, input);
  }

  async updateAddress(id: string, userId: string, input: UpdateAddressInput) {
    await this.getAddressById(id, userId);
    return this.addressRepo.update(id, userId, input);
  }

  async deleteAddress(id: string, userId: string) {
    await this.getAddressById(id, userId);
    return this.addressRepo.delete(id);
  }
}
