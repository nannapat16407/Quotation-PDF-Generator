'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePackages } from '@/hooks/use-packages';
import { useSpecialOffers } from '@/hooks/use-special-offers';
import { useAuth } from '@/hooks/use-auth';
import { useQuotationActions } from '@/hooks/use-quotations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
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

  // Financial
  const [discount, setDiscount] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);

  // Offers
  const [offerSelections, setOfferSelections] = useState<OfferSelection[]>([]);

  // Load next quotation number
  useEffect(() => {
    getNextNumber().then(setQuotationNumber);
  }, []);

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

  // Auto-set package item when package or billing type changes
  const updatePackageItem = useCallback(
    (pkg: Package | undefined, bt: BillingType, currentItems: ItemRow[]) => {
      const addons = currentItems.filter((i) => i.type === 'ADDON');
      if (!pkg) return addons;

      const price = bt === 'MONTHLY' ? Number(pkg.monthlyPrice) : Number(pkg.yearlyPrice);
      const pkgItem: ItemRow = {
        id: 'pkg-main',
        type: 'PACKAGE',
        description: pkg.description || pkg.name,
        descriptionTh: pkg.descriptionTh || pkg.nameTh || '',
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
    const pkg = packages.find((p) => p.id === pkgId);
    setBillingType(pkg?.billingType || 'MONTHLY');
    setItems((prev) => updatePackageItem(pkg, pkg?.billingType || 'MONTHLY', prev));
  };

  const handleBillingTypeChange = (bt: BillingType) => {
    setBillingType(bt);
    const pkg = packages.find((p) => p.id === selectedPackageId);
    setItems((prev) => updatePackageItem(pkg, bt, prev));
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

  const updateAddon = (id: string, field: keyof ItemRow, value: any) => {
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

  const handleSubmit = async () => {
    if (!selectedPackageId || !customerCompany) return;
    setSaving(true);
    try {
      await create({
        customerCompany,
        customerCompanyTh: customerCompanyTh || undefined,
        customerTaxId: customerTaxId || undefined,
        customerAddress: customerAddress || undefined,
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
        signatureUrl: user?.signatureUrl || undefined,
        items: items.map(({ type, description, descriptionTh, qty, unitPrice, amount, sortOrder }) => ({
          type,
          description,
          descriptionTh: descriptionTh || undefined,
          qty,
          unitPrice,
          amount,
          sortOrder,
        })),
        offers: offerSelections
          .filter((o) => o.selected)
          .map((o) => ({
            specialOfferId: o.isCustom ? undefined : o.specialOfferId,
            name: o.name,
            nameTh: o.nameTh || undefined,
            isCustom: o.isCustom,
          })),
      });
      router.push('/quotations');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number) =>
    `฿${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>
            <div className="space-y-2">
              <Label>Company Name (TH)</Label>
              <Input
                value={customerCompanyTh}
                onChange={(e) => setCustomerCompanyTh(e.target.value)}
                placeholder="บริษัท แอคมี จำกัด"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input
                value={customerTaxId}
                onChange={(e) => setCustomerTaxId(e.target.value)}
                placeholder="0105566158667"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="123 ถนนสุขุมวิท..."
              />
            </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Package Selection</CardTitle>
          <CardDescription>Select a package and billing period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {packages
              .filter((p) => p.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPackage(pkg.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPackageId === pkg.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  {pkg.nameTh && (
                    <p className="text-xs text-muted-foreground">{pkg.nameTh}</p>
                  )}
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="font-bold">
                      ฿{Number(pkg.monthlyPrice).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Yearly</p>
                    <p className="font-bold">
                      ฿{Number(pkg.yearlyPrice).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
          </div>

          {selectedPackage && (
            <div className="space-y-2">
              <Label>Billing Period</Label>
              <div className="flex gap-2">
                {(['MONTHLY', 'YEARLY'] as BillingType[]).map((bt) => (
                  <Button
                    key={bt}
                    variant={billingType === bt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleBillingTypeChange(bt)}
                  >
                    {bt === 'MONTHLY' ? 'Monthly' : 'Yearly'} —{' '}
                    {formatCurrency(
                      bt === 'MONTHLY'
                        ? Number(selectedPackage.monthlyPrice)
                        : Number(selectedPackage.yearlyPrice),
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
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
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.type}
                        </Badge>
                        {item.type === 'PACKAGE' ? (
                          <span className="text-muted-foreground">
                            {item.description}
                          </span>
                        ) : (
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateAddon(item.id, 'description', e.target.value)
                            }
                            placeholder="Add-on description"
                            className="h-7 text-sm border-0 shadow-none px-0 focus-visible:ring-0"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {item.type === 'PACKAGE' ? (
                        <span className="text-center block">{item.qty}</span>
                      ) : (
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            updateAddon(item.id, 'qty', Number(e.target.value))
                          }
                          className="h-7 text-sm text-center"
                          min={1}
                        />
                      )}
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
                            updateAddon(
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
          <CardDescription>Select offers to include in this quotation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {offerSelections.map((offer) => (
            <label
              key={offer.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
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
                className="size-4 rounded border-border"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{offer.name}</p>
                {offer.nameTh && (
                  <p className="text-xs text-muted-foreground">{offer.nameTh}</p>
                )}
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

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

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.push('/quotations')}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || !selectedPackageId || !customerCompany}
        >
          {saving ? 'Creating...' : 'Create Quotation'}
        </Button>
      </div>
    </div>
  );
}
