'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  CalendarDays,
  ChevronLeft,
  CreditCard,
  Building,
  Phone,
  Mail,
  User,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Baby,
  UserRound,
  MapPin,
  Sparkles,
  HelpCircle,
  Check,
} from 'lucide-react';
import PriceSummarySidebar from '@/components/checkout/PriceSummarySidebar';
import Button from '@/components/ui/Button';
import CountryCodeSelector from '@/components/checkout/CountryCodeSelector';
import { PaymentScheme, type CheckoutFormData, type InitializeResponse, type SelectedAddonPayload } from '@/types/checkout';
import type { BookingQuestion } from '@/types/tourEditor';
import type { PromoDiscount } from '@/utils/promo';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';

interface ZoneOption {
  id: string;
  name: string;
  transferFee: number;
  pickupWindow?: string | null;
  instructions?: string | null;
  location?: string | null;
}

// Stepper with +/- and direct text input
function GuestStepper({
  label,
  sublabel,
  value,
  icon: Icon,
  iconColor,
  onChange,
  priceLabel,
}: {
  label: string;
  sublabel?: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  onChange: (v: number) => void;
  priceLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  const startEdit = () => {
    setRaw(value === 0 ? '' : String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    else onChange(value);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
          {priceLabel && <p className="text-xs font-medium text-[#FF5B00]">{priceLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-slate-300 hover:border-[#FF5B00] hover:text-[#FF5B00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={`Decrease ${label}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
          </svg>
        </button>

        {editing ? (
          <input
            autoFocus
            type="number"
            min={0}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }}
            className="w-12 text-center text-base font-bold text-white bg-white/10 border border-[#FF5B00] rounded-lg px-1 py-0.5 outline-none focus:ring-2 focus:ring-[#FF5B00]/30"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-12 text-center text-base font-bold text-white hover:text-[#FF5B00] cursor-pointer transition-colors select-none"
            title="Click to type a number"
          >
            {value}
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-slate-300 hover:border-[#FF5B00] hover:text-[#FF5B00] transition-colors"
          aria-label={`Increase ${label}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface TourAddonOption {
  id: string;
  price: number;
  priceType: 'per_person' | 'flat';
  enabled: boolean;
  labels: Record<string, string>;
  descriptions: Record<string, string>;
}

interface TourDetails {
  id: string;
  title: string;
  adultPrice: number;
  childPrice: number | null;
  infantPrice: number | null;
  depositPercentage: number;
  allowPayAtLocation: boolean;
  allowDeposit: boolean;
  allowFullOnline: boolean;
  zoneTransferFee: number;
  maxCapacity: number | null;
  cutoffHours?: number | null;
  pickupTimes: string[];
  pickupType?: string | null;
  hotelPickupIncluded?: boolean;
  meetingPointName?: string | null;
  meetingPointAddress?: string | null;
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingPointLandmark?: string | null;
  meetingPointInstructions?: string | null;
  meetingPointMapUrl?: string | null;
  meetingPointImageUrl?: string | null;
  tourOptions: TourAddonOption[];
  bookingQuestions?: BookingQuestion[];
}

type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;
type PageState = 'loading' | 'form' | 'submitting' | 'confirm' | 'error';

function validateForm(
  data: CheckoutFormData,
  pickupTimes: string[],
  m: {
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    phoneRequired: string;
    phoneInvalid: string;
    hotelRequired: string;
    pickupRequired: string;
  },
  tour?: TourDetails | null
): FormErrors {
  const errors: FormErrors = {};
  if (!data.leadName.trim()) errors.leadName = m.nameRequired;

  // Email is optional when phone is provided (phone-only booking)
  const phoneProvided = !!(data.phone && data.phone.trim());
  if (data.email.trim()) {
    // Validate format only when email is actually entered
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = m.emailInvalid;
    }
  } else if (!phoneProvided) {
    // Email required only when phone is also absent
    errors.email = m.emailRequired;
  }

  if (!data.phone.trim()) {
    errors.phone = m.phoneRequired;
  } else if (!/^\+[1-9]\d{6,14}$/.test(data.phone.replace(/[\s\-().]/g, ''))) {
    errors.phone = 'Please provide a valid international number with country code (e.g. +49, +44, +20)';
  }

  const effectivePickupType = (data.pickupType || tour?.pickupType || 'hotel').toLowerCase();
  const isNoPickup = effectivePickupType === 'meeting_point' || effectivePickupType === 'none';
  if (!isNoPickup && (!data.hotelName || !data.hotelName.trim())) {
    errors.hotelName = m.hotelRequired;
  }

  if (pickupTimes.length > 0 && !data.pickupTime) errors.pickupTime = m.pickupRequired;

  if (tour?.bookingQuestions && tour.bookingQuestions.length > 0) {
    for (const q of tour.bookingQuestions) {
      if (q.required) {
        const ans = data.bookingAnswers?.[q.id];
        if (ans === undefined || ans === null || (typeof ans === 'string' && ans.trim() === '')) {
          (errors as Record<string, string>)[`question_${q.id}`] = 'This field is required';
        }
      }
    }
  }

  return errors;
}

function FormField({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="group">
      <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-300">
        {label}
        {required && <span className="text-[#FF5B00]">*</span>}
      </label>
      {children}
      {error && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}

function Input({
  error,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string; icon?: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
        error
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-white/10 bg-white/[0.04] group-focus-within:border-[#06B6D4]/40 group-focus-within:bg-white/[0.06]'
      } hover:border-white/20`}
    >
      {icon && <span className="text-slate-500 transition-colors group-focus-within:text-[#06B6D4]">{icon}</span>}
      <input
        {...props}
        className="flex-1 bg-transparent text-base font-medium text-white placeholder-slate-500 outline-none"
      />
    </div>
  );
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict, language } = useLanguage();
  const { currency, formatPrice } = useCurrency();
  const tourId = params.tourId as string;
  const reservationId = searchParams.get('reservation') || undefined;

  const [tour, setTour] = useState<TourDetails | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [scheme, setScheme] = useState<PaymentScheme>(PaymentScheme.PAY_ON_ARRIVAL);
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [departureDate, setDepartureDate] = useState('');
  const [dateAvailability, setDateAvailability] = useState<{
    status: string;
    remaining: number;
    adultPrice?: number;
  } | null>(null);
  const [dateAvailLoading, setDateAvailLoading] = useState(false);
  const [confirmData, setConfirmData] = useState<InitializeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [resumeAccessToken, setResumeBookingId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);

  const [availableZones, setAvailableZones] = useState<ZoneOption[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [selectedZoneFee, setSelectedZoneFee] = useState<number>(0);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [bookingAnswers, setBookingAnswers] = useState<Record<string, any>>({});

  const totalPayingGuests = adultsCount + childrenCount;

  // Fetch per-date availability whenever departureDate changes
  useEffect(() => {
    if (!departureDate || !tourId) { setDateAvailability(null); return; }
    const [year, month] = departureDate.split('-');
    setDateAvailLoading(true);
    fetch(`/api/public/tours/${tourId}/availability?month=${year}-${month}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data[departureDate]) {
          setDateAvailability(data[departureDate]);
        } else {
          setDateAvailability(null);
        }
      })
      .catch(() => setDateAvailability(null))
      .finally(() => setDateAvailLoading(false));
  }, [departureDate, tourId]);

  const addonsTotal = tour
    ? (tour.tourOptions || []).reduce((sum, opt) => {
        if (!selectedAddons[opt.id]) return sum;
        return sum + (opt.priceType === 'per_person' ? opt.price * totalPayingGuests : opt.price);
      }, 0)
    : 0;

  const effectiveZoneFee = selectedZoneFee * totalPayingGuests;

  const [form, setForm] = useState<CheckoutFormData>({
    leadName: '',
    email: '',
    phone: '',
    hotelName: '',
    roomNumber: '',
    pickupTime: '',
    currency: 'USD',
    paymentScheme: PaymentScheme.PAY_ON_ARRIVAL,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // Saves a partial abandoned checkout entry when guest starts filling the form
  const saveAbandonedCheckout = useCallback(async (step: 'modal' | 'form' = 'form') => {
    if (!tourId || !form.leadName.trim() || !form.phone.trim()) return;
    try {
      await fetch('/api/abandoned-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId,
          name: form.leadName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          guestCount: adultsCount + childrenCount + infantsCount,
          travelDate: departureDate || null,
          step,
        }),
      });
    } catch {
      // Non-fatal — never block the UI
    }
  }, [tourId, form.leadName, form.phone, form.email, adultsCount, childrenCount, infantsCount, departureDate]);

  // Synchronize counts from search parameters on mount
  useEffect(() => {
    const queryAdults = searchParams.get('adults');
    if (queryAdults) setAdultsCount(Math.max(1, parseInt(queryAdults, 10)));
    const queryChildren = searchParams.get('children');
    if (queryChildren) setChildrenCount(Math.max(0, parseInt(queryChildren, 10)));
    const queryInfants = searchParams.get('infants');
    if (queryInfants) setInfantsCount(Math.max(0, parseInt(queryInfants, 10)));
    const queryTime = searchParams.get('time') || searchParams.get('pickupTime');
    if (queryTime) setForm((prev) => ({ ...prev, pickupTime: queryTime }));
    const queryDate = searchParams.get('date') || searchParams.get('departureDate');
    if (queryDate) setDepartureDate(queryDate);
    const queryAddons = searchParams.get('addons');
    if (queryAddons) {
      const map: Record<string, boolean> = {};
      queryAddons.split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => {
        map[id] = true;
      });
      setSelectedAddons(map);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTour() {
      try {
        const res = await fetch(`/api/public/tours?id=${tourId}`);
        if (!res.ok) throw new Error('Tour not found');
        const data = await res.json();
        let title = '';
        if (data.translations?.en?.title) {
          title = data.translations.en.title;
        } else if (data.title) {
          title = data.title;
        } else {
          title = data.slug ?? 'Tour';
        }

        // Pickup zones come only from the tour destination's admin-managed Zone records.
        // Do not invent fallback zones on checkout: a price must always be traceable.
        const zonesList: ZoneOption[] = Array.isArray(data.availableZones) ? data.availableZones : [];
        setAvailableZones(zonesList);
        if (zonesList.length > 0) {
          setSelectedZoneId(zonesList[0].id);
          setSelectedZoneFee(zonesList[0].transferFee);
        }

        const pm = data.paymentMethods || {};
        // Master payment controls from /admin/settings:
        const allowPayAtLocation = pm.allowPayOnArrival !== false;
        const allowFullOnline = pm.allowFullOnline !== false;
        const allowDeposit = pm.allowDepositOnline !== false && (Boolean(data.allowDeposit) || Number(pm.defaultDepositPercentage ?? 0) > 0);
        const depositPercentage = Number(data.depositPercentage || pm.defaultDepositPercentage || 20);

// Payment on arrival may have been switched off in the admin settings after
        // this page mounted, so fall back to an enabled scheme. Read the current
        // value through the functional updater rather than the captured
        // `scheme` (this effect only depends on `tourId`), and keep
        // `form.paymentScheme` in sync — updating only the local state would
        // leave the submitted payload on the disabled scheme.
        setScheme((current) => {
          if (allowPayAtLocation || current !== PaymentScheme.PAY_ON_ARRIVAL) {
            return current;
          }
          const fallback = allowFullOnline ? PaymentScheme.FULL_ONLINE : PaymentScheme.DEPOSIT_ONLINE;
          setForm((prev) => ({ ...prev, paymentScheme: fallback }));
          return fallback;
        });

        const loadedPickupTimes: string[] = Array.isArray(data.pickupTimes) && data.pickupTimes.length > 0
          ? data.pickupTimes
          : (data.pickupTime ? String(data.pickupTime).split('|').map((t: string) => t.trim()).filter(Boolean) : []);

        if (loadedPickupTimes.length > 0) {
          setForm((prev) => ({
            ...prev,
            pickupTime: prev.pickupTime && loadedPickupTimes.includes(prev.pickupTime)
              ? prev.pickupTime
              : loadedPickupTimes[0],
          }));
        }

        if (data.pickupType) {
          setForm((prev) => ({
            ...prev,
            pickupType: data.pickupType === 'meeting_point' ? 'MEETING_POINT' : data.pickupType === 'none' ? 'NONE' : (prev.pickupType || 'HOTEL'),
            hotelName: data.pickupType === 'meeting_point' ? (data.meetingPointName || 'Meeting Point') : prev.hotelName,
          }));
        }

        setTour({
          id: data.id,
          title,
          adultPrice: Number(data.priceAdult ?? data.adultPrice ?? data.basePrice ?? data.basePriceUSD ?? 0),
          childPrice: data.priceChild ?? data.childPrice ?? null,
          infantPrice: data.infantPrice ?? null,
          depositPercentage,
          allowPayAtLocation,
          allowDeposit,
          allowFullOnline,
          zoneTransferFee: Number(data.zone?.transferFee ?? 0),
          maxCapacity: data.maxCapacity ?? null,
          cutoffHours: data.cutoffHours ?? null,
          pickupTimes: loadedPickupTimes,
          pickupType: data.pickupType || 'hotel',
          hotelPickupIncluded: Boolean(data.hotelPickupIncluded),
          meetingPointName: data.meetingPointName || null,
          meetingPointAddress: data.meetingPointAddress || null,
          meetingPointLat: data.meetingPointLat ?? null,
          meetingPointLng: data.meetingPointLng ?? null,
          meetingPointLandmark: data.meetingPointLandmark || null,
          meetingPointInstructions: data.meetingPointInstructions || null,
          meetingPointMapUrl: data.meetingPointMapUrl || null,
          meetingPointImageUrl: data.meetingPointImageUrl || null,
          tourOptions: Array.isArray(data.tourOptions)
            ? (data.tourOptions as TourAddonOption[]).filter((o) => o.enabled !== false)
            : [],
          bookingQuestions: Array.isArray(data.bookingQuestions) ? data.bookingQuestions : [],
        });
      } catch {
        setTour(null);
      } finally {
        setPageState('form');
      }
    }
    loadTour();

    const pending = sessionStorage.getItem('pendingBookingAccessToken');
    if (pending) {
      setResumeBookingId(pending);
    }
  }, [tourId]);

  const handleFieldChange = useCallback((field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSchemeChange = useCallback((newScheme: PaymentScheme) => {
    setScheme(newScheme);
    setForm((prev) => ({ ...prev, paymentScheme: newScheme }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const formWithAnswers: CheckoutFormData = {
      ...form,
      bookingAnswers,
    };
    const formErrors = validateForm(formWithAnswers, tour?.pickupTimes ?? [], {
      nameRequired: dict.checkout.nameRequired,
      emailRequired: dict.checkout.emailRequired,
      emailInvalid: dict.checkout.emailInvalid,
      phoneRequired: dict.checkout.phoneRequired,
      phoneInvalid: dict.checkout.phoneInvalid,
      hotelRequired: dict.checkout.hotelRequired,
      pickupRequired: dict.checkout.pickupRequired,
    }, tour);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    if (!tour || !departureDate) {
      setErrorMessage(dict.checkout.departureRequired);
      setPageState('error');
      return;
    }

    setPageState('submitting');
    setErrorMessage('');

    try {
      const selectedAddonsList: SelectedAddonPayload[] = (tour?.tourOptions || [])
        .filter((opt) => selectedAddons[opt.id])
        .map((opt) => {
          const isPerPerson = opt.priceType === 'per_person';
          const qty = isPerPerson ? totalPayingGuests : 1;
          return {
            id: opt.id,
            title: opt.labels?.[language] || opt.labels?.['en'] || Object.values(opt.labels || {})[0] || 'Upgrade',
            price: opt.price,
            priceType: opt.priceType,
            quantity: qty,
            total: isPerPerson ? opt.price * qty : opt.price,
          };
        });

      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          reservationId,
          departureDate,
          guestCount: adultsCount + childrenCount + infantsCount,
          adultsCount,
          childrenCount,
          infantsCount,
          formData: {
            ...form,
            currency,
            selectedAddons: selectedAddonsList,
            bookingAnswers,
            whatsappOptIn,
          },
          selectedAddons: selectedAddonsList,
          bookingAnswers,
          promoCode: promoDiscount?.code ?? null,
        }),
      });

      const responseData: InitializeResponse & { error?: string; code?: string } =
        await res.json();

      if (res.status === 409) {
        setErrorMessage(responseData.error ?? dict.checkout.soldOut);
        setPageState('error');
        return;
      }

      if (res.status === 400) {
        setErrorMessage(responseData.error ?? dict.checkout.checkInfo);
        setPageState('error');
        return;
      }

      if (!res.ok) {
        setErrorMessage(responseData.error ?? dict.checkout.wrong);
        setPageState('error');
        return;
      }

      setConfirmData(responseData);

      if (responseData.scheme === PaymentScheme.PAY_ON_ARRIVAL) {
        setPageState('confirm');
      } else if (responseData.gatewayIframeUrl) {
        sessionStorage.setItem('pendingBookingAccessToken', responseData.accessToken);
        window.location.href = responseData.gatewayIframeUrl;
      }
    } catch {
      setErrorMessage(dict.checkout.errorMessage);
      setPageState('error');
    }
  // `validateRequiredFields` closes over the answer map, selected addons, the
  // guest totals and the active language, so all of them have to be listed
  // here — omitting them submits stale validation state when the guest
  // changes an answer, a pickup addon or the interface language.
  }, [form, tour, departureDate, adultsCount, childrenCount, infantsCount, promoDiscount, bookingAnswers, selectedAddons, totalPayingGuests, language, dict, whatsappOptIn, currency, reservationId]);

  const handleResume = useCallback(() => {
    if (resumeAccessToken) {
      router.push(`/booking/${resumeAccessToken}`);
    }
  }, [resumeAccessToken, router]);

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#070F1E]">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#06B6D4]" />
          <p className="mt-4 text-sm font-bold text-slate-400">{dict.checkout.loadingCheckout}</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#070F1E]">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-[#EAB308]" />
          <h1 className="mt-4 text-2xl font-black text-white">{dict.checkout.tourNotFound}</h1>
          <p className="mt-2 text-slate-400">{dict.checkout.tourNotAvailable}</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push('/tours')}
          >
            {dict.checkout.browseTours}
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === 'confirm' && confirmData) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#070F1E] px-5">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#00473F]/30 border border-[#00473F]/30">
            <CheckCircle2 className="h-10 w-10 text-[#A7F3D0]" />
          </div>
          <h1 className="text-3xl font-black text-white">{dict.checkout.successTitle}</h1>
          <p className="mt-3 text-slate-400">
            {dict.checkout.successRef}{' '}
            <span className="font-bold text-white">{confirmData.bookingId}</span>
          </p>

          {confirmData.amountDueOnArrival > 0 && (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#FF5B00]/20 bg-[#FF5B00]/5 p-6">
              <p className="text-sm text-slate-400">{dict.checkout.successDue}</p>
              <p className="mt-1 text-3xl font-black text-[#FF5B00]">
                {formatPrice(confirmData.amountDueOnArrival)}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="mt-8"
            onClick={() => router.push(`/booking/${confirmData.accessToken}`)}
          >
            {dict.checkout.viewDetails}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070F1E] px-5 py-10 text-[#F8FAFC] lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {dict.checkout.back}
        </button>

        <div className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">{dict.checkout.secureCheckout}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-4xl">
            {dict.checkout.completeBooking}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            {dict.checkout.fillDetails}
          </p>
        </div>

        {resumeAccessToken && (
          <div className="mb-8 rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#06B6D4]" />
              <p className="text-sm text-slate-300">
                {dict.checkout.pendingPayment}{' '}
                <button
                  type="button"
                  onClick={handleResume}
                  className="font-bold text-[#06B6D4] underline transition-colors hover:text-[#EAB308]"
                >
                  {dict.checkout.resumePayment}
                </button>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Travel Details */}
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-black text-white">
                <CalendarDays className="h-5 w-5 text-[#06B6D4]" />
                {dict.checkout.travelDetails}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label={dict.checkout.departureDate} required>
                  {(() => {
                    // Min date = today + cutoffHours
                    const cutoff = tour?.cutoffHours ?? 12;
                    const minDate = new Date(Date.now() + cutoff * 3_600_000);
                    const minDateStr = minDate.toISOString().slice(0, 10);

                    const avStatus = dateAvailability?.status;
                    const isUnavailable = avStatus && !['AVAILABLE'].includes(avStatus);
                    const remaining = dateAvailability?.remaining ?? null;

                    return (
                      <>
                        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 focus-within:bg-white/[0.06] ${
                          isUnavailable
                            ? 'border-rose-500/40 bg-rose-900/10'
                            : 'border-white/10 bg-white/[0.04] hover:border-white/20 focus-within:border-[#06B6D4]/40'
                        }`}>
                          <CalendarDays className={`h-5 w-5 shrink-0 ${isUnavailable ? 'text-rose-400' : 'text-slate-500'}`} />
                          <input
                            id="departureDate"
                            type="date"
                            value={departureDate}
                            min={minDateStr}
                            onChange={(e) => setDepartureDate(e.target.value)}
                            className="flex-1 bg-transparent text-base font-medium text-white outline-none [color-scheme:dark]"
                          />
                          {dateAvailLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                          )}
                        </div>
                        {/* Availability feedback badge */}
                        {departureDate && !dateAvailLoading && dateAvailability && (
                          <div className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
                            avStatus === 'AVAILABLE'
                              ? remaining !== null && remaining <= 5
                                ? 'border border-amber-500/30 bg-amber-900/20 text-amber-300'
                                : 'border border-emerald-500/30 bg-emerald-900/20 text-emerald-300'
                              : 'border border-rose-500/30 bg-rose-900/20 text-rose-300'
                          }`}>
                            {avStatus === 'AVAILABLE' ? (
                              remaining !== null && remaining <= 5 ? (
                                <><AlertCircle className="h-3.5 w-3.5" /> Only {remaining} spot{remaining === 1 ? '' : 's'} left on this date!</>
                              ) : (
                                <><CheckCircle2 className="h-3.5 w-3.5" /> Available — {remaining !== null ? `${remaining} spots remaining` : 'Check availability'}</>
                              )
                            ) : avStatus === 'SOLD_OUT' ? (
                              <><AlertCircle className="h-3.5 w-3.5" /> This date is fully booked. Please choose another date.</>
                            ) : avStatus === 'BLACKOUT' || avStatus === 'CLOSED' ? (
                              <><AlertCircle className="h-3.5 w-3.5" /> Tour not available on this date. Please choose another.</>
                            ) : avStatus === 'WEATHER_CANCELLED' ? (
                              <><AlertCircle className="h-3.5 w-3.5" /> This date is cancelled (weather). Please choose another.</>
                            ) : avStatus === 'PRIVATE_EVENT' ? (
                              <><AlertCircle className="h-3.5 w-3.5" /> Private event on this date. Please choose another.</>
                            ) : null}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </FormField>

                <div className="sm:col-span-2 mt-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#06B6D4]" />
                    {dict.checkout.selectTravelers}
                  </h3>
                  <div className="divide-y divide-white/5">
                    <GuestStepper
                      label={dict.checkout.adults}
                      sublabel={dict.checkout.ageAdult}
                      value={adultsCount}
                      icon={User}
                      iconColor="bg-blue-500/10 text-blue-400"
                      onChange={(val) => setAdultsCount(Math.max(1, val))}
                      priceLabel={`${formatPrice(tour.adultPrice)} ${dict.checkout.perPerson}`}
                    />
                    <GuestStepper
                      label={dict.checkout.children}
                      sublabel={dict.checkout.ageChild}
                      value={childrenCount}
                      icon={Users}
                      iconColor="bg-yellow-500/10 text-yellow-400"
                      onChange={(val) => setChildrenCount(val)}
                      priceLabel={tour.childPrice != null ? `${formatPrice(tour.childPrice)} ${dict.checkout.perChild}` : undefined}
                    />
                    <GuestStepper
                      label={dict.checkout.infants}
                      sublabel={dict.checkout.ageInfant}
                      value={infantsCount}
                      icon={Baby}
                      iconColor="bg-emerald-500/10 text-emerald-400"
                      onChange={(val) => setInfantsCount(val)}
                      priceLabel={tour.infantPrice != null ? `${formatPrice(tour.infantPrice)} ${dict.checkout.perInfant}` : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-black text-white">
                <User className="h-5 w-5 text-[#06B6D4]" />
                {dict.checkout.guestInfo}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                noValidate
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField label={dict.checkout.leadName} required error={errors.leadName}>
                    <Input
                      id="leadName"
                      type="text"
                      value={form.leadName}
                      onChange={(e) => handleFieldChange('leadName', e.target.value)}
                      placeholder="e.g. John Smith"
                      icon={<User className="h-5 w-5" />}
                      error={errors.leadName}
                    />
                  </FormField>

                  <FormField label={dict.checkout.email} error={errors.email}>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="john@example.com (optional if phone provided)"
                      icon={<Mail className="h-5 w-5" />}
                      error={errors.email}
                    />
                    <p className="mt-1 text-xs text-slate-500">Leave blank to book with phone number only</p>
                  </FormField>

                  <FormField label={dict.checkout.phone} required error={errors.phone}>
                    <CountryCodeSelector
                      value={form.phone}
                      onChange={(val) => {
                        handleFieldChange('phone', val);
                      }}
                      onBlur={() => saveAbandonedCheckout('form')}
                      error={errors.phone}
                    />
                  </FormField>

                  {/* Adaptive Pickup / Meeting Point Section */}
                  {(() => {
                    const effectiveType = (form.pickupType || tour?.pickupType || 'hotel').toLowerCase();
                    const isMeetingPointOnly = effectiveType === 'meeting_point';
                    const isNoPickup = effectiveType === 'none';
                    const isAirport = effectiveType === 'airport';
                    const isBoth = tour?.pickupType === 'both';

                    return (
                      <div className="sm:col-span-2 space-y-4">
                        {/* If tour offers both hotel pickup and meeting point, provide mode toggle */}
                        {isBoth && (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('pickupType', 'HOTEL');
                                handleFieldChange('hotelName', '');
                              }}
                              className={`flex-1 rounded-xl py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                form.pickupType !== 'MEETING_POINT'
                                  ? 'bg-[#06B6D4] text-[#070F1E] shadow-md shadow-[#06B6D4]/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Building className="w-4 h-4" />
                              Hotel Pickup
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('pickupType', 'MEETING_POINT');
                                handleFieldChange('hotelName', tour?.meetingPointName || 'Meeting Point');
                              }}
                              className={`flex-1 rounded-xl py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                                form.pickupType === 'MEETING_POINT'
                                  ? 'bg-[#06B6D4] text-[#070F1E] shadow-md shadow-[#06B6D4]/20'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <MapPin className="w-4 h-4" />
                              Direct Meeting Point
                            </button>
                          </div>
                        )}

                        {/* Meeting Point Card (when meeting_point or selected MEETING_POINT) */}
                        {(isMeetingPointOnly || (isBoth && form.pickupType === 'MEETING_POINT')) && (
                          <div className="rounded-2xl border border-[#06B6D4]/30 bg-[#06B6D4]/5 p-5 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#06B6D4]/20 text-[#06B6D4]">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <span className="text-xs font-black uppercase tracking-wider text-[#06B6D4]">
                                  Designated Meeting Point
                                </span>
                                <h3 className="text-base font-bold text-white mt-0.5">
                                  {tour?.meetingPointName || 'On-site Meeting Point'}
                                </h3>
                                {tour?.meetingPointAddress && (
                                  <p className="text-xs text-slate-300 mt-1">{tour.meetingPointAddress}</p>
                                )}
                                {tour?.meetingPointLandmark && (
                                  <p className="text-xs text-amber-300/90 mt-1 flex items-center gap-1.5 font-medium">
                                    <span>📍 Landmark:</span>
                                    <span>{tour.meetingPointLandmark}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {tour?.meetingPointInstructions && (
                              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 leading-relaxed">
                                <strong className="text-white block mb-0.5">Directions:</strong>
                                {tour.meetingPointInstructions}
                              </div>
                            )}

                            {tour?.meetingPointMapUrl && (
                              <a
                                href={tour.meetingPointMapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#06B6D4] hover:underline"
                              >
                                View on Google Maps ↗
                              </a>
                            )}
                          </div>
                        )}

                        {/* No Pickup Self-Arrival Card */}
                        {isNoPickup && (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">Direct Arrival — No Hotel Pickup Required</h3>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                This experience begins on-site. Please arrive at the scheduled departure time. Details and entry tickets are sent directly to your email and WhatsApp.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Airport Pickup Inputs */}
                        {isAirport && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Flight Number *" required error={errors.hotelName}>
                              <Input
                                id="flightNumbers"
                                type="text"
                                value={form.flightNumbers || ''}
                                onChange={(e) => {
                                  handleFieldChange('flightNumbers', e.target.value);
                                  handleFieldChange('hotelName', `Flight ${e.target.value}`);
                                }}
                                placeholder="e.g. MS703 or LH2410"
                                error={errors.hotelName}
                              />
                            </FormField>
                            <FormField label="Drop-off Hotel / Resort">
                              <Input
                                id="pickupAddress"
                                type="text"
                                value={form.pickupAddress || ''}
                                onChange={(e) => handleFieldChange('pickupAddress', e.target.value)}
                                placeholder="e.g. Jaz Aquamarine Resort"
                              />
                            </FormField>
                          </div>
                        )}

                        {/* Hotel Pickup Inputs (standard mode) */}
                        {!isMeetingPointOnly && !isNoPickup && !isAirport && form.pickupType !== 'MEETING_POINT' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label={dict.checkout.hotelName} required error={errors.hotelName}>
                              <Input
                                id="hotelName"
                                type="text"
                                value={form.hotelName}
                                onChange={(e) => handleFieldChange('hotelName', e.target.value)}
                                placeholder="e.g. Steigenberger Al Dau"
                                icon={<Building className="h-5 w-5" />}
                                error={errors.hotelName}
                              />
                            </FormField>

                            <FormField label={dict.checkout.roomNumber}>
                              <Input
                                id="roomNumber"
                                type="text"
                                value={form.roomNumber ?? ''}
                                onChange={(e) => handleFieldChange('roomNumber', e.target.value)}
                                placeholder="Optional"
                              />
                            </FormField>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Pickup time: show slot picker if the tour has defined options */}
                  {tour && tour.pickupTimes.length > 0 && (
                    <FormField label={dict.checkout.pickupTime} required error={errors.pickupTime}>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {tour.pickupTimes.map((slot) => {
                          const selected = form.pickupTime === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              id={`pickupSlot-${slot}`}
                              onClick={() => handleFieldChange('pickupTime', slot)}
                              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                                selected
                                  ? 'border-[#FF5B00] bg-[#FF5B00]/10 text-[#FF5B00]'
                                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              <Clock className="h-4 w-4 shrink-0" />
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {errors.pickupTime && (
                        <p className="mt-1.5 text-xs text-red-400">{errors.pickupTime}</p>
                      )}
                    </FormField>
                  )}
                  {tour && tour.pickupTimes.length === 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                      <Clock className="h-4 w-4 shrink-0 text-[#00E5FF]" />
                      {dict.checkout.pickupInfo}
                    </div>
                  )}

                  {/* Currency Selector */}
                  <FormField label={dict.checkout.currency}>
                    <div className="flex gap-2">
                      {['USD', 'EGP', 'EUR', 'GBP'].map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => handleFieldChange('currency', cur)}
                          className={`flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                            form.currency === cur
                              ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]'
                              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>

                {/* Transfer & Pickup Region Selector */}
                {availableZones.length > 0 && (
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#06B6D4]" />
                        Transfer &amp; Pickup Region
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Choose your hotel zone for pickup logistics and transfer calculation.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {availableZones.map((z) => {
                        const isSelected = selectedZoneId === z.id;
                        return (
                          <button
                            key={z.id}
                            type="button"
                            onClick={() => {
                              setSelectedZoneId(z.id);
                              setSelectedZoneFee(z.transferFee);
                            }}
                            className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                              isSelected
                                ? 'border-[#06B6D4] bg-[#06B6D4]/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-bold text-white">{z.name}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {z.transferFee === 0 ? 'Free Hotel Transfer' : `+${formatPrice(z.transferFee)} / person`}
                              </p>
                            </div>
                            <div className="mt-3">
                              <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                z.transferFee === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {z.transferFee === 0 ? 'Included' : `+${formatPrice(z.transferFee)}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic Tour Options & Experience Upgrades (configured via Admin Tour Builder) */}
                {tour && tour.tourOptions && tour.tourOptions.length > 0 && (
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#EAB308]" />
                        Optional Tour Upgrades &amp; Extras
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Customize your booking with exclusive upgrades and options.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tour.tourOptions.map((opt) => {
                        const isSelected = Boolean(selectedAddons[opt.id]);
                        const optTitle = opt.labels?.[language] || opt.labels?.['en'] || Object.values(opt.labels || {})[0] || 'Upgrade Option';
                        const optDesc = opt.descriptions?.[language] || opt.descriptions?.['en'] || Object.values(opt.descriptions || {})[0] || '';
                        const priceDisplay = opt.priceType === 'per_person'
                          ? `+${formatPrice(opt.price)} / person (+${formatPrice(opt.price * totalPayingGuests)} total)`
                          : `+${formatPrice(opt.price)} Total`;

                        return (
                          <label
                            key={opt.id}
                            className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#EAB308] bg-[#EAB308]/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => setSelectedAddons(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                              className="mt-1 h-4 w-4 text-[#EAB308] rounded border-slate-600 focus:ring-[#EAB308]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{optTitle}</p>
                              {optDesc && <p className="text-xs text-slate-400 mt-0.5">{optDesc}</p>}
                              <p className="text-xs font-bold text-[#EAB308] mt-1.5">{priceDisplay}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic Custom Questions per Tour (configured via Admin Tour Builder) */}
                {tour && tour.bookingQuestions && tour.bookingQuestions.length > 0 && (
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-[#06B6D4]" />
                        Additional Experience Details
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Please provide details to ensure smooth tour preparation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tour.bookingQuestions.map((q) => {
                        const qError = (errors as Record<string, string>)[`question_${q.id}`];
                        const val = bookingAnswers[q.id] ?? '';

                        return (
                          <div
                            key={q.id}
                            className={`rounded-2xl border p-4 ${
                              q.type === 'radio' || (q.options && q.options.length > 2)
                                ? 'sm:col-span-2'
                                : ''
                            } ${
                              qError
                                ? 'border-red-500/50 bg-red-500/5'
                                : 'border-white/10 bg-white/[0.03]'
                            }`}
                          >
                            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                              {q.question}
                              {q.required && <span className="text-[#FF5B00] ml-1">*</span>}
                            </label>

                            {q.helpText && (
                              <p className="text-[11px] text-slate-400 mb-2">{q.helpText}</p>
                            )}

                            {q.type === 'text' && (
                              <input
                                type="text"
                                value={val}
                                placeholder={q.placeholder || ''}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setBookingAnswers((prev) => ({ ...prev, [q.id]: newVal }));
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete (next as any)[`question_${q.id}`];
                                    return next;
                                  });
                                }}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#06B6D4]/40"
                              />
                            )}

                            {q.type === 'number' && (
                              <input
                                type="number"
                                value={val}
                                placeholder={q.placeholder || '0'}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setBookingAnswers((prev) => ({ ...prev, [q.id]: newVal }));
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete (next as any)[`question_${q.id}`];
                                    return next;
                                  });
                                }}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#06B6D4]/40"
                              />
                            )}

                            {q.type === 'phone' && (
                              <input
                                type="tel"
                                value={val}
                                placeholder={q.placeholder || '+20...'}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setBookingAnswers((prev) => ({ ...prev, [q.id]: newVal }));
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete (next as any)[`question_${q.id}`];
                                    return next;
                                  });
                                }}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#06B6D4]/40"
                              />
                            )}

                            {q.type === 'date' && (
                              <input
                                type="date"
                                value={val}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setBookingAnswers((prev) => ({ ...prev, [q.id]: newVal }));
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete (next as any)[`question_${q.id}`];
                                    return next;
                                  });
                                }}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#06B6D4]/40 [color-scheme:dark]"
                              />
                            )}

                            {q.type === 'select' && (
                              <select
                                value={val}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setBookingAnswers((prev) => ({ ...prev, [q.id]: newVal }));
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete (next as any)[`question_${q.id}`];
                                    return next;
                                  });
                                }}
                                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-2.5 text-sm text-white outline-none focus:border-[#06B6D4]/40"
                              >
                                <option value="">Select an option...</option>
                                {(q.options || []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {q.type === 'radio' && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(q.options || []).map((opt) => (
                                  <label
                                    key={opt}
                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer transition ${
                                      val === opt
                                        ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#06B6D4]'
                                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question_${q.id}`}
                                      value={opt}
                                      checked={val === opt}
                                      onChange={() => {
                                        setBookingAnswers((prev) => ({ ...prev, [q.id]: opt }));
                                        setErrors((prev) => {
                                          const next = { ...prev };
                                          delete (next as any)[`question_${q.id}`];
                                          return next;
                                        });
                                      }}
                                      className="sr-only"
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}

                            {q.type === 'checkbox' && (
                              <label className="flex items-center gap-3 cursor-pointer mt-1">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) => {
                                    const newVal = e.target.checked;
                                    setBookingAnswers((prev) => ({ ...prev, [q.id]: newVal }));
                                    setErrors((prev) => {
                                      const next = { ...prev };
                                      delete (next as any)[`question_${q.id}`];
                                      return next;
                                    });
                                  }}
                                  className="h-4 w-4 rounded border-slate-600 text-[#06B6D4] focus:ring-[#06B6D4]"
                                />
                                <span className="text-xs text-slate-300">
                                  {q.placeholder || 'Yes, I confirm'}
                                </span>
                              </label>
                            )}

                            {qError && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                {qError}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pageState === 'error' && errorMessage && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <p className="text-sm text-red-300">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* WhatsApp Instant Notification Opt-in */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 transition-all hover:border-emerald-500/30">
                  <label className="flex items-start gap-3.5 cursor-pointer select-none group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        id="whatsapp-optin"
                        checked={whatsappOptIn}
                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        whatsappOptIn
                          ? 'bg-[#25D366] border-[#25D366] text-white shadow-sm shadow-[#25D366]/30'
                          : 'border-white/30 bg-white/5 group-hover:border-white/50'
                      }`}>
                        {whatsappOptIn && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Receive Instant Boarding Pass & Updates on WhatsApp</span>
                        <span className="inline-flex items-center rounded-full bg-[#25D366]/20 px-2 py-0.5 text-[10px] font-bold text-[#25D366]">Free & Instant</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        We will send your PDF boarding pass, pickup confirmation, and 24/7 emergency support directly to your phone.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{dict.checkout.paymentOptions}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {tour.allowPayAtLocation && <button type="button" onClick={() => handleSchemeChange(PaymentScheme.PAY_ON_ARRIVAL)} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${scheme === PaymentScheme.PAY_ON_ARRIVAL ? 'border-[#FF5B00] bg-[#FF5B00]/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>{dict.checkout.payArrival}</button>}
                    {tour.allowFullOnline !== false && <button type="button" onClick={() => handleSchemeChange(PaymentScheme.FULL_ONLINE)} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${scheme === PaymentScheme.FULL_ONLINE ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>{dict.checkout.payOnline}</button>}
                    {tour.allowDeposit && <button type="button" onClick={() => handleSchemeChange(PaymentScheme.DEPOSIT_ONLINE)} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${scheme === PaymentScheme.DEPOSIT_ONLINE ? 'border-[#EAB308] bg-[#EAB308]/10 text-white' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>{dict.checkout.secureDeposit.replace('20%', `${tour.depositPercentage}%`)}</button>}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#A7F3D0]" />
                    {dict.checkout.securedSSL}
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={pageState === 'submitting'}
                    disabled={pageState === 'submitting'}
                    icon={<CreditCard className="h-4 w-4" />}
                  >
                    {pageState === 'submitting' ? dict.checkout.processingButton : dict.checkout.confirmButton}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <PriceSummarySidebar
              tourTitle={tour.title}
              adultsCount={adultsCount}
              childrenCount={childrenCount}
              infantsCount={infantsCount}
              adultPrice={tour.adultPrice}
              childPrice={tour.childPrice ?? tour.adultPrice}
              infantPrice={tour.infantPrice ?? 0}
              depositPercentage={tour.depositPercentage}
              zoneTransferFee={effectiveZoneFee}
              addonsTotal={addonsTotal}
              scheme={scheme}
              onSchemeChange={handleSchemeChange}
              promoDiscount={promoDiscount}
              onPromoApplied={setPromoDiscount}
              allowDeposit={tour.allowDeposit}
              allowPayAtLocation={tour.allowPayAtLocation}
              allowFullOnline={tour.allowFullOnline}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
