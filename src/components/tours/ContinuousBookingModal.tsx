'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Check,
  Plane,
} from 'lucide-react';
import CountryCodeSelector from '@/components/checkout/CountryCodeSelector';
import { saveBookingDraft, loadBookingDraft, clearBookingDraft } from '@/utils/bookingDraftStorage';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { PaymentScheme } from '@/types/checkout';
import { supabaseClient } from '@/lib/supabase/client';
import type { ZoneOption } from '@/types/booking';

export interface ContinuousBookingModalProps {
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
    meetingPointAddress?: string | null;
    meetingPointLandmark?: string | null;
    meetingPointInstructions?: string | null;
    cutoffHours?: number | null;
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
  initialDate?: string;
  initialTime?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
  initialAddons?: Record<string, boolean>;
  availablePickupTimes?: string[];
  zones?: ZoneOption[];
}

export default function ContinuousBookingModal({
  isOpen,
  onClose,
  tour,
  initialDate = '',
  initialTime = '',
  initialAdults = 1,
  initialChildren = 0,
  initialInfants = 0,
  initialAddons = {},
  availablePickupTimes = [],
  zones = [],
}: ContinuousBookingModalProps) {
  const { dict, language } = useLanguage();
  const { formatPrice } = useCurrency();

  // State preserved across steps
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [departureDate, setDepartureDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [adultsCount, setAdultsCount] = useState(initialAdults);
  const [childrenCount, setChildrenCount] = useState(initialChildren);
  const [infantsCount, setInfantsCount] = useState(initialInfants);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>(initialAddons);

  // Traveler info
  const [leadName, setLeadName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // Pickup info
  const isHotelPickupSupported = tour.hotelPickupIncluded !== false && tour.pickupType !== 'meeting_point' && tour.pickupType !== 'none';
  const isMeetingPointOnly = tour.pickupType === 'meeting_point' || (tour.pickupType !== 'hotel' && !tour.hotelPickupIncluded);
  const isNoPickup = tour.pickupType === 'none';
  const [pickupType, setPickupType] = useState<'HOTEL' | 'MEETING_POINT' | 'AIRPORT'>(
    isHotelPickupSupported ? 'HOTEL' : 'MEETING_POINT'
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [hotelName, setHotelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Single Authoritative Payment Scheme
  const [paymentScheme, setPaymentScheme] = useState<PaymentScheme>(PaymentScheme.PAY_ON_ARRIVAL);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Submission & UI status
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
  const [preliminaryLeadId, setPreliminaryLeadId] = useState<string | null>(null);
  const [preliminaryReference, setPreliminaryReference] = useState<string | null>(null);
  const [bookingAnswers, setBookingAnswers] = useState<Record<string, any>>({});

  // Live availability — spots remaining for the selected date
  const [availableSpots, setAvailableSpots] = useState<number | null>(null);

  useEffect(() => {
    if (!departureDate || !tour.id) { setAvailableSpots(null); return; }
    const month = departureDate.slice(0, 7); // YYYY-MM
    fetch(`/api/public/tours/${tour.id}/availability?month=${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data[departureDate]) {
          const day = data[departureDate] as { status: string; remaining: number };
          setAvailableSpots(day.remaining ?? null);
        } else {
          setAvailableSpots(null);
        }
      })
      .catch(() => setAvailableSpots(null));
  }, [departureDate, tour.id]);

  const trackFunnelEvent = useCallback((event: string, meta: Record<string, any> = {}) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('talago_funnel_event', {
            detail: { event, tourId: tour.id, tourSlug: tour.slug, timestamp: Date.now(), ...meta },
          })
        );
      }
    } catch {}
  }, [tour.id, tour.slug]);

  // Sync initial values only when modal first opens
  const prevIsOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      trackFunnelEvent('modal_opened');
      const draft = loadBookingDraft(tour.id);
      if (draft) {
        if (draft.departureDate) setDepartureDate(draft.departureDate);
        else if (initialDate) setDepartureDate(initialDate);
        if (draft.selectedTime) setSelectedTime(draft.selectedTime);
        else if (initialTime) setSelectedTime(initialTime);
        if (draft.adultsCount) setAdultsCount(draft.adultsCount);
        else if (initialAdults) setAdultsCount(initialAdults);
        if (typeof draft.childrenCount === 'number') setChildrenCount(draft.childrenCount);
        else setChildrenCount(initialChildren);
        if (typeof draft.infantsCount === 'number') setInfantsCount(draft.infantsCount);
        else setInfantsCount(initialInfants);
        if (draft.selectedAddons) setSelectedAddons(draft.selectedAddons);
        else setSelectedAddons(initialAddons || {});
        // Apply draft contact fields; authenticated user details below will override if logged in
        if (draft.leadName) setLeadName(draft.leadName);
        if (draft.phone) setPhone(draft.phone);
        if (draft.email) setEmail(draft.email);
        if (draft.pickupType && ['HOTEL', 'MEETING_POINT', 'AIRPORT'].includes(draft.pickupType)) setPickupType(draft.pickupType as any);
        if (draft.hotelName) setHotelName(draft.hotelName);
        if (draft.roomNumber) setRoomNumber(draft.roomNumber);
        if (draft.specialRequirements) setSpecialRequirements(draft.specialRequirements);
        if (draft.selectedZoneId) setSelectedZoneId(draft.selectedZoneId);
      } else {
        if (initialDate) setDepartureDate(initialDate);
        if (initialTime) setSelectedTime(initialTime);
        if (initialAdults) setAdultsCount(initialAdults);
        setChildrenCount(initialChildren);
        setInfantsCount(initialInfants);
        setSelectedAddons(initialAddons || {});
      }
      // Auto-select zone if only 1 zone exists
      if (zones.length === 1 && zones[0]?.id) {
        setSelectedZoneId(zones[0].id);
      }
      // Set default payment scheme based on tour rules
      if (tour.allowPayAtLocation) {
        setPaymentScheme(PaymentScheme.PAY_ON_ARRIVAL);
      } else if (tour.allowFullOnline !== false) {
        setPaymentScheme(PaymentScheme.FULL_ONLINE);
      } else if (tour.allowDeposit) {
        setPaymentScheme(PaymentScheme.DEPOSIT_ONLINE);
      }

      // Authoritative authenticated customer recognition & preliminary hold request
      (async () => {
        let bearerToken: string | null = null;
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session?.access_token) {
            bearerToken = session.access_token;
            setSessionToken(session.access_token);
          }
        } catch {}

        const headers: Record<string, string> = {};
        if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;

        let currentU: any = null;
        let tokenToUse: string | null = bearerToken;

        try {
          const authRes = await fetch('/api/auth/session', { headers, credentials: 'same-origin', cache: 'no-store' });
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData?.authenticated && authData.user) {
              setIsAuthenticated(true);
              setCurrentUser(authData.user);
              currentU = authData.user;
              if (authData.accessToken) {
                tokenToUse = authData.accessToken;
                setSessionToken(authData.accessToken);
                if (authData.refreshToken) {
                  supabaseClient.auth.setSession({
                    access_token: authData.accessToken,
                    refresh_token: authData.refreshToken,
                  }).catch(() => {});
                }
              }
              const verifiedName = (currentU.name && currentU.name !== 'User' && !currentU.name.startsWith('Traveler #'))
                ? currentU.name
                : (currentU.telegramUsername ? `@${currentU.telegramUsername}` : null);
              const verifiedPhone = currentU.phone || currentU.telegramPhone || null;
              const verifiedEmail = (currentU.email && !currentU.email.endsWith('@noreply.talago.com')) ? currentU.email : null;

              if (verifiedName) setLeadName(verifiedName);
              if (verifiedPhone) setPhone(verifiedPhone);
              if (verifiedEmail) setEmail(verifiedEmail);
            }
          }
        } catch {}

        // Immediately register visible preliminary booking request (Stage A: Spots held, no inventory deducted)
        try {
          const interestHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
          if (tokenToUse) interestHeaders['Authorization'] = `Bearer ${tokenToUse}`;

          const res = await fetch('/api/public/booking-interest', {
            method: 'POST',
            headers: interestHeaders,
            body: JSON.stringify({
              tourId: tour.id,
              tourSlug: tour.slug,
              travelDate: initialDate || undefined,
              adults: initialAdults || 1,
              children: initialChildren || 0,
              totalEstimatedPrice: effectiveAdultPrice * (initialAdults || 1),
              currency: 'USD',
              source: 'BOOKING_START',
              customerName: currentU ? ((currentU.name && currentU.name !== 'User') ? currentU.name : undefined) : (draft?.leadName || undefined),
              customerPhone: currentU ? (currentU.phone || currentU.telegramPhone || undefined) : (draft?.phone || undefined),
              customerEmail: currentU ? ((!currentU.email?.endsWith('@noreply.talago.com')) ? currentU.email : undefined) : (draft?.email || undefined),
            }),
          });
          if (res.ok) {
            const resData = await res.json();
            if (resData?.leadId) {
              setPreliminaryLeadId(resData.leadId);
              setPreliminaryReference(resData.reservationReference);
            }
          }
        } catch {}
      })();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialDate, initialTime, initialAdults, initialChildren, initialInfants, initialAddons, zones, tour.allowPayAtLocation, tour.allowFullOnline, tour.allowDeposit, tour.id, tour.slug, tour.adultPrice, trackFunnelEvent]);

  // Price calculations
  const effectiveAdultPrice = tour.adultPrice || 0;
  const effectiveChildPrice = tour.childPrice != null ? tour.childPrice : effectiveAdultPrice;
  const effectiveInfantPrice = tour.infantPrice != null ? tour.infantPrice : 0;

  const guestsSubtotal = useMemo(() => {
    return (
      adultsCount * effectiveAdultPrice +
      childrenCount * effectiveChildPrice +
      infantsCount * effectiveInfantPrice
    );
  }, [adultsCount, effectiveAdultPrice, childrenCount, effectiveChildPrice, infantsCount, effectiveInfantPrice]);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId);
  }, [zones, selectedZoneId]);

  const zoneFee = selectedZone?.transferFee || 0;

  const addonsTotal = useMemo(() => {
    if (!tour.addons || tour.addons.length === 0) return 0;
    return tour.addons.reduce((sum, addon) => {
      if (!selectedAddons[addon.id]) return sum;
      if (addon.priceType === 'per_person') {
        return sum + addon.price * (adultsCount + childrenCount);
      }
      return sum + addon.price;
    }, 0);
  }, [tour.addons, selectedAddons, adultsCount, childrenCount]);

  const grandTotal = guestsSubtotal + zoneFee + addonsTotal;
  const depositPct = tour.depositPercentage || 20;

  const { amountPaidOnline, amountDueOnArrival } = useMemo(() => {
    if (paymentScheme === PaymentScheme.FULL_ONLINE) {
      return { amountPaidOnline: grandTotal, amountDueOnArrival: 0 };
    }
    if (paymentScheme === PaymentScheme.DEPOSIT_ONLINE) {
      const dep = Math.round(grandTotal * (depositPct / 100) * 100) / 100;
      return { amountPaidOnline: dep, amountDueOnArrival: Math.round((grandTotal - dep) * 100) / 100 };
    }
    // Pay on Arrival
    return { amountPaidOnline: 0, amountDueOnArrival: grandTotal };
  }, [paymentScheme, grandTotal, depositPct]);

  // Step validation
  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!departureDate) errs.departureDate = 'Please select a tour date';
      if (adultsCount < 1) errs.guests = 'At least 1 adult traveler is required';
    }

    if (currentStep === 2) {
      if (!leadName.trim()) errs.leadName = 'Lead traveler name is required';
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      if (!cleanPhone || cleanPhone.length < 8) {
        errs.phone = 'Valid phone number is required';
      }
      if (Object.keys(errs).length === 0) {
        // Sync preliminary request with completed contact details
        fetch('/api/public/booking-interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId: tour.id,
            tourSlug: tour.slug,
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
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((resData) => {
            if (resData?.leadId) {
              setPreliminaryLeadId(resData.leadId);
              setPreliminaryReference(resData.reservationReference);
            }
          })
          .catch(() => {});
      }
    }

    if (currentStep === 3) {
      if (tour.bookingQuestions && tour.bookingQuestions.length > 0) {
        for (const q of tour.bookingQuestions) {
          if (q.required) {
            const val = bookingAnswers[q.id];
            if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
              errs[`question_${q.id}`] = 'This field is required';
            }
          }
        }
      } else if (isHotelPickupSupported && pickupType === 'HOTEL') {
        if (!hotelName.trim()) {
          errs.hotelName = 'Please enter your hotel or pickup address';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      saveBookingDraft(tour.id, {
        departureDate,
        selectedTime,
        adultsCount,
        childrenCount,
        infantsCount,
        selectedAddons,
        leadName,
        phone,
        email,
        pickupType,
        hotelName,
        roomNumber,
        specialRequirements,
        selectedZoneId,
      });
      trackFunnelEvent('step_completed', {
        step,
        departureDate,
        guestCount: adultsCount + childrenCount + infantsCount,
      });
      setStep((prev) => (Math.min(4, prev + 1) as 1 | 2 | 3 | 4));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => (Math.max(1, prev - 1) as 1 | 2 | 3 | 4));
  };

  // Submission to authoritative backend
  const handleSubmitBooking = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setIsSubmitting(true);
    setErrors({});
    trackFunnelEvent('submission_started', { paymentScheme, totalEstimatedPrice: grandTotal });

    try {
      const payload = {
        tourId: tour.id,
        reservationId: preliminaryLeadId || undefined,
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
          hotelName: hotelName.trim() || (pickupType === 'MEETING_POINT' ? tour.meetingPointName || 'Meeting Point' : undefined),
          roomNumber: roomNumber.trim() || undefined,
          specialRequirements: specialRequirements.trim() || undefined,
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

      let authToken: string | null = sessionToken;
      if (!authToken) {
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          authToken = session?.access_token || null;
        } catch {}
      }

      const initHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
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
        trackFunnelEvent('booking_failed', { error: data.error || 'Initialization failed' });
        setErrors({ submit: data.error || 'Failed to initialize booking. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      // If online payment returned a gateway URL, navigate to Paymob
      if (data.gatewayIframeUrl) {
        trackFunnelEvent('payment_gateway_redirect', { scheme: paymentScheme });
        window.location.href = data.gatewayIframeUrl;
        return;
      }

      // Confirmed reservation
      trackFunnelEvent('booking_confirmed', {
        reference: data.bookingReference || `TLG-${data.bookingId?.slice(-6).toUpperCase()}`,
        scheme: data.scheme || paymentScheme,
      });
      clearBookingDraft(tour.id);
      setConfirmedBooking({
        bookingReference: data.bookingReference || `TLG-${data.bookingId?.slice(-6).toUpperCase()}`,
        accessToken: data.accessToken,
        confirmationUrl: data.confirmationUrl || `/booking/${data.accessToken}`,
        amountPaidOnline: data.amountPaidOnline ?? amountPaidOnline,
        amountDueOnArrival: data.amountDueOnArrival ?? amountDueOnArrival,
        scheme: data.scheme || paymentScheme,
      });
    } catch {
      setErrors({ submit: 'Network connection issue. Please check your network and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-[#070F1E]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/60 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 id="booking-modal-title" className="text-sm sm:text-base font-black text-white line-clamp-1">
                {confirmedBooking ? ((dict as any).booking?.reservationConfirmed || 'Reservation Confirmed') : tour.title}
              </h2>
              <p className="text-[11px] text-slate-400">
                {confirmedBooking
                  ? ((dict as any).booking?.tripBooked || 'Your trip is booked! Keep your boarding pass handy.')
                  : ((dict as any).booking?.fastSecureBooking || 'Fast, secure direct booking — No account required')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 transition"
            aria-label="Close booking modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress indicator (only when booking in progress) */}
        {!confirmedBooking && (
          <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[
                { s: 1, label: (dict as any).booking?.stepTripGuests || 'Trip & Guests' },
                { s: 2, label: (dict as any).booking?.stepLeadTraveler || 'Lead Traveler' },
                { s: 3, label: (dict as any).booking?.stepPickup || 'Pickup Details' },
                { s: 4, label: (dict as any).booking?.stepPayment || 'Payment' },
              ].map((item, idx) => (
                <React.Fragment key={item.s}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
                        step === item.s
                          ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/30'
                          : step > item.s
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-500 border border-white/10'
                      }`}
                    >
                      {step > item.s ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : item.s}
                    </div>
                    <span className="hidden sm:block text-[10px] font-bold text-slate-400 mt-1">
                      {item.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full transition ${
                        step > item.s ? 'bg-emerald-500/40' : 'bg-white/10'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            {preliminaryReference && (
              <div className="mt-2.5 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Hold Ref: {preliminaryReference}
                </span>
                <span className="text-[10px] text-slate-400">Spot held during booking</span>
              </div>
            )}
          </div>
        )}

        {/* Main Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 lg:p-7">
          {/* Confirmed Screen */}
          {confirmedBooking ? (
            <div className="max-w-xl mx-auto py-6 text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-[#00E5FF] mb-2">
                  {(dict as any).booking?.reference || 'Reference'}: {confirmedBooking.bookingReference}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{(dict as any).booking?.bookingConfirmedTitle || 'Your Booking is Confirmed!'}</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
                  {confirmedBooking.scheme === PaymentScheme.PAY_ON_ARRIVAL
                    ? `${(dict as any).booking?.dueOnArrival || 'Total due on arrival'}: ${formatPrice(confirmedBooking.amountDueOnArrival)}. ${(dict as any).booking?.payInCash || 'You can pay in cash (USD, EUR, EGP) or card upon meetup.'}`
                    : `${(dict as any).booking?.amountPaidOnline || 'Amount paid online'}: ${formatPrice(confirmedBooking.amountPaidOnline)}.`}
                </p>
              </div>

              {/* Booking summary */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left space-y-2">
                <p className="text-xs font-black text-white">{tour.title}</p>
                {departureDate && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
                    <span>{departureDate}{selectedTime ? ` · ${selectedTime}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
                  <span>
                    {adultsCount} {(dict.tourDetails as any)?.adults || 'adults'}
                    {childrenCount > 0 ? `, ${childrenCount} ${(dict.tourDetails as any)?.children || 'children'}` : ''}
                    {infantsCount > 0 ? `, ${infantsCount} ${(dict.tourDetails as any)?.infants || 'infants'}` : ''}
                  </span>
                </div>
              </div>

              {whatsappOptIn && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300 flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{(dict as any).booking?.whatsappDispatch || 'Your e-boarding pass and WhatsApp confirmation are being dispatched.'}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={confirmedBooking.confirmationUrl}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{(dict as any).booking?.viewBoardingPass || 'View Boarding Pass'}</span>
                </a>
                <a
                  href={isAuthenticated ? '/account?tab=bookings' : '/my-bookings'}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  <span>{(dict as any).booking?.goToMyBookings || 'Go to My Bookings'}</span>
                </a>
              </div>
            </div>
          ) : (
            /* Booking Flow (Responsive Two-Column on lg, Stacked on Mobile) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Active Form Step */}
              <div className="lg:col-span-7 space-y-6">
                {/* STEP 1: Trip Preferences & Guests */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#00E5FF]" />
                        {(dict as any).booking?.step1Title || '1. Select Date & Time'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{(dict as any).booking?.step1Desc || 'Choose your departure date and preferred pickup time.'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">{(dict as any).booking?.departureDateLabel || 'Departure Date *'}</label>
                        <input
                          type="date"
                          value={departureDate}
                          min={(() => {
                            const hours = tour.cutoffHours ?? 24;
                            const minDate = new Date(Date.now() + Math.max(hours, 1) * 3600000);
                            return minDate.toISOString().split('T')[0];
                          })()}
                          onChange={(e) => setDepartureDate(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-none"
                        />
                        {errors.departureDate && (
                          <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.departureDate}</p>
                        )}
                        {/* Scarcity indicator — only shown when spots are genuinely low */}
                        {availableSpots !== null && availableSpots <= 5 && availableSpots > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[11px] font-bold text-amber-400">
                              {((dict as any).booking?.spotsLeft || 'Only {{n}} spot(s) left on this date').replace('{{n}}', String(availableSpots))}
                            </span>
                          </div>
                        )}
                        {availableSpots === 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            <span className="text-[11px] font-bold text-red-400">
                              {(dict as any).booking?.soldOut || 'Sold out on this date — please choose another'}
                            </span>
                          </div>
                        )}
                      </div>

                      {availablePickupTimes.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Pickup Time Slot</label>
                          <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-none"
                          >
                            <option value="" className="bg-[#0B1528] text-slate-400">Standard Morning (Default)</option>
                            {availablePickupTimes.map((t) => (
                              <option key={t} value={t} className="bg-[#0B1528] text-white">
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-300 mb-2">Number of Guests</label>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 divide-y divide-white/5">
                        {/* Adults */}
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs font-bold text-white">Adults (Age 12+)</p>
                            <p className="text-[11px] text-[#00E5FF] font-medium">{formatPrice(effectiveAdultPrice)} / person</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                              className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-white">{adultsCount}</span>
                            <button
                              type="button"
                              onClick={() => setAdultsCount(adultsCount + 1)}
                              className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between pt-3">
                          <div>
                            <p className="text-xs font-bold text-white">Children (Age 3-11)</p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {effectiveChildPrice > 0 ? `${formatPrice(effectiveChildPrice)} / child` : 'Free'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                              className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-white">{childrenCount}</span>
                            <button
                              type="button"
                              onClick={() => setChildrenCount(childrenCount + 1)}
                              className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Infants */}
                        <div className="flex items-center justify-between pt-3">
                          <div>
                            <p className="text-xs font-bold text-white">Infants (Under 3)</p>
                            <p className="text-[11px] text-emerald-400 font-medium">Free</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInfantsCount(Math.max(0, infantsCount - 1))}
                              className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-white">{infantsCount}</span>
                            <button
                              type="button"
                              onClick={() => setInfantsCount(infantsCount + 1)}
                              className="h-7 w-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optional Addons */}
                    {tour.addons && tour.addons.length > 0 && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-300 mb-2">Optional Experience Add-ons</label>
                        <div className="space-y-2">
                          {tour.addons.map((addon) => {
                            const label = addon.labels?.[language] || addon.labels?.en || addon.title || addon.name || 'Experience Add-on';
                            const isChecked = Boolean(selectedAddons[addon.id]);
                            return (
                              <div
                                key={addon.id}
                                role="checkbox"
                                aria-checked={isChecked}
                                onClick={() =>
                                  setSelectedAddons((prev) => ({ ...prev, [addon.id]: !prev[addon.id] }))
                                }
                                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                                  isChecked
                                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-sm shadow-[#00E5FF]/15'
                                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                                      isChecked
                                        ? 'border-[#00E5FF] bg-[#00E5FF] text-[#070F1E]'
                                        : 'border-white/25 bg-white/5'
                                    }`}
                                  >
                                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                  <span className="text-xs font-bold text-white">{label}</span>
                                </div>
                                <span className="text-xs font-black text-[#00E5FF]">
                                  +{formatPrice(addon.price)} {addon.priceType === 'per_person' ? '/ person' : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Lead Traveler Contact Details */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <User className="h-4 w-4 text-[#00E5FF]" />
                        {(dict as any).booking?.step2Title || '2. Traveler Information'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(dict as any).booking?.step2Desc || 'Guest booking enabled — Email is optional when a valid phone is provided.'}
                      </p>
                    </div>

                    {/* Account Status Badge */}
                    {isAuthenticated ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
                          ✓
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-400 truncate">
                            Logged in as {currentUser?.name || (currentUser?.telegramUsername ? `@${currentUser.telegramUsername}` : (currentUser?.email || 'Member'))}
                          </p>
                          <p className="text-[11px] text-slate-400">This trip will be automatically saved to your account.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0 text-xs">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">{(dict as any).booking?.bookingAsGuest || 'Booking as Guest'}</p>
                          <p className="text-[11px] text-slate-400">
                            {(dict as any).booking?.haveAccount || 'Have an account?'}{' '}<a href={`/auth?returnTo=/tours/${tour.slug}`} className="text-[#00E5FF] font-bold hover:underline">{(dict as any).booking?.logIn || 'Log in'}</a>{' '}{(dict as any).booking?.toLinkBooking || 'to link this booking.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">{(dict as any).booking?.leadNameLabel || 'Lead Traveler Full Name *'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Maria Gonzalez"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                      />
                      {errors.leadName && (
                        <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.leadName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number (with Country Code) *</label>
                      <CountryCodeSelector
                        value={phone}
                        onChange={(v) => setPhone(v)}
                        error={errors.phone}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Email Address <span className="text-slate-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="maria@example.com (optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappOptIn}
                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        className="h-4 w-4 mt-0.5 rounded border-white/20 bg-white/5 text-emerald-400 focus:ring-emerald-400"
                      />
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Send PDF Boarding Pass & Live Updates via WhatsApp</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Free</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          We will dispatch your driver pickup time and 24/7 concierge contact straight to your WhatsApp.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* STEP 3: Experience Details & Logistics */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#00E5FF]" />
                        {(dict as any).booking?.step3Title || '3. Logistics & Experience Details'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tour.bookingQuestions && tour.bookingQuestions.length > 0
                          ? 'Please provide the details below for your trip preparation.'
                          : ((dict as any).booking?.step3Desc || 'Select how you want to join the tour.')}
                      </p>
                    </div>

                    {tour.bookingQuestions && tour.bookingQuestions.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        {tour.bookingQuestions.map((q) => {
                          const qError = errors[`question_${q.id}`];
                          const val = bookingAnswers[q.id] ?? '';
                          return (
                            <div key={q.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-1.5">
                              <label className="block text-xs font-bold text-slate-300">
                                {q.question} {q.required && <span className="text-[#FF5B00] ml-1">*</span>}
                              </label>
                              {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}
                              {q.type === 'select' && q.options ? (
                                <select
                                  value={val}
                                  onChange={(e) => setBookingAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-none"
                                >
                                  <option value="">Select an option…</option>
                                  {q.options.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : q.type === 'textarea' ? (
                                <textarea
                                  rows={2}
                                  value={val}
                                  placeholder={q.placeholder || ''}
                                  onChange={(e) => setBookingAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  placeholder={q.placeholder || ''}
                                  onChange={(e) => setBookingAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                                />
                              )}
                              {qError && <p className="text-[11px] text-rose-400 font-medium">{qError}</p>}
                            </div>
                          );
                        })}
                      </div>
                    ) : isNoPickup ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center space-y-2">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/20 text-[#00E5FF]">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Direct On-Site Arrival</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          This experience starts directly at the venue. No hotel pickup or transfer logistics required.
                        </p>
                      </div>
                    ) : isMeetingPointOnly ? (
                      <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-5 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#00E5FF]">
                          <MapPin className="h-4 w-4" />
                          <span>Designated Meeting Point</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{tour.meetingPointName || 'Main Pier / Central Meeting Point'}</h4>
                        {tour.meetingPointAddress && (
                          <p className="text-xs text-slate-300">{tour.meetingPointAddress}</p>
                        )}
                        {tour.meetingPointLandmark && (
                          <p className="text-xs text-amber-300 font-medium">📍 Landmark: {tour.meetingPointLandmark}</p>
                        )}
                        {tour.meetingPointInstructions && (
                          <p className="text-[11px] text-slate-400 italic mt-1 leading-relaxed">{tour.meetingPointInstructions}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Mode Toggle when both Hotel Pickup and Meeting Point are offered */}
                        {(tour.meetingPointName || tour.pickupType === 'both') && (
                          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.02]">
                            <button
                              type="button"
                              onClick={() => setPickupType('HOTEL')}
                              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                pickupType === 'HOTEL'
                                  ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Building className="h-3.5 w-3.5" />
                              {(dict as any).booking?.hotelPickup || 'Hotel Pickup'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPickupType('MEETING_POINT')}
                              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                pickupType === 'MEETING_POINT'
                                  ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              {(dict as any).booking?.meetingPoint || 'Meeting Point'}
                            </button>
                          </div>
                        )}

                        {pickupType === 'HOTEL' ? (
                          <div className="space-y-3 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-slate-300 mb-1.5">Hotel or Resort Name *</label>
                              <input
                                type="text"
                                placeholder="e.g. Steigenberger ALDAU Beach Hotel"
                                value={hotelName}
                                onChange={(e) => setHotelName(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                              />
                              {errors.hotelName && (
                                <p className="text-[11px] text-rose-400 mt-1 font-medium">{errors.hotelName}</p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-300 mb-1.5">Room Number (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 402"
                                  value={roomNumber}
                                  onChange={(e) => setRoomNumber(e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                                />
                              </div>

                              {zones.length > 0 && (
                                <div>
                                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Transfer Zone</label>
                                  <select
                                    value={selectedZoneId}
                                    onChange={(e) => setSelectedZoneId(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-none"
                                  >
                                    <option value="" className="bg-[#0B1528] text-slate-400">Standard Zone (Free)</option>
                                    {zones.map((z) => (
                                      <option key={z.id} value={z.id} className="bg-[#0B1528] text-white">
                                        {z.name} (+{formatPrice(z.transferFee)})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#00E5FF]">
                              <MapPin className="h-4 w-4" />
                              <span>Designated Meeting Point: {tour.meetingPointName || 'Main Pier / Landmark'}</span>
                            </div>
                            {tour.meetingPointAddress && (
                              <p className="text-xs text-slate-300">{tour.meetingPointAddress}</p>
                            )}
                            {tour.meetingPointLandmark && (
                              <p className="text-xs text-amber-300 font-medium">📍 Landmark: {tour.meetingPointLandmark}</p>
                            )}
                            {tour.meetingPointInstructions && (
                              <p className="text-[11px] text-slate-400 italic mt-1">{tour.meetingPointInstructions}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Special Requests or Dietary Notes (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Any food allergies, vegetarian preferences, or wheelchair assistance needed..."
                        value={specialRequirements}
                        onChange={(e) => setSpecialRequirements(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: Authoritative Single Payment Selector */}
                {step === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#00E5FF]" />
                        {(dict as any).booking?.step4Title || '4. Payment Choice'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{(dict as any).booking?.step4Desc || 'Select how you want to pay for this booking.'}</p>
                    </div>

                    <div className="space-y-3">
                      {/* Option 1: Pay on Arrival */}
                      {tour.allowPayAtLocation && (
                        <button
                          type="button"
                          onClick={() => setPaymentScheme(PaymentScheme.PAY_ON_ARRIVAL)}
                          className={`w-full p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                            paymentScheme === PaymentScheme.PAY_ON_ARRIVAL
                              ? 'border-[#FF5B00] bg-[#FF5B00]/10 ring-1 ring-[#FF5B00]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{dict.checkout.payArrival}</span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5B00] bg-[#FF5B00]/15 px-2 py-0.5 rounded-full">
                                {(dict as any).booking?.zeroUpfront || 'Zero Upfront'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {((dict as any).booking?.payArrivalDesc || 'Pay nothing now. Pay the full balance ({{amount}}) in cash (USD, EUR, GBP, EGP) or card upon tour meetup.').replace('{{amount}}', formatPrice(grandTotal))}
                            </p>
                          </div>
                          {paymentScheme === PaymentScheme.PAY_ON_ARRIVAL && (
                            <span className="h-3 w-3 rounded-full bg-[#FF5B00] shadow-[0_0_8px_#FF5B00] mt-1 shrink-0 ml-2" />
                          )}
                        </button>
                      )}

                      {/* Option 2: Pay Online in Full */}
                      {tour.allowFullOnline !== false && (
                        <button
                          type="button"
                          onClick={() => setPaymentScheme(PaymentScheme.FULL_ONLINE)}
                          className={`w-full p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                            paymentScheme === PaymentScheme.FULL_ONLINE
                              ? 'border-[#00E5FF] bg-[#00E5FF]/10 ring-1 ring-[#00E5FF]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{dict.checkout.payOnline}</span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/15 px-2 py-0.5 rounded-full">
                                {(dict as any).booking?.instantConfirm || 'Instant Confirm'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {((dict as any).booking?.payOnlineDesc || 'Pay 100% online ({{amount}}) via credit card, Apple Pay, Google Pay, or digital wallet.').replace('{{amount}}', formatPrice(grandTotal))}
                            </p>
                          </div>
                          {paymentScheme === PaymentScheme.FULL_ONLINE && (
                            <span className="h-3 w-3 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] mt-1 shrink-0 ml-2" />
                          )}
                        </button>
                      )}

                      {/* Option 3: Secure Deposit */}
                      {tour.allowDeposit && (tour.depositPercentage || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentScheme(PaymentScheme.DEPOSIT_ONLINE)}
                          className={`w-full p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                            paymentScheme === PaymentScheme.DEPOSIT_ONLINE
                              ? 'border-[#EAB308] bg-[#EAB308]/10 ring-1 ring-[#EAB308]'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">
                                {dict.checkout.secureDeposit.replace('20%', `${depositPct}%`)}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#EAB308] bg-[#EAB308]/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="h-2.5 w-2.5" />
                                {dict.checkout.popular}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              {((dict as any).booking?.depositDesc || 'Pay only {{deposit}} today to guarantee your spots. The remaining {{balance}} is due on arrival.')
                                .replace('{{deposit}}', formatPrice(amountPaidOnline))
                                .replace('{{balance}}', formatPrice(amountDueOnArrival))}
                            </p>
                          </div>
                          {paymentScheme === PaymentScheme.DEPOSIT_ONLINE && (
                            <span className="h-3 w-3 rounded-full bg-[#EAB308] shadow-[0_0_8px_#EAB308] mt-1 shrink-0 ml-2" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Navigation Action Buttons */}
                <div className="flex items-center justify-between border-t border-white/10 pt-5">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      {(dict as any).booking?.back || 'Back'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#00E5FF]" />
                      {(dict as any).booking?.encryptionNotice || 'Protected by 256-bit encryption'}
                    </span>
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 hover:scale-[1.02] active:scale-[0.98] transition ml-auto"
                    >
                      <span>{(dict as any).booking?.continue || 'Continue'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitBooking}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait transition ml-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Complete Booking</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Trust Reassurance */}
                {step === 4 && !errors.submit && (
                  <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      Zero booking fees
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-sky-400" />
                      Instant e-voucher
                    </span>
                  </div>
                )}

                {errors.submit && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Live Booking Summary (Always visible & responsive) */}
              <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  {tour.coverImage && (
                    <img
                      src={tour.coverImage}
                      alt={tour.title}
                      className="h-12 w-14 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{tour.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      {departureDate || 'Select Date'} {selectedTime ? `• ${selectedTime}` : ''}
                    </p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs divide-y divide-white/5">
                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>
                      {adultsCount} Adult{adultsCount > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-white">{formatPrice(adultsCount * effectiveAdultPrice)}</span>
                  </div>

                  {childrenCount > 0 && (
                    <div className="flex justify-between text-slate-300 pt-2">
                      <span>
                        {childrenCount} Child{childrenCount > 1 ? 'ren' : ''}
                      </span>
                      <span className="font-bold text-white">
                        {effectiveChildPrice > 0 ? formatPrice(childrenCount * effectiveChildPrice) : 'Free'}
                      </span>
                    </div>
                  )}

                  {zoneFee > 0 && (
                    <div className="flex justify-between text-slate-300 pt-2">
                      <span>Transfer ({selectedZone?.name})</span>
                      <span className="font-bold text-white">{formatPrice(zoneFee)}</span>
                    </div>
                  )}

                  {addonsTotal > 0 && (
                    <div className="flex justify-between text-slate-300 pt-2">
                      <span>Add-ons</span>
                      <span className="font-bold text-white">{formatPrice(addonsTotal)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Price</span>
                  <span className="text-xl font-black text-white">{formatPrice(grandTotal)}</span>
                </div>

                {/* Selected Payment Summary Display */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Due Online Now:</span>
                    <span className="font-black text-emerald-400">{formatPrice(amountPaidOnline)}</span>
                  </div>
                  {amountDueOnArrival > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Due on Arrival:</span>
                      <span className="font-black text-[#FF5B00]">{formatPrice(amountDueOnArrival)}</span>
                    </div>
                  )}
                </div>

                {/* Fallback to full checkout route */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        saveBookingDraft(tour.id, {
                          departureDate,
                          selectedTime,
                          adultsCount,
                          childrenCount,
                          infantsCount,
                          selectedAddons,
                          leadName,
                          phone,
                          email,
                          pickupType,
                          hotelName,
                          roomNumber,
                          specialRequirements,
                          selectedZoneId,
                        });
                      } catch {}

                      const activeAddons = Object.keys(selectedAddons).filter((k) => selectedAddons[k]).join(',');
                      const query = new URLSearchParams({
                        adults: String(adultsCount),
                        children: String(childrenCount),
                        infants: String(infantsCount),
                        ...(departureDate ? { date: departureDate } : {}),
                        ...(selectedTime ? { time: selectedTime } : {}),
                        ...(activeAddons ? { addons: activeAddons } : {}),
                      });
                      window.location.href = `/checkout/${tour.id}?${query.toString()}`;
                    }}
                    className="text-[11px] text-slate-500 hover:text-[#00E5FF] transition underline decoration-dotted"
                  >
                    Prefer full checkout page? Click here
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
