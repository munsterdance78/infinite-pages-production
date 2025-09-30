/**
 * V2.0 Feature Flags System - Main Entry Point
 * Enables controlled rollout and configuration of new V2.0 features
 */

// Re-export configuration for backward compatibility
export type {
  V2FeatureConfig,
  V2FeatureLimits
} from './v2-feature-config'
export {
  V2_FEATURE_FLAGS,
  V2_FEATURE_LIMITS
} from './v2-feature-config'

import type {
  V2FeatureConfig,
  V2FeatureLimits } from './v2-feature-config'
import {
  V2_FEATURE_FLAGS,
  V2_FEATURE_LIMITS
} from './v2-feature-config'

export class V2FeatureManager {
  private static instance: V2FeatureManager
  private features: V2FeatureConfig
  private limits: V2FeatureLimits

  private constructor() {
    this.features = V2_FEATURE_FLAGS
    this.limits = V2_FEATURE_LIMITS
  }

  static getInstance(): V2FeatureManager {
    if (!V2FeatureManager.instance) {
      V2FeatureManager.instance = new V2FeatureManager()
    }
    return V2FeatureManager.instance
  }

  isEnabled(feature: keyof V2FeatureConfig): boolean {
    return this.features[feature] === true
  }

  getLimit(limit: keyof V2FeatureLimits): number {
    return this.limits[limit]
  }

  getAllFeatures(): V2FeatureConfig {
    return { ...this.features }
  }

  getAllLimits(): V2FeatureLimits {
    return { ...this.limits }
  }

  // Feature checks for common use cases
  canExtractFacts(): boolean {
    return this.isEnabled('FACT_EXTRACTION')
  }

  canUseHierarchicalCache(): boolean {
    return this.isEnabled('HIERARCHICAL_CACHE')
  }

  canUseThreePhaseWorkflow(): boolean {
    return this.isEnabled('THREE_PHASE_WORKFLOW')
  }

  canGenerateCharacters(): boolean {
    return this.isEnabled('CHARACTER_GENERATION')
  }

  canUseWorldBuilder(): boolean {
    return this.isEnabled('WORLD_BUILDER')
  }

  canUseTimelineVisualization(): boolean {
    return this.isEnabled('TIMELINE_VISUALIZATION')
  }

  canManageSeries(): boolean {
    return this.isEnabled('SERIES_MANAGEMENT')
  }

  canUseAnalyticsV2(): boolean {
    return this.isEnabled('ANALYTICS_V2')
  }

  canUsePerformanceMonitoring(): boolean {
    return this.isEnabled('PERFORMANCE_MONITORING')
  }

  canUseAdvancedCaching(): boolean {
    return this.isEnabled('ADVANCED_CACHING')
  }
}

export const V2FeatureUtils = {
  // Utility functions for feature management
  getEnabledFeatures(): Array<keyof V2FeatureConfig> {
    const features = V2_FEATURE_FLAGS
    return Object.keys(features).filter(key =>
      features[key as keyof V2FeatureConfig]
    ) as Array<keyof V2FeatureConfig>
  },

  getDisabledFeatures(): Array<keyof V2FeatureConfig> {
    const features = V2_FEATURE_FLAGS
    return Object.keys(features).filter(key =>
      !features[key as keyof V2FeatureConfig]
    ) as Array<keyof V2FeatureConfig>
  },

  featureStatusSummary(): { enabled: number; disabled: number; total: number } {
    const enabled = this.getEnabledFeatures().length
    const total = Object.keys(V2_FEATURE_FLAGS).length
    return {
      enabled,
      disabled: total - enabled,
      total
    }
  }
}

// Export singleton instance
export const v2FeatureManager = V2FeatureManager.getInstance()