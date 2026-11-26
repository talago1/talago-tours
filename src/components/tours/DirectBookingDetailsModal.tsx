'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Mail,
  Building,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import CountryCodeSelector from '@/components/checkout/CountryCodeSelector';
import { clearBookingDraft } from '@/utils/bookingDraftStorage';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PaymentScheme } from '@/types/checkout';
import { supabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface DirectBookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: {
    id: string;
    slug: string;
    title: string;
    coverImage?: string | null;
    adultPrice: number;
    childPrice?: number | null;
    infantPrice?: number | null;
    depositPercentage?: number | null;
    allowPayAtLocation?: boolean;
    allowFullOnline?: boolean;
    allowDeposit?: boolean;
    pickupType?: string | null;
    hotelPickupIncluded?: boolean;
    meetingPointName?: string | null;
    bookingQuestions?: Array<{
      id: string;
      question: string;
      type?: 'text' | 'select' | 'radio' | 'textarea' | 'checkbox';
      options?: string[];
      required?: boolean;
      placeholder?: string;
      helpText?: string;
    }>;
    addons?: Array<{
      id: string;
      price: number;
      priceType?: string;
      labels?: Record<string, string>;
      title?: string;
      name?: string;
    }>;
  };
  departureDate: string;
  selectedTime: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  selectedAddons: Record<string, boolean>;
  initialResumeData?: {
    leadId: string;
    attemptId: string;
    leadName?: string;
    email?: string;
    phone?: string;
  } | null;
}

export default function DirectBookingDetailsModal({
  isOpen,
  onClose,
  tour,
  departureDate,
  selectedTime,
  adultsCount,
  childrenCount,
  infantsCount,
  selectedAddons,
  initialResumeData = null,
}: DirectBookingDetailsModalProps) {
  const { dict, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user: authUser, isAuthenticated, sessionToken: centralSessionToken } = useAuth();

  // Customer details state
  const [leadName, setLeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [hotelName, setHotelName] = useState('');
  const [bookingAnswers, setBookingAnswers] = useState<Record<string, any>>({});

  // Online payment step is shown ONLY when online payment is enabled AND required
  const requiresOnlinePayment =
    !tour.allowPayAtLocation &&
    (tour.allowFullOnline !== false || Boolean(tour.allowDeposit));

  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>(() => {
    if (tour.allowPayAtLocation) return PaymentScheme.PAY_ON_ARRIVAL;
    if (tour.allowFullOnline !== false) return PaymentScheme.FULL_ONLINE;
    if (tour.allowDeposit) return PaymentScheme.DEPOSIT_ONLINE;
    return PaymentScheme.PAY_ON_ARRIVAL;
  });

  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingReference: string;
    accessToken: string;
    confirmationUrl: string;
    amountPaidOnline: number;
    amountDueOnArrival: number;
    scheme: string;
  } | null>(null);

  // Continuous booking identity (single attemptId + single preliminaryLeadId)
  const idempotencyKeyRef = useRef<string>('');
  const [preliminaryLeadId, setPreliminaryLeadId] = useState<string | null>(null);
  const preliminaryLeadSyncRef = useRef<Promise<string | null> | null>(null);
  const submittingRef = useRef(false);

  const ensureIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        'tlg_att_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    }
    return idempotencyKeyRef.current;
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setShowPaymentStep(false);
    if (initialResumeData?.attemptId) {
      idempotencyKeyRef.current = initialResumeData.attemptId;
      setPreliminaryLeadId(initialResumeData.leadId);
      if (initialResumeData.leadName) setLeadName(initialResumeData.leadName);
      if (initialResumeData.email) setEmail(initialResumeData.email);
      if (initialResumeData.phone) setPhone(initialResumeData.phone);
    } else {
      ensureIdempotencyKey();
    }
    if (tour.allowPayAtLocation) {
      setPaymentScheme(PaymentScheme.PAY_ON_ARRIVAL);
    } else if (tour.allowFullOnline !== false) {
      setPaymentScheme(PaymentScheme.FULL_ONLINE);
    } else if (tour.allowDeposit) {
      setPaymentScheme(PaymentScheme.DEPOSIT_ONLINE);
    }
  }, [isOpen, initialResumeData, tour.allowPayAtLocation, tour.allowFullOnline, tour.allowDeposit]);

  // Prefill for authenticated customers
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const verifiedName =
        authUser.name && authUser.name !== 'User'
          ? authUser.name
          : authUser.telegramUsername
          ? `@${authUser.telegramUsername}`
          : authUser.name || '';
      const verifiedPhone = authUser.phone || authUser.telegramPhone || '';
      const verifiedEmail =
        authUser.email && !authUser.email.endsWith('@noreply.talago.com')
          ? authUser.email
          : '';
      if (verifiedName) setLeadName((prev) => (prev.trim() ? prev : verifiedName));
      if (verifiedPhone) setPhone((prev) => (prev.trim() ? prev : verifiedPhone));
      if (verifiedEmail) setEmail((prev) => (prev.trim() ? prev : verifiedEmail));
    }
  }, [isAuthenticated, authUser, isOpen]);

  // Pickup configuration
  const rawPickupType = (tour.pickupType || 'hotel').toLowerCase();
  const isNoPickup = rawPickupType === 'none' || rawPickupType === 'no_pickup';
  const isMeetingPointExplicit = rawPickupType === 'meeting_point';
  const isHotelPickupSupported =
    !isNoPickup &&
    !isMeetingPointExplicit &&
    (tour.hotelPickupIncluded === true || rawPickupType === 'both' || rawPickupType === 'hotel');
  const pickupType: 'HOTEL' | 'MEETING_POINT' = isHotelPickupSupported ? 'HOTEL' : 'MEETING_POINT';

  // Only show genuinely required tour-specific bookingQuestions not already collected above
  const requiredQuestions = useMemo(() => {
    return (tour.bookingQuestions || []).filter((q) => {
      if (!q.required) return false;
      const qId = String(q.id || '').toLowerCase();
      const qText = String(q.question || '').toLowerCase();
      if (qId.includes('name') || qText.includes('full name')) return false;
      if (qId.includes('phone') || qText.includes('phone') || qText.includes('whatsapp')) return false;
      if (qId.includes('email') || qText.includes('email')) return false;
      if (qId.includes('room') || qText.includes('room')) return false;
      if (isHotelPickupSupported && (qId.includes('hotel') || qText.includes('hotel name'))) return false;
      return true;
    });
  }, [tour.bookingQuestions, isHotelPickupSupported]);

  // Preserved price calculation (read-only)
  const effectiveAdultPrice = tour.adultPrice || 0;
  const effectiveChildPrice = tour.childPrice != null ? tour.childPrice : effectiveAdultPrice;
  const effectiveInfantPrice = tour.infantPrice != null ? tour.infantPrice : 0;

  const addonsTotal = useMemo(() => {
    if (!tour.addons || tour.addons.length === 0) return 0;
    return tour.addons.reduce((sum, addon) => {
      if (!selectedAddons[addon.id]) return sum;
      return (
        sum +
        (addon.priceType === 'per_person'
          ? addon.price * (adultsCount + childrenCount)
          : addon.price)
      );
    }, 0);
  }, [tour.addons, selectedAddons, adultsCount, childrenCount]);

  const grandTotal =
    adultsCount * effectiveAdultPrice +
    childrenCount * effectiveChildPrice +
    infantsCount * effectiveInfantPrice +
    addonsTotal;

  const depositPct = tour.depositPercentage || 20;
  const { amountPaidOnline, amountDueOnArrival } = useMemo(() => {
    if (paymentScheme === PaymentScheme.FULL_ONLINE) {
      return { amountPaidOnline: grandTotal, amountDueOnArrival: 0 };
    }
    if (paymentScheme === PaymentScheme.DEPOSIT_ONLINE) {
      const dep = Math.round(grandTotal * (depositPct / 100) * 100) / 100;
      return {
        amountPaidOnline: dep,
        amountDueOnArrival: Math.round((grandTotal - dep) * 100) / 100,
      };
    }
    return { amountPaidOnline: 0, amountDueOnArrival: grandTotal };
  }, [paymentScheme, grandTotal, depositPct]);

  const ensurePreliminaryLead = async (): Promise<string | null> => {
    if (preliminaryLeadId) return preliminaryLeadId;
    if (preliminaryLeadSyncRef.current) return preliminaryLeadSyncRef.current;
    const promise = (async (): Promise<string | null> => {
      try {
        const res = await fetch('/api/public/booking-interest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(centralSessionToken ? { Authorization: `Bearer ${centralSessionToken}` } : {}),
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            tourId: tour.id,
            tourSlug: tour.slug,
            attemptId: ensureIdempotencyKey(),
            travelDate: departureDate || undefined,
            adults: adultsCount,
            children: childrenCount,
            totalEstimatedPrice: grandTotal,
            currency: 'USD',
            source: 'BOOKING_FORM_CONTACT',
            customerName: leadName.trim(),
            customerPhone: phone.trim(),
            customerEmail: email.trim() || undefined,
          }),
        });
        if (!res.ok) return null;
        const resData = await res.json();
        if (resData?.leadId) {
          setPreliminaryLeadId(resData.leadId);
          return resData.leadId as string;
        }
        return null;
      } catch {
        return null;
      } finally {
        preliminaryLeadSyncRef.current = null;
      }
    })();
    preliminaryLeadSyncRef.current = promise;
    return promise;
  };

  const validateDetails = (): boolean => {
    const errs: Record<string, string> = {};
    if (!departureDate) {
      errs.submit = 'Please select a date in the booking section first.';
    }
    if (!leadName.trim()) {
      errs.leadName = 'Full name is required';
    }
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      errs.phone = 'Valid phone number is required';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (isHotelPickupSupported && !hotelName.trim()) {
      errs.hotelName = 'Hotel or pickup location is required';
    }
    for (const q of requiredQuestions) {
      const val = bookingAnswers[q.id];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        errs[`question_${q.id}`] = 'This field is required';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitBooking = async () => {
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors({});

    const idempotencyKey = ensureIdempotencyKey();
    const confirmedLeadId = await ensurePreliminaryLead();

    try {
      const payload = {
        tourId: tour.id,
        reservationId: confirmedLeadId ?? preliminaryLeadId ?? undefined,
        attemptId: idempotencyKey,
        idempotencyKey,
        departureDate,
        guestCount: adultsCount + childrenCount + infantsCount,
        adultsCount,
        childrenCount,
        infantsCount,
        formData: {
          leadName: leadName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          pickupType,
          hotelName:
            hotelName.trim() ||
            (pickupType === 'MEETING_POINT' ? tour.meetingPointName || 'Meeting Point' : undefined),
          selectedPickupTime: selectedTime || undefined,
          paymentScheme,
          currency: 'USD',
          whatsappOptIn,
          bookingAnswers: Object.keys(bookingAnswers).length > 0 ? bookingAnswers : undefined,
          selectedAddons: Object.keys(selectedAddons)
            .filter((k) => selectedAddons[k])
            .map((id) => {
              const item = tour.addons?.find((a) => a.id === id);
              return {
                id,
                price: item?.price || 0,
                priceType: item?.priceType || 'flat',
                quantity: item?.priceType === 'per_person' ? adultsCount + childrenCount : 1,
              };
            }),
        },
      };

      let authToken: string | null = centralSessionToken || null;
      if (!authToken) {
        try {
          const {
            data: { session },
          } = await supabaseClient.auth.getSession();
          authToken = session?.access_token || null;
        } catch {}
      }

      const initHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      };
      if (authToken) {
        initHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: initHeaders,
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ submit: data.error || 'Failed to complete booking. Please try again.' });
        return;
      }

      if (data.gatewayIframeUrl) {
        window.location.href = data.gatewayIframeUrl;
        return;
      }

      clearBookingDraft(tour.id);
      idempotencyKeyRef.current = '';
      setConfirmedBooking({
        bookingReference:
          data.bookingReference || `TLG-${data.bookingId?.slice(-6).toUpperCase()}`,
        accessToken: data.accessToken,
        confirmationUrl: data.confirmationUrl || `/booking/${data.accessToken}`,
        amountPaidOnline: data.amountPaidOnline ?? amountPaidOnline,
        amountDueOnArrival: data.amountDueOnArrival ?? amountDueOnArrival,
        scheme: data.scheme || paymentScheme,
      });
    } catch {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;
    if (requiresOnlinePayment && !showPaymentStep) {
      void ensurePreliminaryLead();
      setShowPaymentStep(true);
      return;
    }
    await submitBooking();
  };

  if (!isOpen) return null;

  const selectedAddonNames = (tour.addons || [])
    .filter((a) => selectedAddons[a.id])
    .map((a) => a.labels?.[language] || a.labels?.en || a.title || a.name || 'Add-on');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-booking-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#070F1E]/85 p-3 backdrop-blur-md overflow-y-auto sm:p-5"
    >
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/70">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2
                id="direct-booking-modal-title"
                className="truncate text-sm font-black text-white sm:text-base"
              >
                {confirmedBooking
                  ? (dict as any).booking?.reservationConfirmed || 'Reservation Confirmed'
                  : showPaymentStep
                  ? 'Complete Online Payment'
                  : 'Your Details'}
              </h2>
              <p className="truncate text-[11px] text-slate-400">{tour.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {confirmedBooking ? (
            /* Confirmation View */
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Booking Reference
                </p>
                <p
                  data-testid="confirmed-booking-reference"
                  className="mt-1 text-2xl font-black tracking-wider text-white"
                >
                  {confirmedBooking.bookingReference}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs text-slate-300 space-y-1.5">
                <p>
                  <span className="text-slate-500">Date:</span>{' '}
                  <strong className="text-white">{departureDate}</strong>
                  {selectedTime ? ` · ${selectedTime}` : ''}
                </p>
                <p>
                  <span className="text-slate-500">Guests:</span>{' '}
                  <strong className="text-white">
                    {adultsCount} Adult{adultsCount !== 1 ? 's' : ''}
                    {childrenCount > 0 ? `, ${childrenCount} Child${childrenCount !== 1 ? 'ren' : ''}` : ''}
                    {infantsCount > 0 ? `, ${infantsCount} Infant${infantsCount !== 1 ? 's' : ''}` : ''}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Total:</span>{' '}
                  <strong className="text-[#00E5FF]">{formatPrice(grandTotal, { round: true })}</strong>
                </p>
              </div>
              {!isAuthenticated && email.trim() && !email.trim().endsWith('@noreply.talago.com') && (
                <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4 text-left text-xs text-slate-300">
                  <p className="font-bold text-[#00E5FF]">Your Talago account is ready</p>
                  <p className="mt-1 text-slate-400">
                    We linked this booking to <strong className="text-white">{email.trim()}</strong>. You can sign in anytime to track your booking and chat with your guide.
                  </p>
                </div>
              )}
              <a
                href={confirmedBooking.confirmationUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#070F1E]"
              >
                View Booking Details <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <>
              {/* Preserved Selection Summary (Read-only, never repeated as inputs) */}
              <div
                data-testid="preserved-booking-summary"
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5 font-bold text-white">
                      <Calendar className="h-3.5 w-3.5 text-[#00E5FF]" />
                      {departureDate}
                    </span>
                    {selectedTime && (
                      <span className="inline-flex items-center gap-1 font-semibold text-cyan-200">
                        <Clock className="h-3.5 w-3.5 text-[#00E5FF]" />
                        {selectedTime}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-[#00E5FF]" />
                      {adultsCount}A{childrenCount > 0 ? ` · ${childrenCount}C` : ''}{infantsCount > 0 ? ` · ${infantsCount}I` : ''}
                    </span>
                  </div>
                  <span className="text-base font-black text-[#00E5FF]">
                    {formatPrice(grandTotal, { round: true })}
                  </span>
                </div>
                {selectedAddonNames.length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Add-ons: {selectedAddonNames.join(', ')}
                  </p>
                )}
              </div>

              {showPaymentStep ? (
                /* Step 3 — Online Payment (ONLY when required by tour configuration) */
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Select how you would like to complete your online payment:
                  </p>
                  <div className="space-y-2.5">
                    {tour.allowFullOnline !== false && (
                      <button
                        type="button"
                        onClick={() => setPaymentScheme(PaymentScheme.FULL_ONLINE)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                          paymentScheme === PaymentScheme.FULL_ONLINE
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                            : 'border-white/10 bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-[#00E5FF]" />
                          <div>
                            <p className="text-sm font-bold text-white">Pay Full Amount Online</p>
                            <p className="text-xs text-slate-400">Instant online checkout</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-white">
                          {formatPrice(grandTotal, { round: true })}
                        </span>
                      </button>
                    )}
                    {tour.allowDeposit && (
                      <button
                        type="button"
                        onClick={() => setPaymentScheme(PaymentScheme.DEPOSIT_ONLINE)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                          paymentScheme === PaymentScheme.DEPOSIT_ONLINE
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                            : 'border-white/10 bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-[#FFD700]" />
                          <div>
                            <p className="text-sm font-bold text-white">
                              Pay {depositPct}% Deposit Online
                            </p>
                            <p className="text-xs text-slate-400">
                              Remaining balance paid on arrival
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-white">
                          {formatPrice(Math.round(grandTotal * (depositPct / 100) * 100) / 100, {
                            round: true,
                          })}
                        </span>
                      </button>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errors.submit}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPaymentStep(false)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-xs font-bold text-slate-300"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitBooking()}
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#070F1E] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Proceed to Payment <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2 — One Simple Customer Details Form */
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Account status banner */}
                  {isAuthenticated && authUser ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>
                        Signed in as <strong>{authUser.name || authUser.email}</strong> — details prefilled.
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-3.5 py-2.5 text-xs text-slate-300">
                      No separate signup needed — your booking &amp; account are created together.
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <User className="h-3.5 w-3.5 text-[#00E5FF]" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="e.g. Maria Gonzalez"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                    />
                    {errors.leadName && (
                      <p className="mt-1 text-xs text-rose-400">{errors.leadName}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-200">
                      Phone Number (with Country Code) *
                    </label>
                    <CountryCodeSelector
                      value={phone}
                      onChange={setPhone}
                      error={errors.phone}
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <Mail className="h-3.5 w-3.5 text-[#00E5FF]" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="maria@example.com"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Hotel / Pickup Location (only when tour includes hotel pickup) */}
                  {isHotelPickupSupported && (
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Building className="h-3.5 w-3.5 text-[#00E5FF]" />
                        Hotel / Pickup Location *
                      </label>
                      <input
                        type="text"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        placeholder="e.g. Hilton Hurghada Plaza"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                      />
                      {errors.hotelName && (
                        <p className="mt-1 text-xs text-rose-400">{errors.hotelName}</p>
                      )}
                    </div>
                  )}

                  {/* Genuinely required tour-specific bookingQuestions */}
                  {requiredQuestions.map((q) => {
                    const val = bookingAnswers[q.id] ?? '';
                    return (
                      <div key={q.id}>
                        <label className="mb-1.5 block text-xs font-bold text-slate-200">
                          {q.question} *
                        </label>
                        {q.type === 'select' && Array.isArray(q.options) ? (
                          <select
                            value={val}
                            onChange={(e) =>
                              setBookingAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#0B1528] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
                          >
                            <option value="">Select an option…</option>
                            {q.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setBookingAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder={q.placeholder || ''}
                            className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                          />
                        )}
                        {errors[`question_${q.id}`] && (
                          <p className="mt-1 text-xs text-rose-400">
                            {errors[`question_${q.id}`]}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* WhatsApp Opt-in */}
                  <label className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappOptIn}
                      onChange={(e) => setWhatsappOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#00E5FF]"
                    />
                    <span>Send boarding pass &amp; pickup updates via WhatsApp</span>
                  </label>

                  {errors.submit && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errors.submit}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-4 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/25 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : requiresOnlinePayment ? (
                      <>
                        Continue to Payment <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Complete Booking <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    {dict.tourDetails.secureBooking}
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
