'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProfileActions } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { updateProfile, changePassword, isUpdating, isChangingPassword } = useProfileActions();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  if (!user) return null;

  const handleSaveProfile = async () => {
    await updateProfile({ name, email });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    if (newPassword.length < 6) {
      return;
    }
    await changePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Info */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Account Information</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isUpdating}>
              {isUpdating && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Password</h2>
          {!showPasswordForm && (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          )}
        </div>
        {showPasswordForm && (
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-destructive'
                    : 'border-border'
                }`}
                minLength={6}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                size="sm"
              >
                {isChangingPassword && <Loader2 className="size-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
