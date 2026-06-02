export default function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#00473F]/10 px-2 py-0.5 text-xs font-semibold text-[#00473F]">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Verified Booking
    </span>
  );
}
