import { CaseStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: CaseStatus }) {
  const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-zinc-100 text-zinc-800 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-700/50' },
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50 dark:hover:bg-yellow-900/40' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/40' },
    QUALITY_CHECK: { label: 'QC Hold', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50 dark:hover:bg-purple-900/40' },
    DISPATCHED: { label: 'Dispatched', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50 dark:hover:bg-orange-900/40' },
    DELIVERED: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40' },
    COMPLETED: { label: 'Completed', className: 'bg-emerald-200 text-emerald-900 hover:bg-emerald-200 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900' },
  };

  const config = statusConfig[status];

  return (
    <Badge className={cn('whitespace-nowrap font-medium', config.className)} variant="outline">
      {config.label}
    </Badge>
  );
}
