/**
 * V2.0 Feature Flag Management System
 * Centralized control for incremental feature rollout
 */

export interface FeatureFlags {
  // Core V2.0 Features
  factExtraction: boolean
  hierarchicalCache: boolean
  threePhaseWorkflow: boolean
  characterGeneration: boolean
  worldBuilder: boolean
  timelineVisualization: boolean

  // Advanced V2.0 Features
  enhancementSliders: boolean
  workflowInterface: boolean
  sfslProcessing: boolean
  storyAnalysis: boolean
  characterVoicePatterns: boolean
  storyBibleCompliance: boolean
  compressionOptimization: boolean

  // Production Features
  advancedAnalytics: boolean
  realTimeMonitoring: boolean
  performanceTracking: boolean
  seriesManagement: boolean
  analyticsV2: boolean
  performanceMonitoring: boolean
  advancedCaching: boolean
}

// Environment-based feature flag configuration
const getFeatureFlags = (): FeatureFlags => {
  return {
    // Core V2.0 Features
    factExtraction: process.env['ENABLE_FACT_EXTRACTION'] === 'true',
    hierarchicalCache: process.env['ENABLE_HIERARCHICAL_CACHE'] === 'true',
    threePhaseWorkflow: process.env['ENABLE_THREE_PHASE_WORKFLOW'] === 'true',
    characterGeneration: process.env['ENABLE_CHARACTER_GENERATION'] === 'true',
    worldBuilder: process.env['ENABLE_WORLD_BUILDER'] === 'true',
    timelineVisualization: process.env['ENABLE_TIMELINE_VISUALIZATION'] === 'true',

    // Advanced V2.0 Features
    enhancementSliders: process.env['ENABLE_ENHANCEMENT_SLIDERS'] === 'true',
    workflowInterface: process.env['ENABLE_WORKFLOW_INTERFACE'] === 'true',
    sfslProcessing: process.env['ENABLE_SFSL_PROCESSING'] === 'true',
    storyAnalysis: process.env['ENABLE_STORY_ANALYSIS'] === 'true',
    characterVoicePatterns: process.env['ENABLE_CHARACTER_VOICE_PATTERNS'] === 'true',
    storyBibleCompliance: process.env['ENABLE_STORY_BIBLE_COMPLIANCE'] === 'true',
    compressionOptimization: process.env['ENABLE_COMPRESSION_OPTIMIZATION'] === 'true',

    // Production Features
    advancedAnalytics: process.env['ENABLE_ADVANCED_ANALYTICS'] === 'true',
    realTimeMonitoring: process.env['ENABLE_REAL_TIME_MONITORING'] === 'true',
    performanceTracking: process.env['ENABLE_PERFORMANCE_TRACKING'] === 'true',
    seriesManagement: process.env['ENABLE_SERIES_MANAGEMENT'] === 'true',
    analyticsV2: process.env['ENABLE_ANALYTICS_V2'] === 'true',
    performanceMonitoring: process.env['ENABLE_PERFORMANCE_MONITORING'] === 'true',
    advancedCaching: process.env['ENABLE_ADVANCED_CACHING'] === 'true'
  }
}

// Cached feature flags for performance
let cachedFlags: FeatureFlags | null = null

export const featureFlags = (): FeatureFlags => {
  if (!cachedFlags) {
    cachedFlags = getFeatureFlags()
  }
  return cachedFlags
}

// Helper functions for specific feature checks
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags()[feature]
}

export const areAllCoreV2FeaturesEnabled = (): boolean => {
  const flags = featureFlags()
  return flags.factExtraction &&
         flags.hierarchicalCache &&
         flags.threePhaseWorkflow &&
         flags.characterGeneration &&
         flags.worldBuilder &&
         flags.timelineVisualization
}

export const areAllAdvancedFeaturesEnabled = (): boolean => {
  const flags = featureFlags()
  return flags.enhancementSliders &&
         flags.workflowInterface &&
         flags.sfslProcessing &&
         flags.storyAnalysis &&
         flags.characterVoicePatterns &&
         flags.storyBibleCompliance &&
         flags.compressionOptimization
}

export const getEnabledFeatureCount = (): number => {
  const flags = featureFlags()
  return Object.values(flags).filter(Boolean).length
}

export const getFeatureFlagStatus = () => {
  const flags = featureFlags()
  const enabledCount = getEnabledFeatureCount()
  const totalCount = Object.keys(flags).length

  return {
    enabled: enabledCount,
    total: totalCount,
    percentage: Math.round((enabledCount / totalCount) * 100),
    coreV2Enabled: areAllCoreV2FeaturesEnabled(),
    advancedEnabled: areAllAdvancedFeaturesEnabled(),
    flags
  }
}

// Development helper for feature flag debugging
export const logFeatureFlags = () => {
  if (process.env.NODE_ENV === 'development') {
    const status = getFeatureFlagStatus()
    // V2.0 Feature Flag Status logged for development - production logging system would handle this
  }
}

// Client-side feature flag context for React components
export const createFeatureFlagContext = () => {
  return {
    flags: featureFlags(),
    isEnabled: isFeatureEnabled,
    status: getFeatureFlagStatus()
  }
}