'use client';

import { useState } from 'react';
import type { ZoneOption } from '@/types/booking';
import BookingFormSteps from './BookingFormSteps';
import { useCurrency } from '@/context/CurrencyContext';

interface BookingWidgetProps {
  tourId: string;
  tourTitle: string;
  perPersonPrice: number;
  adultPrice?: number;
  childPrice?: number | null;
  infantPrice?: number | null;
  maxCapacity: number;
  zones: ZoneOption[];
}

export default function BookingWidget({
  tourId,
  tourTitle,
  perPersonPrice,
  adultPrice,
  childPrice,
  infantPrice,
  maxCapacity,
  zones,
}: BookingWidgetProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { formatPrice } = useCurrency();

  const commonProps = {
    tourId,
    tourTitle,
    perPersonPrice,
    adultPrice,
    childPrice,
    infantPrice,
    maxCapacity,
    zones,
  };

  return (
    <>
      {/* Desktop: Sticky Sidebar */}
      <aside className="hidden lg:block lg:sticky lg:top-28 w-full max-w-md">
        <div className="bg-white border border-gray-100 shadow-xl rounded-2xl p-6">
          <BookingFormSteps {...commonProps} />
        </div>
      </aside>

      {/* Mobile: Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="text-lg font-bold text-gray-800">
              {formatPrice(adultPrice ?? perPersonPrice)}
              <span className="text-xs font-normal text-gray-500 ml-1">/ adult</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="px-8 py-3 bg-[#FF5B00] text-white font-semibold rounded-lg hover:bg-[#FF5B00]/90 transition-colors duration-200"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Mobile: Full-screen Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto p-6">
            <BookingFormSteps {...commonProps} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
