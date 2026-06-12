'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export interface SpecialOfferFormData {
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: string;
}

export const emptyOfferForm: SpecialOfferFormData = {
  name: '',
  nameTh: '',
  description: '',
  descriptionTh: '',
  isActive: true,
  isDefault: false,
  sortOrder: '0',
};

interface SpecialOfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  initialData: SpecialOfferFormData;
  onSave: (data: SpecialOfferFormData) => void;
  saving?: boolean;
}

export function SpecialOfferFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSave,
  saving,
}: SpecialOfferFormDialogProps) {
  const [form, setForm] = useState<SpecialOfferFormData>(initialData);
  const [errors, setErrors] = useState<{ name?: boolean; nameTh?: boolean }>({});

  // Sync form state when dialog opens (handles programmatic open where
  // Radix onOpenChange is not invoked)
  useEffect(() => {
    if (open) {
      setForm(initialData);
      setErrors({});
    }
  }, [open]);

  const handleSave = () => {
    const newErrors: { name?: boolean; nameTh?: boolean } = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.nameTh.trim()) newErrors.nameTh = true;
    if (newErrors.name || newErrors.nameTh) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Special Offer' : 'Add Special Offer'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
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
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (e.target.value.trim()) setErrors((p) => ({ ...p, name: false }));
                }}
                placeholder="Free Data Migration"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">Name (EN) is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Name (TH) *</Label>
              <Input
                value={form.nameTh}
                onChange={(e) => {
                  setForm({ ...form, nameTh: e.target.value });
                  if (e.target.value.trim()) setErrors((p) => ({ ...p, nameTh: false }));
                }}
                placeholder="นำเข้าข้อมูลฟรี"
                className={errors.nameTh ? 'border-destructive' : ''}
              />
              {errors.nameTh && (
                <p className="text-xs text-destructive">Name (TH) is required</p>
              )}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
