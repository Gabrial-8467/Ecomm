import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailNotificationService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.isConfigured = true;
      console.log(`[EMAIL SERVICE] Initialized SMTP transport for ${host}:${port}`);
    } else {
      console.log(
        '[EMAIL SERVICE] Running in simulation mode (no SMTP credentials configured). Notification previews will be logged to console.'
      );
    }
  }

  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; simulated?: boolean }> {
    if (!payload.to) {
      console.warn('[EMAIL SERVICE] Missing recipient email, skipping dispatch.');
      return { success: false };
    }

    const from = process.env.FROM_EMAIL || `Grand Living Furniture <${env.STORE_EMAIL}>`;

    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        });
        console.log(`[EMAIL SERVICE] Successfully delivered email to ${payload.to}: "${payload.subject}"`);
        return { success: true };
      } catch (error) {
        console.error(`[EMAIL SERVICE] Failed to deliver email via SMTP to ${payload.to}:`, error);
        // Fall back to simulation output
      }
    }

    // Simulation / Dev Logger with sleek preview
    console.log('\n======================================================');
    console.log(`✉️  [AUTOMATED NOTIFICATION DISPATCH]`);
    console.log(`To:      ${payload.to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Time:    ${new Date().toISOString()}`);
    console.log('------------------------------------------------------');
    console.log(payload.text || payload.html.replace(/<[^>]*>?/gm, ' ').slice(0, 300) + '...');
    console.log('======================================================\n');

    return { success: true, simulated: true };
  }

  /**
   * 1. Order Confirmation Email with Invoice Link
   */
  async sendOrderConfirmation(order: any) {
    if (!order.customerEmail) return;

    const invoiceUrl = `${env.STOREFRONT_URL}/orders/${order.orderNumber}`;
    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
            <strong style="color: #111;">${item.productName}</strong><br/>
            <span style="font-size: 12px; color: #666;">${item.variantName} (SKU: ${item.sku})</span>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: center; color: #444;">
            ${item.quantity}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold; color: #111;">
            ₹${Number(item.totalPrice).toLocaleString('en-IN')}
          </td>
        </tr>`
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eaeaea; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="background-color: #0a0a0a; color: #ffffff; padding: 32px 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">Grand Living</h1>
            <p style="margin: 6px 0 0; font-size: 12px; color: #a3a3a3; letter-spacing: 1px;">Luxury Handcrafted Furniture</p>
          </div>

          <div style="padding: 32px 28px;">
            <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; rounded-radius: 999px; margin-bottom: 14px;">
              Order Confirmed • #${order.orderNumber}
            </div>

            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #111;">Thank You for Your Order, ${order.customerName}!</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color: #525252; line-height: 1.6;">
              Your order has been received and scheduled with our master craftsmen and logistics team.
            </p>

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 18px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="color: #6b7280; padding-bottom: 6px;">Fulfillment Type:</td>
                  <td style="font-weight: bold; text-align: right; color: #111;">${order.fulfillmentType}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding-bottom: 6px;">Delivery Slot:</td>
                  <td style="font-weight: bold; text-align: right; color: #111;">${order.deliveryTimeSlot || 'Standard Delivery'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Free Showroom Assembly:</td>
                  <td style="font-weight: bold; text-align: right; color: ${order.requiresInstallation ? '#059669' : '#6b7280'};">
                    ${order.requiresInstallation ? '✓ Technician Requested' : 'Self-Installation'}
                  </td>
                </tr>
              </table>
            </div>

            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #111; margin-bottom: 12px; border-bottom: 2px solid #111; padding-bottom: 8px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
              <thead>
                <tr style="color: #6b7280; text-align: left; font-size: 11px; text-transform: uppercase;">
                  <th style="padding-bottom: 8px;">Item</th>
                  <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding-top: 14px; font-weight: bold; font-size: 15px; color: #111;">Total Amount</td>
                  <td style="padding-top: 14px; font-weight: bold; font-size: 16px; color: #111; text-align: right;">
                    ₹${Number(order.totalAmount).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style="text-align: center; margin: 32px 0 16px;">
              <a href="${invoiceUrl}" style="background-color: #0a0a0a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">
                View Order & Download PDF Invoice
              </a>
            </div>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
            Grand Living Showroom & Workshop • Sector 82, Mohali, Punjab • Contact: support@grandlivingstore.com
          </div>
        </div>
      </body>
    </html>`;

    return this.sendEmail({
      to: order.customerEmail,
      subject: `Order Confirmed: #${order.orderNumber} - Grand Living Luxury Furniture`,
      html,
      text: `Your order #${order.orderNumber} is confirmed! Total: ₹${Number(order.totalAmount).toLocaleString('en-IN')}. View details & invoice: ${invoiceUrl}`,
    });
  }

  /**
   * 2. Order Dispatch Notification with 4-Digit Delivery OTP & Driver Contact
   */
  async sendOrderDispatched(order: any, deliveryOtp: string) {
    if (!order.customerEmail) return;

    const trackUrl = `${env.STOREFRONT_URL}/orders/${order.orderNumber}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eaeaea; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="background-color: #0a0a0a; color: #ffffff; padding: 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">Grand Living Dispatch</h1>
          </div>

          <div style="padding: 32px 28px;">
            <div style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 999px; margin-bottom: 14px;">
              🚚 Out for Delivery • #${order.orderNumber}
            </div>

            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #111;">Your Furniture is On Its Way!</h2>
            <p style="margin: 0 0 24px; font-size: 14px; color: #525252; line-height: 1.6;">
              Our dedicated delivery van is en route to your residence. Please keep the delivery verification PIN ready to share with our crew.
            </p>

            <!-- 4-Digit Delivery Verification OTP Banner -->
            <div style="background: linear-gradient(135deg, #18181b 0%, #09090b 100%); color: #ffffff; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; font-weight: bold; display: block; margin-bottom: 8px;">
                Secure Delivery Verification Code
              </span>
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-bottom: 8px;">
                ${deliveryOtp}
              </div>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                Share this 4-digit PIN with the driver after inspecting your furniture in your room.
              </p>
            </div>

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 18px; margin-bottom: 24px; border: 1px solid #f3f4f6; font-size: 13px;">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #6b7280; padding-bottom: 6px;">Delivery Personnel:</td>
                  <td style="font-weight: bold; text-align: right; color: #111;">${order.deliveryAgentName || 'Grand Living White Glove Crew'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; padding-bottom: 6px;">Driver Contact:</td>
                  <td style="font-weight: bold; text-align: right; color: #111;">${order.deliveryAgentPhone || '+91 98765 43210'}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Preferred Window:</td>
                  <td style="font-weight: bold; text-align: right; color: #111;">${order.deliveryTimeSlot || 'Today'}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 24px 0 10px;">
              <a href="${trackUrl}" style="background-color: #0a0a0a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-size: 13px; font-weight: bold; display: inline-block;">
                Track Live Delivery & Verification
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>`;

    return this.sendEmail({
      to: order.customerEmail,
      subject: `🚚 Out for Delivery: Order #${order.orderNumber} (Delivery PIN: ${deliveryOtp})`,
      html,
      text: `Your furniture order #${order.orderNumber} is Out for Delivery! Share 4-digit PIN ${deliveryOtp} with the driver upon inspection. Track order: ${trackUrl}`,
    });
  }

  /**
   * 3. Return Settled & Refund Confirmation Alert
   */
  async sendReturnSettled(order: any, refundAmount: number, isPartial: boolean) {
    if (!order.customerEmail) return;

    const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eaeaea; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="background-color: #0a0a0a; color: #ffffff; padding: 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">Grand Living Care</h1>
          </div>

          <div style="padding: 32px 28px;">
            <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 999px; margin-bottom: 14px;">
              ✓ Return Approved & Refund Settled
            </div>

            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #111;">
              Refund Processed for Order #${order.orderNumber}
            </h2>
            <p style="margin: 0 0 20px; font-size: 14px; color: #525252; line-height: 1.6;">
              ${
                isPartial
                  ? 'Your partial return claim has been inspected and approved. The refund for returned items has been initiated.'
                  : 'Your return claim has been inspected and approved. The full order refund has been initiated.'
              }
            </p>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: bold; display: block; margin-bottom: 6px;">
                Settled Refund Amount
              </span>
              <div style="font-size: 32px; font-weight: 800; color: #15803d;">
                ₹${Number(refundAmount).toLocaleString('en-IN')}
              </div>
              <p style="margin: 8px 0 0; font-size: 12px; color: #166534;">
                Funds will reflect in your account within 3–5 business days (or collected via cash on pickup).
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>`;

    return this.sendEmail({
      to: order.customerEmail,
      subject: `Return Approved & Refund Processed: Order #${order.orderNumber}`,
      html,
      text: `Your return for order #${order.orderNumber} has been approved. Refund of ₹${Number(refundAmount).toLocaleString('en-IN')} has been initiated.`,
    });
  }
}

export const emailService = new EmailNotificationService();
