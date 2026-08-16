'use client';

import React, { useState } from 'react';
import {
  Box,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileCode,
  Download,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExocadProjectMetadata } from '@/lib/cad/exocad-parser';
import { formatDate } from '@/lib/datetime';

interface ExocadProjectCardProps {
  project: ExocadProjectMetadata;
  onApprove?: () => void;
  onRequestRevision?: (feedback: string) => void;
}

export function ExocadProjectCard({
  project,
  onApprove,
  onRequestRevision,
}: ExocadProjectCardProps) {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'>('PENDING');
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const handleApprove = () => {
    setStatus('APPROVED');
    if (onApprove) onApprove();
  };

  const handleSendRevision = () => {
    if (!revisionFeedback.trim()) return;
    setStatus('REVISION_REQUESTED');
    setShowRevisionModal(false);
    if (onRequestRevision) onRequestRevision(revisionFeedback);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Exocad / 3Shape CAD Project
              <Badge
                variant="outline"
                className={
                  status === 'APPROVED'
                    ? 'text-emerald-600 border-emerald-500/30 font-bold'
                    : status === 'REVISION_REQUESTED'
                    ? 'text-amber-600 border-amber-500/30 font-bold'
                    : 'text-primary border-primary/30 font-bold'
                }
              >
                {status}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Project ID: {project.projectId} • Lab: {project.technicianName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Clock className="w-3.5 h-3.5" /> {formatDate(project.createdAt)}
        </div>
      </div>

      {/* Restorations List */}
      <div className="p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Planned Restorations ({project.restorations.length} Units)
        </h4>

        <div className="grid gap-3">
          {project.restorations.map((res, idx) => (
            <div
              key={idx}
              className="border border-border bg-background rounded-xl p-4 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground font-bold text-xs h-7 px-2.5">
                  Tooth {res.toothFdi}
                </Badge>
                <div>
                  <span className="font-bold text-foreground block">
                    {res.restorationType.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Material: {res.material} (Shade: {res.shade})
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] space-y-0.5 text-muted-foreground">
                <div>Cement Gap: <span className="text-foreground font-bold">{res.cementGapUm} µm</span></div>
                <div>Margin Gap: <span className="text-foreground font-bold">{res.marginGapUm} µm</span></div>
              </div>
            </div>
          ))}
        </div>

        {project.isBridge && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs flex items-center gap-2 text-primary font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Connected Bridge Span: [{project.bridgeSpan?.join(' - ')}]</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
        <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export .constructionInfo
        </Button>

        <div className="flex items-center gap-2">
          {status === 'PENDING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevisionModal(true)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                Request Revision
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve for Milling
              </Button>
            </>
          )}
          {status === 'APPROVED' && (
            <Badge className="bg-emerald-600 text-white font-semibold text-xs py-1 px-3 gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Locked for CAM
            </Badge>
          )}
          {status === 'REVISION_REQUESTED' && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 font-semibold text-xs py-1 px-3">
              Revision Sent to Lab Technician
            </Badge>
          )}
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-foreground">Request CAD Revision</h3>
            <p className="text-xs text-muted-foreground">
              Provide feedback for the dental technician (e.g. increase occlusal clearance by 0.5mm, tighten mesial contact).
            </p>
            <textarea
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="Enter revision notes..."
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowRevisionModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendRevision} className="text-xs font-semibold">
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
