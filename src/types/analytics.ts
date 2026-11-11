export type BookingChannel = 'VIATOR' | 'GETYOURGUIDE' | 'WHATSAPP' | 'HOTEL_DIRECT' | 'WEBSITE';

export interface ChannelSummary {
  channel: BookingChannel;
  _count: number;
  totalRevenueUSD: number;
}

export interface TourPerformanceItem {
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  leadsCount: number;
  confirmedBookingsCount: number;
  conversionRate: number; // Percentage, e.g. 18.5
  revenueUSD: number;
  passengerCount: number;
}

export interface BookingFunnel {
  checkoutStarts: number;       // AbandonedCheckout records created
  confirmedBookings: number;    // status CONFIRMED or PAID
  abandonedCheckouts: number;   // isRecovered=false, reminderSent flag ignored
  conversionRate: number;       // confirmedBookings / (confirmedBookings + abandonedCheckouts) * 100
  recoveredCheckouts: number;   // isRecovered=true
}

export interface ExecutiveDashboardStats {
  grossRevenueUSD: number;
  grossRevenueEGP: number;
  netMarginUSD: number;
  netMarginEGP: number;
  passengerCount: number;
  topTourTitle: string;
  channelBreakdown: ChannelSummary[];
  onlineCapturedRevenueUSD?: number;
  funnel?: BookingFunnel;
}

