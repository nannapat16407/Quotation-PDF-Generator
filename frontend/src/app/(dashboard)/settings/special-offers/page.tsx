'use client';

import { useState } from 'react';
import { useSpecialOffers } from '@/hooks/use-special-offers';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import type { SpecialOffer } from '@/types';

interface OfferForm {
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: string;
}

const emptyForm: OfferForm = {
  name: '',
  nameTh: '',
  description: '',
  descriptionTh: '',
  isActive: true,
  isDefault: false,
  sortOrder: '0',
};

function toForm(offer: SpecialOffer): OfferForm {
  return {
    name: offer.name,
    nameTh: offer.nameTh || '',
    description: offer.description || '',
    descriptionTh: offer.descriptionTh || '',
    isActive: offer.isActive,
    isDefault: offer.isDefault,
    sortOrder: String(offer.sortOrder),
  };
}

export default function SpecialOffersPage() {
  const { offers, isLoading, create, update, remove } = useSpecialOffers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpecialOffer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (offer: SpecialOffer) => {
    setEditing(offer);
    setForm(toForm(offer));
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
        isActive: form.isActive,
        isDefault: form.isDefault,
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
          <h1 className="text-2xl font-semibold">Special Offers</h1>
          <p className="text-muted-foreground mt-1">
            Manage special offers that can be included in quotations.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Add Offer
        </Button>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => (
          <Card key={offer.id} className={!offer.isActive ? 'opacity-60' : ''}>
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <GripVertical className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{offer.name}</CardTitle>
                    {offer.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {!offer.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {offer.nameTh && (
                    <p className="text-sm text-muted-foreground">{offer.nameTh}</p>
                  )}
                  {offer.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {offer.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(offer)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(offer.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {offers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No special offers yet. Click &quot;Add Offer&quot; to create one.
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Special Offer' : 'Add Special Offer'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update offer details.'
                : 'Create a new special offer for quotations.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Free Data Migration"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (TH)</Label>
                <Input
                  value={form.nameTh}
                  onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
                  placeholder="นำเข้าข้อมูลฟรี"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Free for Basic plans and above."
                />
              </div>
              <div className="space-y-2">
                <Label>Description (TH)</Label>
                <Input
                  value={form.descriptionTh}
                  onChange={(e) => setForm({ ...form, descriptionTh: e.target.value })}
                  placeholder="ฟรีสำหรับแพ็กเกจ Basic ขึ้นไป"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
                />
                <Label>Default</Label>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  className="w-20"
                />
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
            <DialogTitle>Delete Special Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
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
