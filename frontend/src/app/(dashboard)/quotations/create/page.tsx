'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePackages } from '@/hooks/use-packages';
import { useSpecialOffers } from '@/hooks/use-special-offers';
import { useAuth } from '@/hooks/use-auth';
import { useQuotationActions } from '@/hooks/use-quotations';
import { uploadSignature } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft, Pencil, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Package, BillingType, QuotationItemType } from '@/types';

interface ItemRow {
  id: string;
  type: QuotationItemType;
  description: string;
  descriptionTh: string;
  qty: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

interface OfferSelection {
  id: string;
  specialOfferId: string;
  name: string;
  nameTh: string;
  selected: boolean;
  isCustom: boolean;
}

export default function CreateQuotationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { packages } = usePackages();
  const { offers: availableOffers } = useSpecialOffers();
  const { getNextNumber, create } = useQuotationActions();

  const [saving, setSaving] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState('');

  // Customer
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerCompanyTh, setCustomerCompanyTh] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Dates
  const [issuedDate, setIssuedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });

  // Package
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('MONTHLY');

  // Items
  const [items, setItems] = useState<ItemRow[]>([]);

  // Signature
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureLoadFailed, setSignatureLoadFailed] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Financial
  const [discount, setDiscount] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Offer edit dialog
  const [offerDialog, setOfferDialog] = useState<{
    mode: 'add' | 'edit';
    id: string;
    name: string;
    nameTh: string;
    selected: boolean;
  } | null>(null);
  const [offerDialogErrors, setOfferDialogErrors] = useState<{ name?: boolean; nameTh?: boolean }>({});
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);

  // Offers
  const [offerSelections, setOfferSelections] = useState<OfferSelection[]>([]);

  // Load next quotation number
  useEffect(() => {
    getNextNumber().then(setQuotationNumber);
  }, []);

  // Build full URL for a signature path
  const buildSignatureSrc = useCallback((path: string) => {
    if (path.startsWith('data:')) return path;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const origin = new URL(apiUrl).origin;
      return `${origin}${path}`;
    } catch {
      return path;
    }
  }, []);

  // Preload default signature from user profile
  useEffect(() => {
    if (user?.signatureUrl && !signatureUrl) {
      setSignaturePreview(buildSignatureSrc(user.signatureUrl));
      setSignatureUrl(user.signatureUrl);
    }
  }, [user, buildSignatureSrc]);

  // Initialize offer selections from available offers
  useEffect(() => {
    if (availableOffers.length > 0 && offerSelections.length === 0) {
      setOfferSelections(
        availableOffers
          .filter((o) => o.isActive)
          .map((o) => ({
            id: o.id,
            specialOfferId: o.id,
            name: o.name,
            nameTh: o.nameTh || '',
            selected: o.isDefault,
            isCustom: false,
          })),
      );
    }
  }, [availableOffers]);

  // Package description generator
  const generatePackageDescription = useCallback(
    (pkg: Package, bt: BillingType) => {
      const sub = bt === 'MONTHLY' ? 'Monthly Subscription' : 'Annual Subscription';
      const subTh = bt === 'MONTHLY' ? 'สมาชิกรายเดือน' : 'สมาชิกรายปี';

      const map: Record<string, { en: string; th: string }> = {
        Starter: {
          en: `Starter Package - 1 Organization User - ${sub}`,
          th: `แพ็กเกจ Starter - ผู้ใช้องค์กร 1 ราย - ${subTh}`,
        },
        'Basic Account': {
          en: `Basic Account Package - 2 Organization Users - ${sub}`,
          th: `แพ็กเกจ Basic Account - ผู้ใช้องค์กร 2 ราย - ${subTh}`,
        },
        Advanced: {
          en: `Advanced Package - 3 Organization Users - ${sub}`,
          th: `แพ็กเกจ Advanced - ผู้ใช้องค์กร 3 ราย - ${subTh}`,
        },
        'Go Pro': {
          en: `Go Pro Package - Unlimited Users - ${sub}`,
          th: `แพ็กเกจ Go Pro - ผู้ใช้ไม่จำกัด - ${subTh}`,
        },
      };

      return map[pkg.name] ?? {
        en: `${pkg.name} Package - ${sub}`,
        th: `แพ็กเกจ ${pkg.name} - ${subTh}`,
      };
    },
    [],
  );

  // Auto-set package item when package or billing type changes
  const updatePackageItem = useCallback(
    (pkg: Package | undefined, bt: BillingType, currentItems: ItemRow[]) => {
      const addons = currentItems.filter((i) => i.type === 'ADDON');
      if (!pkg) return addons;

      const price = bt === 'MONTHLY' ? Number(pkg.monthlyPrice) : Number(pkg.yearlyPrice);
      const desc = generatePackageDescription(pkg, bt);
      const pkgItem: ItemRow = {
        id: 'pkg-main',
        type: 'PACKAGE',
        description: desc.en,
        descriptionTh: desc.th,
        qty: 1,
        unitPrice: price,
        amount: price,
        sortOrder: 0,
      };
      return [pkgItem, ...addons.map((a, i) => ({ ...a, sortOrder: i + 1 }))];
    },
    [generatePackageDescription],
  );

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    if (attemptedSubmit) setValidationErrors((prev) => ({ ...prev, package: false }));
    const pkg = packages.find((p) => p.id === pkgId);
    setItems((prev) => updatePackageItem(pkg, billingType, prev));
  };

  const handleBillingTypeChange = (bt: BillingType) => {
    setBillingType(bt);
    const pkg = packages.find((p) => p.id === selectedPackageId);
    if (pkg) {
      setItems((prev) => updatePackageItem(pkg, bt, prev));
    }
  };

  // Addon management
  const addAddon = () => {
    setItems((prev) => {
      const addons = prev.filter((i) => i.type === 'ADDON');
      return [
        ...prev.filter((i) => i.type === 'PACKAGE'),
        ...addons,
        {
          id: `addon-${Date.now()}`,
          type: 'ADDON' as const,
          description: '',
          descriptionTh: '',
          qty: 1,
          unitPrice: 0,
          amount: 0,
          sortOrder: prev.length,
        },
      ];
    });
  };

  const updateItemQty = (id: string, rawValue: string) => {
    if (rawValue === '') {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, qty: 1, amount: 1 * item.unitPrice } : item,
        ),
      );
      return;
    }
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: parsed, amount: parsed * item.unitPrice } : item,
      ),
    );
  };

  const updateAddonField = (id: string, field: keyof ItemRow, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          updated.amount = updated.qty * updated.unitPrice;
        }
        return updated;
      }),
    );
  };

  const removeAddon = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const packageAmount =
    items.find((i) => i.type === 'PACKAGE')?.amount || 0;
  const addonsAmount = items
    .filter((i) => i.type === 'ADDON')
    .reduce((sum, i) => sum + i.amount, 0);
  const subtotal = packageAmount + addonsAmount - discount;
  const vatAmount = vatEnabled ? subtotal * 0.07 : 0;
  const totalAmount = subtotal + vatAmount;

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  // Validation
  const validateQuotation = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!selectedPackageId) errors.package = true;
    if (!customerCompany.trim()) errors.customerCompany = true;
    if (!customerCompanyTh.trim()) errors.customerCompanyTh = true;
    if (!customerTaxId.trim()) errors.customerTaxId = true;
    if (!customerAddress.trim()) errors.customerAddress = true;
    return errors;
  }, [customerCompany, customerCompanyTh, customerTaxId, customerAddress, selectedPackageId]);

  const handleSignatureUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureError(null);
    setSignatureLoadFailed(false);

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setSignatureError('Only PNG and JPEG files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('File size must be less than 2MB');
      e.target.value = '';
      return;
    }

    // Show preview immediately from local file
    const reader = new FileReader();
    reader.onload = () => setSignaturePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingSignature(true);
    try {
      const url = await uploadSignature(file);
      setSignatureUrl(url);
    } catch {
      setSignatureError('Failed to upload signature');
      setSignaturePreview(null);
      setSignatureUrl(null);
    } finally {
      setUploadingSignature(false);
    }
    e.target.value = '';
  }, []);

  const removeSignature = useCallback(() => {
    setSignaturePreview(null);
    setSignatureUrl(null);
    setSignatureError(null);
    setSignatureLoadFailed(false);
  }, []);

  const handleSubmit = async () => {
    const errors = validateQuotation();
    setValidationErrors(errors);
    setAttemptedSubmit(true);

    if (Object.keys(errors).length > 0) {
      if (errors.package) {
        document.getElementById('package-selection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const firstField = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          '[data-field="customerCompany"], [data-field="customerCompanyTh"], [data-field="customerTaxId"], [data-field="customerAddress"]',
        );
        if (firstField) firstField.focus();
      }
      return;
    }

    const trimmedOffers = offerSelections
      .filter((o) => {
        if (!o.selected) return false;
        if (o.isCustom) return o.name.trim() && o.nameTh.trim();
        return true;
      })
      .map((o) => ({
        specialOfferId: o.isCustom ? undefined : o.specialOfferId,
        name: o.name.trim(),
        nameTh: o.isCustom ? o.nameTh.trim() : (o.nameTh?.trim() || undefined),
        isCustom: o.isCustom,
      }));

    setSaving(true);
    try {
      await create({
        customerCompany: customerCompany.trim(),
        customerCompanyTh: customerCompanyTh.trim() || undefined,
        customerTaxId: customerTaxId.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        issuedDate,
        validUntil,
        packageId: selectedPackageId,
        billingType,
        packageAmount,
        addonsAmount,
        discount,
        subtotal,
        vatEnabled,
        vatAmount,
        totalAmount,
        signatureUrl: signatureUrl || undefined,
        items: items.map(({ type, description, descriptionTh, qty, unitPrice, amount, sortOrder }) => ({
          type,
          description,
          descriptionTh: descriptionTh || undefined,
          qty,
          unitPrice,
          amount,
          sortOrder,
        })),
        offers: trimmedOffers,
      });
      router.push('/quotations');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number) =>
    `฿ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/quotations')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create Quotation</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {quotationNumber || '...'}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Prepared for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name (EN) *</Label>
              <Input
                data-field="customerCompany"
                value={customerCompany}
                onChange={(e) => {
                  setCustomerCompany(e.target.value);
                  if (attemptedSubmit && e.target.value.trim()) {
                    setValidationErrors((prev) => ({ ...prev, customerCompany: false }));
                  }
                }}
                placeholder="SuperHR Co., Ltd."
                className={validationErrors.customerCompany && attemptedSubmit ? 'border-destructive' : ''}
              />
              {validationErrors.customerCompany && attemptedSubmit && (
                <p className="text-xs text-destructive">Company Name (EN) is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Company Name (TH) *</Label>
              <Input
                data-field="customerCompanyTh"
                value={customerCompanyTh}
                onChange={(e) => {
                  setCustomerCompanyTh(e.target.value);
                  if (attemptedSubmit && e.target.value.trim()) {
                    setValidationErrors((prev) => ({ ...prev, customerCompanyTh: false }));
                  }
                }}
                placeholder="บริษัท ซูเปอร์เอชอาร์ จำกัด"
                className={validationErrors.customerCompanyTh && attemptedSubmit ? 'border-destructive' : ''}
              />
              {validationErrors.customerCompanyTh && attemptedSubmit && (
                <p className="text-xs text-destructive">Company Name (TH) is required</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tax ID *</Label>
            <Input
              data-field="customerTaxId"
              value={customerTaxId}
              onChange={(e) => {
                setCustomerTaxId(e.target.value);
                if (attemptedSubmit && e.target.value.trim()) {
                  setValidationErrors((prev) => ({ ...prev, customerTaxId: false }));
                }
              }}
              placeholder="0105551234567"
              className={validationErrors.customerTaxId && attemptedSubmit ? 'border-destructive' : ''}
            />
            {validationErrors.customerTaxId && attemptedSubmit && (
              <p className="text-xs text-destructive">Tax ID is required</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Address *</Label>
            <Textarea
              data-field="customerAddress"
              value={customerAddress}
              onChange={(e) => {
                setCustomerAddress(e.target.value);
                if (attemptedSubmit && e.target.value.trim()) {
                  setValidationErrors((prev) => ({ ...prev, customerAddress: false }));
                }
              }}
              placeholder="123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพมหานคร 10110"
              className={validationErrors.customerAddress && attemptedSubmit ? 'border-destructive' : ''}
              rows={2}
            />
            {validationErrors.customerAddress && attemptedSubmit && (
              <p className="text-xs text-destructive">Address is required</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issued Date</Label>
              <Input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Selection */}
      <Card id="package-selection" className={validationErrors.package && attemptedSubmit ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle>Package Selection</CardTitle>
          <CardDescription>Select a package and billing period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationErrors.package && attemptedSubmit && (
            <p className="text-sm text-destructive font-medium">Please select a package.</p>
          )}
          {/* Billing Period Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
              {(['MONTHLY', 'YEARLY'] as BillingType[]).map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => handleBillingTypeChange(bt)}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                    billingType === bt
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {bt === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>

          {/* Package Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {packages
              .filter((p) => p.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const price =
                  billingType === 'MONTHLY'
                    ? Number(pkg.monthlyPrice)
                    : Number(pkg.yearlyPrice);
                const period = billingType === 'MONTHLY' ? 'month' : 'year';

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`relative rounded-xl border-2 p-5 text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                        : 'border-border hover:border-primary/40 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <Badge className="text-[10px] px-2 py-0.5">Selected</Badge>
                      </div>
                    )}
                    <p className="font-semibold text-base">{pkg.name}</p>
                    <div className="mt-3">
                      <p className="text-2xl font-bold">
                        {price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">
                          {' '}
                          THB / {period}
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Itemization Table */}
      <Card>
        <CardHeader>
          <CardTitle>Itemization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-center px-3 py-2 font-medium w-16">Qty</th>
                  <th className="text-right px-3 py-2 font-medium w-28">
                    Unit Price
                  </th>
                  <th className="text-right px-3 py-2 font-medium w-28">
                    Amount
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">
                          {item.type}
                        </Badge>
                        {item.type === 'PACKAGE' ? (
                          <div className="min-w-0">
                            <p className="text-sm text-foreground">{item.description}</p>
                            {item.descriptionTh && (
                              <p className="text-xs text-muted-foreground">{item.descriptionTh}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 space-y-1">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateAddonField(item.id, 'description', e.target.value)
                              }
                              placeholder="Description (English)"
                              className="h-7 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
                            />
                            <Input
                              value={item.descriptionTh}
                              onChange={(e) =>
                                updateAddonField(item.id, 'descriptionTh', e.target.value)
                              }
                              placeholder="Description (Thai)"
                              className="h-7 text-xs text-muted-foreground border-0 shadow-none px-0 focus-visible:ring-0"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateItemQty(item.id, e.target.value)
                        }
                        className="h-7 text-sm text-center"
                        min={1}
                        step={1}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {item.type === 'PACKAGE' ? (
                        <span className="text-right block">
                          {formatCurrency(item.unitPrice)}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateAddonField(
                              item.id,
                              'unitPrice',
                              Number(e.target.value),
                            )
                          }
                          className="h-7 text-sm text-right"
                          min={0}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-3 py-2">
                      {item.type === 'ADDON' && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeAddon(item.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={addAddon}>
            <Plus className="size-3.5 mr-1" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Special Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Special Offers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {offerSelections.map((offer) => (
            <div
              key={offer.id}
              className="group flex items-start gap-3 py-3 rounded-md hover:bg-muted/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={offer.selected}
                onChange={(e) =>
                  setOfferSelections((prev) =>
                    prev.map((o) =>
                      o.id === offer.id ? { ...o, selected: e.target.checked } : o,
                    ),
                  )
                }
                className="mt-1 size-5 rounded border-border accent-primary cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug">{offer.name}</p>
                {offer.nameTh && (
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {offer.nameTh}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setOfferDialogErrors({});
                    setOfferDialog({
                      mode: 'edit',
                      id: offer.id,
                      name: offer.name,
                      nameTh: offer.nameTh,
                      selected: offer.selected,
                    });
                  }}
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDeletingOfferId(offer.id)}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setOfferDialogErrors({});
              setOfferDialog({
                mode: 'add',
                id: `custom-${Date.now()}`,
                name: '',
                nameTh: '',
                selected: false,
              });
            }}
          >
            <Plus className="size-3.5 mr-1" />
            Add Offer
          </Button>
        </CardContent>
      </Card>

      {/* Offer Add/Edit Dialog */}
      <Dialog
        open={!!offerDialog}
        onOpenChange={(open) => { if (!open) setOfferDialog(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {offerDialog?.mode === 'edit' ? 'Edit Special Offer' : 'Add Special Offer'}
            </DialogTitle>
          </DialogHeader>
          {offerDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Offer (English) *</Label>
                <Input
                  value={offerDialog.name}
                  onChange={(e) => {
                    setOfferDialog({ ...offerDialog, name: e.target.value });
                    if (e.target.value.trim()) setOfferDialogErrors((p) => ({ ...p, name: false }));
                  }}
                  placeholder="Free Data Migration"
                  className={offerDialogErrors.name ? 'border-destructive' : ''}
                />
                {offerDialogErrors.name && (
                  <p className="text-xs text-destructive">Offer (English) is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Offer (Thai) *</Label>
                <Input
                  value={offerDialog.nameTh}
                  onChange={(e) => {
                    setOfferDialog({ ...offerDialog, nameTh: e.target.value });
                    if (e.target.value.trim()) setOfferDialogErrors((p) => ({ ...p, nameTh: false }));
                  }}
                  placeholder="นำเข้าข้อมูลฟรี"
                  className={offerDialogErrors.nameTh ? 'border-destructive' : ''}
                />
                {offerDialogErrors.nameTh && (
                  <p className="text-xs text-destructive">Offer (Thai) is required</p>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offerDialog.selected}
                  onChange={(e) =>
                    setOfferDialog({ ...offerDialog, selected: e.target.checked })
                  }
                  className="size-4 rounded border-border accent-primary"
                />
                <span className="text-sm">Selected by default</span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!offerDialog) return;
                const errors: { name?: boolean; nameTh?: boolean } = {};
                if (!offerDialog.name.trim()) errors.name = true;
                if (!offerDialog.nameTh.trim()) errors.nameTh = true;
                if (errors.name || errors.nameTh) {
                  setOfferDialogErrors(errors);
                  return;
                }
                if (offerDialog.mode === 'add') {
                  setOfferSelections((prev) => [
                    ...prev,
                    {
                      id: offerDialog.id,
                      specialOfferId: '',
                      name: offerDialog.name.trim(),
                      nameTh: offerDialog.nameTh.trim(),
                      selected: offerDialog.selected,
                      isCustom: true,
                    },
                  ]);
                } else {
                  setOfferSelections((prev) =>
                    prev.map((o) =>
                      o.id === offerDialog.id
                        ? {
                            ...o,
                            name: offerDialog.name.trim(),
                            nameTh: offerDialog.nameTh.trim(),
                            selected: offerDialog.selected,
                          }
                        : o,
                    ),
                  );
                }
                setOfferDialog(null);
              }}
            >
              Save Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Offer Confirmation */}
      <Dialog
        open={!!deletingOfferId}
        onOpenChange={(open) => { if (!open) setDeletingOfferId(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this special offer?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingOfferId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingOfferId) {
                  setOfferSelections((prev) => prev.filter((o) => o.id !== deletingOfferId));
                }
                setDeletingOfferId(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Package Amount</span>
            <span>{formatCurrency(packageAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Add-ons Amount</span>
            <span>{formatCurrency(addonsAmount)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm gap-4">
            <Label className="text-muted-foreground shrink-0">Discount</Label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-32 h-7 text-sm text-right"
              min={0}
            />
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
              <span className="text-muted-foreground">VAT 7%</span>
            </div>
            <span>{formatCurrency(vatAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Authorized Signature</CardTitle>
          <CardDescription>อัปโหลดลายเซ็นผู้มีอำนาจลงนาม</CardDescription>
        </CardHeader>
        <CardContent>
          {!signaturePreview || signatureLoadFailed ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <Upload className="size-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {signatureLoadFailed
                  ? 'Signature image could not be loaded — click to re-upload'
                  : 'Click to upload signature image'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                PNG, JPG, JPEG (max 2MB)
              </span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleSignatureUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative inline-block">
              <img
                src={signaturePreview}
                alt="Signature preview"
                className="max-h-32 max-w-xs object-contain rounded-lg border border-border"
                onError={() => {
                  setSignatureLoadFailed(true);
                }}
              />
              {uploadingSignature && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              <Button
                variant="destructive"
                size="icon-xs"
                className="absolute -top-2 -right-2"
                onClick={removeSignature}
              >
                <X className="size-3" />
              </Button>
            </div>
          )}
          {signatureError && (
            <p className="text-xs text-destructive mt-2">{signatureError}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.push('/quotations')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating...' : 'Create Quotation'}
        </Button>
      </div>
    </div>
  );
}
