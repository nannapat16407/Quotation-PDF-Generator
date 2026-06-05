'use client';

import { useState, useEffect } from 'react';
import { useSupplier } from '@/hooks/use-supplier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupplierPage() {
  const { supplier, isLoading, update, isUpdating } = useSupplier();
  const [form, setForm] = useState({
    companyName: '',
    companyNameTh: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        companyName: supplier.companyName || '',
        companyNameTh: supplier.companyNameTh || '',
        taxId: supplier.taxId || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        website: supplier.website || '',
      });
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Supplier Information</h1>
        <p className="text-muted-foreground mt-1">
          Manage your company details that appear on quotation documents.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>
            This information will be used as the default supplier on all quotations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (EN) *</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                  placeholder="SuperHR Co., Ltd."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyNameTh">Company Name (TH)</Label>
                <Input
                  id="companyNameTh"
                  value={form.companyNameTh}
                  onChange={(e) => setForm({ ...form, companyNameTh: e.target.value })}
                  placeholder="บริษัท ซุปเปอร์เอชอาร์ จำกัด"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID *</Label>
              <Input
                id="taxId"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                required
                placeholder="0105566158667"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                placeholder="287 ชั้น 8 ถนนสีลม..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="02-077-7581"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="cs@superhr.biz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="www.superhr.biz"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
