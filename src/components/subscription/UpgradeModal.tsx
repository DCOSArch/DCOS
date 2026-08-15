'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SubscriptionTier, FeatureKey } from '@/types';
import { FEATURE_METADATA } from '@/lib/subscriptions';
import { Check, Sparkles, Zap, Building2, Shield, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureKey?: FeatureKey;
  targetTier?: SubscriptionTier;
}

export function UpgradeModal({
  open,
  onOpenChange,
  featureKey,
  targetTier: explicitTargetTier,
}: UpgradeModalProps) {
  const metadata = featureKey ? FEATURE_METADATA[featureKey] : null;
  const targetTier = explicitTargetTier || metadata?.requiredTier || 'PRO_LAB';

  const handleUpgrade = (tier: SubscriptionTier) => {
    toast.success(`Redirecting to ${tier === 'PRO_LAB' ? 'Pro Lab ($149/mo)' : 'Enterprise'} checkout...`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground shadow-2xl p-6">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
              TIER FEATURE GATE
            </Badge>
            {targetTier === 'ENTERPRISE' ? (
              <Badge variant="outline" className="text-purple-400 border-purple-500/40 text-xs">
                Enterprise Feature
              </Badge>
            ) : (
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">
                Pro Lab Feature
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
            {metadata ? `Unlock ${metadata.name}` : 'Upgrade Your DentalConnect OS Plan'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {metadata?.description ||
              'Scale your dental practice and laboratory operations with automated CAD sync, unlimited case volume, and advanced diagnostic viewers.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tier Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
          {/* Pro Lab Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            targetTier === 'PRO_LAB' ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-xs' : 'bg-muted/30 border-border opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-foreground">Pro Lab Center</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">$149/mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
              For high-volume practices & commercial labs needing unlimited case routing and CAD bridges.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Unlimited active cases
              </li>
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Exocad & 3Shape CAD Bridge
              </li>
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1-Click WhatsApp automations
              </li>
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Soft-copy remake warranty archive
              </li>
            </ul>
            <Button
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
              onClick={() => handleUpgrade('PRO_LAB')}
            >
              Upgrade to Pro Lab ($149/mo)
            </Button>
          </div>

          {/* Enterprise Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            targetTier === 'ENTERPRISE' ? 'bg-purple-950/20 border-purple-500 ring-1 ring-purple-500 shadow-xs' : 'bg-muted/30 border-border opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-foreground">Enterprise Pipeline</span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400">Custom</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
              For hospital networks, DSOs, and enterprise milling groups needing custom infrastructure.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Tri-Planar CBCT DICOM MPR Viewer
              </li>
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> ABDM M1-M3 & HL7 FHIR EMR
              </li>
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Merkle tamper-proof audit ledger
              </li>
              <li className="flex items-center gap-2 text-foreground font-medium">
                <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Dedicated Cloudflare R2 bucket
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full mt-4 border-purple-500/50 hover:bg-purple-950/40 text-purple-300 font-bold text-xs shadow-xs"
              onClick={() => handleUpgrade('ENTERPRISE')}
            >
              Contact Enterprise Sales
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> 14-day money back guarantee &bull; Cancel anytime
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
