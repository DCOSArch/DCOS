import { Subscription, SubscriptionTier, FeatureKey, SubscriptionFeatures } from '@/types';
import { createClient } from '@/lib/supabase/client';

export const TIER_ENTITLEMENTS: Record<SubscriptionTier, SubscriptionFeatures> = {
  STARTER: {
    dicom_mpr: false,
    cad_bridge: false,
    whatsapp_automation: false,
    unlimited_cases: false,
    hardware_bridge: false,
    ai_margin_detection: false,
    merkle_audit: false,
    custom_sso: false,
  },
  PRO_LAB: {
    dicom_mpr: false,
    cad_bridge: true,
    whatsapp_automation: true,
    unlimited_cases: true,
    hardware_bridge: true,
    ai_margin_detection: false,
    merkle_audit: false,
    custom_sso: false,
  },
  ENTERPRISE: {
    dicom_mpr: true,
    cad_bridge: true,
    whatsapp_automation: true,
    unlimited_cases: true,
    hardware_bridge: true,
    ai_margin_detection: true,
    merkle_audit: true,
    custom_sso: true,
  },
};

export const FEATURE_METADATA: Record<FeatureKey, { name: string; description: string; requiredTier: SubscriptionTier }> = {
  dicom_mpr: {
    name: 'Tri-Planar CBCT DICOM MPR Viewer',
    description: 'Axial, coronal, and sagittal cross-sectional CBCT slices with panoramic reformatting and IAN nerve tracing.',
    requiredTier: 'ENTERPRISE',
  },
  cad_bridge: {
    name: 'Exocad & 3Shape CAD Bridge',
    description: 'Bi-directional manufacturing parameter synchronization and permanent soft-copy milled mesh warranty archiving.',
    requiredTier: 'PRO_LAB',
  },
  whatsapp_automation: {
    name: '1-Click WhatsApp Automations',
    description: 'Direct patient appointment confirmations, UPI balance payment deep-links, and 48hr post-op comfort checks.',
    requiredTier: 'PRO_LAB',
  },
  unlimited_cases: {
    name: 'Unlimited Active Lab Cases',
    description: 'Route and manufacture unlimited digital restorative orders per month without volume ceilings.',
    requiredTier: 'PRO_LAB',
  },
  hardware_bridge: {
    name: 'Operatory Hardware WebSocket Bridge',
    description: 'Native foot-pedal triggering and high-definition USB intraoral camera direct capture.',
    requiredTier: 'PRO_LAB',
  },
  ai_margin_detection: {
    name: 'Autonomous AI Margin Detection (Enterprise Preview)',
    description: 'Computer-vision auto-segmentation of gingival margins and undercut warnings on 3D meshes.',
    requiredTier: 'ENTERPRISE',
  },
  merkle_audit: {
    name: 'Cryptographic Merkle Audit Ledger (Enterprise Preview)',
    description: 'Bi-temporal immutable audit chain guaranteeing tamper-proof clinical records for compliance & medico-legal safety.',
    requiredTier: 'ENTERPRISE',
  },
  custom_sso: {
    name: 'Enterprise SAML / Okta SSO',
    description: 'Centralized hospital and DSO identity management with role-based access delegation.',
    requiredTier: 'ENTERPRISE',
  },
};

export const DEFAULT_STARTER_SUBSCRIPTION: Subscription = {
  id: 'sub_default_starter',
  organizationId: 'org_default',
  tier: 'STARTER',
  status: 'ACTIVE',
  casesUsedThisPeriod: 7,
  caseLimit: 20,
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  features: TIER_ENTITLEMENTS.STARTER,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Unwired / ghost subsystems documented in docs/map/objects/_ghosts/.
 * Gated to return false across all tiers until fully wired to active runtime engines.
 */
export const GHOST_FEATURES: ReadonlySet<FeatureKey> = new Set([
  'merkle_audit',
  'ai_margin_detection',
]);

/**
 * Checks if a given tier has access to a specific feature.
 * Ghost features return false across all tiers until their runtime subsystems are connected.
 */
export function hasFeatureAccess(tier: SubscriptionTier = 'STARTER', feature: FeatureKey): boolean {
  if (GHOST_FEATURES.has(feature)) {
    return false;
  }
  const entitlements = TIER_ENTITLEMENTS[tier] || TIER_ENTITLEMENTS.STARTER;
  return entitlements[feature] === true;
}

/**
 * Retrieves the current subscription for an organization, with graceful fallback to Starter.
 */
export async function getOrganizationSubscription(organizationId?: string): Promise<Subscription> {
  if (!organizationId) {
    return DEFAULT_STARTER_SUBSCRIPTION;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        organizationId: data.organization_id,
        tier: data.tier as SubscriptionTier,
        status: data.status,
        casesUsedThisPeriod: data.cases_used_this_period,
        caseLimit: data.case_limit,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        features: (data.features as SubscriptionFeatures) || TIER_ENTITLEMENTS[data.tier as SubscriptionTier] || TIER_ENTITLEMENTS.STARTER,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.warn('Could not fetch subscription from Supabase, falling back to starter', err);
  }

  return DEFAULT_STARTER_SUBSCRIPTION;
}

/**
 * Verifies case creation quota limits for the active billing cycle.
 */
export function evaluateCaseQuota(subscription: Subscription): {
  canCreate: boolean;
  used: number;
  limit: number;
  percentageUsed: number;
  isUnlimited: boolean;
} {
  const isUnlimited = subscription.caseLimit === -1 || subscription.tier === 'PRO_LAB' || subscription.tier === 'ENTERPRISE';
  if (isUnlimited) {
    return {
      canCreate: true,
      used: subscription.casesUsedThisPeriod,
      limit: -1,
      percentageUsed: 0,
      isUnlimited: true,
    };
  }

  const remaining = Math.max(0, subscription.caseLimit - subscription.casesUsedThisPeriod);
  const percentageUsed = Math.min(100, Math.round((subscription.casesUsedThisPeriod / subscription.caseLimit) * 100));

  return {
    canCreate: remaining > 0,
    used: subscription.casesUsedThisPeriod,
    limit: subscription.caseLimit,
    percentageUsed,
    isUnlimited: false,
  };
}
