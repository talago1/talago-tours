import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionUser } from '@/server/customerSession';
import { collectPhoneKeys, exactPhoneVariants, phoneDigits, phoneMatchKey, phonesEquivalent } from '@/utils/phoneMatch';

type PhoneDb = Prisma.TransactionClient | PrismaClient;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function collectIdentityEmails(
  emails: Array<string | null | undefined>,
  phones: Array<unknown> = [],
): string[] {
  const set = new Set<string>();
  const add = (value?: string | null) => {
    const email = (value || '').trim().toLowerCase();
    if (email.length <= 254 && EMAIL_PATTERN.test(email)) set.add(email);
  };

  for (const email of emails) add(email);

  for (const phone of phones) {
    const digits = phoneDigits(phone);
    if (digits.length >= 8 && digits.length <= 15) {
      add(`guest-${digits}@noreply.talago.com`);
    }
    const key = phoneMatchKey(phone);
    if (key) {
      add(`guest-${key}@noreply.talago.com`);
      add(`guest-0${key}@noreply.talago.com`);
      add(`guest-20${key}@noreply.talago.com`);
    }
  }

  return [...set];
}

async function findIdsByNationalPhone(
  db: PhoneDb,
  table: 'booking' | 'lead' | 'profile',
  keys: string[],
): Promise<Array<{ id: string; phone: string; telegramPhone?: string | null }>> {
  const safe = [...new Set(keys.filter((key) => /^\d{8,12}$/.test(key)))];
  const found: Array<{ id: string; phone: string; telegramPhone?: string | null }> = [];

  for (const key of safe) {
    const minLen = key.length;
    const maxLen = key.length + 4;
    try {
      if (table === 'booking') {
        const rows = await db.$queryRaw<Array<{ id: string; phone: string }>>`
          SELECT id, "customerPhone" AS phone
          FROM "Booking"
          WHERE char_length(regexp_replace(coalesce("customerPhone", ''), '[^0-9]', '', 'g')) BETWEEN ${minLen}::int AND ${maxLen}::int
            AND right(regexp_replace(coalesce("customerPhone", ''), '[^0-9]', '', 'g'), ${key.length}::int) = ${key}
        `;
        for (const row of rows) {
          if (phoneMatchKey(row.phone) === key) found.push(row);
        }
      } else if (table === 'lead') {
        const rows = await db.$queryRaw<Array<{ id: string; phone: string }>>`
          SELECT id, "customerPhone" AS phone
          FROM "booking_leads"
          WHERE char_length(regexp_replace(coalesce("customerPhone", ''), '[^0-9]', '', 'g')) BETWEEN ${minLen}::int AND ${maxLen}::int
            AND right(regexp_replace(coalesce("customerPhone", ''), '[^0-9]', '', 'g'), ${key.length}::int) = ${key}
        `;
        for (const row of rows) {
          if (phoneMatchKey(row.phone) === key) found.push(row);
        }
      } else {
        const rows = await db.$queryRaw<Array<{ id: string; phone: string; telegramPhone: string | null }>>`
          SELECT id, "phone" AS phone, "telegramPhone"
          FROM "CustomerProfile"
          WHERE (
            char_length(regexp_replace(coalesce("phone", ''), '[^0-9]', '', 'g')) BETWEEN ${minLen}::int AND ${maxLen}::int
            AND right(regexp_replace(coalesce("phone", ''), '[^0-9]', '', 'g'), ${key.length}::int) = ${key}
          ) OR (
            char_length(regexp_replace(coalesce("telegramPhone", ''), '[^0-9]', '', 'g')) BETWEEN ${minLen}::int AND ${maxLen}::int
            AND right(regexp_replace(coalesce("telegramPhone", ''), '[^0-9]', '', 'g'), ${key.length}::int) = ${key}
          )
        `;
        for (const row of rows) {
          if (phoneMatchKey(row.phone) === key || phoneMatchKey(row.telegramPhone) === key) {
            found.push(row);
          }
        }
      }
    } catch (error) {
      console.warn('[customer-bookings] normalized phone lookup failed:', error);
    }
  }

  return found;
}

export async function findProfileByContact(
  db: PhoneDb,
  email: string,
  phone: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail) {
    const byEmail = await db.customerProfile.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (byEmail) return byEmail;
  }

  const keys = collectPhoneKeys([phone]);
  if (keys.length === 0) return null;

  const matches = await findIdsByNationalPhone(db, 'profile', keys);
  const ids = [...new Set(matches.map((row) => row.id))];
  if (ids.length === 0) {
    const variants = exactPhoneVariants(phone);
    if (variants.length === 0) return null;
    const fallback = await db.customerProfile.findFirst({
      where: {
        OR: variants.flatMap((variant) => [
          { phone: variant },
          { telegramPhone: variant },
        ]),
      },
    });
    return fallback;
  }

  const profiles = await db.customerProfile.findMany({ where: { id: { in: ids } } });
  return (
    profiles.find((profile) =>
      keys.some((key) => phoneMatchKey(profile.phone) === key || phoneMatchKey(profile.telegramPhone) === key),
    ) ?? null
  );
}

function profileName(user: SessionUser, telegramId?: string): string {
  const metaName = user.user_metadata?.name || user.user_metadata?.full_name;
  if (typeof metaName === 'string' && metaName.trim() && metaName !== 'User') return metaName.trim();
  if (telegramId) return `Traveler #${telegramId}`;
  return user.email?.split('@')[0] || 'Traveler';
}

export async function resolveCustomerProfileForUser(user: SessionUser) {
  const email = user.email!.trim().toLowerCase();
  const telegramMatch = email.match(/^telegram-(\d+)@noreply\.talago\.com$/);
  const guestMatch = email.match(/^guest-(\d+)@noreply\.talago\.com$/);
  const metaPhone = user.phone || user.user_metadata?.phone || null;

  const rows = await prisma.customerProfile.findMany({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        ...(telegramMatch ? [{ telegramId: telegramMatch[1] }] : []),
      ],
    },
  });

  let profile =
    rows.find((row) => row.email.toLowerCase() === email) ||
    rows.find((row) => telegramMatch && row.telegramId === telegramMatch[1]) ||
    null;

  if (!profile) {
    try {
      profile = await prisma.customerProfile.create({
        data: {
          email,
          name: profileName(user, telegramMatch?.[1]),
          telegramId: telegramMatch?.[1],
          phone: guestMatch ? `+${guestMatch[1]}` : typeof metaPhone === 'string' ? metaPhone : undefined,
          isShadow: false,
        },
      });
    } catch {
      profile = await prisma.customerProfile.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
    }
  } else {
    const data: Prisma.CustomerProfileUpdateInput = {};
    if (profile.isShadow) data.isShadow = false;
    if (!profile.phone && profile.telegramPhone) data.phone = profile.telegramPhone;
    if (!profile.phone && typeof metaPhone === 'string' && phoneMatchKey(metaPhone)) data.phone = metaPhone;
    if (telegramMatch && !profile.telegramId) {
      const taken = await prisma.customerProfile.findUnique({ where: { telegramId: telegramMatch[1] } });
      if (!taken) data.telegramId = telegramMatch[1];
    }
    if (Object.keys(data).length > 0) {
      profile = await prisma.customerProfile.update({ where: { id: profile.id }, data });
    }
  }

  return { profile, telegramMatch, guestMatch };
}

export async function listVisibleBookingIds(input: {
  profileId: string;
  emails: Array<string | null | undefined>;
  phones: Array<unknown>;
}): Promise<string[]> {
  const emails = collectIdentityEmails(input.emails, input.phones);
  const keys = collectPhoneKeys(input.phones);
  const ids = new Set<string>();

  const linked = await prisma.booking.findMany({
    where: { customerProfileId: input.profileId },
    select: { id: true },
  });
  for (const row of linked) ids.add(row.id);

  if (emails.length > 0) {
    const byEmail = await prisma.booking.findMany({
      where: { OR: emails.map((email) => ({ customerEmail: { equals: email, mode: 'insensitive' as const } })) },
      select: { id: true, customerEmail: true },
    });
    for (const row of byEmail) {
      if (emails.includes(row.customerEmail.trim().toLowerCase())) ids.add(row.id);
    }
  }

  const byPhone = await findIdsByNationalPhone(prisma, 'booking', keys);
  for (const row of byPhone) ids.add(row.id);

  const candidateIds = [...ids];
  if (candidateIds.length === 0) return [];

  const rows = await prisma.booking.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, customerProfileId: true, customerEmail: true, customerPhone: true },
  });
  const emailSet = new Set(emails);

  return rows
    .filter((row) => {
      if (row.customerProfileId === input.profileId) return true;
      const emailHit = emailSet.has(row.customerEmail.trim().toLowerCase());
      const phoneHit = keys.some((key) => phoneMatchKey(row.customerPhone) === key);
      return emailHit || phoneHit;
    })
    .map((row) => row.id);
}

export async function listVisibleLeadIds(
  emailsInput: Array<string | null | undefined>,
  phones: Array<unknown>,
): Promise<string[]> {
  const emails = collectIdentityEmails(emailsInput, phones);
  const keys = collectPhoneKeys(phones);
  const ids = new Set<string>();

  if (emails.length > 0) {
    const byEmail = await prisma.bookingLead.findMany({
      where: { OR: emails.map((email) => ({ customerEmail: { equals: email, mode: 'insensitive' as const } })) },
      select: { id: true, customerEmail: true },
    });
    for (const row of byEmail) {
      if (row.customerEmail && emails.includes(row.customerEmail.trim().toLowerCase())) ids.add(row.id);
    }
  }

  const byPhone = await findIdsByNationalPhone(prisma, 'lead', keys);
  for (const row of byPhone) ids.add(row.id);
  return [...ids];
}

function profileOwnsBookingContact(
  owner: { email: string; phone: string | null; telegramPhone: string | null },
  booking: { customerEmail: string; customerPhone: string },
): boolean {
  return (
    owner.email.trim().toLowerCase() === booking.customerEmail.trim().toLowerCase()
    || phonesEquivalent(owner.phone, booking.customerPhone)
    || phonesEquivalent(owner.telegramPhone, booking.customerPhone)
  );
}

export async function adoptOwnedBookings(input: {
  profileId: string;
  emails: Array<string | null | undefined>;
  phones: Array<unknown>;
}) {
  const ids = await listVisibleBookingIds(input);
  await adoptBookingIds(
    input.profileId,
    ids,
    collectIdentityEmails(input.emails, input.phones),
    collectPhoneKeys(input.phones),
  );
}

async function adoptBookingIds(
  profileId: string,
  bookingIds: string[],
  emails: string[],
  phoneKeys: string[],
) {
  if (bookingIds.length === 0) return;
  const rows = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { id: true, customerProfileId: true, customerEmail: true, customerPhone: true },
  });
  const foreignIds = [
    ...new Set(
      rows
        .map((row) => row.customerProfileId)
        .filter((id): id is string => Boolean(id && id !== profileId)),
    ),
  ];
  const owners = foreignIds.length
    ? await prisma.customerProfile.findMany({
        where: { id: { in: foreignIds } },
        select: { id: true, isShadow: true, email: true, phone: true, telegramPhone: true },
      })
    : [];
  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
  const emailSet = new Set(emails);

  const adoptable = rows
    .filter((row) => {
      if (!row.customerProfileId || row.customerProfileId === profileId) {
        return !row.customerProfileId;
      }
      const owner = ownerById.get(row.customerProfileId);
      if (!owner || owner.isShadow) return true;
      const accountMatches =
        emailSet.has(row.customerEmail.trim().toLowerCase())
        || phoneKeys.some((key) => phoneMatchKey(row.customerPhone) === key);
      return accountMatches;
    })
    .map((row) => row.id);
  if (adoptable.length === 0) return;

  await prisma.booking.updateMany({
    where: { id: { in: adoptable } },
    data: { customerProfileId: profileId },
  });
}

/** Link one booking after the customer proves reference + the same phone. */
export async function claimBookingForProfile(
  profileId: string,
  bookingId: string,
  phone: string,
): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerProfileId: true, customerEmail: true, customerPhone: true },
  });
  if (!booking || !phonesEquivalent(booking.customerPhone, phone)) return false;
  if (booking.customerProfileId === profileId) return true;

  if (booking.customerProfileId) {
    const owner = await prisma.customerProfile.findUnique({
      where: { id: booking.customerProfileId },
      select: { isShadow: true, email: true, phone: true, telegramPhone: true },
    });
    if (owner && !owner.isShadow && profileOwnsBookingContact(owner, booking)) return false;
  }

  const updated = await prisma.booking.updateMany({
    where: { id: bookingId },
    data: { customerProfileId: profileId },
  });
  return updated.count > 0;
}

export function formatUserProfile(
  user: SessionUser,
  profile: any,
  telegramMatch?: RegExpMatchArray | null,
) {
  const isTelegram = Boolean(telegramMatch || profile?.telegramId);
  const isGoogle = Boolean(
    user.app_metadata?.provider === 'google' ||
    user.identities?.some((i: { provider?: string }) => i.provider === 'google')
  );

  let displayName = profile?.name;
  if (!displayName || displayName === 'User' || displayName === 'Traveler' || displayName.startsWith('Traveler #')) {
    if (profile?.telegramUsername) {
      displayName = `@${profile.telegramUsername}`;
    } else if (user.user_metadata?.name && user.user_metadata.name !== 'User') {
      displayName = user.user_metadata.name;
    } else if (user.user_metadata?.full_name && user.user_metadata.full_name !== 'User') {
      displayName = user.user_metadata.full_name;
    } else if (user.email) {
      displayName = user.email.split('@')[0];
    } else {
      displayName = 'Traveler';
    }
  }

  return {
    id: user.id,
    name: displayName,
    email: profile?.email || user.email || '',
    phone: profile?.phone || profile?.telegramPhone || user.phone || null,
    isTelegram,
    telegramId: profile?.telegramId || null,
    telegramUsername: profile?.telegramUsername || null,
    telegramPhotoUrl: profile?.telegramPhotoUrl || null,
    telegramPhone: profile?.telegramPhone || null,
    telegramPhoneVerified: Boolean(profile?.telegramPhoneVerified),
    telegramBotAccess: Boolean(profile?.telegramBotAccess),
    telegramConnectedAt: profile?.telegramConnectedAt ? new Date(profile.telegramConnectedAt).toISOString() : null,
    provider: isTelegram ? ('telegram' as const) : isGoogle ? ('google' as const) : ('email' as const),
  };
}
