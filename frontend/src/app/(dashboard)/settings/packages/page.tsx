'use client';

import { useState } from 'react';
import { usePackages } from '@/hooks/use-packages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Package, BillingType } from '@/types';

interface PackageForm {
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  billingType: BillingType;
  monthlyPrice: string;
  yearlyPrice: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: PackageForm = {
  name: '',
  nameTh: '',
  description: '',
  descriptionTh: '',
  billingType: 'MONTHLY',
  monthlyPrice: '',
  yearlyPrice: '',
  isActive: true,
  sortOrder: '0',
};

function toForm(pkg: Package): PackageForm {
  return {
    name: pkg.name,
    nameTh: pkg.nameTh || '',
    description: pkg.description || '',
    descriptionTh: pkg.descriptionTh || '',
    billingType: pkg.billingType,
    monthlyPrice: String(pkg.monthlyPrice),
    yearlyPrice: String(pkg.yearlyPrice),
    isActive: pkg.isActive,
    sortOrder: String(pkg.sortOrder),
  };
}

export default function PackagesPage() {
  const { packages, isLoading, create, update, remove } = usePackages();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setForm(toForm(pkg));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        nameTh: form.nameTh || undefined,
        description: form.description || undefined,
        descriptionTh: form.descriptionTh || undefined,
        billingType: form.billingType,
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      };

      if (editing) {
        await update({ id: editing.id, ...payload });
      } else {
        await create(payload);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await remove(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Packages</h1>
          <p className="text-muted-foreground mt-1">
            Manage pricing packages available for quotations.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Add Package
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={!pkg.isActive ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  {pkg.nameTh && (
                    <p className="text-sm text-muted-foreground">{pkg.nameTh}</p>
                  )}
                </div>
                <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                  {pkg.billingType === 'MONTHLY' ? '/mo' : '/yr'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ฿{pkg.billingType === 'MONTHLY'
                  ? Number(pkg.monthlyPrice).toLocaleString()
                  : Number(pkg.yearlyPrice).toLocaleString()}
              </p>
              {pkg.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {pkg.description}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(pkg)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteId(pkg.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No packages yet. Click &quot;Add Package&quot; to create one.
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Package' : 'Add Package'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update package details and pricing.'
                : 'Create a new pricing package for quotations.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Starter"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (TH)</Label>
                <Input
                  value={form.nameTh}
                  onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
                  placeholder="สตาร์ทเตอร์"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Basic HR management..."
                />
              </div>
              <div className="space-y-2">
                <Label>Description (TH)</Label>
                <Input
                  value={form.descriptionTh}
                  onChange={(e) => setForm({ ...form, descriptionTh: e.target.value })}
                  placeholder="ระบบบริหารงานบุคคล..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Billing Type</Label>
              <Select
                value={form.billingType}
                onValueChange={(v) =>
                  setForm({ ...form, billingType: v as BillingType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price (฿)</Label>
                <Input
                  type="number"
                  value={form.monthlyPrice}
                  onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly Price (฿)</Label>
                <Input
                  type="number"
                  value={form.yearlyPrice}
                  onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
