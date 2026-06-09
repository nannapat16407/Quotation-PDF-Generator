'use client';

import { useState } from 'react';
import { useSpecialOffers } from '@/hooks/use-special-offers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import type { SpecialOffer } from '@/types';
import {
  SpecialOfferFormDialog,
  emptyOfferForm,
  type SpecialOfferFormData,
} from '@/components/special-offer-form-dialog';

function toForm(offer: SpecialOffer): SpecialOfferFormData {
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
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editing, setEditing] = useState<SpecialOffer | null>(null);
  const [formData, setFormData] = useState<SpecialOfferFormData>(emptyOfferForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogMode('add');
    setFormData(emptyOfferForm);
    setDialogOpen(true);
  };

  const openEdit = (offer: SpecialOffer) => {
    setEditing(offer);
    setDialogMode('edit');
    setFormData(toForm(offer));
    setDialogOpen(true);
  };

  const handleSave = async (form: SpecialOfferFormData) => {
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

      <SpecialOfferFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={formData}
        onSave={handleSave}
        saving={saving}
      />

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
