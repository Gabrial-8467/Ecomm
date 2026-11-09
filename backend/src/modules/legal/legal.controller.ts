import { Request, Response, NextFunction } from 'express';
import { LegalService } from './legal.service.js';
import { LegalDocType } from '@prisma/client';

export class LegalController {
  static async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.params.type as LegalDocType;
      const document = await LegalService.getDocument(type);
      res.status(200).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  }

  static async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.params.type as LegalDocType;
      const { title, content, version } = req.body;
      const updated = await LegalService.updateDocument(type, title, content, version || '1.1');
      res.status(200).json({ success: true, message: 'Policy updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async submitGrievance(req: Request, res: Response, next: NextFunction) {
    try {
      const grievance = await LegalService.submitGrievance({
        ...req.body,
        userId: req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Grievance ticket created and acknowledged within statutory SLA (< 48 hrs)',
        data: grievance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGrievanceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const grievance = await LegalService.getGrievanceStatus(req.params.ticketNumber);
      res.status(200).json({ success: true, data: grievance });
    } catch (error) {
      next(error);
    }
  }

  static async listGrievances(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await LegalService.listGrievances();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  }

  static async updateGrievance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, resolutionNotes, officerRemarks } = req.body;
      const updated = await LegalService.updateGrievanceStatus(
        id,
        status,
        resolutionNotes,
        officerRemarks
      );
      res.status(200).json({ success: true, message: 'Grievance record updated', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async recordConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { purpose, hasConsented } = req.body;
      const record = await LegalService.recordConsent({
        userId: req.user?.id,
        purpose,
        hasConsented: Boolean(hasConsented),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  }
}
