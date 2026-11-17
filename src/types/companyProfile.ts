export type VerificationStatus =
  | 'missing'
  | 'draft'
  | 'awaiting_approval'
  | 'verified'
  | 'public_approved';

export interface LicenseRecord {
  id: string;
  licenseNumber: string;
  licensingAuthority: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'pending_renewal' | 'expired' | 'under_review';
  documentName?: string;
  documentUrl?: string;
  isPublic: boolean;
  notes?: string;
}

export interface CompanyLegalProfile {
  identity: {
    legalName: string;
    arabicLegalName: string;
    tradingName: string;
    entityType: string;
    countryOfRegistration: string;
    registeredJurisdiction: string;
    incorporationDate: string;
    commercialRegisterNumber: string;
    taxCardNumber: string;
    vatNumber: string;
    crIssueDate: string;
    crExpiryDate: string;
    isPublic: boolean;
  };

  licenses: LicenseRecord[];

  address: {
    registeredStreet: string;
    buildingOffice: string;
    district: string;
    city: string;
    governorate: string;
    postalCode: string;
    country: string;
    correspondenceAddress: string;
    isPublic: boolean;
  };

  contact: {
    officialSupportEmail: string;
    generalContactEmail: string;
    phoneNumber: string;
    whatsAppNumber: string;
    legalCorrespondenceEmail: string;
    complaintsContactEmail: string;
    supportHours: string;
    timezone: string;
    isPublic: boolean;
  };

  operatingModel: {
    marketplaceRole: 'intermediary_marketplace' | 'direct_operator' | 'hybrid';
    supplierRelationship: string;
    experienceProvider: string;
    bookingConfirmationEntity: string;
    paymentCollectionEntity: string;
    refundProcessingEntity: string;
    taxFeeStructure: string;
    insuranceArrangements: string;
    licensingDeclaration: string;
    isPublic: boolean;
  };

  disclosure: {
    showCrOnLegalPages: boolean;
    showTaxCardOnLegalPages: boolean;
    showFullAddressInFooter: boolean;
    showOperatingModelSummary: boolean;
    requireOwnerSignOff: boolean;
    ownerSignOffDate?: string;
    ownerSignOffBy?: string;
  };

  updatedAt?: string;
  createdAt?: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyLegalProfile = {
  identity: {
    legalName: '',
    arabicLegalName: '',
    tradingName: 'TALAGO',
    entityType: 'Limited Liability Company (LLC)',
    countryOfRegistration: 'Egypt',
    registeredJurisdiction: 'Red Sea Governorate, Arab Republic of Egypt',
    incorporationDate: '',
    commercialRegisterNumber: '',
    taxCardNumber: '',
    vatNumber: '',
    crIssueDate: '',
    crExpiryDate: '',
    isPublic: false,
  },
  licenses: [],
  address: {
    registeredStreet: '',
    buildingOffice: '',
    district: '',
    city: 'Hurghada',
    governorate: 'Red Sea',
    postalCode: '',
    country: 'Egypt',
    correspondenceAddress: '',
    isPublic: true,
  },
  contact: {
    officialSupportEmail: 'support@talago-tours.com',
    generalContactEmail: 'info@talago-tours.com',
    phoneNumber: '+20 100 000 0000',
    whatsAppNumber: '+20 100 000 0000',
    legalCorrespondenceEmail: 'legal@talago-tours.com',
    complaintsContactEmail: 'care@talago-tours.com',
    supportHours: '08:00 - 22:00 (EET / UTC+2), Daily',
    timezone: 'Africa/Cairo (EET / UTC+2)',
    isPublic: true,
  },
  operatingModel: {
    marketplaceRole: 'intermediary_marketplace',
    supplierRelationship:
      'TALAGO operates as an Egyptian tourism discovery and booking platform connecting travellers with vetted, independent licensed local tour operators.',
    experienceProvider:
      'All excursions, guided activities, safari expeditions, and marine transfers are performed directly by independent, licensed Egyptian operating partners.',
    bookingConfirmationEntity:
      'TALAGO issues instant digital vouchers and boarding passes confirming guest reservations with local suppliers.',
    paymentCollectionEntity:
      'TALAGO processes customer payments through licensed payment service providers in accordance with local banking regulations.',
    refundProcessingEntity:
      'Eligible refunds are processed back to the customer’s original payment method in compliance with stated cancellation policies.',
    taxFeeStructure:
      'All public prices include statutory fees and value-added taxes where applicable without hidden charges.',
    insuranceArrangements:
      'Local excursion suppliers are independently responsible for maintaining passenger liability coverage required by Egyptian tourism authorities.',
    licensingDeclaration:
      'Commercial activities are conducted under Egyptian commercial registry and applicable e-commerce provisions.',
    isPublic: true,
  },
  disclosure: {
    showCrOnLegalPages: false,
    showTaxCardOnLegalPages: false,
    showFullAddressInFooter: true,
    showOperatingModelSummary: true,
    requireOwnerSignOff: true,
  },
};
