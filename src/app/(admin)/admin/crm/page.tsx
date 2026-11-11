import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, CalendarDays, Mail, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  bookingCount: number;
  lastTravelDate: Date | null;
  lastStatus: string | null;
}

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const q = searchParams.q?.trim() ?? '';
  const perPage = 25;
  const skip = (page - 1) * perPage;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { name: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [profiles, total] = await Promise.all([
    prisma.customerProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    }),
    prisma.customerProfile.count({ where }),
  ]);

  // Enrich each profile with booking stats
  const profileIds = profiles.map((p) => p.id);
  const bookingStats = await prisma.booking.groupBy({
    by: ['customerProfileId'],
    where: { customerProfileId: { in: profileIds } },
    _count: { id: true },
    _max: { travelDate: true },
  });
  const statMap = new Map(
    bookingStats.map((s) => [
      s.customerProfileId,
      { count: s._count.id, lastDate: s._max.travelDate },
    ])
  );

  // Get last booking status for each profile
  const lastBookings = await prisma.booking.findMany({
    where: {
      customerProfileId: { in: profileIds },
    },
    orderBy: { travelDate: 'desc' },
    distinct: ['customerProfileId'],
    select: { customerProfileId: true, travelDate: true, status: true },
  });
  const statusMap = new Map(lastBookings.map((b) => [b.customerProfileId, b.status]));

  const customers: CustomerRow[] = profiles.map((p) => ({
    ...p,
    bookingCount: statMap.get(p.id)?.count ?? 0,
    lastTravelDate: statMap.get(p.id)?.lastDate ?? null,
    lastStatus: statusMap.get(p.id) ?? null,
  }));

  const totalPages = Math.ceil(total / perPage);

  const statusColor: Record<string, string> = {
    CONFIRMED: 'text-emerald-400',
    COMPLETED: 'text-blue-400',
    CANCELLED: 'text-red-400',
    PENDING: 'text-amber-400',
  };

  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#00E5FF]">
            Customer Relationship Management
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-5xl">
            Customers
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            {total.toLocaleString()} registered customer{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <form method="GET" className="mb-6">
          <div className="flex gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, or phone…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#00473F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005a50] transition-colors"
            >
              Search
            </button>
            {q && (
              <Link
                href="/admin/crm"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Table */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold hidden md:table-cell">Contact</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Bookings</th>
                  <th className="px-5 py-3.5 font-semibold hidden lg:table-cell">Last Trip</th>
                  <th className="px-5 py-3.5 font-semibold hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No customers found{q ? ` for "${q}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const lastTripDate = c.lastTravelDate
                      ? new Date(c.lastTravelDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#00473F]/30 border border-[#00473F]/50 flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-[#00E5FF]" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{c.name || '—'}</p>
                              <p className="text-xs text-slate-500 md:hidden">
                                {c.email || c.phone || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="space-y-1">
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Mail className="h-3 w-3 text-slate-500" />
                                {c.email}
                              </div>
                            )}
                            {c.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Phone className="h-3 w-3 text-slate-500" />
                                {c.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-block rounded-full bg-[#00473F]/20 border border-[#00473F]/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                            {c.bookingCount}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-slate-400">{lastTripDate}</span>
                            {c.lastStatus && (
                              <span className={`text-[10px] font-bold ${statusColor[c.lastStatus] ?? 'text-slate-500'}`}>
                                {c.lastStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-xs text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/bookings?customerProfileId=${c.id}`}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-[#00E5FF]/30 hover:text-[#00E5FF] transition-colors"
                          >
                            Bookings
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm">
            <p className="text-slate-500">
              Page {page} of {totalPages} &mdash; {total} customers
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/crm?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 hover:border-[#00E5FF]/30 hover:text-[#00E5FF] transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/crm?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 hover:border-[#00E5FF]/30 hover:text-[#00E5FF] transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
