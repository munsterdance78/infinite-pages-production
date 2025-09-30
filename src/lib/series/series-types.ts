// Series architecture types for multi-book novel creation

export interface Series {
  id: string
  user_id: string
  title: string
  genre: string
  description: string
  total_planned_books: number
  current_book_count: number
  world_rules: WorldRules
  character_relationships: CharacterRelationship[]
  timeline: SeriesTimeline
  created_at: Date
  updated_at: Date
}

export interface WorldRules {
  magic_system?: MagicSystem
  technology_level?: TechnologyLevel
  political_structure?: PoliticalStructure
  geography?: Geography
  cultural_norms?: CulturalNorm[]
  physical_laws?: PhysicalLaw[]
  historical_events?: HistoricalEvent[]
}

export interface MagicSystem {
  exists: boolean
  type: 'elemental' | 'divine' | 'scientific' | 'innate' | 'learned' | 'artifact' | 'none'
  limitations: string[]
  power_source: string
  cost: string
  practitioners: string[]
}

export interface TechnologyLevel {
  era: 'prehistoric' | 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'near_future' | 'far_future'
  key_technologies: string[]
  transportation: string[]
  communication: string[]
  warfare: string[]
  medicine: string[]
}

export interface PoliticalStructure {
  government_type: string
  power_structure: string[]
  key_institutions: string[]
  conflict_areas: string[]
  stability_level: 'stable' | 'unstable' | 'in_transition' | 'chaotic'
}

export interface Geography {
  world_type: 'earth_like' | 'fantasy' | 'space_based' | 'alternate_dimension' | 'virtual'
  key_locations: Location[]
  climate_zones: string[]
  natural_resources: string[]
  dangerous_areas: string[]
}

export interface Location {
  name: string
  type: 'city' | 'country' | 'continent' | 'planet' | 'dimension' | 'building' | 'landmark'
  description: string
  significance: string
  first_appearance_book: number
}

export interface CulturalNorm {
  area: string
  norm: string
  importance: 'critical' | 'important' | 'minor'
  affects_story: boolean
}

export interface PhysicalLaw {
  law: string
  description: string
  affects_story: boolean
}

export interface HistoricalEvent {
  name: string
  date: string
  description: string
  consequences: string[]
  affects_current_story: boolean
}

export interface CharacterRelationship {
  character_a: string
  character_b: string
  relationship_type: 'family' | 'romantic' | 'friendship' | 'rivalry' | 'enemy' | 'professional' | 'mentor' | 'alliance'
  status: 'active' | 'past' | 'complicated' | 'unknown'
  intensity: 'weak' | 'moderate' | 'strong' | 'intense'
  first_book: number
  last_book?: number
  description: string
}

export interface SeriesTimeline {
  start_date: string
  end_date?: string
  time_span: string
  major_events: TimelineEvent[]
  book_timeline: BookTimelineEntry[]
}

export interface TimelineEvent {
  id: string
  name: string
  date: string
  description: string
  book_number?: number
  chapter_number?: number
  consequences: string[]
  affects_future_books: boolean
}

export interface BookTimelineEntry {
  book_number: number
  start_date: string
  end_date: string
  duration: string
  time_gap_from_previous?: string
}

export interface CharacterArc {
  id: string
  series_id: string
  character_name: string
  overall_arc: string
  current_book_development: Record<number, BookDevelopment>
  personality_evolution: PersonalityEvolution[]
  key_relationships: string[]
  current_status: 'alive' | 'dead' | 'missing' | 'unknown' | 'transformed'
  last_appearance_book: number
  arc_completion_percentage: number
  major_turning_points: TurningPoint[]
}

export interface BookDevelopment {
  book_number: number
  starting_state: string
  ending_state: string
  key_growth: string[]
  relationships_changed: string[]
  skills_gained: string[]
  trauma_or_loss: string[]
  achievements: string[]
}

export interface PersonalityEvolution {
  book_number: number
  trait_changes: TraitChange[]
  motivation_shifts: string[]
  goal_evolution: string[]
  worldview_changes: string[]
}

export interface TraitChange {
  trait: string
  from_value: number // 1-10 scale
  to_value: number
  reason: string
}

export interface TurningPoint {
  book_number: number
  chapter_number?: number
  event: string
  impact: 'minor' | 'moderate' | 'major' | 'life_changing'
  consequences: string[]
  character_reaction: string
}

export interface WorldStateChange {
  id: string
  series_id: string
  book_number: number
  chapter_number?: number
  change_type: 'political' | 'technological' | 'social' | 'geographic' | 'magical' | 'economic' | 'cultural'
  description: string
  scope: 'local' | 'regional' | 'global' | 'cosmic'
  consequences: string[]
  affects_future_books: boolean
  reversible: boolean
  caused_by: string
  duration: 'temporary' | 'permanent' | 'gradual' | 'unknown'
}

export interface SeriesContext {
  series_id: string
  current_book: number
  character_arcs: CharacterArc[]
  world_state: WorldState
  previous_book_summaries: BookSummary[]
  ongoing_plot_threads: PlotThread[]
  unresolved_conflicts: UnresolvedConflict[]
  foreshadowing_elements: ForeshadowingElement[]
}

export interface WorldState {
  current_political_situation: string
  current_technology_level: string
  current_social_climate: string
  current_threats: string[]
  current_opportunities: string[]
  changed_since_book_one: WorldStateChange[]
}

export interface BookSummary {
  book_number: number
  title: string
  main_plot: string
  subplots: string[]
  character_developments: string[]
  world_changes: string[]
  unresolved_elements: string[]
  cliffhangers: string[]
  new_characters_introduced: string[]
  characters_who_died: string[]
}

export interface PlotThread {
  id: string
  name: string
  description: string
  introduced_book: number
  current_status: 'active' | 'resolved' | 'dormant' | 'abandoned'
  priority: 'main' | 'secondary' | 'background'
  expected_resolution_book?: number
  characters_involved: string[]
  complexity: 'simple' | 'moderate' | 'complex'
}

export interface UnresolvedConflict {
  id: string
  name: string
  type: 'personal' | 'interpersonal' | 'societal' | 'political' | 'cosmic'
  parties_involved: string[]
  stakes: string
  escalation_level: number // 1-10
  introduced_book: number
  tension_level: 'low' | 'moderate' | 'high' | 'critical'
}

export interface ForeshadowingElement {
  id: string
  element: string
  introduced_book: number
  introduced_chapter?: number
  payoff_book?: number
  payoff_chapter?: number
  subtlety_level: 'obvious' | 'moderate' | 'subtle' | 'hidden'
  importance: 'minor' | 'moderate' | 'major' | 'critical'
  status: 'planted' | 'developing' | 'paying_off' | 'resolved'
}

// Database table interfaces for migrations
export interface SeriesTable {
  id: string
  user_id: string
  title: string
  genre: string
  description: string
  total_planned_books: number
  current_book_count: number
  world_rules: WorldRules // JSONB
  character_relationships: CharacterRelationship[] // JSONB
  timeline: SeriesTimeline // JSONB
  created_at: string
  updated_at: string
}

export interface CharacterArcsTable {
  id: string
  series_id: string
  character_name: string
  overall_arc: string
  current_book_development: Record<number, BookDevelopment> // JSONB
  personality_evolution: PersonalityEvolution[] // JSONB
  key_relationships: string[] // JSONB
  current_status: string
  last_appearance_book: number
  arc_completion_percentage: number
  major_turning_points: TurningPoint[] // JSONB
  created_at: string
  updated_at: string
}

export interface WorldStateChangesTable {
  id: string
  series_id: string
  book_number: number
  chapter_number?: number
  change_type: string
  description: string
  scope: string
  consequences: string[] // JSONB
  affects_future_books: boolean
  reversible: boolean
  caused_by: string
  duration: string
  created_at: string
}

export interface PlotThreadsTable {
  id: string
  series_id: string
  name: string
  description: string
  introduced_book: number
  current_status: string
  priority: string
  expected_resolution_book?: number
  characters_involved: string[] // JSONB
  complexity: string
  created_at: string
  updated_at: string
}

export interface SeriesAnalytics {
  series_id: string
  total_books: number
  total_chapters: number
  total_words: number
  total_characters: number
  avg_words_per_chapter: number
  character_arc_completion_rate: number
  plot_thread_resolution_rate: number
  world_consistency_score: number
  timeline_coherence_score: number
  cost_per_book: number
  generation_time_per_book: number
}

export interface SeriesQualityMetrics {
  character_consistency: number // 0-100
  plot_coherence: number // 0-100
  world_building_consistency: number // 0-100
  timeline_accuracy: number // 0-100
  foreshadowing_payoff_rate: number // 0-100
  character_development_quality: number // 0-100
  overall_series_quality: number // 0-100
}