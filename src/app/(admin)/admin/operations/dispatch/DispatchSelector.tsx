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
    <div className="space-y-5 rounded-3xl border border-white/10 bg-[#0B1528] p-7 shadow-2xl backdrop-blur-xl">
      <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-[#06B6D4]">Select Experience</label>
        <select
          value={selectedTourId}
          onChange={(e) => setSelectedTourId(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#06B6D4]"
        >
          <option value="">Choose a tour...</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#0B1528] text-white">
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-[#EAB308]">Departure Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
          className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EAB308] [color-scheme:dark]"
        />
      </div>

      <button
        onClick={handleOpen}
        disabled={!selectedTourId || !selectedDate}
        className={`w-full rounded-2xl py-3.5 text-sm font-black uppercase tracking-wider transition-all duration-300 ${
          !selectedTourId || !selectedDate
            ? 'cursor-not-allowed bg-white/10 text-slate-500'
            : 'bg-[#06B6D4] text-[#070F1E] shadow-xl shadow-[#06B6D4]/20 hover:bg-[#00E5FF]'
        }`}
      >
        Open Live Dispatcher
      </button>
    </div>
  );
}

