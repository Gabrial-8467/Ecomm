'use client'

import {
  AlertCircle,
  Building,
  CheckCircle2,
  CreditCard,
  Info,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { CouponForm } from '@/components/store/coupon-form'
import { Button } from '@/components/ui/button'
import type { CheckoutView } from '@/modules/checkout/checkout.service'

import {
  fetchCheckoutQuoteAction,
  finalizePaymentAction,
  placeOrderAction,
} from './checkout-actions'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, callback: (response: unknown) => void) => void
    }
  }
}

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function CheckoutForm({ initialView }: { initialView: CheckoutView }) {
  const router = useRouter()
  const [view, setView] = useState<CheckoutView>(initialView)
  const [isPending, startTransition] = useTransition()
  const [isQuoting, setIsQuoting] = useState(false)

  // Address state
  const hasSavedAddresses = view.addresses.length > 0
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    view.addresses.find((a) => a.isDefaultShipping)?.id ?? view.addresses[0]?.id ?? null,
  )
  const [useNewAddress, setUseNewAddress] = useState(!hasSavedAddresses)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [landmark, setLandmark] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [saveAddress, setSaveAddress] = useState(false)

  // Options state
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY')
  const [installationRequested, setInstallationRequested] = useState(false)
  const [customerNote, setCustomerNote] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasInstallationItems = view.cart.items.some((item) => item.installationRequired)

  // Fetch shipping quote when pincode changes
  const checkQuote = useCallback(async (pin: string) => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) return
    setIsQuoting(true)
    try {
      const res = await fetchCheckoutQuoteAction(pin)
      if (res.status === 'success' && res.data) {
        setView(res.data)
        if (res.data.quote?.city) setCity((prev) => prev || res.data?.quote?.city || '')
        if (res.data.quote?.state) setState((prev) => prev || res.data?.quote?.state || '')
      } else if (res.message) {
        toast.error(res.message)
      }
    } finally {
      setIsQuoting(false)
    }
  }, [])

  function handlePincodeChange(value: string) {
    const cleaned = value.replace(/\D/g, '')
    setPincode(cleaned)
    if (cleaned.length === 6) {
      void checkQuote(cleaned)
    }
  }

  function handleSelectSavedAddress(addr: CheckoutView['addresses'][number]) {
    setSelectedAddressId(addr.id)
    setUseNewAddress(false)
    if (addr.pincode) {
      void checkQuote(addr.pincode)
    }
  }

  // Pre-load Razorpay checkout script
  useEffect(() => {
    void loadRazorpayScript()
  }, [])

  const codOption = view.paymentOptions.find((p) => p.method === 'COD')
  const isCodAllowed = Boolean(codOption?.available)
  const effectivePaymentMethod = paymentMethod === 'COD' && !isCodAllowed ? 'RAZORPAY' : paymentMethod

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!acceptTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy.')
      return
    }

    if (useNewAddress || !selectedAddressId) {
      if (!fullName.trim() || !phone.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        setErrorMessage('Please complete all mandatory delivery address fields.')
        return
      }
      if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
        setErrorMessage('Enter a valid 6-digit Indian PIN code.')
        return
      }
      if (view.isGuest && !email.trim()) {
        setErrorMessage('Please provide an email address for your order confirmation.')
        return
      }
    }

    if (view.quote && !view.quote.serviceable) {
      setErrorMessage(view.quote.reason ?? 'Delivery is not available to this PIN code.')
      return
    }

    const idempotencyKey = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    startTransition(async () => {
      const res = await placeOrderAction({
        addressId: useNewAddress ? null : selectedAddressId,
        saveAddress: !view.isGuest && saveAddress,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        line1: line1.trim(),
        line2: line2.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: 'IN',
        paymentMethod: effectivePaymentMethod,
        customerNote: customerNote.trim(),
        installationRequested,
        acceptTerms: true,
        idempotencyKey,
      })

      if (res.status === 'error' || !res.data) {
        setErrorMessage(res.message ?? 'Order placement failed. Please try again.')
        toast.error(res.message ?? 'Order placement failed.')
        return
      }

      const orderData = res.data

      // Cash On Delivery flow
      if (orderData.paymentMethod === 'COD' || !orderData.requiresPayment) {
        toast.success(`Order ${orderData.orderNumber} placed successfully!`)
        router.push(`/orders/${orderData.orderNumber}`)
        return
      }

      // Online payment via Razorpay
      if (orderData.razorpay) {
        const loaded = await loadRazorpayScript()
        if (!loaded || !window.Razorpay) {
          toast.error('Unable to open payment gateway. Please contact support or try COD.')
          router.push(`/orders/${orderData.orderNumber}`)
          return
        }

        const rzp = new window.Razorpay({
          key: orderData.razorpay.keyId,
          order_id: orderData.razorpay.providerOrderId,
          amount: orderData.razorpay.amountPaise,
          currency: 'INR',
          name: orderData.razorpay.name,
          description: orderData.razorpay.description,
          prefill: orderData.razorpay.prefill,
          theme: { color: '#0f172a' },
          handler: async (response: {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }) => {
            const verifyRes = await finalizePaymentAction({
              orderNumber: orderData.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            if (verifyRes.status === 'success') {
              toast.success('Payment verified! Order confirmed.')
            } else {
              toast.info('Payment received. Our team will reconcile confirmation shortly.')
            }
            router.push(`/orders/${orderData.orderNumber}`)
          },
          modal: {
            ondismiss: () => {
              toast.warning('Payment was not completed. You can retry payment from your order page.')
              router.push(`/orders/${orderData.orderNumber}`)
            },
          },
        })

        rzp.open()
      }
    })
  }

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column: Delivery, Installation, Payment */}
      <div className="space-y-8 lg:col-span-7">
        {/* Section 1: Delivery Address */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <MapPin className="size-5 text-accent" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">1. Delivery Address</h2>
          </div>

          {/* Saved Addresses Selector (for registered users) */}
          {hasSavedAddresses ? (
            <div className="mt-5 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select from saved addresses
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {view.addresses.map((addr) => {
                  const isSelected = !useNewAddress && selectedAddressId === addr.id
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`cursor-pointer rounded-lg border p-4 text-xs transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/5 ring-1 ring-accent'
                          : 'border-border hover:border-foreground/30 bg-secondary/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{addr.fullName}</span>
                        {addr.isDefaultShipping ? (
                          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-muted-foreground">{addr.phone}</p>
                      <p className="mt-2 text-foreground/80 line-clamp-2">
                        {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} — {addr.pincode}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseNewAddress(!useNewAddress)}
                >
                  {useNewAddress ? 'Use a saved address' : '+ Deliver to a new address'}
                </Button>
              </div>
            </div>
          ) : null}

          {/* New Address Fields */}
          {useNewAddress ? (
            <div className="mt-5 space-y-4">
              {hasSavedAddresses ? (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  New delivery address
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="block text-xs font-medium text-foreground">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-medium text-foreground">
                    Phone Number (10 digits) *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {view.isGuest ? (
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-medium text-foreground">
                    Email Address (for order confirmation & tracking) *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="e.g. priya@example.com"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="line1" className="block text-xs font-medium text-foreground">
                  Flat, House no., Building, Company, Apartment *
                </label>
                <input
                  id="line1"
                  value={line1}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLine1(e.target.value)}
                  placeholder="e.g. Flat 402, Lotus Heights"
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="line2" className="block text-xs font-medium text-foreground">
                    Area, Colony, Street, Sector (Optional)
                  </label>
                  <input
                    id="line2"
                    value={line2}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLine2(e.target.value)}
                    placeholder="e.g. Indiranagar, 100ft Road"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="landmark" className="block text-xs font-medium text-foreground">
                    Landmark (Optional)
                  </label>
                  <input
                    id="landmark"
                    value={landmark}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro Station"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="pincode" className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span>PIN Code *</span>
                    {isQuoting ? <span className="text-[10px] text-accent animate-pulse">Checking…</span> : null}
                  </label>
                  <input
                    id="pincode"
                    value={pincode}
                    maxLength={6}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePincodeChange(e.target.value)}
                    placeholder="6-digit PIN"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="city" className="block text-xs font-medium text-foreground">
                    City / Town *
                  </label>
                  <input
                    id="city"
                    value={city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="state" className="block text-xs font-medium text-foreground">
                    State *
                  </label>
                  <input
                    id="state"
                    value={state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    required
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {!view.isGuest ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="size-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <label htmlFor="saveAddress" className="text-xs text-muted-foreground cursor-pointer">
                    Save this address to your address book
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* PIN Code Serviceability Banner */}
          {view.quote ? (
            <div
              className={`mt-5 rounded-lg border p-4 text-xs ${
                view.quote.serviceable
                  ? 'border-success/30 bg-success/5 text-foreground'
                  : 'border-destructive/30 bg-destructive/5 text-destructive'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {view.quote.serviceable ? (
                  <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">
                    {view.quote.serviceable
                      ? `Serviceable PIN: ${view.quote.pincode} (${view.quote.city ?? 'Metro area'}, ${view.quote.state ?? ''})`
                      : `PIN Code ${view.quote.pincode} is not currently serviceable`}
                  </p>
                  <p className="text-muted-foreground">
                    {view.quote.serviceable
                      ? `Estimated delivery in ${view.quote.standardDays ?? 3} business days.${
                          view.quote.freeShippingApplied ? ' You qualify for Free Delivery!' : ''
                        }`
                      : view.quote.reason}
                  </p>
                  {view.quote.installationAvailable ? (
                    <p className="text-[11px] text-foreground/80 flex items-center gap-1 mt-1">
                      <Truck className="size-3.5 text-accent shrink-0" aria-hidden="true" />
                      Free professional delivery and assembly available in this area.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="size-3.5" aria-hidden="true" />
              <span>Enter your 6-digit PIN code above to view delivery timelines and shipping options.</span>
            </div>
          )}
        </div>

        {/* Section 2: Furniture Installation & Services (Conditional) */}
        {hasInstallationItems ? (
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Building className="size-5 text-accent" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">2. Assembly & Installation</h2>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="installation"
                checked={installationRequested}
                onChange={(e) => setInstallationRequested(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent mt-0.5"
              />
              <div>
                <label htmlFor="installation" className="text-sm font-semibold cursor-pointer">
                  Request Free Professional Installation & Assembly
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Our certified technicians will assemble and install eligible furniture or appliances at your delivery location.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Section 3: Payment Method */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <CreditCard className="size-5 text-accent" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">
              {hasInstallationItems ? '3. Payment Method' : '2. Payment Method'}
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {view.paymentOptions.map((opt) => {
              const isSelected = effectivePaymentMethod === opt.method
              return (
                <label
                  key={opt.method}
                  className={`flex cursor-pointer items-start gap-3.5 rounded-lg border p-4 transition-all ${
                    !opt.available
                      ? 'border-border/60 bg-secondary/10 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-border hover:border-foreground/30 bg-secondary/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.method}
                    checked={isSelected}
                    disabled={!opt.available}
                    onChange={() => setPaymentMethod(opt.method as 'RAZORPAY' | 'COD')}
                    className="size-4 text-accent border-border mt-0.5 focus:ring-accent"
                  />
                  <div className="space-y-1 text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{opt.label}</span>
                      {opt.method === 'RAZORPAY' ? (
                        <span className="text-[11px] font-medium text-accent">UPI · Cards · NetBanking</span>
                      ) : null}
                    </div>
                    {opt.method === 'RAZORPAY' ? (
                      <p className="text-muted-foreground">
                        Pay securely with UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, or NetBanking via Razorpay.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Pay with cash or digital payment at the courier doorstep when your order arrives.
                      </p>
                    )}
                    {opt.reason ? (
                      <p className="text-[11px] text-destructive pt-0.5">{opt.reason}</p>
                    ) : null}
                  </div>
                </label>
              )
            })}
          </div>

          {/* Delivery Instructions / Customer Note */}
          <div className="mt-5 pt-4 border-t border-border space-y-1.5">
            <label htmlFor="note" className="block text-xs font-medium text-foreground">
              Delivery instructions (Optional)
            </label>
            <input
              id="note"
              value={customerNote}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerNote(e.target.value)}
              placeholder="e.g. Call before delivery, leave with guard at gate 2"
              maxLength={200}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Placement */}
      <div className="space-y-6 lg:col-span-5">
        <aside className="rounded-xl border border-border bg-card p-6 shadow-xs lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold border-b border-border pb-3">
            Order Summary ({view.cart.itemCount} items)
          </h2>

          {/* Items Preview */}
          <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-border pr-1">
            {view.cart.items.map((line) => (
              <div key={line.id} className="flex gap-3 py-3 text-xs">
                <div className="relative size-12 shrink-0 overflow-hidden rounded bg-secondary">
                  {line.image?.url ? (
                    <Image
                      src={line.image.url}
                      alt={line.image.alt}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <Package className="size-5 m-auto text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground line-clamp-1">{line.productName}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {line.variantName} · Qty: {line.quantity}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    HSN: {line.hsnCode} · GST: {line.gstRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{money.format(line.lineTotal)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Input */}
          <div className="mt-4 border-t border-border pt-4">
            <CouponForm activeCoupon={view.coupon} />
          </div>

          {/* Price Breakdown */}
          <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs">
            <div className="flex justify-between gap-3 text-muted-foreground">
              <dt>Goods Subtotal</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {money.format(view.totals.subtotal)}
              </dd>
            </div>

            {view.totals.discountTotal > 0 ? (
              <div className="flex justify-between gap-3 text-success">
                <dt className="flex items-center gap-1">
                  <Tag className="size-3" aria-hidden="true" />
                  <span>Coupon Discount</span>
                </dt>
                <dd className="font-semibold tabular-nums">
                  −{money.format(view.totals.discountTotal)}
                </dd>
              </div>
            ) : null}

            <div className="flex justify-between gap-3 text-muted-foreground">
              <dt>Delivery Charges</dt>
              <dd className="font-medium text-foreground tabular-nums">
                {view.totals.shippingTotal === 0 ? (
                  <span className="text-success font-semibold">FREE</span>
                ) : (
                  money.format(view.totals.shippingTotal)
                )}
              </dd>
            </div>

            {view.totals.codFee > 0 ? (
              <div className="flex justify-between gap-3 text-muted-foreground">
                <dt>Cash on Delivery Convenience Fee</dt>
                <dd className="font-medium text-foreground tabular-nums">
                  {money.format(view.totals.codFee)}
                </dd>
              </div>
            ) : null}

            <div className="flex justify-between gap-3 text-muted-foreground">
              <dt>Estimated GST (included)</dt>
              <dd className="tabular-nums">{money.format(view.totals.taxTotal)}</dd>
            </div>

            <div className="flex justify-between gap-3 border-t border-border pt-3 text-base font-bold text-foreground">
              <dt>Total Amount</dt>
              <dd className="tabular-nums text-accent">
                {money.format(view.totals.grandTotal)}
              </dd>
            </div>
          </dl>

          {/* Error Banner */}
          {errorMessage ? (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Statutory Terms Consent */}
          <div className="mt-5 border-t border-border pt-4">
            <label className="flex items-start gap-2.5 text-[11px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="size-4 rounded border-border text-accent focus:ring-accent mt-0.5 shrink-0"
              />
              <span>
                I agree to the{' '}
                <Link href="/legal/terms" target="_blank" className="text-accent underline">
                  Terms of Service
                </Link>
                ,{' '}
                <Link href="/legal/cancellation" target="_blank" className="text-accent underline">
                  Cancellation Policy
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy" target="_blank" className="text-accent underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Place Order CTA */}
          <Button
            type="submit"
            size="lg"
            disabled={isPending || (view.quote !== null && !view.quote.serviceable)}
            className="mt-5 w-full font-semibold"
          >
            {isPending ? (
              'Processing your order…'
            ) : effectivePaymentMethod === 'RAZORPAY' ? (
              <>
                <Lock className="size-4 mr-2" aria-hidden="true" />
                Pay {money.format(view.totals.grandTotal)}
              </>
            ) : (
              `Place COD Order (${money.format(view.totals.grandTotal)})`
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
              256-bit Secure Checkout
            </span>
            <span>·</span>
            <span>GST Invoice Included</span>
          </div>
        </aside>
      </div>
    </form>
  )
}
