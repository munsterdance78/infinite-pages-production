/**
 * SFSL (Story Fact Structured Language) Schema
 * Defines structured formats for hierarchical story fact storage
 * Part of infinite-pages V2.0 fact-based context optimization
 */

export interface SFSLFact {
  id: string
  type: FactType
  content: string
  confidence: number
  relationships: string[]
  metadata: FactMetadata
  hierarchyLevel: HierarchyLevel
  extractionSource: string
  timestamp: string
}

export type FactType =
  | 'character'
  | 'location'
  | 'plot'
  | 'world-rule'
  | 'timeline'
  | 'dialogue'
  | 'description'
  | 'relationship'
  | 'conflict'
  | 'theme'

export type HierarchyLevel =
  | 'universe'
  | 'series'
  | 'book'
  | 'chapter'
  | 'scene'
  | 'paragraph'

export interface FactMetadata {
  source: {
    chapter?: string
    paragraph?: number
    line?: number
  }
  importance: 'critical' | 'major' | 'minor' | 'detail'
  consistency: {
    score: number
    conflicts: string[]
    validatedAt: string
  }
  compression: {
    originalLength: number
    compressedLength: number
    ratio: number
  }
}

export interface CharacterVoicePattern {
  characterName: string
  traits: {
    speechPatterns: string[]
    vocabulary: string[]
    emotionalTone: string
    behaviorPatterns: string[]
  }
  consistency: {
    score: number
    examples: VoiceExample[]
    violations: VoiceViolation[]
  }
  sfslData: string
}

export interface VoiceExample {
  text: string
  chapter: string
  context: string
  traits: string[]
}

export interface VoiceViolation {
  text: string
  chapter: string
  expectedTrait: string
  actualTrait: string
  severity: 'low' | 'medium' | 'high'
}

export interface StoryBibleConflict {
  id: string
  type: ConflictType
  description: string
  affectedFacts: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'resolved' | 'ignored'
  resolution?: string
  createdAt: string
  resolvedAt?: string
}

export type ConflictType =
  | 'character-inconsistency'
  | 'timeline-contradiction'
  | 'world-rule-violation'
  | 'plot-hole'
  | 'dialogue-mismatch'
  | 'description-conflict'

export interface SFSLCompressionResult {
  originalText: string
  compressedFacts: SFSLFact[]
  compressionRatio: number
  tokensSaved: number
  costReduction: number
  hierarchicalStructure: HierarchicalFacts
}

export interface HierarchicalFacts {
  universe: SFSLFact[]
  series: SFSLFact[]
  book: SFSLFact[]
  chapter: SFSLFact[]
  scene: SFSLFact[]
}

export interface FactExtractionRequest {
  content: string
  factType: FactType
  hierarchyLevel: HierarchyLevel
  workflowPhase: 'extract' | 'analyze' | 'optimize'
  options?: {
    maxFacts?: number
    minConfidence?: number
    includeRelationships?: boolean
    preserveVoice?: boolean
  }
}

export interface FactExtractionResponse {
  facts: SFSLFact[]
  voicePatterns: CharacterVoicePattern[]
  conflicts: StoryBibleConflict[]
  compressionMetrics: {
    originalTokens: number
    compressedTokens: number
    ratio: number
    costSavings: number
  }
  processingTime: number
  workflowPhase: string
}

export interface FactOptimizationRequest {
  storyId: string
  factType?: FactType
  hierarchyLevel?: HierarchyLevel
  workflowPhase: 'analyze' | 'optimize' | 'enhance'
  optimizationGoals: OptimizationGoal[]
}

export type OptimizationGoal =
  | 'reduce-redundancy'
  | 'improve-consistency'
  | 'enhance-relationships'
  | 'compress-storage'
  | 'detect-conflicts'

export interface FactOptimizationResponse {
  optimizedFacts: SFSLFact[]
  removedRedundancies: number
  conflictsDetected: StoryBibleConflict[]
  compressionImprovement: number
  consistencyScore: number
  recommendations: string[]
}

// Main SFSL Schema interface
export interface SFSLSchema {
  character: {
    name: string
    traits: string[]
    relationships: string[]
    voicePattern: string
  }
  world: {
    rules: string[]
    locations: string[]
    systems: string[]
    history: string[]
  }
  plot: {
    mainArcs: string[]
    subplots: string[]
    conflicts: string[]
    resolutions: string[]
  }
  timeline: {
    events: Array<{
      timestamp: string
      event: string
      importance: string
    }>
    chronology: string[]
  }
  voice: {
    narratorStyle: string
    tense: string
    perspective: string
    tone: string
  }
}

// SFSL Processor with required methods
export class SFSLProcessor {
  compressFacts(extractedFacts: Array<{ type: string; content: string }>): string {
    const compressed = extractedFacts.map((fact) => {
      return `${fact.type}:${fact.content.slice(0, 50)}...`
    })
    return compressed.join('|')
  }

  expandForDisplay(sfslData: string): {
    facts: Array<{ type: string; content: string }>
    expanded: boolean
    metadata: { timestamp?: string; error?: string }
  } {
    try {
      const facts = sfslData.split('|').map(item => {
        const [type, content] = item.split(':')
        return { type: type || '', content: content || '' }
      })
      return {
        facts,
        expanded: true,
        metadata: { timestamp: new Date().toISOString() }
      }
    } catch (error) {
      return { facts: [], expanded: false, metadata: { error: 'Invalid SFSL data' } }
    }
  }

  validateSyntax(sfsl: string): boolean {
    try {
      const validPrefixes = ['character:', 'location:', 'plot:', 'dialogue:', 'description:']
      return validPrefixes.some(prefix => sfsl.includes(prefix))
    } catch (error) {
      return false
    }
  }

  calculateCompressionRatio(original: string, compressed: string): number {
    if (!original.length) return 0
    return compressed.length / original.length
  }

  processStoryFacts(content: string): SFSLFact[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const facts: SFSLFact[] = []

    sentences.slice(0, 10).forEach((sentence, index) => {
      facts.push({
        id: `sfsl-fact-${Date.now()}-${index}`,
        type: this.detectFactType(sentence),
        content: sentence.trim(),
        confidence: 0.8,
        relationships: [],
        metadata: {
          source: { paragraph: index + 1 },
          importance: 'minor',
          consistency: {
            score: 0.85,
            conflicts: [],
            validatedAt: new Date().toISOString()
          },
          compression: {
            originalLength: sentence.length,
            compressedLength: sentence.length * 0.7,
            ratio: 0.7
          }
        },
        hierarchyLevel: 'chapter',
        extractionSource: 'sfsl-processor',
        timestamp: new Date().toISOString()
      })
    })

    return facts
  }

  private detectFactType(sentence: string): FactType {
    const lowerSentence = sentence.toLowerCase()

    if (lowerSentence.includes('said') || lowerSentence.includes('"')) {
      return 'dialogue'
    }
    if (/\b[A-Z][a-z]+\b/.test(sentence)) {
      return 'character'
    }
    if (lowerSentence.includes('place') || lowerSentence.includes('location')) {
      return 'location'
    }
    if (lowerSentence.includes('happened') || lowerSentence.includes('then')) {
      return 'plot'
    }

    return 'description'
  }
}

// SFSL Compression Utilities
export class SFSLCompressor {
  static compressFacts(facts: SFSLFact[]): string {
    return JSON.stringify(facts)
  }

  static decompressFacts(sfslData: string): SFSLFact[] {
    return JSON.parse(sfslData)
  }

  static calculateRatio(original: string, compressed: string): number {
    return compressed.length / original.length
  }
}

// Validation utilities
export class SFSLValidator {
  static validateFact(fact: SFSLFact): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!fact.id) errors.push('Fact ID is required')
    if (!fact.type) errors.push('Fact type is required')
    if (!fact.content) errors.push('Fact content is required')
    if (fact.confidence < 0 || fact.confidence > 1) {
      errors.push('Confidence must be between 0 and 1')
    }

    return { valid: errors.length === 0, errors }
  }

  static validateHierarchy(facts: SFSLFact[]): StoryBibleConflict[] {
    const conflicts: StoryBibleConflict[] = []
    return conflicts
  }
}