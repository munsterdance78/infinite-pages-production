/**
 * V2.0 Feature Configuration and Types
 */

export interface V2FeatureConfig {
  FACT_EXTRACTION: boolean
  HIERARCHICAL_CACHE: boolean
  THREE_PHASE_WORKFLOW: boolean
  CHARACTER_GENERATION: boolean
  WORLD_BUILDER: boolean
  TIMELINE_VISUALIZATION: boolean
  SERIES_MANAGEMENT: boolean
  ANALYTICS_V2: boolean
  PERFORMANCE_MONITORING: boolean
  ADVANCED_CACHING: boolean
}

export interface V2FeatureLimits {
  MAX_FACTS_PER_EXTRACTION: number
  MAX_CACHE_ENTRIES: number
  MAX_WORKFLOW_DURATION_MS: number
  MAX_CHARACTERS_PER_STORY: number
  MAX_TIMELINE_EVENTS: number
}

export const V2_FEATURE_FLAGS: V2FeatureConfig = {
  // Core SFSL Features
  FACT_EXTRACTION: process.env['ENABLE_FACT_EXTRACTION'] === 'true',
  HIERARCHICAL_CACHE: process.env['ENABLE_HIERARCHICAL_CACHE'] === 'true',

  // Workflow Features
  THREE_PHASE_WORKFLOW: process.env['ENABLE_THREE_PHASE_WORKFLOW'] === 'true',

  // Content Generation Features
  CHARACTER_GENERATION: process.env['ENABLE_CHARACTER_GENERATION'] === 'true',
  WORLD_BUILDER: process.env['ENABLE_WORLD_BUILDER'] === 'true',

  // Advanced Features
  TIMELINE_VISUALIZATION: process.env['ENABLE_TIMELINE_VISUALIZATION'] === 'true',
  SERIES_MANAGEMENT: process.env['ENABLE_SERIES_MANAGEMENT'] === 'true',

  // Analytics & Monitoring
  ANALYTICS_V2: process.env['ENABLE_ANALYTICS_V2'] === 'true',
  PERFORMANCE_MONITORING: process.env['ENABLE_PERFORMANCE_MONITORING'] === 'true',

  // Performance Features
  ADVANCED_CACHING: process.env['ENABLE_ADVANCED_CACHING'] === 'true'
}

export const V2_FEATURE_LIMITS: V2FeatureLimits = {
  MAX_FACTS_PER_EXTRACTION: parseInt(process.env['MAX_FACTS_PER_EXTRACTION'] || '50'),
  MAX_CACHE_ENTRIES: parseInt(process.env['MAX_CACHE_ENTRIES'] || '1000'),
  MAX_WORKFLOW_DURATION_MS: parseInt(process.env['MAX_WORKFLOW_DURATION_MS'] || '300000'),
  MAX_CHARACTERS_PER_STORY: parseInt(process.env['MAX_CHARACTERS_PER_STORY'] || '20'),
  MAX_TIMELINE_EVENTS: parseInt(process.env['MAX_TIMELINE_EVENTS'] || '100')
}