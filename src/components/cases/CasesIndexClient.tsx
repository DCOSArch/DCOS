'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Case, User, CaseStatus, Urgency } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileBox, Search, ChevronRight, User as UserIcon, Filter } from 'lucide-react';

interface CasesIndexClientProps {
  initialCases: Case[];
  currentUser: User;
}

const STATUS_OPTIONS: (CaseStatus | 'ALL')[] = [
  'ALL', 'DRAFT', 'PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED', 'COMPLETED', 'REJECTED',
];
const URGENCY_OPTIONS: (Urgency | 'ALL')[] = ['ALL', 'LOW', 'NORMAL', 'HIGH', 'URGENT'];

const urgencyColor: Record<Urgency, string> = {
  LOW: 'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-300',
  NORMAL: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-300',
  HIGH: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300',
  URGENT: 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-300',
};

export default function CasesIndexClient({ initialCases, currentUser }: CasesIndexClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return initialCases
      .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
      .filter(c => urgencyFilter === 'ALL' || c.urgency === urgencyFilter)
      .filter(c => {
        if (!s) return true;
        return (
          c.patientName.toLowerCase().includes(s) ||
          c.id.toLowerCase().includes(s) ||
          (c.requestedTreatment ?? '').toLowerCase().includes(s)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialCases, search, statusFilter, urgencyFilter]);

  const statusCounts = useMemo(() => {
    const c: Partial<Record<CaseStatus, number>> = {};
    for (const x of initialCases) c[x.status] = (c[x.status] ?? 0) + 1;
    return c;
  }, [initialCases]);

  const activeCount =
    (statusCounts['PENDING'] ?? 0) +
    (statusCounts['IN_PROGRESS'] ?? 0) +
    (statusCounts['QUALITY_CHECK'] ?? 0) +
    (statusCounts['DISPATCHED'] ?? 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <FileBox className="w-8 h-8 text-primary" />
            Lab Cases
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            {currentUser.role === 'DENTIST'
              ? 'Every case you have sent to a lab — with status, urgency, and due dates.'
              : 'Every case routed to this laboratory — with dentist context and delivery schedule.'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <StatSlot label="Total" value={initialCases.length} />
          <StatSlot label="Active" value={activeCount} accent />
          <StatSlot label="Delivered" value={statusCounts['DELIVERED'] ?? 0} />
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient, case ID, or treatment"
                className="bg-muted/40 pl-9 border-border h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px] h-9 text-xs bg-muted/40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-xs">
                      {o === 'ALL' ? 'All statuses' : o.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={(v) => setUrgencyFilter(v as any)}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-muted/40">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-xs">
                      {o === 'ALL' ? 'All urgency' : o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-14 space-y-2">
              <FileBox className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
              <p className="text-sm font-semibold text-foreground">No cases match your filters</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Clear the filters above or create a new case from the dashboard.
              </p>
              <Link href="/">
                <Button size="sm" variant="outline" className="text-xs mt-2">Back to dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id} className="group hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground">{c.patientName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">#{c.id.slice(-8).toUpperCase()}</span>
                          {c.patientId && (
                            <Link href={`/patients/${c.patientId}`} className="mt-0.5 flex items-center gap-1 text-[10px] text-primary hover:underline w-fit">
                              <UserIcon className="w-3 h-3" />
                              View patient chart
                            </Link>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="text-xs text-foreground line-clamp-2">{c.requestedTreatment}</span>
                        {c.material && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{c.material}</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${urgencyColor[c.urgency]}`}>
                          {c.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-foreground">
                          {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}
                        </span>
                        {c.proposedDueDate && c.proposedDueDate !== c.dueDate && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                            proposed: {new Date(c.proposedDueDate).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={c.patientId ? `/patients/${c.patientId}?caseId=${c.id}` : `/cases/${c.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 text-xs">
                            Open Workspace
                            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatSlot({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${accent ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/40'}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-base font-bold leading-none ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
