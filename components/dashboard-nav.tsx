'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types';
import { useSidebar } from '@/hooks/useSidebar';
import { ChevronDown } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';

interface DashboardNavProps {
  items: NavItem[];
  setOpen?: Dispatch<SetStateAction<boolean>>;
  isMobileNav?: boolean;
}

export function DashboardNav({
  items,
  setOpen,
  isMobileNav = false
}: DashboardNavProps) {
  const path = usePathname();
  const { isMinimized } = useSidebar();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  if (!items?.length) {
    return null;
  }

  const handleToggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  return (
    <nav className="grid items-start gap-2">
      <TooltipProvider>
        {items.map((item, index) => {
          const Icon = Icons[item.icon || 'arrowRight'];
          return (
            <div key={index}>
              {/* Parent menu item */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.disabled ? '/' : item.href || '#'}
                    className={cn(
                      'flex items-center gap-2 overflow-hidden rounded-md py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                      path === item.href ? 'bg-accent' : 'transparent',
                      item.disabled && 'cursor-not-allowed opacity-80'
                    )}
                    onClick={(e) => {
                      if (item.submenu) {
                        e.preventDefault(); // Prevent navigation if there’s a submenu
                        handleToggleSubmenu(item.title);
                      } else {
                        if (setOpen) setOpen(false);
                      }
                    }}
                  >
                    <Icon className={`ml-3 size-5 flex-none`} />

                    {isMobileNav || (!isMinimized && !isMobileNav) ? (
                      <span className="mr-2 truncate">{item.title}</span>
                    ) : (
                      ''
                    )}

                    {item.submenu && (
                      <ChevronDown
                        className={cn(
                          'ml-auto transition-transform',
                          openSubmenu === item.title && 'rotate-180'
                        )}
                      />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  align="center"
                  side="right"
                  sideOffset={8}
                  className={!isMinimized ? 'hidden' : 'inline-block'}
                >
                  {item.title}
                </TooltipContent>
              </Tooltip>

              {/* Submenu */}
              {item.submenu && openSubmenu === item.title && (
                <div className="ml-6 mt-2 flex flex-col gap-2 border-l-2 border-muted pl-4">
                  {item.submenu.map((subitem, subIndex) => (
                    <Link
                      key={subIndex}
                      href={subitem.disabled ? '/' : subitem.href || '#'}
                      className={cn(
                        'flex items-center gap-2 rounded-md py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                        path === subitem.href ? 'bg-accent' : 'transparent',
                        subitem.disabled && 'cursor-not-allowed opacity-80'
                      )}
                      onClick={() => {
                        if (setOpen) setOpen(false);
                      }}
                    >
                      <Icons.arrowRight className="size-4 flex-none" />
                      <span>{subitem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </TooltipProvider>
    </nav>
  );
}
