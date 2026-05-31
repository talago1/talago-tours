import type { ItineraryMilestone } from '@/types/itinerary';
import { ICON_TOKENS } from '@/types/itinerary';

export function validateMilestone(milestone: ItineraryMilestone): string | null {
  if (!milestone.timeTag || milestone.timeTag.trim().length === 0) {
    return 'Time tag is required';
  }
  if (!ICON_TOKENS.includes(milestone.iconToken)) {
    return 'Invalid icon selected';
  }
  if (!milestone.title.en || milestone.title.en.trim().length === 0) {
    return 'English title is required';
  }
  return null;
}

export function validateItinerary(milestones: ItineraryMilestone[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const ids = new Set<string>();

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];

    if (ids.has(m.id)) {
      errors[`itinerary.${i}.id`] = `Duplicate milestone ID at position ${i + 1}`;
    }
    ids.add(m.id);

    const err = validateMilestone(m);
    if (err) {
      errors[`itinerary.${i}.timeTag`] = err;
    }
  }

  return errors;
}
