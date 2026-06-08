'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  FileText,
  Package,
  Settings,
  Sparkles,
  Building2,
  HardDrive,
  User,
} from 'lucide-react';

const navItems = [
  { label: 'Quotations', href: '/quotations', icon: FileText, adminOnly: false },
  { label: 'Supplier Info', href: '/settings/supplier', icon: Building2, adminOnly: true },
  { label: 'Packages', href: '/settings/packages', icon: Package, adminOnly: true },
  { label: 'Special Offers', href: '/settings/special-offers', icon: Sparkles, adminOnly: true },
  { label: 'Google Drive', href: '/settings/google-drive', icon: HardDrive, adminOnly: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          S
        </div>
        <span className="font-semibold text-lg">SuperHR</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-1">
        {isAdmin && (
          <Link
            href="/settings/supplier"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        )}
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <User className="size-4" />
          Profile
        </Link>
      </div>
    </aside>
  );
}
