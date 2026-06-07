import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { colors } from './pdf-styles';

export interface QuotationPdfItem {
  description: string;
  descriptionTh?: string;
  qty: number;
  unitPrice: number;
  amount: number;
  type: string;
}

export interface QuotationPdfOffer {
  name: string;
  nameTh?: string;
}

export interface QuotationPdfData {
  quotationNumber: string;
  issuedDate: string;
  validUntil: string;

  supplier: {
    companyName: string;
    companyNameTh?: string;
    taxId: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };

  customer: {
    companyName: string;
    companyNameTh?: string;
    taxId?: string;
    address?: string;
  };

  package: {
    name: string;
    billingType: string;
    price: number;
    dueDate: string;
  };

  items: QuotationPdfItem[];
  offers: QuotationPdfOffer[];

  packageAmount: number;
  addonsAmount: number;
  discount: number;
  subtotal: number;
  vatEnabled: boolean;
  vatAmount: number;
  totalAmount: number;

  signatureUrl?: string;
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Sarabun',
    fontSize: 9,
    color: colors.black,
    backgroundColor: colors.white,
    padding: 0,
  },

  contentWrap: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.primary,
  },
  headerSub: {
    fontSize: 10,
    color: colors.gray,
  },
  headerBrand: {
    height: 32,
    width: 120,
  },

  infoGrid: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingBottom: 18,
    gap: 10,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 7,
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  infoName: {
    fontSize: 9,
    fontWeight: 600,
    marginBottom: 2,
  },
  infoDetail: {
    fontSize: 7.5,
    color: colors.gray,
    lineHeight: 1.5,
  },
  docInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  docRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 1,
  },
  docLabel: {
    fontSize: 7.5,
    color: colors.grayLight,
    width: '45%',
  },
  docValue: {
    fontSize: 7.5,
    fontWeight: 600,
    width: '55%',
  },

  heroBanner: {
    marginHorizontal: 28,
    marginBottom: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroPackage: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 600,
  },
  heroDue: {
    color: colors.white,
    fontSize: 9,
  },

  table: {
    marginHorizontal: 28,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  thDesc: { width: '50%', fontSize: 7, fontWeight: 600, color: colors.white },
  thQty: { width: '15%', fontSize: 7, fontWeight: 600, color: colors.white, textAlign: 'center' },
  thPrice: { width: '17.5%', fontSize: 7, fontWeight: 600, color: colors.white, textAlign: 'center' },
  thAmount: { width: '17.5%', fontSize: 7, fontWeight: 600, color: colors.white, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tdDesc: { width: '50%' },
  tdDescEn: { fontSize: 8.5, fontWeight: 500 },
  tdDescTh: { fontSize: 7.5, color: colors.gray },
  tdQty: { width: '15%', fontSize: 8.5, textAlign: 'center' },
  tdPrice: { width: '17.5%', fontSize: 8.5, textAlign: 'center' },
  tdAmount: { width: '17.5%', fontSize: 8.5, textAlign: 'right' },
  tdFree: { color: colors.green },

  bottomGrid: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    gap: 16,
    marginBottom: 16,
  },
  bottomLeft: { flex: 1, gap: 10 },
  bottomRight: { width: 180 },

  offersBox: {
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  offersHeader: {
    backgroundColor: '#e4e1ee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 7,
    fontWeight: 600,
  },
  offersBody: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 5,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  offerCheck: {
    fontSize: 8,
    color: colors.orange,
    marginTop: 1,
  },
  offerTextWrap: {
    flexDirection: 'column',
    gap: 1,
  },
  offerText: {
    fontSize: 7.5,
    color: colors.gray,
  },
  offerTextTh: {
    fontSize: 7,
    color: '#9ca3af',
  },

  termsBox: {
    borderWidth: 0.5,
    borderColor: colors.amberBorder,
    backgroundColor: colors.amberBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  termsHeader: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 7,
    fontWeight: 600,
  },
  termsBody: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
  },
  termText: {
    fontSize: 7,
    color: colors.gray,
    paddingLeft: 10,
  },

  summaryBox: {
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
  },
  summaryRowOrange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
    color: colors.orange,
    fontWeight: 600,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: colors.black,
    fontSize: 9,
    color: colors.white,
  },

  signatureRow: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 40,
  },
  signatureCol: {
    flex: 1,
    alignItems: 'center',
  },
  signatureArea: {
    height: 65,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  signatureImage: {
    width: 150,
    maxHeight: 55,
    objectFit: 'contain',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 0.75,
    borderTopColor: colors.black,
    paddingTop: 3,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 7,
    fontWeight: 500,
  },
  signatureSublabel: {
    fontSize: 6.5,
    color: colors.grayLight,
    marginTop: 1,
  },

  pageFooter: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 6.5,
    color: colors.grayLight,
    paddingHorizontal: 28,
  },
});

const paymentTerms = [
  'Full bank transfer annual payment in advance / ชำระรายปีเต็มจำนวนล่วงหน้า',
  'Quote valid upon validation date / ใบเสนอราคามีอายุตามระบุ',
  'Service activates 60 days for free / เปิดใช้งานระบบฟรี 60 วัน',
  'Payments are non-refundable / ขอสงวนสิทธิ ไม่คืนเงินทุกกรณี',
  'Able to deduct 3% for service WHT / สามารถหักที่จ่ายได้ 3%',
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const FOOTER_TEXT = 'Super HR Co., Ltd. | 287 Silom Rd, Silom, Bang Rak, Bangkok 10500 | cs@superhr.biz | www.superhr.biz | 02-077-7581';

export function QuotationPdfDocument({ data, logoSrc }: { data: QuotationPdfData; logoSrc?: string | null }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.contentWrap}>
          {/* Top content group — pushed to top by space-between */}
          <View>
            {/* Header */}
            <View style={s.headerRow}>
              <View>
                <Text style={s.headerTitle}>
                  Quotation <Text style={s.headerSub}>/ ใบเสนอราคา</Text>
                </Text>
              </View>
              {logoSrc ? (
                <Image src={logoSrc} style={s.headerBrand} />
              ) : (
                <View style={s.headerBrand}>
                  <Text style={{ fontSize: 18, fontWeight: 300, color: colors.primary, letterSpacing: 3 }}>
                    SUPERHR
                  </Text>
                </View>
              )}
            </View>

            {/* Three-column info section */}
            <View style={s.infoGrid}>
              {/* Supplier */}
              <View style={s.infoCol}>
                <View style={s.infoLabel}>
                  <Text>SUPPLIER / ผู้เสนอราคา</Text>
                </View>
                <Text style={s.infoName}>{data.supplier.companyName}</Text>
                {data.supplier.companyNameTh && (
                  <Text style={s.infoDetail}>{data.supplier.companyNameTh}</Text>
                )}
                <Text style={s.infoDetail}>เลขประจำตัวผู้เสียภาษี: {data.supplier.taxId}</Text>
                <Text style={s.infoDetail}>{data.supplier.address}</Text>
              </View>

              {/* Prepared For */}
              <View style={s.infoCol}>
                <View style={s.infoLabel}>
                  <Text>PREPARED FOR / เสนอแก่</Text>
                </View>
                <Text style={s.infoName}>{data.customer.companyName}</Text>
                {data.customer.companyNameTh && (
                  <Text style={s.infoDetail}>{data.customer.companyNameTh}</Text>
                )}
                {data.customer.taxId && (
                  <Text style={s.infoDetail}>เลขประจำตัวผู้เสียภาษี: {data.customer.taxId}</Text>
                )}
                {data.customer.address && (
                  <Text style={s.infoDetail}>{data.customer.address}</Text>
                )}
              </View>

              {/* Document Info */}
              <View style={s.infoCol}>
                <View style={s.infoLabel}>
                  <Text>DOCUMENT INFO / ข้อมูลเอกสาร</Text>
                </View>
                <View style={s.docInfoGrid}>
                  <View style={s.docRow}>
                    <Text style={s.docLabel}>Quo. No.</Text>
                    <Text style={s.docValue}>{data.quotationNumber}</Text>
                  </View>
                  <View style={s.docRow}>
                    <Text style={s.docLabel}>Issued</Text>
                    <Text style={s.docValue}>{formatDate(data.issuedDate)}</Text>
                  </View>
                  <View style={s.docRow}>
                    <Text style={s.docLabel}>Valid Until</Text>
                    <Text style={s.docValue}>{formatDate(data.validUntil)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Hero Banner */}
            <View style={s.heroBanner}>
              <Text style={s.heroPackage}>
                {data.package.name} ฿ {fmt(data.package.price)} /{' '}
                {data.package.billingType === 'YEARLY' ? 'Year' : 'Month'}
              </Text>
              <Text style={s.heroDue}>
                Due / ชำระภายใน {data.package.dueDate}
              </Text>
            </View>

            {/* Item Table */}
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={s.thDesc}>Description / รายละเอียด</Text>
                <Text style={s.thQty}>Qty</Text>
                <Text style={s.thPrice}>Unit Price / ราคา</Text>
                <Text style={s.thAmount}>Amount / รวม</Text>
              </View>
              {data.items.map((item, i) => (
                <View key={i} style={s.tableRow}>
                  <View style={s.tdDesc}>
                    <Text style={s.tdDescEn}>{item.description}</Text>
                    {item.descriptionTh && (
                      <Text style={s.tdDescTh}>{item.descriptionTh}</Text>
                    )}
                  </View>
                  <Text style={s.tdQty}>{item.qty}</Text>
                  <Text style={item.unitPrice === 0 ? [s.tdPrice, s.tdFree] : s.tdPrice}>
                    {fmt(item.unitPrice)}
                  </Text>
                  <Text style={item.amount === 0 ? [s.tdAmount, s.tdFree] : s.tdAmount}>
                    {fmt(item.amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bottom: Offers + Terms | Financial Summary */}
            <View style={s.bottomGrid}>
              <View style={s.bottomLeft}>
                {/* Special Offers */}
                {data.offers.length > 0 && (
                  <View style={s.offersBox}>
                    <View style={s.offersHeader}>
                      <Text>Special Offers Included / ข้อเสนอพิเศษที่รวมอยู่</Text>
                    </View>
                    <View style={s.offersBody}>
                      {data.offers.map((offer, i) => (
                        <View key={i} style={s.offerRow}>
                          <Text style={s.offerCheck}>✓</Text>
                          <View style={s.offerTextWrap}>
                            <Text style={s.offerText}>{offer.name}</Text>
                            {offer.nameTh && (
                              <Text style={s.offerTextTh}>{offer.nameTh}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Payment Terms */}
                <View style={s.termsBox}>
                  <View style={s.termsHeader}>
                    <Text>Payment Terms / เงื่อนไขการชำระเงิน</Text>
                  </View>
                  <View style={s.termsBody}>
                    {paymentTerms.map((t, i) => (
                      <Text key={i} style={s.termText}>
                        • {t}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              {/* Financial Summary */}
              <View style={s.bottomRight}>
                <View style={s.summaryBox}>
                  <View style={s.summaryRow}>
                    <Text>Pro Package</Text>
                    <Text>{fmt(data.packageAmount)}</Text>
                  </View>
                  <View style={s.summaryRow}>
                    <Text>Add-ons</Text>
                    <Text>{fmt(data.addonsAmount)}</Text>
                  </View>
                  {data.discount > 0 && (
                    <View style={s.summaryRowOrange}>
                      <Text>Discount</Text>
                      <Text>{fmt(data.discount)}</Text>
                    </View>
                  )}
                  <View style={s.summaryRow}>
                    <Text style={{ fontWeight: 600 }}>Subtotal</Text>
                    <Text style={{ fontWeight: 600 }}>{fmt(data.subtotal)}</Text>
                  </View>
                  <View style={s.summaryRow}>
                    <Text>VAT 7%</Text>
                    <Text>{data.vatEnabled ? fmt(data.vatAmount) : '0'}</Text>
                  </View>
                  <View style={s.summaryTotal}>
                    <Text style={{ fontWeight: 700 }}>Total Amount Due</Text>
                    <Text style={{ fontWeight: 700, fontSize: 11 }}>{fmt(data.totalAmount)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Signature Footer — pushed toward bottom by space-between */}
          <View style={s.signatureRow}>
            <View style={s.signatureCol}>
              <View style={s.signatureArea}>
                {data.signatureUrl && (
                  <Image src={data.signatureUrl} style={s.signatureImage} />
                )}
              </View>
              <View style={s.signatureLine}>
                <Text style={s.signatureLabel}>
                  Authorised by / {data.supplier.companyName}
                </Text>
                <Text style={s.signatureSublabel}>
                  ผู้มีอำนาจลงนาม / {data.supplier.companyNameTh || data.supplier.companyName}
                </Text>
              </View>
            </View>
            <View style={s.signatureCol}>
              <View style={s.signatureArea} />
              <View style={s.signatureLine}>
                <Text style={s.signatureLabel}>
                  Accepted by / {data.customer.companyName}
                </Text>
                <Text style={s.signatureSublabel}>
                  ผู้ยอมรับ / {data.customer.companyNameTh || data.customer.companyName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Page Footer */}
        <View style={s.pageFooter}>
          <Text>{FOOTER_TEXT}</Text>
        </View>
      </Page>
    </Document>
  );
}
