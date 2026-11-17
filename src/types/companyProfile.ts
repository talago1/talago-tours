export type VerificationStatus =
  | 'missing'
  | 'entered'
  | 'pending_verification'
  | 'verified'
  | 'approved_public';

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
    entityType: '',
    countryOfRegistration: 'Egypt',
    registeredJurisdiction: '',
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
    city: '',
    governorate: '',
    postalCode: '',
    country: 'Egypt',
    correspondenceAddress: '',
    isPublic: false,
  },
  contact: {
    officialSupportEmail: '',
    generalContactEmail: '',
    phoneNumber: '',
    whatsAppNumber: '',
    legalCorrespondenceEmail: '',
    complaintsContactEmail: '',
    supportHours: '',
    timezone: 'Africa/Cairo',
    isPublic: false,
  },
  operatingModel: {
    marketplaceRole: 'intermediary_marketplace',
    supplierRelationship: '',
    experienceProvider: '',
    bookingConfirmationEntity: '',
    paymentCollectionEntity: '',
    refundProcessingEntity: '',
    taxFeeStructure: '',
    insuranceArrangements: '',
    licensingDeclaration: '',
    isPublic: false,
  },
  disclosure: {
    showCrOnLegalPages: false,
    showTaxCardOnLegalPages: false,
    showFullAddressInFooter: false,
    showOperatingModelSummary: false,
    requireOwnerSignOff: true,
  },
};
