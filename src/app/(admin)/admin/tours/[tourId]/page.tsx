import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TourBuilderForm from "@/components/admin/TourBuilderForm";

export const dynamic = "force-dynamic";

interface Params {
  params: { tourId: string };
}

export default async function EditTourPage({ params }: Params) {
  const { tourId } = params;

  const [tour, zones] = await Promise.all([
    prisma.tour.findUnique({ where: { id: tourId } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!tour) notFound();

  const initialData = {
    id: tour.id,
    slug: tour.slug,
    type: tour.type as "SHARED" | "PRIVATE",
    basePriceUSD: tour.basePriceUSD,
    durationHours: tour.durationHours,
    maxCapacity: tour.maxCapacity,
    zoneId: tour.zoneId,
    status: tour.status,
    category: tour.category,
    translations: tour.translations as Record<string, { title: string; description: string; cancellationPolicies: string[] }>,
    coverImage: tour.coverImage ?? "",
    galleryImages: tour.galleryImages ?? [],
    highlights: tour.highlights ?? [],
    inclusions: tour.inclusions ?? [],
    exclusions: tour.exclusions ?? [],
    itinerary: (tour.itinerary as Record<string, unknown>[] | null) ?? [],
    whatToBring: tour.whatToBring ?? "",
    pickupDescription: tour.pickupDescription ?? "",
    hotelPickupIncluded: tour.hotelPickupIncluded,
    pickupTime: tour.pickupTime ?? "",
    cancellationPolicy: tour.cancellationPolicy ?? "",
    adultPrice: tour.adultPrice,
    childPrice: tour.childPrice ?? 0,
    childMinAge: tour.childMinAge ?? 3,
    childMaxAge: tour.childMaxAge ?? 11,
    infantPrice: tour.infantPrice ?? 0,
    infantMinAge: tour.infantMinAge ?? 0,
    infantMaxAge: tour.infantMaxAge ?? 2,
    ageRestrictionsNotes: tour.ageRestrictionsNotes ?? "",
    cardExcerpt: tour.cardExcerpt ?? "",
    showExcerptOnCard: tour.showExcerptOnCard,
    tourOptions: (tour.tourOptions as Record<string, unknown>[] | null) ?? [],
    allowDeposit: tour.allowDeposit,
    depositPercentage: tour.depositPercentage,
    allowPayAtLocation: tour.allowPayAtLocation,
  };

  return (
    <main className="min-h-screen bg-[#070F1E] py-8 px-4">
      <TourBuilderForm zones={zones} initialData={initialData} />
    </main>
  );
}