'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TourOption {
  id: string;
  title: string;
}

interface DispatchSelectorProps {
  tours: TourOption[];
}

export default function DispatchSelector({ tours }: DispatchSelectorProps) {
  const router = useRouter();
  const [selectedTourId, setSelectedTourId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const handleOpen = () => {
    if (!selectedTourId || !selectedDate) return;
    router.push(`/admin/operations/dispatch?tourId=${encodeURIComponent(selectedTourId)}&date=${encodeURIComponent(selectedDate)}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Tour</label>
        <select
          value={selectedTourId}
          onChange={(e) => setSelectedTourId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
        >
          <option value="">Select a tour...</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Departure Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
        />
      </div>

      <button
        onClick={handleOpen}
        disabled={!selectedTourId || !selectedDate}
        className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
          !selectedTourId || !selectedDate
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-[#FF5B00] hover:bg-[#e65200]'
        }`}
      >
        Open Dispatcher
      </button>
    </div>
  );
}
