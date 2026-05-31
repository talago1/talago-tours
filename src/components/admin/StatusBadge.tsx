import type { BookingStatus } from '@/types/booking';

const STYLES: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

interface StatusBadgeProps {
  status: BookingStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {status}
    </span>
  );
}
