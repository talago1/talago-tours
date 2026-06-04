'use client';

import { useState, useRef, useCallback } from 'react';
import type { ZoneOption, CheckoutResponse, CheckoutError } from '@/types/booking';
import {
  validateTravelDate,
  validateGuestCount,
  validateHotelName,
  validateCustomerName,
  validateCustomerEmail,
  validateCustomerPhone,
} from '@/utils/bookingValidation';
import { calculateTotalPrice } from '@/utils/priceCalculator';

interface BookingFormStepsProps {
  tourId: string;
  tourTitle: string;
  perPersonPrice: number;
  maxCapacity: number;
  zones: ZoneOption[];
  onClose?: () => void;
}

type Step = 1 | 2;

export default function BookingFormSteps({
  tourId,
  tourTitle,
  perPersonPrice,
  maxCapacity,
  zones,
  onClose,
}: BookingFormStepsProps) {
  const [step, setStep] = useState<Step>(1);
  const [travelDate, setTravelDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);
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

  const totalPrice = calculateTotalPrice({
    perPersonPrice,
    guestCount,
    zoneTransferFee: selectedZone?.transferFee ?? 0,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const dateErr = validateTravelDate(travelDate);
    if (dateErr) newErrors.travelDate = dateErr;
    const guestErr = validateGuestCount(guestCount, maxCapacity);
    if (guestErr) newErrors.guestCount = guestErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [travelDate, guestCount, maxCapacity]);

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
          guestCount,
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

  const isSoldOut = maxCapacity <= 0;

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

      {isSoldOut ? (
        <div className="text-center py-6">
          <span className="inline-block px-4 py-2 bg-[#00473F]/10 text-[#00473F] font-semibold rounded-lg text-sm">
            Sold Out
          </span>
          <p className="text-sm text-gray-500 mt-2">No available dates for this tour.</p>
        </div>
      ) : (
        <>
          {step === 1 && (
            <div className="space-y-4">
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

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Guests</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    disabled={guestCount <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#FF5B00] hover:text-[#FF5B00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease guests"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-lg font-semibold text-gray-800 w-8 text-center">
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => Math.min(maxCapacity, c + 1))}
                    disabled={guestCount >= maxCapacity}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#FF5B00] hover:text-[#FF5B00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase guests"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {errors.guestCount && (
                  <p className="text-xs text-red-500 mt-1">{errors.guestCount}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Total</span>
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
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Total: <strong className="text-gray-800">${totalPrice.toFixed(2)}</strong></span>
                <span>{travelDate} · {guestCount} guest{guestCount > 1 ? 's' : ''}</span>
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
      )}
    </div>
  );
}
