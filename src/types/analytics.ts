export type BookingChannel = 'VIATOR' | 'GETYOURGUIDE' | 'WHATSAPP' | 'HOTEL_DIRECT' | 'WEBSITE';

export interface ChannelSummary {
  channel: BookingChannel;
  _count: number;
  totalRevenueUSD: number;
}

export interface ExecutiveDashboardStats {
  grossRevenueUSD: number;
  grossRevenueEGP: number;
  netMarginUSD: number;
  netMarginEGP: number;
  passengerCount: number;
  topTourTitle: string;
  channelBreakdown: ChannelSummary[];
}
