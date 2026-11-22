import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DestinationSlugPage({ params }: { params: { slug: string } }) {
  permanentRedirect(`/tours?destination=${encodeURIComponent(params.slug)}`);
}
