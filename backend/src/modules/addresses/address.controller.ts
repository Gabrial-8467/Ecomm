import { Request, Response, NextFunction } from 'express';
import { AddressService } from './address.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const addressService = new AddressService();

export class AddressController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await addressService.getUserAddresses(req.user!.id);
      sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const address = await addressService.getAddressById(id, req.user!.id);
      sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await addressService.createAddress(req.user!.id, req.body);
      sendCreated(res, address, 'Address added successfully');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const address = await addressService.updateAddress(id, req.user!.id, req.body);
      sendSuccess(res, address, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      await addressService.deleteAddress(id, req.user!.id);
      sendSuccess(res, null, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

