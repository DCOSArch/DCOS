import { CaseStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: CaseStatus }) {
  const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border hover:bg-muted' },
    PENDING: { label: 'Awaiting lab acceptance', className: 'bg-attention-soft text-attention border-attention/30 hover:bg-attention-soft' },
    IN_PROGRESS: { label: 'In production', className: 'bg-primary-soft text-primary border-primary/30 hover:bg-primary-soft' },
    QUALITY_CHECK: { label: 'Quality check', className: 'bg-primary-soft/50 text-primary border-primary/20 hover:bg-primary-soft/50' },
    DISPATCHED: { label: 'Dispatched', className: 'bg-clinical-blue/10 text-clinical-blue border-clinical-blue/30 hover:bg-clinical-blue/10' },
    DELIVERED: { label: 'Delivered to clinic', className: 'bg-success-soft text-success border-success/30 hover:bg-success-soft' },
    COMPLETED: { label: 'Fitted / completed', className: 'bg-success-soft text-success border-success/30 hover:bg-success-soft font-semibold' },
    REJECTED: { label: 'Needs revision', className: 'bg-critical-soft text-critical border-critical/30 hover:bg-critical-soft font-semibold' },
  };

  const config = statusConfig[status];

  return (
    <Badge className={cn('whitespace-nowrap font-medium', config.className)} variant="outline">
      {config.label}
    </Badge>
  );
}
