import { prisma } from '../../lib/prisma.js';
import { LegalDocType, GrievanceStatus } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';

export class LegalService {
  static async getDocument(type: LegalDocType) {
    let doc = await prisma.legalDocument.findUnique({
      where: { type },
    });

    if (!doc) {
      // Seed default compliant legal templates
      doc = await this.seedDefaultDocument(type);
    }

    return doc;
  }

  static async updateDocument(type: LegalDocType, title: string, content: string, version: string) {
    return prisma.legalDocument.upsert({
      where: { type },
      update: {
        title,
        content,
        version,
        updatedAt: new Date(),
      },
      create: {
        type,
        title,
        content,
        version,
      },
    });
  }

  static async submitGrievance(data: {
    userId?: string;
    complainantName: string;
    phoneNumber: string;
    email: string;
    subject: string;
    description: string;
  }) {
    const ticketNumber = `GRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const grievance = await prisma.grievance.create({
      data: {
        ticketNumber,
        userId: data.userId || null,
        complainantName: data.complainantName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        subject: data.subject,
        description: data.description,
        status: GrievanceStatus.SUBMITTED,
        acknowledgedAt: new Date(), // Auto-acknowledge upon receipt (< 48 hrs SLA)
      },
    });

    return grievance;
  }

  static async getGrievanceStatus(ticketNumber: string) {
    const grievance = await prisma.grievance.findUnique({
      where: { ticketNumber },
    });

    if (!grievance) {
      throw new AppError('Grievance ticket not found.', 404);
    }

    return grievance;
  }

  static async listGrievances() {
    return prisma.grievance.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateGrievanceStatus(
    id: string,
    status: GrievanceStatus,
    resolutionNotes?: string,
    officerRemarks?: string
  ) {
    return prisma.grievance.update({
      where: { id },
      data: {
        status,
        resolutionNotes,
        officerRemarks,
        resolvedAt: ['RESOLVED', 'REJECTED'].includes(status) ? new Date() : undefined,
      },
    });
  }

  static async recordConsent(data: {
    userId?: string;
    purpose: string;
    hasConsented: boolean;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.consentRecord.create({
      data,
    });
  }

  private static async seedDefaultDocument(type: LegalDocType) {
    const templates: Record<LegalDocType, { title: string; content: string }> = {
      TERMS_AND_CONDITIONS: {
        title: 'Terms and Conditions',
        content: `### 1. Introduction
Welcome to Apex Retailers. These Terms and Conditions govern your access to and purchase of Furniture, Electronics, and Mobile Phones/Accessories from our single-store retail business.

### 2. Single Business Entity
This platform is owned and operated solely by Apex Retail Enterprises LLP, operating from New Delhi, India. All products, prices, and stock are owned directly by us. There are no third-party sellers.

### 3. Pricing and GST
All prices rendered on the platform are in Indian Rupees (INR) and inclusive of Goods and Services Tax (GST) as mandated under the CGST/SGST Acts, 2017. Transparent breakdown is provided prior to payment.

### 4. Governing Law and Jurisdiction
These terms are governed by the laws of India. Courts in New Delhi have exclusive jurisdiction.`,
      },
      PRIVACY_POLICY: {
        title: 'Privacy Policy (DPDP Act, 2023 & Rules 2025)',
        content: `### 1. Data Fiduciary Commitment
Apex Retail Enterprises LLP acts as a Data Fiduciary in compliance with the Digital Personal Data Protection (DPDP) Act, 2023.

### 2. Purpose of Collection
We collect personal data (Name, Phone Number, Shipping Address, Email) exclusively for the performance of the sales contract, shipping furniture/electronics, generating GST invoices, and servicing warranties.

### 3. Data Principal Rights
Under the DPDP Act, you possess:
- The right to access a summary of your personal data.
- The right to correction and erasure of personal data (subject to GST statutory retention).
- The right of grievance redressal via our designated Grievance Officer.`,
      },
      RETURN_AND_REFUND_POLICY: {
        title: 'Return and Refund Policy (Consumer Protection E-Commerce Rules, 2020)',
        content: `### 1. Statutory Return Window
Under the Consumer Protection (E-Commerce) Rules, 2020, consumers have the right to return goods that are defective, damaged in transit, or materially different from the specifications provided.
- **Furniture**: 7-day return window from the date of completed delivery and assembly inspection.
- **Electronics & Appliances**: 7-day replacement or return in case of transit damage, dead-on-arrival, or manufacturing defects.
- **Mobile Phones**: 7-day replacement for technical defects with verified IMEI and packaging.

### 2. Refund SLA
Upon inspection and approval of the returned merchandise, refunds are processed within 5-7 business days to the original payment source (UPI/Card/NetBanking) via Razorpay.`,
      },
      CANCELLATION_POLICY: {
        title: 'Cancellation Policy',
        content: `### 1. Order Cancellation
Customers may cancel orders at any time prior to shipment dispatch with zero penalty. Once dispatched, return and refund guidelines apply.`,
      },
      SHIPPING_POLICY: {
        title: 'Shipping & Delivery Policy',
        content: `### 1. Delivery Coverage
We offer verified local delivery across serviceable PIN codes. Furniture orders include scheduled professional assembly.
### 2. Delivery Timelines
- Local Delivery: 2-4 business days.
- Outstation / Heavy Furniture: 5-8 business days with prior appointment scheduling.`,
      },
      WARRANTY_POLICY: {
        title: 'Warranty & Service Policy',
        content: `### 1. Official Manufacturer & Retail Warranty
All electronic appliances and mobile smartphones carry standard 1-year brand warranty. Solid wood furniture carries a 3-year warranty against manufacturing defects and termite infestation. Serial numbers and IMEIs are logged on your GST invoice.`,
      },
      COOKIE_POLICY: {
        title: 'Cookie Policy',
        content: `We use essential session cookies strictly required for secure authentication, shopping cart persistence, and CSRF protection.`,
      },
      DISCLAIMER: {
        title: 'General Disclaimer',
        content: `All wood finishes, fabric shades, and product images are represented as accurately as possible. Natural timber grains and monitor calibration variations may produce minor cosmetic distinctions.`,
      },
      GRIEVANCE_POLICY: {
        title: 'Grievance Redressal Policy',
        content: `### 1. Grievance Officer Details
Name: Grievance Redressal Officer
Address: Shop No. 12-14, Commercial Plaza, MG Road, New Delhi 110001
Email: grievance@apexretailers.in
Phone: +91 11 2345 6780

### 2. Resolution SLA
- Acknowledgment: Within 48 hours.
- Redressal: Within 30 days from the date of complaint receipt.`,
      },
    };

    const template = templates[type];
    return prisma.legalDocument.create({
      data: {
        type,
        title: template.title,
        content: template.content,
        version: '1.0',
      },
    });
  }
}
