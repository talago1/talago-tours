import { prisma } from '@/lib/prisma';
import {
  CompanyLegalProfile,
  DEFAULT_COMPANY_PROFILE,
  LicenseRecord,
} from '@/types/companyProfile';

const SETTING_KEY = 'company_legal_profile';

export interface ProfileCompleteness {
  score: number; // 0 to 100
  totalFields: number;
  completedFields: number;
  missingFields: string[];
  verifiedFields: string[];
  publicApprovedFields: string[];
  expiringLicenses: LicenseRecord[];
  expiredLicenses: LicenseRecord[];
  isOwnerSignedOff: boolean;
}

/**
 * Retrieve full company legal profile for admin use.
 */
export async function getCompanyProfile(): Promise<CompanyLegalProfile> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (!setting?.value) {
      return DEFAULT_COMPANY_PROFILE;
    }
    const parsed = JSON.parse(setting.value);
    return {
      identity: { ...DEFAULT_COMPANY_PROFILE.identity, ...(parsed.identity || {}) },
      licenses: Array.isArray(parsed.licenses) ? parsed.licenses : [],
      address: { ...DEFAULT_COMPANY_PROFILE.address, ...(parsed.address || {}) },
      contact: { ...DEFAULT_COMPANY_PROFILE.contact, ...(parsed.contact || {}) },
      operatingModel: {
        ...DEFAULT_COMPANY_PROFILE.operatingModel,
        ...(parsed.operatingModel || {}),
      },
      disclosure: {
        ...DEFAULT_COMPANY_PROFILE.disclosure,
        ...(parsed.disclosure || {}),
      },
      updatedAt: (setting as any)?.updatedAt ? new Date((setting as any).updatedAt).toISOString() : new Date().toISOString(),
      createdAt: (setting as any)?.createdAt ? new Date((setting as any).createdAt).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('[getCompanyProfile] Error loading company profile:', error);
    return DEFAULT_COMPANY_PROFILE;
  }
}

/**
 * Save company profile from admin dashboard.
 */
export async function saveCompanyProfile(
  data: Partial<CompanyLegalProfile>
): Promise<CompanyLegalProfile> {
  const current = await getCompanyProfile();
  const merged: CompanyLegalProfile = {
    identity: { ...current.identity, ...(data.identity || {}) },
    licenses: Array.isArray(data.licenses) ? data.licenses : current.licenses,
    address: { ...current.address, ...(data.address || {}) },
    contact: { ...current.contact, ...(data.contact || {}) },
    operatingModel: {
      ...current.operatingModel,
      ...(data.operatingModel || {}),
    },
    disclosure: {
      ...current.disclosure,
      ...(data.disclosure || {}),
    },
  };

  const saved = await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: JSON.stringify(merged),
    },
    update: {
      value: JSON.stringify(merged),
    },
  });

  return {
    ...merged,
    updatedAt: (saved as any)?.updatedAt ? new Date((saved as any).updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Calculate completeness and safety alerts for the Company & Legal Profile Dashboard.
 */
export function calculateProfileCompleteness(
  profile: CompanyLegalProfile
): ProfileCompleteness {
  const missing: string[] = [];
  const completed: string[] = [];

  // 1. Identity checks
  if (profile.identity.legalName) completed.push('Legal Name');
  else missing.push('Official Registered Company Name');

  if (profile.identity.commercialRegisterNumber)
    completed.push('Commercial Register No.');
  else missing.push('Commercial Register No. (السجل التجاري)');

  if (profile.identity.taxCardNumber) completed.push('Tax Card No.');
  else missing.push('Tax Card No. (البطاقة الضريبية)');

  if (profile.identity.entityType) completed.push('Entity Type');
  else missing.push('Legal Entity Type');

  // 2. Address checks
  if (profile.address.registeredStreet) completed.push('Street Address');
  else missing.push('Registered Street Address');

  if (profile.address.city) completed.push('City');
  else missing.push('City');

  if (profile.address.governorate) completed.push('Governorate');
  else missing.push('Governorate');

  // 3. Contact checks
  if (profile.contact.officialSupportEmail) completed.push('Support Email');
  else missing.push('Support Email');

  if (profile.contact.phoneNumber) completed.push('Phone Number');
  else missing.push('Official Phone Number');

  if (profile.contact.whatsAppNumber) completed.push('WhatsApp Number');
  else missing.push('Official WhatsApp Number');

  // 4. Operating model checks
  if (profile.operatingModel.marketplaceRole) completed.push('Operating Model');
  else missing.push('Marketplace Role Classification');

  // 5. Licenses checks
  const now = new Date();
  const thirtyDaysAhead = new Date(Date.now() + 30 * 86_400_000);
  const expiringLicenses: LicenseRecord[] = [];
  const expiredLicenses: LicenseRecord[] = [];

  profile.licenses.forEach((lic) => {
    if (lic.expiryDate) {
      const exp = new Date(lic.expiryDate);
      if (exp < now) {
        expiredLicenses.push(lic);
      } else if (exp <= thirtyDaysAhead) {
        expiringLicenses.push(lic);
      }
    }
  });

  const totalFields = missing.length + completed.length;
  const score = Math.round((completed.length / totalFields) * 100);

  const publicApprovedFields: string[] = [];
  if (profile.identity.isPublic) publicApprovedFields.push('Company Identity');
  if (profile.address.isPublic) publicApprovedFields.push('Public Address');
  if (profile.contact.isPublic) publicApprovedFields.push('Public Contact Channels');
  if (profile.operatingModel.isPublic)
    publicApprovedFields.push('Operating Model Description');

  return {
    score,
    totalFields,
    completedFields: completed.length,
    missingFields: missing,
    verifiedFields: completed,
    publicApprovedFields,
    expiringLicenses,
    expiredLicenses,
    isOwnerSignedOff: Boolean(
      profile.disclosure.requireOwnerSignOff && profile.disclosure.ownerSignOffDate
    ),
  };
}

/**
 * Filter profile to ONLY return public approved fields for client rendering.
 * NEVER exposes private tax card, commercial registration numbers, or private documents
 * unless explicitly approved by the owner in the disclosure settings.
 * Fails closed: unverified or empty fields are omitted rather than showing mock/placeholder data.
 */
export function sanitizePublicCompanyProfile(profile: CompanyLegalProfile) {
  const hasLegalName = Boolean(profile.identity.legalName && profile.identity.legalName.trim().length > 0);
  const hasCr = Boolean(profile.identity.commercialRegisterNumber && profile.identity.commercialRegisterNumber.trim().length > 0);
  const hasTaxCard = Boolean(profile.identity.taxCardNumber && profile.identity.taxCardNumber.trim().length > 0);

  const hasAddress = Boolean(
    profile.address.isPublic &&
    (profile.address.registeredStreet || profile.address.city || profile.address.governorate)
  );

  const hasContact = Boolean(
    profile.contact.isPublic &&
    (profile.contact.officialSupportEmail || profile.contact.phoneNumber || profile.contact.whatsAppNumber)
  );

  const hasOperatingModel = Boolean(
    profile.operatingModel.isPublic &&
    profile.operatingModel.supplierRelationship &&
    profile.operatingModel.supplierRelationship.trim().length > 0
  );

  return {
    tradingName: profile.identity.tradingName || 'TALAGO',
    legalName: profile.disclosure.showCrOnLegalPages && hasLegalName
      ? profile.identity.legalName
      : undefined,
    commercialRegisterNumber: profile.disclosure.showCrOnLegalPages && hasCr
      ? profile.identity.commercialRegisterNumber
      : undefined,
    taxCardNumber: profile.disclosure.showTaxCardOnLegalPages && hasTaxCard
      ? profile.identity.taxCardNumber
      : undefined,
    address: hasAddress
      ? {
          city: profile.address.city || undefined,
          governorate: profile.address.governorate || undefined,
          country: profile.address.country || 'Egypt',
          street: profile.disclosure.showFullAddressInFooter
            ? profile.address.registeredStreet || undefined
            : undefined,
          building: profile.disclosure.showFullAddressInFooter
            ? profile.address.buildingOffice || undefined
            : undefined,
        }
      : undefined,
    contact: hasContact
      ? {
          supportEmail: profile.contact.officialSupportEmail || undefined,
          phone: profile.contact.phoneNumber || undefined,
          whatsApp: profile.contact.whatsAppNumber || undefined,
          supportHours: profile.contact.supportHours || undefined,
          timezone: profile.contact.timezone || undefined,
        }
      : undefined,
    operatingModel: hasOperatingModel
      ? {
          role: profile.operatingModel.marketplaceRole,
          summary: profile.operatingModel.supplierRelationship,
          experienceProvider: profile.operatingModel.experienceProvider || undefined,
          bookingConfirmation: profile.operatingModel.bookingConfirmationEntity || undefined,
          taxFeeNotice: profile.operatingModel.taxFeeStructure || undefined,
        }
      : undefined,
    publicLicenses: profile.licenses
      .filter((l) => l.isPublic && l.status === 'active' && Boolean(l.licenseNumber))
      .map((l) => ({
        authority: l.licensingAuthority,
        type: l.licenseType,
        licenseNumber: l.licenseNumber,
      })),
  };
}
