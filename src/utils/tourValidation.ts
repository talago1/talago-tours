import type { ValidationError, TourFormState } from '@/types/tourBuilder';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const SLUG_MAX_LENGTH = 200;

export function validateSlugFormat(slug: string): string | null {
  if (!slug || slug.trim().length === 0) {
    return 'Slug is required';
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return `Slug must be ${SLUG_MAX_LENGTH} characters or less`;
  }
  if (!SLUG_REGEX.test(slug)) {
    return 'Slug must only contain lowercase letters, numbers, and hyphens';
  }
  return null;
}

export function validatePositiveNumber(value: number, label: string): string | null {
  if (!value || value <= 0) {
    return `${label} must be a positive number`;
  }
  if (!Number.isInteger(value) && label !== 'Base price') {
    return `${label} must be a whole number`;
  }
  return null;
}

export function validateEnglishContent(
  title: string,
  description: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!title || title.trim().length === 0) {
    errors.push({ field: 'translations.en.title', message: 'English title is required' });
  }
  if (!description || description.trim().length === 0) {
    errors.push({ field: 'translations.en.description', message: 'English description is required' });
  }
  return errors;
}

export function validateTourForm(state: TourFormState): ValidationError[] {
  const errors: ValidationError[] = [];
  const { globalFields, translations, pricing } = state;

  const slugError = validateSlugFormat(globalFields.slug);
  if (slugError) {
    errors.push({ field: 'slug', message: slugError });
  }

  const priceError = validatePositiveNumber(globalFields.basePriceUSD, 'Base price');
  if (priceError) {
    errors.push({ field: 'basePriceUSD', message: priceError });
  }

  const durationError = validatePositiveNumber(globalFields.durationHours, 'Duration');
  if (durationError) {
    errors.push({ field: 'durationHours', message: durationError });
  }

  const capacityError = validatePositiveNumber(globalFields.maxCapacity, 'Max capacity');
  if (capacityError) {
    errors.push({ field: 'maxCapacity', message: capacityError });
  }

  if (!globalFields.zoneId || globalFields.zoneId.trim().length === 0) {
    errors.push({ field: 'zoneId', message: 'Zone is required' });
  }

  // Pricing validation
  if (!pricing.adultPrice || pricing.adultPrice <= 0) {
    errors.push({ field: 'adultPrice', message: 'Adult price is required and must be greater than zero' });
  }

  if (pricing.childEnabled) {
    if (!pricing.childPrice || pricing.childPrice <= 0) {
      errors.push({ field: 'childPrice', message: 'Child price must be greater than zero' });
    }
    if (pricing.childMaxAge <= pricing.childMinAge) {
      errors.push({ field: 'childMaxAge', message: 'Child max age must be greater than min age' });
    }
  }

  if (pricing.infantEnabled) {
    if (!pricing.infantPrice || pricing.infantPrice <= 0) {
      errors.push({ field: 'infantPrice', message: 'Infant price must be greater than zero' });
    }
    if (pricing.infantMaxAge <= pricing.infantMinAge) {
      errors.push({ field: 'infantMaxAge', message: 'Infant max age must be greater than min age' });
    }
  }

  const enErrors = validateEnglishContent(
    translations.en.title,
    translations.en.description
  );
  errors.push(...enErrors);

  return errors;
}
