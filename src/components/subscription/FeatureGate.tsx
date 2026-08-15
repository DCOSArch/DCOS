'use client';

import React, { useState } from 'react';
import { SubscriptionTier, FeatureKey } from '@/types';
import { hasFeatureAccess, FEATURE_METADATA } from '@/lib/subscriptions';
import { UpgradeModal } from './UpgradeModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Zap, Building2, ChevronRight } from 'lucide-react';

interface FeatureGateProps {
  feature: FeatureKey;
  userTier?: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  compact?: boolean;
}

export function FeatureGate({
  feature,
  userTier = 'STARTER',
  children,
  fallback,
  compact = false,
}: FeatureGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isUnlocked = hasFeatureAccess(userTier, feature);

  if (isUnlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const meta = FEATURE_METADATA[feature];
  const isEnterprise = meta?.requiredTier === 'ENTERPRISE';

  if (compact) {
    return (
      <>
        <div
          onClick={() => setShowUpgradeModal(true)}
          className="p-3 rounded-xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors text-xs"
        >
          <div className="flex items-center gap-2">
            <Lock className={`w-4 h-4 ${isEnterprise ? 'text-purple-400' : 'text-emerald-400'}`} />
            <span className="font-semibold text-foreground">{meta?.name || 'Locked Feature'}</span>
            <Badge variant="outline" className={`text-[9px] ${isEnterprise ? 'border-purple-500/40 text-purple-300' : 'border-emerald-500/40 text-emerald-300'}`}>
              {meta?.requiredTier === 'ENTERPRISE' ? 'Enterprise' : 'Pro Lab'}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" className="h-6 text-[11px] text-primary p-0">
            Upgrade <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          featureKey={feature}
          targetTier={meta?.requiredTier}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full min-h-[360px] p-8 rounded-2xl border border-border/80 bg-neutral-950/70 backdrop-blur flex flex-col items-center justify-center text-center space-y-4 shadow-inner relative overflow-hidden">
        {/* Ambient Glow */}
        <div className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isEnterprise ? 'bg-purple-600' : 'bg-emerald-500'
        }`} />

        <div className={`p-4 rounded-2xl border shadow-lg ${
          isEnterprise ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
        }`}>
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{meta?.name || 'Advanced Feature Locked'}</h3>
            <Badge className={`text-[10px] font-mono ${
              isEnterprise ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {meta?.requiredTier === 'ENTERPRISE' ? 'ENTERPRISE PIPELINE' : 'PRO LAB CENTER'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {meta?.description || 'Upgrade your subscription plan to unlock access to this professional tool.'}
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className={`font-bold text-xs shadow-md ${
              isEnterprise
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isEnterprise ? <Building2 className="w-3.5 h-3.5 mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
            Unlock {meta?.requiredTier === 'ENTERPRISE' ? 'with Enterprise' : 'with Pro Lab ($149/mo)'}
          </Button>
        </div>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureKey={feature}
        targetTier={meta?.requiredTier}
      />
    </>
  );
}
