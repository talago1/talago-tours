'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import PriceSummarySidebar from '@/components/checkout/PriceSummarySidebar';
import Button from '@/components/ui/Button';
import { PaymentScheme, type CheckoutFormData, type InitializeResponse } from '@/types/checkout';
import type { PromoDiscount } from '@/utils/promo';

interface TourDetails {
  id: string;
  title: string;
  basePrice: number;
  maxCapacity: number | null;
}

type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;
type PageState = 'loading' | 'form' | 'submitting' | 'confirm' | 'error';

function validateForm(data: CheckoutFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.leadName.trim()) errors.leadName = 'Name is required';
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?\d{7,15}$/.test(data.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Invalid phone number';
  }
  if (!data.hotelName.trim()) errors.hotelName = 'Hotel name is required';
  if (!data.pickupTime.trim()) errors.pickupTime = 'Pickup time is required';
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
  const tourId = params.tourId as string;

  const [tour, setTour] = useState<TourDetails | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [scheme, setScheme] = useState<PaymentScheme>(PaymentScheme.PAY_ON_ARRIVAL);
  const [guestCount, setGuestCount] = useState(1);
  const [departureDate, setDepartureDate] = useState('');
  const [confirmData, setConfirmData] = useState<InitializeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [resumeBookingId, setResumeBookingId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);

  const [form, setForm] = useState<CheckoutFormData>({
    leadName: '',
    email: '',
    phone: '',
    hotelName: '',
    roomNumber: '',
    pickupTime: '',
    paymentScheme: PaymentScheme.PAY_ON_ARRIVAL,
  });
  const [errors, setErrors] = useState<FormErrors>({});

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
        setTour({
          id: data.id,
          title,
          basePrice: Number(data.basePrice ?? data.basePriceUSD ?? 0),
          maxCapacity: data.maxCapacity ?? null,
        });
      } catch {
        setTour(null);
      } finally {
        setPageState('form');
      }
    }
    loadTour();

    const pending = sessionStorage.getItem('pendingBookingId');
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
    const formErrors = validateForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    if (!tour || !departureDate) {
      setErrorMessage('Please select a departure date');
      setPageState('error');
      return;
    }

    setPageState('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          departureDate,
          guestCount,
          formData: form,
          promoCode: promoDiscount?.code ?? null,
        }),
      });

      const responseData: InitializeResponse & { error?: string; code?: string } =
        await res.json();

      if (res.status === 409) {
        setErrorMessage(responseData.error ?? 'This tour is sold out for this date.');
        setPageState('error');
        return;
      }

      if (res.status === 400) {
        setErrorMessage(responseData.error ?? 'Please check your information.');
        setPageState('error');
        return;
      }

      if (!res.ok) {
        setErrorMessage(responseData.error ?? 'Something went wrong. Please try again.');
        setPageState('error');
        return;
      }

      setConfirmData(responseData);

      if (responseData.scheme === PaymentScheme.PAY_ON_ARRIVAL) {
        setPageState('confirm');
      } else if (responseData.gatewayIframeUrl) {
        sessionStorage.setItem('pendingBookingId', responseData.bookingId);
        window.location.href = responseData.gatewayIframeUrl;
      }
    } catch {
      setErrorMessage('Unable to reach the server. Please check your connection.');
      setPageState('error');
    }
  }, [form, tour, departureDate, guestCount, promoDiscount]);

  const handleResume = useCallback(() => {
    if (resumeBookingId) {
      router.push(`/booking/${resumeBookingId}`);
    }
  }, [resumeBookingId, router]);

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#070F1E]">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#06B6D4]" />
          <p className="mt-4 text-sm font-bold text-slate-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#070F1E]">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-[#EAB308]" />
          <h1 className="mt-4 text-2xl font-black text-white">Tour not found</h1>
          <p className="mt-2 text-slate-400">This tour may no longer be available.</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push('/tours')}
          >
            Browse tours
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
          <h1 className="text-3xl font-black text-white">Booking Confirmed!</h1>
          <p className="mt-3 text-slate-400">
            Your booking reference is{' '}
            <span className="font-bold text-white">{confirmData.bookingId}</span>
          </p>

          {confirmData.amountDueOnArrival > 0 && (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-[#FF5B00]/20 bg-[#FF5B00]/5 p-6">
              <p className="text-sm text-slate-400">Amount due on arrival</p>
              <p className="mt-1 text-3xl font-black text-[#FF5B00]">
                EGP {confirmData.amountDueOnArrival.toFixed(2)}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="mt-8"
            onClick={() => router.push(`/booking/${confirmData.bookingId}`)}
          >
            View Booking Details
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
          Back
        </button>

        <div className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">Secure Checkout</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-4xl">
            Complete your booking
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Fill in your details to reserve your spot. Your information is securely processed.
          </p>
        </div>

        {resumeBookingId && (
          <div className="mb-8 rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-[#06B6D4]" />
              <p className="text-sm text-slate-300">
                You have a pending payment.{' '}
                <button
                  type="button"
                  onClick={handleResume}
                  className="font-bold text-[#06B6D4] underline transition-colors hover:text-[#EAB308]"
                >
                  Resume payment
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
                Travel Details
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Departure Date" required>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all duration-300 hover:border-white/20 focus-within:border-[#06B6D4]/40 focus-within:bg-white/[0.06]">
                    <CalendarDays className="h-5 w-5 shrink-0 text-slate-500" />
                    <input
                      id="departureDate"
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="flex-1 bg-transparent text-base font-medium text-white outline-none [color-scheme:dark]"
                    />
                  </div>
                </FormField>

                <FormField label="Number of Guests" required>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-all duration-300 hover:border-white/20 focus-within:border-[#06B6D4]/40 focus-within:bg-white/[0.06]">
                    <Users className="h-5 w-5 shrink-0 text-slate-500" />
                    <select
                      id="guestCount"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="flex-1 bg-transparent text-base font-medium text-white outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n} className="bg-[#0B1528] text-white">
                          {n} {n === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>
              </div>
            </div>

            {/* Guest Information */}
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-black text-white">
                <User className="h-5 w-5 text-[#06B6D4]" />
                Guest Information
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
                  <FormField label="Lead Traveler Name" required error={errors.leadName}>
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

                  <FormField label="Email Address" required error={errors.email}>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="john@example.com"
                      icon={<Mail className="h-5 w-5" />}
                      error={errors.email}
                    />
                  </FormField>

                  <FormField label="WhatsApp Number" required error={errors.phone}>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="+201234567890"
                      icon={<Phone className="h-5 w-5" />}
                      error={errors.phone}
                    />
                  </FormField>

                  <FormField label="Hotel Name" required error={errors.hotelName}>
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

                  <FormField label="Room Number">
                    <Input
                      id="roomNumber"
                      type="text"
                      value={form.roomNumber ?? ''}
                      onChange={(e) => handleFieldChange('roomNumber', e.target.value)}
                      placeholder="Optional"
                    />
                  </FormField>

                  <FormField label="Preferred Pickup Time" required error={errors.pickupTime}>
                    <Input
                      id="pickupTime"
                      type="time"
                      value={form.pickupTime}
                      onChange={(e) => handleFieldChange('pickupTime', e.target.value)}
                      icon={<Clock className="h-5 w-5" />}
                      error={errors.pickupTime}
                    />
                  </FormField>
                </div>

                {pageState === 'error' && errorMessage && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <p className="text-sm text-red-300">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#A7F3D0]" />
                    Secured with SSL encryption
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={pageState === 'submitting'}
                    disabled={pageState === 'submitting'}
                    icon={<CreditCard className="h-4 w-4" />}
                  >
                    {pageState === 'submitting' ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <PriceSummarySidebar
              tourTitle={tour.title}
              guestCount={guestCount}
              basePrice={tour.basePrice}
              scheme={scheme}
              onSchemeChange={handleSchemeChange}
              promoDiscount={promoDiscount}
              onPromoApplied={setPromoDiscount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
