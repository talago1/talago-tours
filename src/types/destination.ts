export interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  countryCode?: string;
  region?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tours: number };
  zones?: ZoneItem[];
}

export interface ZoneItem {
  id: string;
  name: string;
  transferFee: number;
  pickupOffset: number;
  destinationId: string;
  destination?: { id: string; name: string };
}

export interface DestinationFormData {
  name: string;
  description: string;
  imageUrl?: string | null;
}

export interface DestinationCreateRequest {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface DestinationUpdateRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface DestinationListResponse {
  destinations: (Destination & { _count: { tours: number } })[];
  total: number;
}
