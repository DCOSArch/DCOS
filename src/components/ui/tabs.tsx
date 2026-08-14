'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'w-full flex flex-col gap-6',
        orientation === 'vertical' && 'flex-row',
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'inline-flex items-center gap-1.5 rounded-xl p-1 bg-muted/60 border border-border text-muted-foreground w-fit max-w-full overflow-x-auto',
  {
    variants: {
      variant: {
        default: 'bg-muted/60 border border-border',
        line: 'bg-transparent border-b border-border rounded-none p-0 gap-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 cursor-pointer select-none whitespace-nowrap outline-none',
        'hover:text-foreground hover:bg-muted/40',
        'data-[selected]:bg-card data-[selected]:text-primary data-[selected]:shadow-xs data-[selected]:border data-[selected]:border-border/60',
        'data-active:bg-card data-active:text-primary data-active:shadow-xs data-active:border data-active:border-border/60',
        'focus-visible:ring-2 focus-visible:ring-primary/40',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('w-full flex-1 outline-none animate-in fade-in-50 duration-200', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
