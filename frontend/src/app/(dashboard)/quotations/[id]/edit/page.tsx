'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotation, useQuotationActions } from '@/hooks/use-quotations';
import { uploadSignature } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { usePackages } from '@/hooks/use-packages';
import { useSpecialOffers } from '@/hooks/use-special-offers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft, Pencil, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { BillingType, QuotationItemType, Package } from '@/types';
import { buildPackageDescription } from '@/types';
import {
  SpecialOfferFormDialog,
  emptyOfferForm,
  type SpecialOfferFormData,
} from '@/components/special-offer-form-dialog';

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

export default function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { quotation, isLoading } = useQuotation(id);
  const { packages } = usePackages();
  const { offers: availableOffers, create: createOffer, update: updateOffer, remove: removeOffer } = useSpecialOffers();
  const { update } = useQuotationActions();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Customer
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerCompanyTh, setCustomerCompanyTh] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Dates
  const [issuedDate, setIssuedDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Package
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('MONTHLY');

  // Items
  const [items, setItems] = useState<ItemRow[]>([]);

  // Financial
  const [discount, setDiscount] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);

  // Signature
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureLoadFailed, setSignatureLoadFailed] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Offers
  const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set());
  const [offersInitialized, setOffersInitialized] = useState(false);

  // Offer edit dialog
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerDialogMode, setOfferDialogMode] = useState<'add' | 'edit'>('add');
  const [offerDialogTargetId, setOfferDialogTargetId] = useState<string>('');
  const [offerFormData, setOfferFormData] = useState<SpecialOfferFormData>(emptyOfferForm);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Initialize from quotation data
  useEffect(() => {
    if (quotation && !initialized) {
      setCustomerCompany(quotation.customerCompany);
      setCustomerCompanyTh(quotation.customerCompanyTh || '');
      setCustomerTaxId(quotation.customerTaxId || '');
      setCustomerAddress(quotation.customerAddress || '');
      setIssuedDate(quotation.issuedDate.split('T')[0]);
      setValidUntil(quotation.validUntil.split('T')[0]);
      setDueDate(quotation.dueDate ? quotation.dueDate.split('T')[0] : '');
      setSelectedPackageId(quotation.packageId);
      setBillingType(quotation.billingType);
      setItems(
        quotation.items.map((i) => ({
          id: i.id,
          type: i.type,
          description: i.description,
          descriptionTh: i.descriptionTh || '',
          qty: i.qty,
          unitPrice: Number(i.unitPrice),
          amount: Number(i.amount),
          sortOrder: i.sortOrder,
        })),
      );
      setDiscount(Number(quotation.discount));
      setVatEnabled(quotation.vatEnabled);
      // Signature
      const sig = quotation.signatureUrl || null;
      const buildSrc = (path: string) => {
        if (path.startsWith('data:')) return path;
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const origin = new URL(apiUrl).origin;
          return `${origin}${path}`;
        } catch {
          return path;
        }
      };
      if (sig) {
        setSignaturePreview(buildSrc(sig));
        setSignatureUrl(sig);
      } else if (user?.signatureUrl) {
        setSignaturePreview(buildSrc(user.signatureUrl));
        setSignatureUrl(user.signatureUrl);
      }
      // Pre-select offers from quotation's existing records
      const preselectedIds = new Set(
        (quotation.offerRecords || [])
          .map((o) => o.specialOfferId)
          .filter((id): id is string => !!id),
      );
      setSelectedOfferIds(preselectedIds);
      setOffersInitialized(true);
      setInitialized(true);
    }
  }, [quotation, initialized]);

  // Keep offer selections in sync with available offers once both are loaded
  useEffect(() => {
    if (initialized && availableOffers.length > 0 && offersInitialized) {
      // No-op: selectedOfferIds already set from quotation data
    }
  }, [availableOffers, initialized, offersInitialized]);

  // Auto-set package item when billing type changes
  const updatePackageItem = useCallback(
    (pkg: Package | undefined, bt: BillingType, currentItems: ItemRow[]) => {
      const addons = currentItems.filter((i) => i.type === 'ADDON');
      if (!pkg) return addons;

      const price = bt === 'MONTHLY' ? Number(pkg.monthlyPrice) : Number(pkg.yearlyPrice);
      const desc = buildPackageDescription(pkg, bt);
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
    [],
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

  // Signature
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

    const reader = new FileReader();
    reader.onload = () => setSignaturePreview(reader.result as string);
    reader.readAsDataURL(file);

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

  const handleOfferSave = async (form: SpecialOfferFormData) => {
    setSavingOffer(true);
    try {
      const payload = {
        name: form.name.trim(),
        nameTh: form.nameTh.trim() || undefined,
        description: form.description.trim() || undefined,
        descriptionTh: form.descriptionTh.trim() || undefined,
        isActive: form.isActive,
        isDefault: form.isDefault,
        sortOrder: Number(form.sortOrder),
      };
      if (offerDialogMode === 'add') {
        const created = await createOffer(payload);
        setSelectedOfferIds((prev) => new Set(prev).add(created.id));
        toast.success('Offer created successfully.');
      } else {
        await updateOffer({ id: offerDialogTargetId, ...payload });
        toast.success('Offer updated successfully.');
      }
      setOfferDialogOpen(false);
    } catch {
      toast.error('Failed to save offer.');
    } finally {
      setSavingOffer(false);
    }
  };

  const handleOfferDelete = async () => {
    if (!deletingOfferId) return;
    try {
      await removeOffer(deletingOfferId);
      setSelectedOfferIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingOfferId);
        return next;
      });
      toast.success('Offer deleted successfully.');
    } catch {
      toast.error('Failed to delete offer.');
    } finally {
      setDeletingOfferId(null);
    }
  };

  // Calculations
  const packageAmount = items.find((i) => i.type === 'PACKAGE')?.amount || 0;
  const addonsAmount = items
    .filter((i) => i.type === 'ADDON')
    .reduce((sum, i) => sum + i.amount, 0);
  const subtotal = packageAmount + addonsAmount - discount;
  const vatAmount = vatEnabled ? subtotal * 0.07 : 0;
  const totalAmount = subtotal + vatAmount;

  // Validation
  const validateQuotation = useCallback(() => {
    const errors: Record<string, boolean> = {};
    if (!selectedPackageId) errors.package = true;
    if (!customerCompany.trim()) errors.customerCompany = true;
    if (!customerTaxId.trim() || !/^\d{13}$/.test(customerTaxId.trim())) errors.customerTaxId = true;
    if (!customerAddress.trim()) errors.customerAddress = true;
    return errors;
  }, [customerCompany, customerTaxId, customerAddress, selectedPackageId]);

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

    const trimmedOffers = availableOffers
      .filter((o) => selectedOfferIds.has(o.id))
      .map((o) => ({
        specialOfferId: o.id,
        name: o.name,
        nameTh: o.nameTh?.trim() || undefined,
        isCustom: false,
      }));

    setSaving(true);
    try {
      await update({
        id,
        customerCompany: customerCompany.trim(),
        customerCompanyTh: customerCompanyTh.trim() || undefined,
        customerTaxId: customerTaxId.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        issuedDate,
        validUntil,
        dueDate: dueDate || undefined,
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
      toast.success('Quotation updated successfully.');
      router.push('/quotations');
    } catch {
      toast.error('Failed to update quotation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number) =>
    `฿ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading || !quotation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/quotations')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Edit Quotation</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {quotation.quotationNumber} (v{quotation.version})
          </p>
        </div>
      </div>

      {/* Customer Information */}
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
                onChange={(e) => setCustomerCompanyTh(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tax ID *</Label>
            <Input
              data-field="customerTaxId"
              value={customerTaxId}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 13);
                setCustomerTaxId(val);
                if (attemptedSubmit && val.trim() && /^\d{13}$/.test(val.trim())) {
                  setValidationErrors((prev) => ({ ...prev, customerTaxId: false }));
                }
              }}
              placeholder="0105551234567"
              maxLength={13}
              className={validationErrors.customerTaxId && attemptedSubmit ? 'border-destructive' : ''}
            />
            {validationErrors.customerTaxId && attemptedSubmit && (
              <p className="text-xs text-destructive">
                {!customerTaxId.trim() ? 'Tax ID is required' : 'Tax ID must be exactly 13 digits'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Address *</Label>
            <Input
              data-field="customerAddress"
              value={customerAddress}
              onChange={(e) => {
                setCustomerAddress(e.target.value);
                if (attemptedSubmit && e.target.value.trim()) {
                  setValidationErrors((prev) => ({ ...prev, customerAddress: false }));
                }
              }}
              className={validationErrors.customerAddress && attemptedSubmit ? 'border-destructive' : ''}
            />
            {validationErrors.customerAddress && attemptedSubmit && (
              <p className="text-xs text-destructive">Address is required</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Quotation Number</Label>
            <Input
              value={quotation.quotationNumber}
              className="font-mono bg-muted/50"
              readOnly
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
          {availableOffers
            .filter((o) => o.isActive)
            .map((offer) => (
            <div
              key={offer.id}
              className="group flex items-start gap-3 py-3 rounded-md hover:bg-muted/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedOfferIds.has(offer.id)}
                onChange={(e) =>
                  setSelectedOfferIds((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(offer.id);
                    else next.delete(offer.id);
                    return next;
                  })
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
                    setOfferDialogMode('edit');
                    setOfferDialogTargetId(offer.id);
                    setOfferFormData({
                      name: offer.name,
                      nameTh: offer.nameTh || '',
                      description: offer.description || '',
                      descriptionTh: offer.descriptionTh || '',
                      isActive: offer.isActive,
                      isDefault: offer.isDefault,
                      sortOrder: String(offer.sortOrder),
                    });
                    setOfferDialogOpen(true);
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
              setOfferDialogMode('add');
              setOfferFormData(emptyOfferForm);
              setOfferDialogOpen(true);
            }}
          >
            <Plus className="size-3.5 mr-1" />
            Add Offer
          </Button>
        </CardContent>
      </Card>

      {/* Offer Add/Edit Dialog */}
      <SpecialOfferFormDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        mode={offerDialogMode}
        initialData={offerFormData}
        onSave={handleOfferSave}
        saving={savingOffer}
      />

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
              onClick={handleOfferDelete}
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
        <Button variant="outline" onClick={() => router.push('/quotations')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          {saving ? 'Updating Quotation...' : 'Update Quotation'}
        </Button>
      </div>

      {/* Full-page loading overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="text-center">
              <p className="text-lg font-semibold">Updating quotation...</p>
              <p className="text-sm text-muted-foreground mt-1">Saving changes and regenerating PDF</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
