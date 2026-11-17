import { test, expect } from '@playwright/test';
import { parseTourText } from '../src/utils/tourTextParser';
import {
  calculateProfileCompleteness,
  sanitizePublicCompanyProfile,
} from '../src/lib/companyProfile';
import type { CompanyLegalProfile } from '../src/types/companyProfile';

test.describe('Tour Importer Multiline Preservation & Integrity', () => {
  test('Preserves full multiline descriptions, paragraphs, Arabic text, and internal colons without truncation', () => {
    const rawTemplate = `
TITLE: Super Desert Quad Safari & Bedouin Dinner
SLUG: super-desert-quad-safari-hurghada
CATEGORY: Desert Safari
ADULT_PRICE: 48
DURATION: 5 Hours

DESCRIPTION:
Experience the vast beauty of the Hurghada desert on a high-speed quad bike adventure. This safari combines thrilling mountain terrain with authentic Egyptian Bedouin hospitality.

NOTE: Helmets and protective eye-wear are inspected before departure. No previous quad biking license is required.

VIP: Private guides are available for families upon advance request. Enjoy complimentary mint tea and traditional flatbread freshly baked over desert embers.

استمتع برحلة سفاري رائعة في صحراء الغردقة مع قيادة بيتش باجي وسط الجبال الساحرة وتناول الشاي البدوي اللذيذ.

HIGHLIGHTS:
- 3 hours of guided quad biking across rugged sand dunes
- Photo stop at the panoramic desert ridge overlooking the Red Sea hills
- Bedouin village visit with traditional hospitality
- Camel ride through the desert oasis

INCLUSIONS:
- Hotel pickup and drop-off in air-conditioned vehicle
- 250cc Quad bike with safety helmet
- Professional desert safari guide
- Bedouin herbal tea and bottled water

EXCLUSIONS:
- Desert scarf (keffiyeh) and protective goggles (available for rent)
- Gratuities for safari crew

WHAT_TO_BRING:
- Comfortable trainers or closed shoes
- Sunglasses and cotton scarf
- Sunscreen and light jacket for evening cool breezes
`;

    const parsed = parseTourText(rawTemplate);

    // 1. Title, slug, category, price
    expect(parsed.data.translations?.en?.title).toBe('Super Desert Quad Safari & Bedouin Dinner');
    expect(parsed.data.slug).toBe('super-desert-quad-safari-hurghada');
    expect(parsed.data.adultPrice).toBe(48);

    // 2. Multiline description preservation
    const description = parsed.data.translations?.en?.description || '';
    expect(description).toContain('Experience the vast beauty of the Hurghada desert');
    expect(description).toContain('NOTE: Helmets and protective eye-wear are inspected before departure.');
    expect(description).toContain('VIP: Private guides are available for families upon advance request.');
    expect(description).toContain('استمتع برحلة سفاري رائعة في صحراء الغردقة');

    // 3. Multiline stats audit
    expect(parsed.multilineStats.descriptionParagraphs).toBeGreaterThanOrEqual(4);
    expect(parsed.multilineStats.descriptionChars).toBeGreaterThan(400);

    // 4. Highlights, inclusions, exclusions
    expect(parsed.data.highlights?.length).toBe(4);
    expect(parsed.data.inclusions?.length).toBe(4);
    expect(parsed.data.exclusions?.length).toBe(2);

    // 5. What to bring multiline
    expect(parsed.data.whatToBring).toContain('Comfortable trainers or closed shoes');
    expect(parsed.data.whatToBring).toContain('Sunscreen and light jacket');
  });
});

test.describe('Company & Legal Profile Completeness & Sanitization', () => {
  test('Calculates completeness score, detects missing items, and flags expired licenses', () => {
    const mockProfile: CompanyLegalProfile = {
      identity: {
        legalName: 'Talago Tours LLC',
        arabicLegalName: 'شركة تالاجو ذ.م.م',
        tradingName: 'TALAGO',
        entityType: 'Limited Liability Company (LLC)',
        countryOfRegistration: 'Egypt',
        registeredJurisdiction: 'Red Sea Governorate, Arab Republic of Egypt',
        incorporationDate: '2024-01-01',
        commercialRegisterNumber: '109823',
        taxCardNumber: '987-654-321',
        vatNumber: 'EG-987654321',
        crIssueDate: '2024-01-01',
        crExpiryDate: '2029-01-01',
        isPublic: true,
      },
      licenses: [
        {
          id: 'lic-1',
          licenseNumber: 'MOT-7890',
          licensingAuthority: 'Ministry of Tourism and Antiquities',
          licenseType: 'Tourism Excursion Operator',
          issueDate: '2023-01-01',
          expiryDate: '2024-01-01', // Expired
          status: 'expired',
          isPublic: true,
        },
      ],
      address: {
        registeredStreet: 'Sheraton Road',
        buildingOffice: 'Marina Commercial Plaza, Unit 4',
        district: 'Marina',
        city: 'Hurghada',
        governorate: 'Red Sea',
        postalCode: '84511',
        country: 'Egypt',
        correspondenceAddress: '',
        isPublic: true,
      },
      contact: {
        officialSupportEmail: 'support@talago-tours.com',
        generalContactEmail: 'info@talago-tours.com',
        phoneNumber: '+20 122 243 4602',
        whatsAppNumber: '+20 122 243 4602',
        legalCorrespondenceEmail: 'legal@talago-tours.com',
        complaintsContactEmail: 'care@talago-tours.com',
        supportHours: '08:00 - 22:00 EET',
        timezone: 'Africa/Cairo',
        isPublic: true,
      },
      operatingModel: {
        marketplaceRole: 'intermediary_marketplace',
        supplierRelationship: 'Vetted independent excursion suppliers in Egypt',
        experienceProvider: 'Local licensed tour operators',
        bookingConfirmationEntity: 'TALAGO instant vouchers',
        paymentCollectionEntity: 'Authorized Egyptian payment channels',
        refundProcessingEntity: 'Original payment method refunds',
        taxFeeStructure: 'All taxes included',
        insuranceArrangements: 'Operator passenger insurance',
        licensingDeclaration: 'Commercial registration in Egypt',
        isPublic: true,
      },
      disclosure: {
        showCrOnLegalPages: false, // Private by default
        showTaxCardOnLegalPages: false, // Private by default
        showFullAddressInFooter: true,
        showOperatingModelSummary: true,
        requireOwnerSignOff: true,
        ownerSignOffDate: '2026-11-15T00:00:00Z',
      },
    };

    const completeness = calculateProfileCompleteness(mockProfile);
    expect(completeness.score).toBe(100);
    expect(completeness.missingFields.length).toBe(0);
    expect(completeness.expiredLicenses.length).toBe(1);
    expect(completeness.isOwnerSignedOff).toBe(true);

    // Verify sanitized public profile hides private tax card and CR when disclosure is disabled
    const sanitized = sanitizePublicCompanyProfile(mockProfile);
    expect(sanitized.tradingName).toBe('TALAGO');
    expect(sanitized.commercialRegisterNumber).toBeUndefined(); // Hidden!
    expect(sanitized.taxCardNumber).toBeUndefined(); // Hidden!
    expect(sanitized.address?.city).toBe('Hurghada');
  });
});
