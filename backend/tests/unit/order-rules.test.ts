import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from '../../src/utils/order-number.js';

describe('Order Rules & Utilities', () => {
  it('generates a formatted unique order number', () => {
    const num1 = generateOrderNumber();
    const num2 = generateOrderNumber();

    expect(num1).toMatch(/^ORD-\d{6}-[A-Z0-9]+$/);
    expect(num2).toMatch(/^ORD-\d{6}-[A-Z0-9]+$/);
    expect(num1).not.toBe(num2);
  });

  it('validates state machine transitions', () => {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      PLACED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['READY_FOR_DISPATCH', 'CANCELLED'],
      READY_FOR_DISPATCH: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['RETURN_REQUESTED'],
      RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
      CANCELLED: [],
      RETURNED: [],
    };

    expect(VALID_TRANSITIONS['PLACED']).toContain('CONFIRMED');
    expect(VALID_TRANSITIONS['PLACED']).not.toContain('DELIVERED');
    expect(VALID_TRANSITIONS['CANCELLED'].length).toBe(0);
    expect(VALID_TRANSITIONS['RETURNED'].length).toBe(0);
  });
});
