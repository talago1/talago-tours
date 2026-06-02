import type { ReviewDistribution } from '@/types/review';

interface ReviewBreakdownBarsProps {
  distribution: ReviewDistribution[];
}

export default function ReviewBreakdownBars({ distribution }: ReviewBreakdownBarsProps) {
  const sortedDistribution = [...distribution].sort((a, b) => b.star - a.star);

  return (
    <div className="space-y-2">
      {sortedDistribution.map((d) => (
        <div key={d.star} className="flex items-center gap-2">
          <span className="w-4 text-right text-sm font-medium text-gray-600">
            {d.star}
          </span>
          <svg className="h-3.5 w-3.5 shrink-0 text-[#FF5B00]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#FF5B00] transition-all duration-300"
              style={{ width: `${d.percentage}%` }}
            />
          </div>
          <span className="w-10 text-right text-sm text-gray-500">
            {d.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}
