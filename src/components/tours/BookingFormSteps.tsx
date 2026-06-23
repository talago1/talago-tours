'use client';

import { useState, useRef, useCallback } from 'react';
import type { ZoneOption, CheckoutResponse, CheckoutError } from '@/types/booking';
import {
  validateTravelDate,
  validateHotelName,
  validateCustomerName,
  validateCustomerEmail,
  validateCustomerPhone,
  validateGuestTiers,
} from '@/utils/bookingValidation';
import { calculateTieredPrice } from '@/utils/priceCalculator';
import { Users, Baby, UserRound } from 'lucide-react';

interface BookingFormStepsProps {
  tourId: string;
  tourTitle: string;
  perPersonPrice: number;
  adultPrice?: number;
  childPrice?: number | null;
  infantPrice?: number | null;
  maxCapacity: number;
  zones: ZoneOption[];
  onClose?: () => void;
}

type Step = 1 | 2;

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
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
          {priceLabel && <p className="text-xs font-medium text-[#FF5B00]">{priceLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#FF5B00] hover:text-[#FF5B00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            className="w-12 text-center text-base font-bold text-gray-800 border border-[#FF5B00] rounded-lg px-1 py-0.5 outline-none focus:ring-2 focus:ring-[#FF5B00]/30"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-12 text-center text-base font-bold text-gray-800 hover:text-[#FF5B00] cursor-pointer transition-colors select-none"
            title="Click to type a number"
          >
            {value}
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#FF5B00] hover:text-[#FF5B00] transition-colors"
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

export default function BookingFormSteps({
  tourId,
  tourTitle,
  perPersonPrice,
  adultPrice,
  childPrice,
  infantPrice,
  zones,
  onClose,
}: BookingFormStepsProps) {
  const effectiveAdultPrice = adultPrice ?? perPersonPrice;
  const hasChildPrice = (childPrice ?? 0) > 0;
  const hasInfantPrice = (infantPrice ?? 0) > 0;

  const [step, setStep] = useState<Step>(1);
  const [travelDate, setTravelDate] = useState('');
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [zoneId, setZoneId] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [pickupDirectives, setPickupDirectives] = useState('');
  const [flightNumbers, setFlightNumbers] = useState('');
  const [bedConfiguration, setBedConfiguration] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const selectedZone = zones.find((z) => z.id === zoneId);

  const totalPrice = calculateTieredPrice({
    adultPrice: effectiveAdultPrice,
    childPrice,
    infantPrice,
    adultsCount,
    childrenCount,
    infantsCount,
    zoneTransferFee: selectedZone?.transferFee ?? 0,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const dateErr = validateTravelDate(travelDate);
    if (dateErr) newErrors.travelDate = dateErr;
    const guestErr = validateGuestTiers(adultsCount, childrenCount, infantsCount);
    if (guestErr) newErrors.guests = guestErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [travelDate, adultsCount, childrenCount, infantsCount]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!zoneId) newErrors.zoneId = 'Please select a pickup zone';
    const hotelErr = validateHotelName(hotelName);
    if (hotelErr) newErrors.hotelName = hotelErr;
    const nameErr = validateCustomerName(customerName);
    if (nameErr) newErrors.customerName = nameErr;
    const emailErr = validateCustomerEmail(customerEmail);
    if (emailErr) newErrors.customerEmail = emailErr;
    const phoneErr = validateCustomerPhone(customerPhone);
    if (phoneErr) newErrors.customerPhone = phoneErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [zoneId, hotelName, customerName, customerEmail, customerPhone]);

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId,
          zoneId,
          hotelName: hotelName.trim(),
          travelDate,
          adultsCount,
          childrenCount,
          infantsCount,
          guestCount: adultsCount + childrenCount + infantsCount,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          roomNumber: roomNumber.trim() || undefined,
          pickupDirectives: pickupDirectives.trim() || undefined,
          flightNumbers: flightNumbers.trim() || undefined,
          bedConfiguration: bedConfiguration.trim() || undefined,
          specialRequirements: specialRequirements.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err: CheckoutError = await res.json();
        if (err.field) {
          setErrors((prev) => ({ ...prev, [err.field!]: err.error }));
        }
        setSubmitError(err.error || 'Failed to create booking');
        setIsSubmitting(false);
        submittingRef.current = false;
        return;
      }

      const data: CheckoutResponse = await res.json();
      window.location.href = `/tours/checkout/success?ref=${data.bookingReference}`;
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const totalGuests = adultsCount + childrenCount + infantsCount;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{tourTitle}</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <>
        {step === 1 && (
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Travel Date</label>
              <input
                type="date"
                value={travelDate}
                min={minDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 ${
                  errors.travelDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.travelDate && (
                <p className="text-xs text-red-500 mt-1">{errors.travelDate}</p>
              )}
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Guests
              </label>
              <div className="border border-gray-200 rounded-xl px-4 bg-gray-50/50">
                <GuestStepper
                  label="Adults"
                  sublabel="Age 12+"
                  priceLabel={`$${effectiveAdultPrice.toFixed(0)} / person`}
                  icon={UserRound}
                  iconColor="bg-[#FF5B00]/10 text-[#FF5B00]"
                  value={adultsCount}
                  onChange={setAdultsCount}
                />
                {hasChildPrice && (
                  <GuestStepper
                    label="Children"
                    sublabel="Age 3–11"
                    priceLabel={`$${childPrice!.toFixed(0)} / child`}
                    icon={Users}
                    iconColor="bg-blue-500/10 text-blue-500"
                    value={childrenCount}
                    onChange={setChildrenCount}
                  />
                )}
                {hasInfantPrice && (
                  <GuestStepper
                    label="Infants"
                    sublabel="Age 0–2"
                    priceLabel={`$${infantPrice!.toFixed(0)} / infant`}
                    icon={Baby}
                    iconColor="bg-purple-500/10 text-purple-500"
                    value={infantsCount}
                    onChange={setInfantsCount}
                  />
                )}
                {/* If no child/infant pricing, still let users declare children (counted as adults) */}
                {!hasChildPrice && (
                  <GuestStepper
                    label="Children"
                    sublabel="Same price as adults"
                    icon={Users}
                    iconColor="bg-blue-500/10 text-blue-500"
                    value={childrenCount}
                    onChange={setChildrenCount}
                  />
                )}
                {!hasInfantPrice && (
                  <GuestStepper
                    label="Infants"
                    sublabel="Age 0–2 · Free"
                    icon={Baby}
                    iconColor="bg-purple-500/10 text-purple-500"
                    value={infantsCount}
                    onChange={setInfantsCount}
                  />
                )}
              </div>
              {errors.guests && (
                <p className="text-xs text-red-500 mt-1">{errors.guests}</p>
              )}
            </div>

            {/* Price Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Total · {totalGuests} guest{totalGuests !== 1 ? 's' : ''}
              </span>
              <span className="text-lg font-bold text-gray-800">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 bg-[#FF5B00] text-white font-semibold rounded-lg hover:bg-[#FF5B00]/90 transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-sm text-gray-500 bg-orange-50 rounded-lg px-3 py-2">
              <span>Total: <strong className="text-gray-800">${totalPrice.toFixed(2)}</strong></span>
              <span>{travelDate} · {totalGuests} guest{totalGuests > 1 ? 's' : ''}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 bg-white ${
                  errors.zoneId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select zone...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}{z.transferFee > 0 ? ` (+$${z.transferFee.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
              {errors.zoneId && (
                <p className="text-xs text-red-500 mt-1">{errors.zoneId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hotel Name</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                maxLength={200}
                placeholder="e.g. Steigenberger Al Dau"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 ${
                  errors.hotelName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.hotelName && (
                  <p className="text-xs text-red-500">{errors.hotelName}</p>
                )}
                <span className="text-xs text-gray-400 ml-auto">{hotelName.length}/200</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Room Number</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Directives</label>
                <input
                  type="text"
                  value={pickupDirectives}
                  onChange={(e) => setPickupDirectives(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Flight Numbers</label>
                <input
                  type="text"
                  value={flightNumbers}
                  onChange={(e) => setFlightNumbers(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bed Config</label>
                <input
                  type="text"
                  value={bedConfiguration}
                  onChange={(e) => setBedConfiguration(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Special Requirements</label>
              <textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Optional notes or requests..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Smith"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 ${
                  errors.customerName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customerName && (
                <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 ${
                  errors.customerEmail ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customerEmail && (
                <p className="text-xs text-red-500 mt-1">{errors.customerEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Phone <span className="text-gray-400 font-normal">(WhatsApp, include country code)</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +201001234567"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5B00]/50 ${
                  errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customerPhone && (
                <p className="text-xs text-red-500 mt-1">{errors.customerPhone}</p>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 bg-[#FF5B00] text-white font-semibold rounded-lg transition-all duration-200 ${
                  isSubmitting
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-[#FF5B00]/90'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Booking...
                  </span>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
