export const CONTACT_CATEGORIES = [
  { value: 'PRODUCT', label: 'Product or catalogue question' },
  { value: 'ORDER', label: 'Order question' },
  { value: 'PAYMENT', label: 'Payment question' },
  { value: 'DELIVERY', label: 'Delivery question' },
  { value: 'RETURN', label: 'Return or replacement' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'ACCOUNT', label: 'Account or sign-in' },
  { value: 'TECHNICAL', label: 'Website or technical issue' },
  { value: 'OTHER', label: 'Something else' },
] as const

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]['value']
