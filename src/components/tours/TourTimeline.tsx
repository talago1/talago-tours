'use client';

import type { ItineraryMilestone, LanguageCode } from '@/types/itinerary';
import { ICON_MAP } from '@/types/itinerary';

interface TourTimelineProps {
  milestones: ItineraryMilestone[] | null;
  language?: LanguageCode;
}

export default function TourTimeline({ milestones, language = 'en' }: TourTimelineProps) {
  if (!milestones || milestones.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-400 italic">No itinerary details available.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Itinerary</h2>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {milestones.map((milestone) => {
            const Icon = ICON_MAP[milestone.iconToken];
            const title = milestone.title[language] || milestone.title.en;

            return (
              <article key={milestone.id} className="relative pl-14">
                <div className="absolute left-2.5 top-0 w-6 h-6 -translate-x-1/2 rounded-full bg-secondary-forest flex items-center justify-center hover:scale-105 transition-transform duration-200">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="space-y-0.5">
                  <time className="text-xs font-medium text-primary-coral uppercase tracking-wide">
                    {milestone.timeTag}
                  </time>
                  <p className="text-sm text-gray-800 max-w-prose break-words">
                    {title || '\u00A0'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
