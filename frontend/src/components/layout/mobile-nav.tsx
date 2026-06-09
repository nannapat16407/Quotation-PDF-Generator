'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { X, FileText, Package, Sparkles, Building2 } from 'lucide-react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Quotations', href: '/quotations', icon: FileText },
  { label: 'Supplier Info', href: '/settings/supplier', icon: Building2 },
  { label: 'Packages', href: '/settings/packages', icon: Package },
  { label: 'Special Offers', href: '/settings/special-offers', icon: Sparkles },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border">
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              S
            </div>
            <span className="font-semibold text-lg">SuperHR</span>
          </div>
          <button onClick={onClose}>
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
      </div>
    </div>
  );
}
