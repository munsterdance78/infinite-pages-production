// Choice book types - extends existing system without breaking changes
import type { Database } from '@/lib/supabase/types'
// import type { OptimizedContext } from '@/lib/claude/context-optimizer' // Not exported
import type { ChapterComplexity, ContextLevel } from '@/lib/claude/adaptive-context'

// Extends existing story types
export interface ChoiceBook extends Omit<Database['public']['Tables']['stories']['Row'], 'status'> {
  book_type: 'choice'
  choice_complexity: 'simple' | 'moderate' | 'complex'
  choice_structure: ChoiceStructure
  ending_count: number
  average_playthrough_length: number
}

export interface ChoiceStructure {
  start_chapter_id: string
  choice_points: ChoicePoint[]
  ending_chapters: EndingChapter[]
  path_map: PathConnection[]
  decision_tree: DecisionNode
}

export interface ChoicePoint {
  id: string
  chapter_id: string
  position_in_chapter: 'end' | 'middle' | 'early'
  choices: Choice[]
  choice_type: 'binary' | 'multiple' | 'consequential'
  time_pressure?: boolean
  affects_ending: boolean
}

export interface Choice {
  id: string
  text: string
  description?: string
  leads_to_chapter: string
  requires_previous_choice?: string
  consequences: ChoiceConsequence[]
  character_impact: CharacterImpact[]
  emotional_tone: 'positive' | 'negative' | 'neutral' | 'mysterious'
  difficulty_level: 'easy' | 'moderate' | 'hard'
}

export interface ChoiceConsequence {
  type: 'immediate' | 'delayed' | 'ending_modifier'
  description: string
  affects_character?: string
  affects_plot_thread?: string
  magnitude: 'minor' | 'moderate' | 'major'
}

export interface CharacterImpact {
  character_name: string
  relationship_change: number // -10 to +10
  trust_change: number
  development_unlock?: string
}

export interface EndingChapter {
  id: string
  chapter_id: string
  ending_type: 'happy' | 'tragic' | 'bittersweet' | 'mysterious' | 'open'
  requirements: ChoiceRequirement[]
  rarity: 'common' | 'uncommon' | 'rare' | 'secret'
  satisfaction_rating?: number
}

export interface ChoiceRequirement {
  type: 'specific_choice' | 'character_relationship' | 'choice_count' | 'path_taken'
  target: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
  value: string | number | boolean
}

export interface PathConnection {
  from_chapter: string
  to_chapter: string
  via_choice: string
  probability_weight: number
}

export interface DecisionNode {
  chapter_id: string
  choices: DecisionChoice[]
  children: DecisionNode[]
  ending?: string
}

export interface DecisionChoice {
  choice_id: string
  choice_text: string
  leads_to: string
}

// Reader progress and analytics
export interface ReaderPath {
  id: string
  user_id: string
  story_id: string
  session_id: string
  choices_made: ChoiceMade[]
  current_chapter: string
  path_completion: number
  discovered_endings: string[]
  playthrough_count: number
  favorite_path?: string
  created_at: Date
  updated_at: Date
}

export interface ChoiceMade {
  choice_point_id: string
  choice_id: string
  choice_text: string
  timestamp: Date
  time_taken_seconds: number
  chapter_context: string
}

export interface ChoiceAnalytics {
  choice_point_id: string
  choice_id: string
  selection_count: number
  selection_percentage: number
  average_time_to_decide: number
  completion_rate: number
  satisfaction_rating: number
  leads_to_ending_count: number
  popular_follow_up_choices: string[]
}

// Choice generation context (extends existing optimization)
export interface ChoiceOptimizedContext {
  choice_context: {
    previous_choices: ChoiceMade[]
    available_paths: string[]
    character_relationships: Record<string, number>
    consequences_pending: ChoiceConsequence[]
    ending_proximity: number // 0-1, how close to ending
  }

  branching_complexity: {
    choice_count: number
    path_divergence: 'linear' | 'branching' | 'reconverging' | 'complex'
    narrative_weight: 'light' | 'moderate' | 'heavy' | 'climactic'
  }

  // Additional optimization metrics
  tokens_saved?: number
  compression_ratio?: number
  core_facts?: string[]
}

export interface ChoiceComplexity extends ChapterComplexity {
  choiceCount: number
  pathDivergence: number
  consequenceDepth: 'immediate' | 'short_term' | 'long_term' | 'ending_affecting'
  branchingType: 'simple_binary' | 'multiple_choice' | 'conditional' | 'complex_tree'
  replayValue: 'low' | 'medium' | 'high'
}

// Database table interfaces (extends existing schema)
export interface ChoiceChaptersTable {
  id: string
  story_id: string
  chapter_number: number
  title: string
  content: string
  summary: string
  word_count: number
  choice_points: ChoicePoint[] // JSONB
  is_ending: boolean
  ending_type?: string
  parent_chapters: string[] // Array of chapter IDs that can lead here
  required_choices?: string[] // Choices needed to access this chapter
  generation_context: {
    complexity_level?: string
    branching_strategy?: string
    context_tokens_used?: number
    [key: string]: unknown
  } // JSONB - tracks context used for generation
  created_at: string
  updated_at: string
}

export interface ChoicesTable {
  id: string
  choice_point_id: string
  story_id: string
  chapter_id: string
  choice_order: number
  choice_text: string
  choice_description?: string
  leads_to_chapter: string
  consequences: ChoiceConsequence[] // JSONB
  character_impacts: CharacterImpact[] // JSONB
  emotional_tone: string
  difficulty_level: string
  selection_count: number
  created_at: string
  updated_at: string
}

export interface ReaderPathsTable {
  id: string
  user_id: string
  story_id: string
  session_id: string
  choices_made: ChoiceMade[] // JSONB
  current_chapter: string
  path_completion: number
  discovered_endings: string[]
  playthrough_count: number
  session_start: string
  session_end?: string
  created_at: string
  updated_at: string
}

export interface ChoiceAnalyticsTable {
  id: string
  story_id: string
  choice_point_id: string
  choice_id: string
  selection_count: number
  completion_rate: number
  average_decision_time: number
  satisfaction_rating?: number
  abandonment_rate: number
  popular_next_choices: Array<{ choice_id: string; frequency: number }> // JSONB
  created_at: string
  updated_at: string
}

// Access control (extends existing pricing system)
export interface ChoiceBookPricing {
  story_id: string
  pricing_model: 'per_playthrough' | 'unlock_all_paths' | 'per_ending' | 'premium_access'
  base_price: number
  path_unlock_price?: number
  ending_unlock_price?: number
  free_playthroughs: number
  demo_choices_limit?: number
}

// Generation parameters (extends existing AI system)
export interface ChoiceGenerationParams {
  story_context: ChoiceOptimizedContext
  choice_complexity: ChoiceComplexity
  context_level: ContextLevel
  previous_choices: ChoiceMade[]
  target_choice_count: number
  branching_strategy: 'conservative' | 'moderate' | 'aggressive'
  consequence_depth: number
  character_development_focus: string[]
  ending_approach: boolean
}

// Author creation tools
export interface ChoiceBookTemplate {
  id: string
  name: string
  description: string
  structure: 'linear_with_choices' | 'branching_paths' | 'multiple_endings' | 'complex_web'
  suggested_length: number
  choice_frequency: 'low' | 'medium' | 'high'
  complexity_level: 'beginner' | 'intermediate' | 'advanced'
  example_outline: {
    chapters: Array<{ title: string; choices: number }>
    endings: Array<{ type: string; requirements: string[] }>
    [key: string]: unknown
  }
}

export interface ChoiceValidation {
  is_valid: boolean
  errors: ChoiceValidationError[]
  warnings: ChoiceValidationWarning[]
  suggestions: string[]
  path_analysis: PathAnalysis
}

export interface ChoiceValidationError {
  type: 'unreachable_chapter' | 'circular_reference' | 'missing_ending' | 'broken_choice'
  location: string
  description: string
  severity: 'critical' | 'major' | 'minor'
}

export interface ChoiceValidationWarning {
  type: 'unbalanced_paths' | 'too_many_choices' | 'shallow_consequences' | 'unclear_choice'
  location: string
  suggestion: string
}

export interface PathAnalysis {
  total_paths: number
  average_path_length: number
  shortest_path: number
  longest_path: number
  ending_distribution: Record<string, number>
  choice_density: number
  replay_value_score: number
}

// Integration with existing systems
export interface ExtendedStoryTypes {
  book_type: 'linear' | 'choice' | 'series_linear' | 'series_choice'
  choice_structure?: ChoiceStructure
  series_id?: string
}

// Extends existing Database types without breaking changes
export interface ChoiceBookDatabase {
  choice_chapters: {
    Row: ChoiceChaptersTable
    Insert: Omit<ChoiceChaptersTable, 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Omit<ChoiceChaptersTable, 'id'>>
  }
  choices: {
    Row: ChoicesTable
    Insert: Omit<ChoicesTable, 'id' | 'created_at' | 'updated_at' | 'selection_count'>
    Update: Partial<Omit<ChoicesTable, 'id'>>
  }
  reader_paths: {
    Row: ReaderPathsTable
    Insert: Omit<ReaderPathsTable, 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Omit<ReaderPathsTable, 'id'>>
  }
  choice_analytics: {
    Row: ChoiceAnalyticsTable
    Insert: Omit<ChoiceAnalyticsTable, 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Omit<ChoiceAnalyticsTable, 'id'>>
  }
}