import type { BookingStatus } from '@/types/booking';

const STYLES: Record<BookingStatus, string> = {
  PENDING: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  CONFIRMED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  COMPLETED: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  CANCELLED: 'border-red-500/20 bg-red-500/10 text-red-400',
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
        STYLES[status] || 'border-slate-500/20 bg-slate-500/10 text-slate-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'PENDING' ? 'bg-amber-400' :
          status === 'CONFIRMED' ? 'bg-emerald-400' :
          status === 'COMPLETED' ? 'bg-blue-400' :
          status === 'CANCELLED' ? 'bg-red-400' : 'bg-slate-400'
        }`}
      />
      {status}
    </span>
  );
}
