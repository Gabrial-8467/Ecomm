import { jsPDF } from 'jspdf';
import { Order } from '../types/index.js';

export function downloadOrderInvoicePdf(order: Order): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = 210;
  let y = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text('GRAND LIVING', 14, y);

  doc.setFontSize(14);
  doc.text('TAX INVOICE', pageWidth - 14, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Curated Architectural Furniture & Premium Electronics', 14, y);
  doc.text(`Invoice #: INV-${order.orderNumber}`, pageWidth - 14, y, { align: 'right' });

  y += 4;
  doc.text('SCO 45-48, Sector 70, Mohali, Punjab - 160071', 14, y);
  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    pageWidth - 14,
    y,
    { align: 'right' }
  );

  y += 4;
  doc.text('GSTIN: 03ABCDE1234F1Z5 | Phone: +91 98765 43210', 14, y);
  doc.text(`Order Ref: #${order.orderNumber}`, pageWidth - 14, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, pageWidth - 14, y);

  // Customer & Fulfillment Box
  y += 6;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(14, y, pageWidth - 28, 28, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('BILLED & SHIPPED TO:', 18, y + 5);
  doc.text('ORDER & PAYMENT DETAILS:', pageWidth / 2 + 5, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(order.deliveryAddress?.fullName || 'Valued Customer', 18, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  const line1 = order.deliveryAddress?.addressLine1 || '';
  const line2 = order.deliveryAddress?.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : '';
  doc.text(`${line1}${line2}`.substring(0, 50), 18, y + 14);
  doc.text(
    `${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pincode || ''}`,
    18,
    y + 18
  );
  doc.text(`Phone: ${order.deliveryAddress?.phone || 'N/A'}`, 18, y + 22);

  const rightColX = pageWidth / 2 + 5;
  doc.text(
    `Fulfillment: ${order.fulfillmentType === 'STORE_PICKUP' ? 'Showroom Self-Pickup' : 'Local Fleet Delivery'}`,
    rightColX,
    y + 10
  );
  doc.text(`Payment Mode: ${order.paymentMethod || 'COD'}`, rightColX, y + 14);
  doc.text(`Payment Status: ${order.paymentStatus || 'PENDING'}`, rightColX, y + 18);
  doc.text(`Order Status: ${order.status || 'PLACED'}`, rightColX, y + 22);

  // Table
  y += 34;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.rect(14, y, pageWidth - 28, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text('#', 17, y + 4.5);
  doc.text('Item Description', 26, y + 4.5);
  doc.text('SKU', 115, y + 4.5);
  doc.text('Qty', 140, y + 4.5, { align: 'center' });
  doc.text('Unit Price', 165, y + 4.5, { align: 'right' });
  doc.text('Total (INR)', pageWidth - 17, y + 4.5, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  order.items.forEach((item, idx) => {
    doc.setDrawColor(230, 230, 230);
    doc.rect(14, y, pageWidth - 28, 8, 'S');
    doc.text(String(idx + 1), 17, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(item.productName.substring(0, 48), 26, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(item.sku || '-', 115, y + 5.5);
    doc.text(String(item.quantity), 140, y + 5.5, { align: 'center' });
    doc.text(`INR ${Number(item.unitPrice).toLocaleString('en-IN')}`, 165, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`INR ${Number(item.totalPrice).toLocaleString('en-IN')}`, pageWidth - 17, y + 5.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 8;
  });

  // Summary box
  y += 4;
  const summaryX = pageWidth - 80;
  const summaryW = 66;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(summaryX, y, summaryW, 26, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(summaryX, y, summaryW, 26, 'S');

  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text('Subtotal:', summaryX + 4, y + 5);
  doc.text(`INR ${Number(order.subtotal).toLocaleString('en-IN')}`, summaryX + summaryW - 4, y + 5, { align: 'right' });

  doc.text('Delivery Fee:', summaryX + 4, y + 9);
  doc.text(
    Number(order.deliveryCharge) === 0 ? 'FREE' : `INR ${Number(order.deliveryCharge).toLocaleString('en-IN')}`,
    summaryX + summaryW - 4,
    y + 9,
    { align: 'right' }
  );

  doc.text('GST (18% Incl.):', summaryX + 4, y + 13);
  doc.text(`INR ${Number(order.taxAmount).toLocaleString('en-IN')}`, summaryX + summaryW - 4, y + 13, { align: 'right' });

  if (Number(order.discountAmount) > 0) {
    doc.text('Discount:', summaryX + 4, y + 17);
    doc.text(`-INR ${Number(order.discountAmount).toLocaleString('en-IN')}`, summaryX + summaryW - 4, y + 17, { align: 'right' });
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(summaryX + 3, y + 19, summaryX + summaryW - 3, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text('Grand Total:', summaryX + 4, y + 24);
  doc.text(`INR ${Number(order.totalAmount).toLocaleString('en-IN')}`, summaryX + summaryW - 4, y + 24, { align: 'right' });

  // Warranty Footer
  y += 32;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, pageWidth - 14, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('Official Brand Warranty & Verification:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('• Retain this official tax invoice for brand warranty coverage (Samsung, LG, Godrej).', 14, y + 4);
  doc.text('• Handcrafted Teak & Sheesham wood furniture carries 5-year termite guarantee.', 14, y + 7.5);
  doc.text('• For inquiries, call showroom at +91 98765 43210 (10:00 AM - 09:00 PM).', 14, y + 11);

  // Seal Box
  doc.setDrawColor(180, 180, 180);
  doc.rect(pageWidth - 46, y, 32, 12, 'S');
  doc.setFontSize(7);
  doc.text('Authorized Seal', pageWidth - 30, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Living Store', pageWidth - 30, y + 9.5, { align: 'center' });

  doc.save(`Tax-Invoice-${order.orderNumber}.pdf`);
}
