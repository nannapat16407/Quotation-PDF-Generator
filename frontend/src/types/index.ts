export type BillingType = 'MONTHLY' | 'YEARLY';
export type QuotationItemType = 'PACKAGE' | 'ADDON';

export interface User {
  id: string;
  name: string;
  email: string;
  signatureUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface SupplierInfo {
  id: string;
  companyName: string;
  companyNameTh: string | null;
  taxId: string;
  address: string;
  contactInfo: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  nameTh: string | null;
  userCountEn: string | null;
  userCountTh: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialOffer {
  id: string;
  name: string;
  nameTh: string | null;
  description: string | null;
  descriptionTh: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  type: QuotationItemType;
  description: string;
  descriptionTh: string | null;
  qty: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

export interface QuotationOffer {
  id: string;
  quotationId: string;
  specialOfferId: string | null;
  name: string;
  nameTh: string | null;
  isCustom: boolean;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  version: number;
  customerCompany: string;
  customerCompanyTh: string | null;
  customerTaxId: string | null;
  customerAddress: string | null;
  issuedDate: string;
  validUntil: string;
  packageId: string;
  billingType: BillingType;
  packageAmount: number;
  addonsAmount: number;
  discount: number;
  subtotal: number;
  vatEnabled: boolean;
  vatAmount: number;
  totalAmount: number;
  driveFileId: string | null;
  driveUrl: string | null;
  pdfFileSize: string | null;
  signatureUrl: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  items: QuotationItem[];
  offerRecords: QuotationOffer[];
  package: Package;
  createdBy: Pick<User, 'id' | 'name' | 'email' | 'signatureUrl'>;
}

export interface QuotationListItem {
  id: string;
  quotationNumber: string;
  version: number;
  customerCompany: string;
  totalAmount: number;
  issuedDate: string;
  validUntil: string;
  createdAt: string;
  package: { name: string };
  createdBy: { name: string };
  _count: { items: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuotationQueryParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/** Build itemization description from package data + billing type */
export function buildPackageDescription(
  pkg: { name: string; userCountEn?: string | null; userCountTh?: string | null },
  billingType: BillingType,
): { en: string; th: string } {
  const sub = billingType === 'MONTHLY' ? 'Monthly Subscription' : 'Yearly Subscription';
  const subTh = billingType === 'MONTHLY' ? 'สมาชิกรายเดือน' : 'สมาชิกรายปี';

  const userPart = pkg.userCountEn ? ` - ${pkg.userCountEn}` : '';
  const userPartTh = pkg.userCountTh ? ` - ${pkg.userCountTh}` : '';

  return {
    en: `${pkg.name} Package${userPart} - ${sub}`,
    th: `แพ็กเกจ ${pkg.name}${userPartTh} - ${subTh}`,
  };
}
