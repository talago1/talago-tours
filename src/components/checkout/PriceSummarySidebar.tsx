'use client';

import { useState, useMemo } from 'react';
import { PaymentScheme } from '@/types/checkout';
import { computePriceBreakdown } from '@/utils/priceCalculator';
import type { PromoDiscount } from '@/utils/promo';
import { Ticket, Percent, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';

interface PriceSummarySidebarProps {
  tourTitle: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  depositPercentage: number;
  zoneTransferFee: number;
  addonsTotal?: number;
  scheme: PaymentScheme;
  onSchemeChange: (s: PaymentScheme) => void;
  promoDiscount: PromoDiscount | null;
  onPromoApplied: (d: PromoDiscount | null) => void;
  allowDeposit: boolean;
  allowPayAtLocation: boolean;
  allowFullOnline?: boolean;
}

export default function PriceSummarySidebar({
  tourTitle,
  adultsCount,
  childrenCount,
  infantsCount,
  adultPrice,
  childPrice,
  infantPrice,
  depositPercentage,
  zoneTransferFee,
  addonsTotal = 0,
  scheme,
  onSchemeChange,
  promoDiscount,
  onPromoApplied,
  allowDeposit,
  allowPayAtLocation,
  allowFullOnline = true,
}: PriceSummarySidebarProps) {
  const { dict } = useLanguage();
  const { formatPrice } = useCurrency();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Single-source pricing calculation (shared with server via computePriceBreakdown)
  const pricing = useMemo(() => computePriceBreakdown({
    adultsCount,
    childrenCount,
    infantsCount,
    adultPrice,
    childPrice,
    infantPrice,
    zoneTransferFee,
    addonsTotal,
    depositPercentage,
    scheme,
    promo: promoDiscount
      ? { type: promoDiscount.type, value: promoDiscount.value, minBookingValue: promoDiscount.minBookingValue }
      : null,
  }), [adultsCount, childrenCount, infantsCount, adultPrice, childPrice, infantPrice,
      zoneTransferFee, addonsTotal, depositPercentage, scheme, promoDiscount]);

  const { baseSubtotal, discountAmount, grandTotal, amountPaidOnline, amountDueOnArrival } = pricing;

  // Per-tier totals for display
  const adultTotal = adultPrice * adultsCount;
  const childTotal = childPrice * childrenCount;
  const infantTotal = infantPrice * infantsCount;

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsApplying(true);
    setPromoError(null);

    try {
      const res = await fetch('/api/public/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          bookingValue: baseSubtotal,
          currency: 'USD',
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setPromoError(payload.error || dict.checkout.promoInvalid);
        onPromoApplied(null);
        return;
      }

      onPromoApplied(payload as PromoDiscount);
    } catch {
      setPromoError(dict.checkout.promoNetworkError);
      onPromoApplied(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromo = () => {
    onPromoApplied(null);
    setPromoCodeInput('');
    setPromoError(null);
  };

  return (
    <aside className="sticky top-8 space-y-6">
      {/* Price Breakdown Card */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md lg:p-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#EAB308] mb-2">{dict.checkout.priceDetails}</h3>
        <h2 className="text-xl font-black text-white mb-6 truncate" title={tourTitle}>{tourTitle}</h2>

        {/* Guest Breakdowns */}
        <div className="space-y-3.5 border-b border-white/10 pb-6 text-sm text-slate-300">
          <div className="flex justify-between items-center">
            <span>{adultsCount} {dict.checkout.adults}</span>
            <span className="font-semibold text-white">{formatPrice(adultTotal)}</span>
          </div>

          {childrenCount > 0 && (
            <div className="flex justify-between items-center">
              <span>{childrenCount} {dict.checkout.children}</span>
              <span className="font-semibold text-white">{formatPrice(childTotal)}</span>
            </div>
          )}

          {infantsCount > 0 && (
            <div className="flex justify-between items-center">
              <span>{infantsCount} {dict.checkout.infants}</span>
              <span className="font-semibold text-white">{formatPrice(infantTotal)}</span>
            </div>
          )}

          {zoneTransferFee > 0 && (
            <div className="flex justify-between items-center text-slate-400">
              <span>{dict.checkout.pickupFee}</span>
              <span className="font-semibold text-white">+{formatPrice(zoneTransferFee)}</span>
            </div>
          )}

          {addonsTotal > 0 && (
            <div className="flex justify-between items-center text-[#06B6D4]">
              <span>Upgrades & Extras</span>
              <span className="font-semibold text-[#06B6D4]">+{formatPrice(addonsTotal)}</span>
            </div>
          )}
        </div>

        {/* Promo Code Input */}
        <div className="py-6 border-b border-white/10 space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{dict.checkout.promoLabel}</label>
          {promoDiscount ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-bold">
                <Percent className="h-4 w-4" />
                <span>{promoDiscount.code} {dict.checkout.promoApplied}</span>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
              >
                {dict.checkout.promoRemove}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={dict.checkout.promoPlaceholder}
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-[#06B6D4]/40 rounded-xl py-3 pl-11 pr-3 text-sm font-medium text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={isApplying || !promoCodeInput.trim()}
                className="bg-[#FF5B00] hover:bg-[#FF5B00]/90 disabled:opacity-40 disabled:hover:bg-[#FF5B00] text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shrink-0"
              >
                {isApplying ? '...' : dict.checkout.promoApply}
              </button>
            </div>
          )}
          {promoError && <p className="text-xs text-red-400 font-medium">{promoError}</p>}
        </div>

        {/* Final Price Line */}
        <div className="py-6 space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-slate-300">{dict.checkout.grandTotal}</span>
            <div className="text-right">
              {discountAmount > 0 && (
                <p className="text-sm text-slate-500 line-through mb-0.5">{formatPrice(baseSubtotal + zoneTransferFee)}</p>
              )}
              <p className="text-3xl font-black text-white">{formatPrice(grandTotal)}</p>
            </div>
          </div>
        </div>

        {/* Payment Scheme Selection */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dict.checkout.paymentOptions}</h4>

          <div className="space-y-3">
            {/* Pay on Arrival */}
            {allowPayAtLocation && (
              <label
                className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300 hover:border-white/20 ${
                  scheme === PaymentScheme.PAY_ON_ARRIVAL
                    ? 'border-[#FF5B00] bg-[#FF5B00]/5 shadow-[0_0_12px_rgba(255,91,0,0.1)]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentScheme"
                  value={PaymentScheme.PAY_ON_ARRIVAL}
                  checked={scheme === PaymentScheme.PAY_ON_ARRIVAL}
                  onChange={() => onSchemeChange(PaymentScheme.PAY_ON_ARRIVAL)}
                  className="mt-1 h-4 w-4 border-slate-300 text-[#FF5B00] focus:ring-[#FF5B00]"
                />
                <div>
                  <p className="text-sm font-black text-white">{dict.checkout.payArrival}</p>
                  <p className="mt-1 text-xs text-slate-400">{dict.checkout.payArrivalDesc}</p>
                </div>
              </label>
            )}

            {/* Full Online */}
            {allowFullOnline !== false && (
              <label
                className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300 hover:border-white/20 ${
                  scheme === PaymentScheme.FULL_ONLINE
                    ? 'border-[#06B6D4] bg-[#06B6D4]/5 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentScheme"
                  value={PaymentScheme.FULL_ONLINE}
                  checked={scheme === PaymentScheme.FULL_ONLINE}
                  onChange={() => onSchemeChange(PaymentScheme.FULL_ONLINE)}
                  className="mt-1 h-4 w-4 border-slate-300 text-[#06B6D4] focus:ring-[#06B6D4]"
                />
                <div>
                  <p className="text-sm font-black text-white">{dict.checkout.payOnline}</p>
                  <p className="mt-1 text-xs text-slate-400">{dict.checkout.payOnlineDesc}</p>
                </div>
              </label>
            )}

            {/* Deposit Online */}
            {allowDeposit && depositPercentage > 0 && (
              <label
                className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300 hover:border-white/20 ${
                  scheme === PaymentScheme.DEPOSIT_ONLINE
                    ? 'border-[#EAB308] bg-[#EAB308]/5 shadow-[0_0_12px_rgba(234,179,8,0.1)]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentScheme"
                  value={PaymentScheme.DEPOSIT_ONLINE}
                  checked={scheme === PaymentScheme.DEPOSIT_ONLINE}
                  onChange={() => onSchemeChange(PaymentScheme.DEPOSIT_ONLINE)}
                  className="mt-1 h-4 w-4 border-slate-300 text-[#EAB308] focus:ring-[#EAB308]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-white">{dict.checkout.secureDeposit.replace('20%', `${depositPercentage}%`)}</p>
                    <span className="flex items-center justify-center gap-0.5 rounded-full bg-[#EAB308]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#EAB308]">
                      <Sparkles className="h-2.5 w-2.5" />
                      {dict.checkout.popular}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{dict.checkout.secureDepositDesc}</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Pricing Split Breakdown display */}
        <div className="mt-6 border-t border-white/10 pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400 font-medium">{dict.checkout.dueOnline}</span>
            <span className="text-lg font-black text-white">{formatPrice(amountPaidOnline)}</span>
          </div>

          {amountDueOnArrival > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">{dict.checkout.balanceArrival}</span>
              <span className="text-xl font-bold text-[#FF5B00] bg-[#FF5B00]/10 px-2.5 py-1 rounded-xl">
                {formatPrice(amountDueOnArrival)}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
