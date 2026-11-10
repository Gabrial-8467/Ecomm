import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service.js';
import { sendSuccess } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const customerService = new CustomerService();

export class CustomerController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string | undefined;

      const result = await customerService.getCustomers(page, limit, search);
      sendSuccess(res, result.customers, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = paramToString(req.params.id);
      const customer = await customerService.getCustomerById(id);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }
}

