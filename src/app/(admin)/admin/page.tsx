import Link from 'next/link';
export const dynamic = 'force-dynamic';
import {
  CalendarCheck,
  DollarSign,
  Download,
  MessageSquareWarning,
  PlaneTakeoff,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Star,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTourTitle(translations: unknown): string {
  const value = translations as Record<string, { title?: string }> | null;
  return value?.en?.title ?? 'Untitled Experience';
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-400/10 text-emerald-300';
    case 'PENDING':
      return 'bg-[#EAB308]/10 text-[#EAB308]';
    case 'COMPLETED':
      return 'bg-[#06B6D4]/10 text-[#06B6D4]';
    case 'CANCELLED':
      return 'bg-red-400/10 text-red-300';
    default:
      return 'bg-white/10 text-slate-300';
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function AdminControlDeskPage() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeBookings,
    pendingReviews,
    totalBookingsCount,
    revenueAggregate,
    monthlyRevenue,
    recentBookings,
    topTours,
    todayBookings,
    destinationRevenue,
    confirmedTodayCount,
  ] = await Promise.all([
    // Active bookings
    prisma.booking.count({
      where: { status: { in: ['PENDING', 'CONFIRMED'] } },
    }),

    // Pending reviews
    prisma.review.count({
      where: { status: 'PENDING' },
    }),

    // Total bookings all-time
    prisma.booking.count(),

    // Total revenue (confirmed + completed)
    prisma.booking.aggregate({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _sum: { totalPriceUSD: true },
    }),

    // Revenue last 30 days
    prisma.booking.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalPriceUSD: true },
    }),

    // Recent bookings
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        guestCount: true,
        totalPriceUSD: true,
        status: true,
        createdAt: true,
        travelDate: true,
        channel: true,
        tour: { select: { translations: true } },
      },
    }),

    // Top selling tours
    prisma.booking.groupBy({
      by: ['tourId'],
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _count: { id: true },
      _sum: { totalPriceUSD: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),

    // Today's departure bookings
    prisma.booking.findMany({
      where: {
        travelDate: { gte: todayStart, lt: todayEnd },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: {
        id: true,
        guestCount: true,
        tourId: true,
        tour: { select: { translations: true, maxCapacity: true } },
      },
    }),

    // Revenue by destination
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: {
        totalPriceUSD: true,
        tour: {
          select: {
            destination: { select: { name: true } },
          },
        },
      },
    }),

    // Today confirmed count
    prisma.booking.count({
      where: {
        travelDate: { gte: todayStart, lt: todayEnd },
        status: 'CONFIRMED',
      },
    }),
  ]);

  // ---------------------------------------------------------------------------
  // Computed Metrics
  // ---------------------------------------------------------------------------

  const totalRevenue = revenueAggregate._sum.totalPriceUSD ?? 0;
  const monthlyRevenueTotal = monthlyRevenue._sum.totalPriceUSD ?? 0;
  const avgBookingValue = totalBookingsCount > 0 ? totalRevenue / totalBookingsCount : 0;

  // Destination revenue breakdown
  const destRevenueMap = new Map<string, number>();
  for (const b of destinationRevenue) {
    const destName = b.tour.destination?.name ?? 'Uncategorized';
    destRevenueMap.set(destName, (destRevenueMap.get(destName) ?? 0) + b.totalPriceUSD);
  }
  const destRevenueEntries = Array.from(destRevenueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxDestRevenue = destRevenueEntries[0]?.[1] ?? 1;

  // Tour names for top tours
  const topTourIds = topTours.map((t) => t.tourId);
  const tourDetails = topTourIds.length > 0
    ? await prisma.tour.findMany({
        where: { id: { in: topTourIds } },
        select: { id: true, translations: true },
      })
    : [];
  const tourNameMap = new Map(tourDetails.map((t) => [t.id, getTourTitle(t.translations)]));

  // Today's capacity utilization
  const todayTourCapacityMap = new Map<string, { used: number; max: number; name: string }>();
  for (const b of todayBookings) {
    const existing = todayTourCapacityMap.get(b.tourId);
    if (existing) {
      existing.used += b.guestCount;
    } else {
      todayTourCapacityMap.set(b.tourId, {
        used: b.guestCount,
        max: b.tour.maxCapacity,
        name: getTourTitle(b.tour.translations),
      });
    }
  }
  const capacityEntries = Array.from(todayTourCapacityMap.values());

  // KPI Cards
  const kpiCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: `${formatCurrency(monthlyRevenueTotal)} this month`,
      icon: DollarSign,
      accentBg: 'bg-emerald-400/10',
      accentText: 'text-emerald-300',
      accentGlow: 'shadow-emerald-500/10',
    },
    {
      label: 'Active Bookings',
      value: activeBookings.toLocaleString(),
      subtitle: `${confirmedTodayCount} departing today`,
      icon: CalendarCheck,
      accentBg: 'bg-[#06B6D4]/10',
      accentText: 'text-[#06B6D4]',
      accentGlow: 'shadow-cyan-500/10',
    },
    {
      label: 'Avg. Booking Value',
      value: formatCurrency(avgBookingValue),
      subtitle: `${totalBookingsCount} total bookings`,
      icon: TrendingUp,
      accentBg: 'bg-[#EAB308]/10',
      accentText: 'text-[#EAB308]',
      accentGlow: 'shadow-amber-500/10',
    },
    {
      label: 'Pending Reviews',
      value: pendingReviews.toLocaleString(),
      subtitle: 'Awaiting moderation',
      icon: MessageSquareWarning,
      accentBg: 'bg-violet-400/10',
      accentText: 'text-violet-300',
      accentGlow: 'shadow-violet-500/10',
    },
  ];

  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">Executive Studio</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">
              Operations Control Desk
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Live command view for bookings, moderation, revenue, and high-priority guest activity across TALAGO operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/admin/reports/export"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-slate-200 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            <Link
              href="/admin/tours"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-slate-200 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10"
            >
              Experience Studio
            </Link>
            <Link
              href="/admin/reviews"
              className="rounded-full bg-[#EAB308] px-5 py-3 text-sm font-black text-[#070F1E] transition-all duration-300 ease-in-out hover:scale-[1.02]"
            >
              Moderate Reviews
            </Link>
          </div>
        </div>

        {/* KPI Row */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.label}
                className={`group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl ${card.accentGlow} transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-white/20`}
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.accentBg}`}>
                  <Icon className={`h-6 w-6 ${card.accentText}`} />
                </div>
                <p className="text-sm font-semibold text-slate-400">{card.label}</p>
                <p className="mt-2 text-4xl font-black text-white">{card.value}</p>
                <p className="mt-2 text-xs text-slate-500">{card.subtitle}</p>
              </article>
            );
          })}
        </div>

        {/* Two-Column Grid: Revenue by Destination + Top Tours */}
        <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Revenue by Destination */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#06B6D4]/10">
                <BarChart3 className="h-5 w-5 text-[#06B6D4]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Revenue by Destination</h2>
                <p className="text-xs text-slate-500">All-time confirmed revenue distribution</p>
              </div>
            </div>
            <div className="space-y-4">
              {destRevenueEntries.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">No revenue data yet</p>
              )}
              {destRevenueEntries.map(([name, revenue]) => {
                const percentage = Math.round((revenue / maxDestRevenue) * 100);
                return (
                  <div key={name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-300">{name}</span>
                      <span className="text-sm font-black text-white">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0EA5E9] transition-all duration-700 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Top Selling Tours */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAB308]/10">
                <Star className="h-5 w-5 text-[#EAB308]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Top Selling Experiences</h2>
                <p className="text-xs text-slate-500">Ranked by confirmed bookings</p>
              </div>
            </div>
            <div className="space-y-3">
              {topTours.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">No bookings yet</p>
              )}
              {topTours.map((tour, index) => {
                const tourName = tourNameMap.get(tour.tourId) ?? 'Unknown';
                const revenue = tour._sum.totalPriceUSD ?? 0;
                const count = tour._count.id;
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div
                    key={tour.tourId}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/10"
                  >
                    <span className="text-2xl">{medals[index] ?? `${index + 1}.`}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{tourName}</p>
                      <p className="text-xs text-slate-500">{count} bookings</p>
                    </div>
                    <span className="text-sm font-black text-emerald-300">{formatCurrency(revenue)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Capacity Utilization — Today */}
        {capacityEntries.length > 0 && (
          <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
                <Users className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Today&apos;s Capacity Utilization</h2>
                <p className="text-xs text-slate-500">
                  Live seat occupancy for{' '}
                  {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {capacityEntries.map((entry) => {
                const fillPercent = entry.max > 0 ? Math.min(100, Math.round((entry.used / entry.max) * 100)) : 0;
                const isFull = fillPercent >= 100;
                const isHigh = fillPercent >= 80;
                const barColor = isFull
                  ? 'bg-red-500'
                  : isHigh
                    ? 'bg-[#EAB308]'
                    : 'bg-emerald-400';
                return (
                  <div
                    key={entry.name}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="truncate text-sm font-bold text-slate-300">{entry.name}</span>
                      <span className={`text-xs font-black ${isFull ? 'text-red-400' : isHigh ? 'text-[#EAB308]' : 'text-emerald-300'}`}>
                        {fillPercent}%
                      </span>
                    </div>
                    <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {entry.used} / {entry.max} seats booked
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Booking Activity */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#06B6D4]/10">
                <Clock className="h-5 w-5 text-[#06B6D4]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Recent Booking Activity</h2>
                <p className="text-xs text-slate-500">Latest guest movement through the booking pipeline</p>
              </div>
            </div>
            <Link
              href="/admin/bookings"
              className="text-sm font-black text-[#06B6D4] transition-all duration-300 ease-in-out hover:text-[#EAB308]"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-4">Reference</th>
                  <th className="px-4 py-4">Guest</th>
                  <th className="px-4 py-4">Experience</th>
                  <th className="px-4 py-4">Travel Date</th>
                  <th className="px-4 py-4">Pax</th>
                  <th className="px-4 py-4">Revenue</th>
                  <th className="px-4 py-4">Channel</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="text-slate-300 transition-all duration-300 ease-in-out hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4 font-bold text-white">{booking.bookingReference}</td>
                    <td className="px-4 py-4">{booking.customerName}</td>
                    <td className="max-w-[180px] truncate px-4 py-4">{getTourTitle(booking.tour.translations)}</td>
                    <td className="px-4 py-4 text-xs">
                      {booking.travelDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4">{booking.guestCount}</td>
                    <td className="px-4 py-4">${booking.totalPriceUSD.toFixed(0)}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-400">
                        {booking.channel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
