'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotation, useQuotationActions } from '@/hooks/use-quotations';
import { usePackages } from '@/hooks/use-packages';
import { useSpecialOffers } from '@/hooks/use-special-offers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import type { BillingType, QuotationItemType } from '@/types';

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
  const { offers: availableOffers } = useSpecialOffers();
  const { update } = useQuotationActions();

  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [customerCompany, setCustomerCompany] = useState('');
  const [customerCompanyTh, setCustomerCompanyTh] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('MONTHLY');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [discount, setDiscount] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);

  useEffect(() => {
    if (quotation && !initialized) {
      setCustomerCompany(quotation.customerCompany);
      setCustomerCompanyTh(quotation.customerCompanyTh || '');
      setCustomerTaxId(quotation.customerTaxId || '');
      setCustomerAddress(quotation.customerAddress || '');
      setIssuedDate(quotation.issuedDate.split('T')[0]);
      setValidUntil(quotation.validUntil.split('T')[0]);
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
      setInitialized(true);
    }
  }, [quotation, initialized]);

  const handleBillingTypeChange = (bt: BillingType) => {
    setBillingType(bt);
    const pkg = packages.find((p) => p.id === selectedPackageId);
    if (!pkg) return;
    const price = bt === 'MONTHLY' ? Number(pkg.monthlyPrice) : Number(pkg.yearlyPrice);
    setItems((prev) =>
      prev.map((i) =>
        i.type === 'PACKAGE'
          ? { ...i, unitPrice: price, amount: price }
          : i,
      ),
    );
  };

  const addAddon = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `addon-${Date.now()}`,
        type: 'ADDON',
        description: '',
        descriptionTh: '',
        qty: 1,
        unitPrice: 0,
        amount: 0,
        sortOrder: prev.length,
      },
    ]);
  };

  const updateAddon = (itemId: string, field: keyof ItemRow, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          updated.amount = updated.qty * updated.unitPrice;
        }
        return updated;
      }),
    );
  };

  const removeAddon = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const packageAmount = items.find((i) => i.type === 'PACKAGE')?.amount || 0;
  const addonsAmount = items
    .filter((i) => i.type === 'ADDON')
    .reduce((sum, i) => sum + i.amount, 0);
  const subtotal = packageAmount + addonsAmount - discount;
  const vatAmount = vatEnabled ? subtotal * 0.07 : 0;
  const totalAmount = subtotal + vatAmount;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await update({
        id,
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
        items: items.map(({ type, description, descriptionTh, qty, unitPrice, amount, sortOrder }) => ({
          type,
          description,
          descriptionTh: descriptionTh || undefined,
          qty,
          unitPrice,
          amount,
          sortOrder,
        })),
        offers: quotation?.offerRecords?.map((o) => ({
          specialOfferId: o.specialOfferId || undefined,
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

  if (isLoading || !quotation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
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

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name (EN) *</Label>
              <Input value={customerCompany} onChange={(e) => setCustomerCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Company Name (TH)</Label>
              <Input value={customerCompanyTh} onChange={(e) => setCustomerCompanyTh(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax ID</Label>
              <Input value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
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
              <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Type Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['MONTHLY', 'YEARLY'] as BillingType[]).map((bt) => {
              const pkg = packages.find((p) => p.id === selectedPackageId);
              const price = pkg
                ? bt === 'MONTHLY'
                  ? Number(pkg.monthlyPrice)
                  : Number(pkg.yearlyPrice)
                : 0;
              return (
                <Button
                  key={bt}
                  variant={billingType === bt ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBillingTypeChange(bt)}
                >
                  {bt === 'MONTHLY' ? 'Monthly' : 'Yearly'} — {formatCurrency(price)}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Itemization */}
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
                  <th className="text-right px-3 py-2 font-medium w-28">Unit Price</th>
                  <th className="text-right px-3 py-2 font-medium w-28">Amount</th>
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
                          <span className="text-muted-foreground">{item.description}</span>
                        ) : (
                          <Input
                            value={item.description}
                            onChange={(e) => updateAddon(item.id, 'description', e.target.value)}
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
                          onChange={(e) => updateAddon(item.id, 'qty', Number(e.target.value))}
                          className="h-7 text-sm text-center"
                          min={1}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {item.type === 'PACKAGE' ? (
                        <span className="text-right block">{formatCurrency(item.unitPrice)}</span>
                      ) : (
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateAddon(item.id, 'unitPrice', Number(e.target.value))}
                          className="h-7 text-sm text-right"
                          min={0}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-2">
                      {item.type === 'ADDON' && (
                        <Button variant="ghost" size="icon-xs" onClick={() => removeAddon(item.id)}>
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
        <Button onClick={handleSubmit} disabled={saving || !customerCompany}>
          {saving ? 'Saving...' : 'Update Quotation'}
        </Button>
      </div>
    </div>
  );
}
