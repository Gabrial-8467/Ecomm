import { jsPDF } from 'jspdf';
import { Order } from '../types/index.js';

export function downloadOrderInvoicePdf(order: Order): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Top luxury accent bar
  doc.setFillColor(24, 24, 27); // #18181b slate-900
  doc.rect(0, 0, pageWidth, 4, 'F');

  let y = 14;

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(24, 24, 27);
  doc.text('GRAND LIVING', margin, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(115, 115, 115);
  doc.text('ARCHITECTURAL FURNITURE & PREMIUM LIVING', margin, y + 9);
  doc.text('SCO 45-48, Sector 70, Mohali, Punjab 160071 | GSTIN: 03ABCDE1234F1Z5', margin, y + 13);

  const isReturned = order.status === 'RETURNED';

  // Invoice Title & Badge (Right side)
  doc.setFillColor(isReturned ? 255 : 244, isReturned ? 241 : 244, isReturned ? 242 : 245);
  doc.roundedRect(pageWidth - margin - 58, y - 2, 58, 20, 2, 2, 'F');
  doc.setDrawColor(isReturned ? 251 : 228, isReturned ? 113 : 228, isReturned ? 133 : 231);
  doc.roundedRect(pageWidth - margin - 58, y - 2, 58, 20, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isReturned ? 8.5 : 10);
  doc.setTextColor(isReturned ? 190 : 24, isReturned ? 18 : 24, isReturned ? 60 : 27);
  doc.text(isReturned ? 'CREDIT NOTE / RETURN' : 'OFFICIAL TAX INVOICE', pageWidth - margin - 29, y + 3, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(isReturned ? 190 : 180, isReturned ? 18 : 83, isReturned ? 60 : 9);
  doc.text(`INV-${order.orderNumber}${isReturned ? ' (RET)' : ''}`, pageWidth - margin - 29, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(115, 115, 115);
  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    pageWidth - margin - 29,
    y + 13,
    { align: 'center' }
  );

  y += 20;

  // Horizontal separator
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;

  // 2-Column Info Cards: Customer / Billing & Order Details
  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 32;

  // Left Card: Customer Details
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'S');

  // Badge
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(margin + 4, y + 4, 32, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BILLED & SHIPPED TO', margin + 20, y + 7.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text(order.deliveryAddress?.fullName || 'Valued Client', margin + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);
  const addr1 = order.deliveryAddress?.addressLine1 || '';
  const addr2 = order.deliveryAddress?.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : '';
  doc.text(`${addr1}${addr2}`.substring(0, 48), margin + 4, y + 18.5);
  doc.text(
    `${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.pincode || ''}`,
    margin + 4,
    y + 22.5
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text(`Phone: ${order.deliveryAddress?.phone || 'N/A'}`, margin + 4, y + 27);

  // Right Card: Order & Delivery Metadata
  const rightCardX = margin + cardWidth + 6;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFillColor(24, 24, 27);
  doc.roundedRect(rightCardX + 4, y + 4, 32, 4.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FULFILLMENT SPECS', rightCardX + 20, y + 7.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);

  doc.text('Fulfillment Mode:', rightCardX + 4, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text(
    order.fulfillmentType === 'STORE_PICKUP' ? 'Showroom Self-Pickup (Mohali)' : 'Local White-Glove Truck Delivery',
    rightCardX + 32,
    y + 14
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(82, 82, 91);
  doc.text('Payment Mode:', rightCardX + 4, y + 18.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text(order.paymentMethod || 'Cash On Delivery', rightCardX + 32, y + 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(82, 82, 91);
  doc.text('Payment Status:', rightCardX + 4, y + 22.5);
  doc.setFont('helvetica', 'bold');
  if (isReturned || order.paymentStatus === 'REFUNDED') {
    doc.setTextColor(190, 18, 60);
    doc.text('REFUNDED', rightCardX + 32, y + 22.5);
  } else if (order.paymentStatus === 'PAID') {
    doc.setTextColor(22, 101, 52);
    doc.text(order.paymentStatus, rightCardX + 32, y + 22.5);
  } else {
    doc.setTextColor(180, 83, 9);
    doc.text(order.paymentStatus || 'PENDING', rightCardX + 32, y + 22.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(82, 82, 91);
  doc.text('Order Ref No.:', rightCardX + 4, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text(`#${order.orderNumber}`, rightCardX + 32, y + 27);

  y += cardHeight + 8;

  // Table Columns
  const tableX = margin;
  const colW = {
    idx: 8,
    desc: 70,
    sku: 28,
    qty: 14,
    rate: 30,
    amt: 32,
  };

  const drawTableHeader = (curY: number) => {
    doc.setFillColor(24, 24, 27);
    doc.roundedRect(tableX, curY, contentWidth, 8, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    doc.text('#', tableX + colW.idx / 2, curY + 5.2, { align: 'center' });
    doc.text('ITEM DESCRIPTION', tableX + colW.idx + 2, curY + 5.2);
    doc.text('SKU / CODE', tableX + colW.idx + colW.desc + 2, curY + 5.2);
    doc.text('QTY', tableX + colW.idx + colW.desc + colW.sku + colW.qty / 2, curY + 5.2, { align: 'center' });
    doc.text(
      'PRICE (INR)',
      tableX + colW.idx + colW.desc + colW.sku + colW.qty + colW.rate - 3,
      curY + 5.2,
      { align: 'right' }
    );
    doc.text('TOTAL (INR)', tableX + contentWidth - 4, curY + 5.2, { align: 'right' });
  };

  drawTableHeader(y);
  y += 8;

  // Table Body Rows
  order.items.forEach((item, idx) => {
    // Word-wrap item title within description column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const titleLines: string[] = doc.splitTextToSize(item.productName, colW.desc - 4);
    const titleH = titleLines.length * 3.8;
    const variantH = item.variantName ? 3.5 : 0;

    // Word-wrap / constrain SKU to prevent overlap with QTY column
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const skuLines: string[] = doc.splitTextToSize(item.sku || '-', colW.sku - 4);
    const skuH = skuLines.length * 3.2;

    const rowH = Math.max(9, titleH + variantH + 4, skuH + 4);

    if (y + rowH > 240) {
      doc.addPage();
      y = 16;
      drawTableHeader(y);
      y += 8;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 250);
    doc.rect(tableX, y, contentWidth, rowH, 'F');

    doc.setDrawColor(240, 240, 240);
    doc.line(tableX, y + rowH, tableX + contentWidth, y + rowH);

    const baselineY = y + 5;

    // Index
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text(String(idx + 1), tableX + colW.idx / 2, baselineY, { align: 'center' });

    // Item title (multi-line word wrap)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    let titleY = y + 4.5;
    titleLines.forEach((line) => {
      doc.text(line, tableX + colW.idx + 2, titleY);
      titleY += 3.8;
    });

    if (item.variantName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(115, 115, 115);
      doc.text(`Variant: ${item.variantName}`, tableX + colW.idx + 2, titleY);
    }

    // SKU (multi-line wrapped, safe gap before QTY)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(82, 82, 91);
    let skuY = y + 4.5;
    skuLines.forEach((line) => {
      doc.text(line, tableX + colW.idx + colW.desc + 2, skuY);
      skuY += 3.2;
    });

    // Qty
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text(String(item.quantity), tableX + colW.idx + colW.desc + colW.sku + colW.qty / 2, baselineY, {
      align: 'center',
    });

    // Rate / Unit Price
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(
      Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      tableX + colW.idx + colW.desc + colW.sku + colW.qty + colW.rate - 3,
      baselineY,
      { align: 'right' }
    );

    // Total Amount
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text(
      Number(item.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      tableX + contentWidth - 4,
      baselineY,
      { align: 'right' }
    );

    y += rowH;
  });

  // Table outer border
  doc.setDrawColor(228, 228, 231);
  doc.line(tableX, y, tableX + contentWidth, y);

  // Check if summary and footer fit on current page
  if (y + 55 > 280) {
    doc.addPage();
    y = 16;
  } else {
    y += 6;
  }

  // Lower Section: Left terms & Right Totals Box
  const summaryBoxW = 75;
  const summaryBoxX = pageWidth - margin - summaryBoxW;

  // Left Note / GST compliance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(82, 82, 91);
  doc.text('TAX & STATUTORY BREAKDOWN:', margin, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 115, 115);
  const cgst = (Number(order.taxAmount) / 2).toFixed(2);
  const sgst = (Number(order.taxAmount) / 2).toFixed(2);
  doc.text(`• CGST (9.0%): INR ${Number(cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin, y + 8.5);
  doc.text(`• SGST (9.0%): INR ${Number(sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin, y + 12);
  doc.text('• Applicable HSN Code: 9403 (Wooden Furniture) / 8528 (Electronics)', margin, y + 15.5);
  doc.text('• Place of Supply: Mohali, Punjab (State Code: 03)', margin, y + 19);

  // Right Totals Box
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(summaryBoxX, y, summaryBoxW, 36, 2, 2, 'F');
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(summaryBoxX, y, summaryBoxW, 36, 2, 2, 'S');

  let sy = y + 5.5;

  function addSummaryRow(label: string, value: string, bold = false, color: [number, number, number] = [82, 82, 91]) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(label, summaryBoxX + 4, sy);
    doc.text(value, summaryBoxX + summaryBoxW - 4, sy, { align: 'right' });
    sy += 4.8;
  }

  addSummaryRow(
    'Subtotal (Taxable):',
    `INR ${Number(order.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  );
  addSummaryRow(
    'Fleet Delivery:',
    Number(order.deliveryCharge) === 0
      ? 'COMPLIMENTARY'
      : `INR ${Number(order.deliveryCharge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  );
  addSummaryRow(
    'GST (18% Total):',
    `INR ${Number(order.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  );

  if (Number(order.discountAmount) > 0) {
    addSummaryRow(
      'Promo Discount:',
      `-INR ${Number(order.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      true,
      [22, 101, 52]
    );
  }

  // Grand Total Banner inside box
  doc.setFillColor(24, 24, 27);
  doc.roundedRect(summaryBoxX + 2, sy + 1, summaryBoxW - 4, 8, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', summaryBoxX + 5, sy + 6.2);
  doc.setFontSize(9.5);
  doc.text(
    `INR ${Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    summaryBoxX + summaryBoxW - 5,
    sy + 6.2,
    { align: 'right' }
  );

  y += 42;

  // Bottom Guarantee & Stamp Bar
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(24, 24, 27);
  doc.text('Warranty Terms & Customer Notice:', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(115, 115, 115);
  doc.text(
    '1. Retain this computerized tax invoice for official OEM brand warranty registration (Samsung, LG, Godrej).',
    margin,
    y + 4
  );
  doc.text(
    '2. Solid Teak and Sheesham wood architectural furniture carries 5-year anti-termite and structural guarantee.',
    margin,
    y + 7.5
  );
  doc.text(
    '3. For installation or dedicated showroom support, reach our desk at support@grandliving.in or +91 98765 43210.',
    margin,
    y + 11
  );

  // Authorized Stamp Box
  const stampX = pageWidth - margin - 44;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 83, 9); // amber-700
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, y - 2, 44, 15, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(180, 83, 9);
  doc.text('GRAND LIVING SHOWROOM', stampX + 22, y + 3, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(115, 115, 115);
  doc.text('Authorized Signatory & Seal', stampX + 22, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  if (isReturned) {
    doc.setTextColor(190, 18, 60);
    doc.text('ORDER RETURNED & RESTOCKED', stampX + 22, y + 11, { align: 'center' });
  } else {
    doc.setTextColor(22, 101, 52);
    doc.text('VERIFIED DIGITAL INVOICE', stampX + 22, y + 11, { align: 'center' });
  }

  doc.save(`${isReturned ? 'Return-CreditNote' : 'Tax-Invoice'}-${order.orderNumber}.pdf`);
}
