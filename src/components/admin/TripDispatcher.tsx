'use client';

import { useState, useEffect } from 'react';
import { Anchor, Bus, Compass, DollarSign, UserCheck, ShieldCheck, Plus, CheckCircle2, AlertCircle, FileText, Send, Phone, Car } from 'lucide-react';

interface CrewAssignmentItem {
  id: string;
  name: string;
  role: 'CAPTAIN' | 'GUIDE' | 'DRIVER';
  phone?: string;
}

interface FleetAssetItem {
  id: string;
  name: string;
  type: 'BOAT' | 'SPEEDBOAT' | 'VEHICLE' | 'QUAD';
  capacity?: number;
}

interface ExpenseItem {
  id: string;
  category: 'FUEL' | 'CREW_PAYROLL' | 'CATERING' | 'PERMITS' | 'MISC';
  amount: number;
  currency: 'USD' | 'EGP';
  notes?: string;
}

export default function TripDispatcher({ tourId, date }: { tourId: string; date: string }) {
  const [loading, setLoading] = useState(false);
  const [crew, setCrew] = useState<CrewAssignmentItem[]>([
    { id: 'c1', name: 'Captain Mahmoud Soliman', role: 'CAPTAIN', phone: '+20 100 123 4567' },
    { id: 'c2', name: 'Youssef Al-Sayed', role: 'GUIDE', phone: '+20 101 987 6543' },
  ]);
  const [fleet, setFleet] = useState<FleetAssetItem[]>([
    { id: 'f1', name: 'Royal Star Yacht I', type: 'BOAT', capacity: 35 },
    { id: 'f2', name: 'VIP Transfer Coaster 04', type: 'VEHICLE', capacity: 20 },
  ]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'e1', category: 'FUEL', amount: 150, currency: 'USD', notes: 'Bunker fuel refill at Hurghada Marina' },
    { id: 'e2', category: 'CATERING', amount: 80, currency: 'USD', notes: 'Fresh seafood & tropical fruit lunch' },
  ]);

  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewRole, setNewCrewRole] = useState<'CAPTAIN' | 'GUIDE' | 'DRIVER'>('GUIDE');
  const [newExpenseCategory, setNewExpenseCategory] = useState<'FUEL' | 'CREW_PAYROLL' | 'CATERING' | 'PERMITS' | 'MISC'>('FUEL');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseNotes, setNewExpenseNotes] = useState('');

  const addCrew = () => {
    if (!newCrewName.trim()) return;
    setCrew((prev) => [
      ...prev,
      { id: `c_${Date.now()}`, name: newCrewName.trim(), role: newCrewRole },
    ]);
    setNewCrewName('');
  };

  const addExpense = () => {
    const amt = parseFloat(newExpenseAmount);
    if (isNaN(amt) || amt <= 0) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: `e_${Date.now()}`,
        category: newExpenseCategory,
        amount: amt,
        currency: 'USD',
        notes: newExpenseNotes.trim() || undefined,
      },
    ]);
    setNewExpenseAmount('');
    setNewExpenseNotes('');
  };

  const [totalExpenseUSD, setTotalExpenseUSD] = useState(0);

  const [dispatchDriverName, setDispatchDriverName] = useState('Ahmed Hassan');
  const [dispatchDriverPhone, setDispatchDriverPhone] = useState('+20 100 876 5432');
  const [dispatchVehicle, setDispatchVehicle] = useState('Toyota Coaster VIP — Plate 4821');
  const [dispatchNotes, setDispatchNotes] = useState('Please wait in the hotel main lobby 5 minutes before scheduled pickup time.');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleBroadcastDispatch = async () => {
    if (!dispatchDriverName.trim()) {
      alert('Please provide a driver name.');
      return;
    }
    setDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await fetch('/api/admin/operations/dispatch/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId,
          departureDate: date,
          driverName: dispatchDriverName.trim(),
          driverPhone: dispatchDriverPhone.trim(),
          vehicleDetails: dispatchVehicle.trim(),
          pickupNotes: dispatchNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch briefing');
      setDispatchStatus(`Successfully dispatched driver briefings to ${data.dispatchedCount} / ${data.totalGuests} guests via WhatsApp & Email!`);
    } catch (err: any) {
      setDispatchStatus(`Error: ${err.message || 'Dispatch failed'}`);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-8 text-[#F8FAFC]">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4]">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Live Departure Dispatch Console</h2>
            <p className="text-xs text-slate-400">
              Tour Reference: <span className="font-bold text-[#06B6D4]">{tourId}</span> — Date: <span className="font-bold text-[#EAB308]">{date}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Operational Ready
          </span>
          <a
            href={`/api/admin/operations/manifest?tourId=${encodeURIComponent(tourId)}&departureDate=${encodeURIComponent(date)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10"
          >
            <FileText className="h-3.5 w-3.5" />
            Download Manifest
          </a>
        </div>
      </div>

      {/* Automated Driver Briefing Card */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-[#0B1528] to-[#070F1E] p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/20 text-[#00E5FF]">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Guest Transfer Briefing Dispatcher</h3>
              <p className="text-xs text-slate-400">Broadcast driver contact, pickup timing, and vehicle details straight to travelers via WhatsApp & Email</p>
            </div>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-[#00E5FF] border border-cyan-500/20">
            Automated WhatsApp + Email
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Assigned Driver Name *</label>
            <input
              type="text"
              value={dispatchDriverName}
              onChange={(e) => setDispatchDriverName(e.target.value)}
              placeholder="Driver full name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Driver Phone / WhatsApp</label>
            <input
              type="text"
              value={dispatchDriverPhone}
              onChange={(e) => setDispatchDriverPhone(e.target.value)}
              placeholder="e.g. +20 100 876 5432"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Model &amp; Plate #</label>
            <input
              type="text"
              value={dispatchVehicle}
              onChange={(e) => setDispatchVehicle(e.target.value)}
              placeholder="e.g. Toyota Coaster — Plate 4821"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-bold text-slate-300 mb-1">Departure Notes / Lobby Directives (Optional)</label>
          <input
            type="text"
            value={dispatchNotes}
            onChange={(e) => setDispatchNotes(e.target.value)}
            placeholder="e.g. Driver will meet you at the main hotel lobby. Look for the Talago badge."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF]"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleBroadcastDispatch}
            disabled={dispatching || !dispatchDriverName.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-40"
          >
            {dispatching ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Broadcast Driver Details to All Departure Guests</span>
          </button>

          {dispatchStatus && (
            <p className={`text-xs font-bold ${dispatchStatus.startsWith('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
              {dispatchStatus}
            </p>
          )}
        </div>
      </div>

      {/* Grid: Crew Assignments + Fleet Assets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Crew Assignment Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4]">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Crew Roster</h3>
                <p className="text-xs text-slate-400">Assigned captains, guides & drivers</p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
              {crew.length} Assigned
            </span>
          </div>

          <div className="space-y-3">
            {crew.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/15"
              >
                <div>
                  <p className="font-bold text-white">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.phone || 'No direct phone logged'}</p>
                </div>
                <span className="rounded-full bg-[#06B6D4]/10 px-3 py-1 text-xs font-black text-[#06B6D4]">
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          {/* Add Crew Input */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <input
              type="text"
              placeholder="Crew member name..."
              value={newCrewName}
              onChange={(e) => setNewCrewName(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-[#06B6D4]"
            />
            <select
              value={newCrewRole}
              onChange={(e) => setNewCrewRole(e.target.value as any)}
              className="rounded-2xl border border-white/10 bg-[#0B1528] px-3 py-2.5 text-xs font-bold text-white outline-none"
            >
              <option value="CAPTAIN">CAPTAIN</option>
              <option value="GUIDE">GUIDE</option>
              <option value="DRIVER">DRIVER</option>
            </select>
            <button
              onClick={addCrew}
              className="inline-flex items-center gap-1 rounded-2xl bg-[#06B6D4] px-4 py-2.5 text-xs font-black text-[#070F1E] transition-all hover:bg-[#00E5FF]"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* Fleet Assets Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAB308]/10 text-[#EAB308]">
                <Anchor className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Fleet & Vehicles</h3>
                <p className="text-xs text-slate-400">Yachts, coasters & quad assets</p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
              {fleet.length} Active Assets
            </span>
          </div>

          <div className="space-y-3">
            {fleet.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/15"
              >
                <div>
                  <p className="font-bold text-white">{asset.name}</p>
                  <p className="text-xs text-slate-400">Capacity: {asset.capacity || 'N/A'} guests</p>
                </div>
                <span className="rounded-full bg-[#EAB308]/10 px-3 py-1 text-xs font-black text-[#EAB308]">
                  {asset.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trip Expense Logger */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Trip Operational Expenses</h3>
              <p className="text-xs text-slate-400">Log fuel, catering, permits, and operational costs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Logged Expense</p>
            <p className="text-xl font-black text-emerald-300">${totalExpenseUSD.toFixed(2)}</p>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-bold text-white">{exp.category}</td>
                  <td className="p-3 font-black text-emerald-300">${exp.amount.toFixed(2)} {exp.currency}</td>
                  <td className="p-3 text-slate-400">{exp.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Expense Form */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4 border-t border-white/10 pt-4">
          <select
            value={newExpenseCategory}
            onChange={(e) => setNewExpenseCategory(e.target.value as any)}
            className="rounded-2xl border border-white/10 bg-[#0B1528] px-3 py-2.5 text-xs font-bold text-white outline-none"
          >
            <option value="FUEL">FUEL</option>
            <option value="CREW_PAYROLL">CREW_PAYROLL</option>
            <option value="CATERING">CATERING</option>
            <option value="PERMITS">PERMITS</option>
            <option value="MISC">MISC</option>
          </select>
          <input
            type="number"
            placeholder="Amount ($)..."
            value={newExpenseAmount}
            onChange={(e) => setNewExpenseAmount(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400"
          />
          <input
            type="text"
            placeholder="Notes (optional)..."
            value={newExpenseNotes}
            onChange={(e) => setNewExpenseNotes(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-400 sm:col-span-1"
          />
          <button
            onClick={addExpense}
            className="inline-flex items-center justify-center gap-1 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-[#070F1E] transition-all hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Log Expense
          </button>
        </div>
      </div>
    </div>
  );
}
