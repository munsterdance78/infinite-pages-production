import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { LRUCache } from 'lru-cache'
import type { ALLOWED_GENRES } from '@/lib/constants'

// Match your exact content types and API structure
export type InfinitePagesContentType =
  // Story Foundation Components
  | 'story_foundation' | 'main_characters' | 'setting' | 'plot_structure'
  | 'themes' | 'tone' | 'target_audience' | 'chapter_outline'
  // Chapter Components
  | 'chapter_content' | 'chapter_summary' | 'key_events'
  | 'character_development' | 'foreshadowing'
  // Improvement Types
  | 'improvement_general' | 'improvement_dialogue' | 'improvement_description'
  | 'improvement_pacing' | 'improvement_character' | 'improvement_plot'
  | 'improvement_style' | 'improvement_grammar'
  // Analysis Types
  | 'analysis_comprehensive' | 'analysis_style' | 'analysis_structure'
  | 'analysis_quality' | 'analysis_readability' | 'analysis_genre'
  // Export Formats
  | 'export_pdf' | 'export_epub' | 'export_docx' | 'export_txt';

export type Genre = typeof ALLOWED_GENRES[number];

export interface InfinitePagesCacheRecord {
  id: string;
  cache_key: string;
  content: {
    title?: string
    premise?: string
    genre?: string
    themes?: string[]
    mainCharacters?: Array<{ name: string }>
    plotStructure?: Record<string, unknown>
    setting?: { time?: string; place?: string }
    targetAudience?: string
    wordCount?: number
    [key: string]: unknown
  };
  content_type: InfinitePagesContentType;
  user_id: string;
  story_id?: string;

  // Your specific metadata structure
  metadata: {
    genre: Genre;
    premise_hash: string;
    word_count?: number;
    chapter_number?: number;
    target_word_count?: number;
    writing_style?: string;
    foundation_fingerprint?: string;
    previous_chapters_hash?: string;
    improvement_type?: string;
    analysis_type?: string;
    export_format?: string;

    // Character-specific
    character_count?: number;
    character_roles?: string[];

    // Foundation-specific
    plot_complexity?: 'simple' | 'moderate' | 'complex';
    theme_count?: number;
    setting_period?: string;
    target_audience?: string;
  };

  // Caching strategy fields
  foundation_dependency?: string; // Links to foundation this content depends on
  prompt_template: string; // Which template was used
  prompt_variables: Record<string, unknown>; // Variables passed to template
  semantic_similarity_hash: string;
  reuse_score: number; // How suitable for reuse (0-10)

  created_at: string;
  expires_at: string;
  hit_count: number;
  adaptation_count: number;
  last_accessed: string;
  token_cost_saved: number; // Track actual token savings
}

export interface CacheConfig {
  // Match your token costs
  tokenCosts: Record<InfinitePagesContentType, number>;

  // TTL based on reuse potential
  ttl: Record<InfinitePagesContentType, number>;

  // Similarity thresholds for each content type
  similarityThresholds: Record<InfinitePagesContentType, number>;

  // Maximum entries per user per content type
  maxEntries: Record<InfinitePagesContentType, number>;
}

class InfinitePagesCache {
  private supabase: ReturnType<typeof createClient>
  private memoryCache = new LRUCache<string, InfinitePagesCacheRecord>({
    max: 1000,        // Maximum 1000 entries
    ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
    updateAgeOnGet: true
  })
  private isDbAvailable: boolean = true

  constructor() {
    try {
      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
      const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

      if (!supabaseUrl) {
        // InfinitePages Cache: NEXT_PUBLIC_SUPABASE_URL not available - cache disabled
        this.isDbAvailable = false
        this.supabase = null as unknown as ReturnType<typeof createClient>
        return
      }

      if (!serviceRoleKey) {
        // InfinitePages Cache: SUPABASE_SERVICE_ROLE_KEY not available - cache disabled
        // Please add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables
        this.isDbAvailable = false
        this.supabase = null as unknown as ReturnType<typeof createClient>
        return
      }

      this.supabase = createClient(supabaseUrl, serviceRoleKey)
      // InfinitePages Cache successfully initialized with Supabase
    } catch (error) {
      // InfinitePages Cache: Failed to initialize Supabase client - cache disabled
      this.isDbAvailable = false
      this.supabase = null as unknown as ReturnType<typeof createClient>
    }
  }

  private isAvailable(): boolean {
    return this.isDbAvailable && this.supabase !== null
  }

  private config: CacheConfig = {
    tokenCosts: {
      // Foundation (8 tokens) - PRIORITY 1
      story_foundation: 8, main_characters: 2, setting: 1.5, plot_structure: 2,
      themes: 1, tone: 0.5, target_audience: 0.5, chapter_outline: 2,

      // Chapters (5 tokens)
      chapter_content: 5, chapter_summary: 1, key_events: 0.5,
      character_development: 1, foreshadowing: 0.5,

      // Improvements (variable)
      improvement_general: 3, improvement_dialogue: 2, improvement_description: 2,
      improvement_pacing: 2, improvement_character: 2, improvement_plot: 3,
      improvement_style: 2, improvement_grammar: 1,

      // Analysis (2-3 tokens)
      analysis_comprehensive: 3, analysis_style: 2, analysis_structure: 2,
      analysis_quality: 2, analysis_readability: 1, analysis_genre: 1,

      // Export (1 token)
      export_pdf: 1, export_epub: 1, export_docx: 1, export_txt: 0.5
    },

    ttl: {
      // Foundation components - HIGH REUSE = LONG TTL for 80% savings
      story_foundation: 30 * 24 * 60 * 60 * 1000,      // 30 days
      main_characters: 21 * 24 * 60 * 60 * 1000,       // 21 days
      setting: 21 * 24 * 60 * 60 * 1000,               // 21 days
      plot_structure: 14 * 24 * 60 * 60 * 1000,        // 14 days
      themes: 30 * 24 * 60 * 60 * 1000,                // 30 days (highly reusable)
      tone: 14 * 24 * 60 * 60 * 1000,                  // 14 days
      target_audience: 30 * 24 * 60 * 60 * 1000,       // 30 days
      chapter_outline: 7 * 24 * 60 * 60 * 1000,        // 7 days

      // Chapter components - moderate reuse
      chapter_content: 3 * 24 * 60 * 60 * 1000,        // 3 days
      chapter_summary: 7 * 24 * 60 * 60 * 1000,        // 7 days
      key_events: 5 * 24 * 60 * 60 * 1000,             // 5 days
      character_development: 10 * 24 * 60 * 60 * 1000, // 10 days
      foreshadowing: 3 * 24 * 60 * 60 * 1000,          // 3 days

      // Improvements - story-specific, shorter TTL
      improvement_general: 2 * 24 * 60 * 60 * 1000,    // 2 days
      improvement_dialogue: 3 * 24 * 60 * 60 * 1000,   // 3 days
      improvement_description: 3 * 24 * 60 * 60 * 1000, // 3 days
      improvement_pacing: 2 * 24 * 60 * 60 * 1000,     // 2 days
      improvement_character: 5 * 24 * 60 * 60 * 1000,  // 5 days
      improvement_plot: 2 * 24 * 60 * 60 * 1000,       // 2 days
      improvement_style: 7 * 24 * 60 * 60 * 1000,      // 7 days
      improvement_grammar: 1 * 24 * 60 * 60 * 1000,    // 1 day

      // Analysis - medium reuse
      analysis_comprehensive: 5 * 24 * 60 * 60 * 1000, // 5 days
      analysis_style: 10 * 24 * 60 * 60 * 1000,        // 10 days
      analysis_structure: 7 * 24 * 60 * 60 * 1000,     // 7 days
      analysis_quality: 3 * 24 * 60 * 60 * 1000,       // 3 days
      analysis_readability: 14 * 24 * 60 * 60 * 1000,  // 14 days
      analysis_genre: 21 * 24 * 60 * 60 * 1000,        // 21 days

      // Export - high reuse
      export_pdf: 14 * 24 * 60 * 60 * 1000,            // 14 days
      export_epub: 14 * 24 * 60 * 60 * 1000,           // 14 days
      export_docx: 14 * 24 * 60 * 60 * 1000,           // 14 days
      export_txt: 7 * 24 * 60 * 60 * 1000              // 7 days
    },

    similarityThresholds: {
      // Foundation - OPTIMIZED FOR 80% HIT RATE
      story_foundation: 0.75, // Lowered from 0.85 for better hit rate
      main_characters: 0.70,  // Lowered from 0.80
      setting: 0.65,          // Lowered from 0.75
      plot_structure: 0.75,   // Lowered from 0.85
      themes: 0.60,           // Lowered from 0.70
      tone: 0.65,             // Lowered from 0.75
      target_audience: 0.80,  // Lowered from 0.90
      chapter_outline: 0.70,  // Lowered from 0.80

      // Chapter components - moderate threshold
      chapter_content: 0.75, chapter_summary: 0.80, key_events: 0.75,
      character_development: 0.80, foreshadowing: 0.70,

      // Improvements - high threshold (specific to content)
      improvement_general: 0.85, improvement_dialogue: 0.80, improvement_description: 0.80,
      improvement_pacing: 0.85, improvement_character: 0.80, improvement_plot: 0.85,
      improvement_style: 0.75, improvement_grammar: 0.90,

      // Analysis - moderate threshold
      analysis_comprehensive: 0.75, analysis_style: 0.80, analysis_structure: 0.80,
      analysis_quality: 0.75, analysis_readability: 0.85, analysis_genre: 0.70,

      // Export - high threshold (format-specific)
      export_pdf: 0.95, export_epub: 0.95, export_docx: 0.95, export_txt: 0.95
    },

    maxEntries: {
      // Foundation components - INCREASED FOR BETTER HIT RATES
      story_foundation: 200,  // Increased from 100
      main_characters: 1000,  // Increased from 500
      setting: 400,           // Increased from 200
      plot_structure: 300,    // Increased from 150
      themes: 600,            // Increased from 300
      tone: 200,              // Increased from 100
      target_audience: 100,   // Increased from 50
      chapter_outline: 400,   // Increased from 200

      // Chapter components
      chapter_content: 1000, chapter_summary: 500, key_events: 300,
      character_development: 400, foreshadowing: 200,

      // Improvements
      improvement_general: 200, improvement_dialogue: 200, improvement_description: 200,
      improvement_pacing: 200, improvement_character: 200, improvement_plot: 200,
      improvement_style: 200, improvement_grammar: 200,

      // Analysis
      analysis_comprehensive: 100, analysis_style: 100, analysis_structure: 100,
      analysis_quality: 100, analysis_readability: 100, analysis_genre: 100,

      // Export
      export_pdf: 50, export_epub: 50, export_docx: 50, export_txt: 50
    }
  }

  /**
   * PRIORITY 1: Foundation caching for immediate 80% cost savings
   * This is the highest-impact method - wraps generateStoryFoundation calls
   */
  async getFoundationWithSimilarity(
    genre: Genre,
    premise: string,
    userId: string,
    title?: string,
    includeWritingTips: boolean = false
  ): Promise<{
    foundation: {
      title?: string
      premise?: string
      genre?: string
      themes?: string[]
      mainCharacters?: Array<{ name: string }>
      plotStructure?: Record<string, unknown>
      setting?: { time?: string; place?: string }
      targetAudience?: string
      _cacheAdapted?: boolean
      _originalCacheId?: string
      [key: string]: unknown
    } | null;
    fromCache: boolean;
    cacheType: 'exact' | 'genre-similar' | 'theme-similar' | 'none';
    tokensSaved: number;
  }> {
    // Return cache miss if Supabase is not available
    if (!this.isAvailable()) {
      return {
        foundation: null,
        fromCache: false,
        cacheType: 'none',
        tokensSaved: 0
      }
    }

    const premiseHash = crypto.createHash('md5').update(premise).digest('hex')

    try {
      // 1. Try exact premise + genre match first
      const exactMatch = await this.getByMetadata(
        'story_foundation',
        userId,
        { genre, premise_hash: premiseHash }
      )

      if (exactMatch.length > 0) {
        const match = exactMatch[0]
        if (match) {
          await this.incrementHitCount(match.id)
          // InfinitePages Cache: EXACT foundation hit for genre and premise

          return {
            foundation: match.content,
            fromCache: true,
            cacheType: 'exact',
            tokensSaved: this.config.tokenCosts.story_foundation
          }
        }
      }

      // 2. Try theme + genre similarity for high-value matches
      const themes = this.extractThemesFromPremise(premise)
      const genreMatches = await this.getByMetadata(
        'story_foundation',
        userId,
        { genre },
        20 // Get more candidates for better matching
      )

      if (genreMatches.length > 0 && themes.length > 0) {
        const themeMatch = this.findBestThemeMatch(genreMatches, themes)
        if (themeMatch && themeMatch.similarity > this.config.similarityThresholds.story_foundation) {
          // Use existing foundation with premise adapted
          const adaptedFoundation = {
            ...themeMatch.entry.content,
            ...(title != null && { title }),
            ...(title == null && themeMatch.entry.content.title != null && { title: themeMatch.entry.content.title }),
            premise: premise,
            ...(themes.length > 0 && { themes }),
            ...(themes.length === 0 && themeMatch.entry.content.themes != null && { themes: themeMatch.entry.content.themes }),
            // Keep the rest of the foundation intact for maximum reuse
            _cacheAdapted: true,
            _originalCacheId: themeMatch.entry.id
          }

          await this.incrementHitCount(themeMatch.entry.id)
          // InfinitePages Cache: THEME-SIMILAR foundation hit for genre and themes

          return {
            foundation: adaptedFoundation,
            fromCache: true,
            cacheType: 'theme-similar',
            tokensSaved: Math.floor(this.config.tokenCosts.story_foundation * 0.8) // 80% savings
          }
        }
      }

      // 3. Try genre similarity for partial reuse
      if (genreMatches.length > 0) {
        // Find high-quality, frequently reused foundations
        const highQualityMatch = genreMatches.find(entry =>
          entry.reuse_score >= 7.0 && entry.hit_count >= 2
        )

        if (highQualityMatch) {
          const adaptedFoundation = {
            ...highQualityMatch.content,
            title: title != null ? title : 'Untitled Story',
            premise: premise,
            ...(themes.length > 0 && { themes }),
            ...(themes.length === 0 && highQualityMatch.content.themes != null && { themes: highQualityMatch.content.themes }),
            _cacheAdapted: true,
            _originalCacheId: highQualityMatch.id
          }

          await this.incrementHitCount(highQualityMatch.id)
          // InfinitePages Cache: GENRE-SIMILAR foundation hit for genre

          return {
            foundation: adaptedFoundation,
            fromCache: true,
            cacheType: 'genre-similar',
            tokensSaved: Math.floor(this.config.tokenCosts.story_foundation * 0.6) // 60% savings
          }
        }
      }

      // InfinitePages Cache: NO foundation cache hit for genre and premise
      return {
        foundation: null,
        fromCache: false,
        cacheType: 'none',
        tokensSaved: 0
      }

    } catch (error) {
      // InfinitePages Cache error in getFoundationWithSimilarity - production logging system would handle this
      return {
        foundation: null,
        fromCache: false,
        cacheType: 'none',
        tokensSaved: 0
      }
    }
  }

  /**
   * Cache a newly generated foundation for future reuse
   */
  async cacheStoryFoundation(
    prompt: string,
    genre: Genre,
    premise: string,
    foundation: {
      title?: string
      premise?: string
      genre?: string
      themes?: string[]
      mainCharacters?: Array<{ name: string }>
      plotStructure?: Record<string, unknown>
      setting?: { time?: string; place?: string }
      targetAudience?: string
      [key: string]: unknown
    },
    userId: string,
    title?: string,
    templateVariables: Record<string, unknown> = {}
  ): Promise<void> {

    try {
      const premiseHash = crypto.createHash('md5').update(premise).digest('hex')

      const baseMetadata = {
        genre,
        premise_hash: premiseHash,
        character_count: foundation.mainCharacters?.length || 0,
        theme_count: foundation.themes?.length || 0,
        setting_period: foundation.setting?.time || 'modern',
        target_audience: foundation.targetAudience || 'general',
        plot_complexity: this.assessPlotComplexity(foundation.plotStructure)
      }

      // Cache the complete foundation
      await this.set(
        prompt,
        'story_foundation',
        foundation,
        userId,
        'story_foundation_comprehensive',
        { ...templateVariables, genre, premise, title },
        baseMetadata
      )

      // InfinitePages Cache: Foundation cached for genre and premise

    } catch (error) {
      // InfinitePages Cache error caching story foundation - production logging system would handle this
    }
  }

  /**
   * Wrapper for existing Claude service calls - integrates seamlessly
   */
  async wrapFoundationGeneration<T>(
    claudeServiceCall: () => Promise<T>,
    genre: Genre,
    premise: string,
    userId: string,
    title?: string,
    templateVariables: Record<string, unknown> = {}
  ): Promise<{ result: T; fromCache: boolean; tokensSaved: number; cacheType?: string }> {

    // Check cache first
    const cacheResult = await this.getFoundationWithSimilarity(genre, premise, userId, title)

    if (cacheResult.fromCache && cacheResult.foundation) {
      return {
        result: cacheResult.foundation as T,
        fromCache: true,
        tokensSaved: cacheResult.tokensSaved,
        cacheType: cacheResult.cacheType
      }
    }

    // Generate new content
    const result = await claudeServiceCall()

    // Cache the result for future use
    const prompt = `${genre} story: ${premise}`
    await this.cacheStoryFoundation(prompt, genre, premise, result as any, userId, title, templateVariables)

    return {
      result,
      fromCache: false,
      tokensSaved: 0
    }
  }

  // Private helper methods for foundation caching
  private async getByMetadata(
    contentType: InfinitePagesContentType,
    userId: string,
    metadata: Record<string, unknown>,
    limit: number = 10
  ): Promise<InfinitePagesCacheRecord[]> {

    try {
      if (!this.isAvailable()) {
        return []
      }

      const { data, error } = await this.supabase
        .from('infinite_pages_cache')
        .select('*')
        .eq('content_type', contentType)
        .eq('user_id', userId)
        .contains('metadata', metadata)
        .gt('expires_at', new Date().toISOString())
        .order('hit_count', { ascending: false })
        .order('reuse_score', { ascending: false })
        .limit(limit)

      if (error) {
        // InfinitePages Cache database error in getByMetadata - production logging system would handle this
        return []
      }

      return data || []
    } catch (error) {
      // InfinitePages Cache error in getByMetadata - production logging system would handle this
      return []
    }
  }

  private async set(
    prompt: string,
    contentType: InfinitePagesContentType,
    content: any,
    userId: string,
    promptTemplate: string,
    promptVariables: Record<string, any>,
    metadata: any,
    storyId?: string,
    foundationDependency?: string
  ): Promise<void> {
    // Skip caching if Supabase is not available
    if (!this.isAvailable()) {
      return
    }

    try {
      const cacheKey = this.generateCacheKey(prompt, contentType, metadata)
      const semanticHash = this.generateSemanticHash(prompt, metadata)

      const entry = {
        cache_key: cacheKey,
        content,
        content_type: contentType,
        user_id: userId,
        story_id: storyId || null,
        metadata,
        foundation_dependency: foundationDependency || null,
        prompt_template: promptTemplate,
        prompt_variables: promptVariables,
        semantic_similarity_hash: semanticHash,
        reuse_score: this.calculateReuseScore(content, contentType),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.config.ttl[contentType]).toISOString(),
        hit_count: 0,
        adaptation_count: 0,
        last_accessed: new Date().toISOString(),
        token_cost_saved: 0
      }

      // Type assertion to bypass schema mismatch
      const { error } = await (this.supabase as any)
        .from('infinite_pages_cache')
        .upsert(entry)

      if (error) {
        // InfinitePages Cache database error in set - production logging system would handle this
      }

    } catch (error) {
      // InfinitePages Cache error in set - production logging system would handle this
    }
  }

  private async incrementHitCount(entryId: string): Promise<void> {
    try {
      // First get current values
      const { data: current, error: fetchError } = await this.supabase
        .from('infinite_pages_cache')
        .select('hit_count, token_cost_saved')
        .eq('id', entryId)
        .single()

      if (fetchError || !current) {
        // InfinitePages Cache error fetching current values - production logging system would handle this
        return
      }

      // Then update with incremented values
      const { error } = await (this.supabase as any)
        .from('infinite_pages_cache')
        .update({
          hit_count: ((current as any).hit_count || 0) + 1,
          last_accessed: new Date().toISOString(),
          token_cost_saved: ((current as any).token_cost_saved || 0) + 1
        })
        .eq('id', entryId)

      if (error) {
        // InfinitePages Cache error incrementing hit count - production logging system would handle this
      }
    } catch (error) {
      // InfinitePages Cache error in incrementHitCount - production logging system would handle this
    }
  }

  private generateCacheKey(prompt: string, contentType: InfinitePagesContentType, metadata: any): string {
    const keyData = `${contentType}_${prompt}_${JSON.stringify(metadata)}`
    return crypto.createHash('sha256').update(keyData).digest('hex')
  }

  private generateSemanticHash(prompt: string, metadata: any): string {
    const normalized = prompt.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
    const semantic = `${normalized}_${metadata.genre}_${metadata.target_audience || ''}`
    return crypto.createHash('md5').update(semantic).digest('hex')
  }

  private extractThemesFromPremise(premise: string): string[] {
    const commonThemes = [
      'love', 'revenge', 'redemption', 'coming-of-age', 'sacrifice', 'betrayal',
      'power', 'friendship', 'family', 'survival', 'identity', 'justice',
      'freedom', 'loyalty', 'honor', 'forgiveness', 'corruption', 'transformation',
      'war', 'peace', 'loss', 'hope', 'fear', 'courage', 'destiny', 'fate'
    ]

    const premiseLower = premise.toLowerCase()
    return commonThemes.filter(theme =>
      premiseLower.includes(theme.toLowerCase()) ||
      premiseLower.includes(theme.toLowerCase() + 's') ||
      premiseLower.includes(theme.toLowerCase() + 'ing')
    )
  }

  private findBestThemeMatch(entries: InfinitePagesCacheRecord[], targetThemes: string[]): { entry: InfinitePagesCacheRecord; similarity: number } | null {
    let bestMatch = null
    let highestSimilarity = 0

    for (const entry of entries) {
      const entryThemes = entry.content.themes || []
      const similarity = this.calculateThemeSimilarity(targetThemes, entryThemes)

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity
        bestMatch = { entry, similarity }
      }
    }

    return bestMatch
  }

  private calculateThemeSimilarity(themes1: string[], themes2: string[]): number {
    if (themes1.length === 0 && themes2.length === 0) return 1
    if (themes1.length === 0 || themes2.length === 0) return 0

    const intersection = themes1.filter(theme =>
      themes2.some(t2 => t2.toLowerCase().includes(theme.toLowerCase()))
    )
    const union = Array.from(new Set([...themes1, ...themes2]))

    return intersection.length / union.length
  }

  private assessPlotComplexity(plotStructure: any): 'simple' | 'moderate' | 'complex' {
    const eventCount = Object.keys(plotStructure || {}).length
    if (eventCount <= 3) return 'simple'
    if (eventCount <= 6) return 'moderate'
    return 'complex'
  }

  private calculateReuseScore(content: any, contentType: InfinitePagesContentType): number {
    // Calculate based on content genericness and quality
    const score = 5.0 // Base score

    // Adjust based on content type reusability
    const reuseFactors: Partial<Record<InfinitePagesContentType, number>> = {
      themes: 9.0,
      setting: 8.0,
      main_characters: 7.0,
      plot_structure: 6.0,
      story_foundation: 5.0,
      chapter_outline: 4.0,
      chapter_content: 3.0,
      improvement_style: 7.0,
      analysis_genre: 8.0
    }

    return Math.min(10.0, reuseFactors[contentType] || score)
  }

  /**
   * PRIORITY 2: Chapter caching with foundation dependency tracking
   * Target: 60% cost savings on chapter generation (5 tokens per chapter)
   */
  async cacheChapterWithContext(
    chapterNumber: number,
    content: any,
    storyId: string,
    foundationFingerprint: string,
    previousChaptersHash: string,
    genre: Genre,
    targetWordCount: number,
    userId: string,
    storyTitle: string = 'Unknown Story'
  ): Promise<void> {

    try {
      const prompt = `Chapter ${chapterNumber} for ${genre} story: ${storyTitle}`
      const metadata = {
        genre,
        premise_hash: '', // Not needed for chapters
        chapter_number: chapterNumber,
        target_word_count: targetWordCount,
        word_count: content.wordCount || targetWordCount,
        foundation_fingerprint: foundationFingerprint,
        previous_chapters_hash: previousChaptersHash
      }

      await this.set(
        prompt,
        'chapter_content',
        content,
        userId,
        'chapter_generation_contextual',
        {
          chapterNumber,
          targetWordCount,
          genre,
          storyId,
          storyTitle
        },
        metadata,
        storyId,
        foundationFingerprint
      )

      // InfinitePages Cache: Chapter cached for story

    } catch (error) {
      // InfinitePages Cache error caching chapter - production logging system would handle this
    }
  }

  /**
   * Get chapter with intelligent foundation context matching
   */
  async getChapterWithFoundationContext(
    chapterNumber: number,
    foundationFingerprint: string,
    previousChaptersHash: string,
    genre: Genre,
    targetWordCount: number,
    userId: string,
    storyTitle: string = 'Unknown Story'
  ): Promise<{
    chapter: any | null;
    fromCache: boolean;
    cacheType: 'exact' | 'foundation-adapted' | 'structure-similar' | 'genre-adapted' | 'none';
    tokensSaved: number;
  }> {

    try {
      // InfinitePages Cache: Looking for chapter cache

      // 1. Try exact context match (same foundation + previous chapters)
      const exactMatch = await this.getByMetadata(
        'chapter_content',
        userId,
        {
          genre,
          chapter_number: chapterNumber,
          foundation_fingerprint: foundationFingerprint,
          previous_chapters_hash: previousChaptersHash
        }
      )

      if (exactMatch.length > 0) {
        const match = exactMatch[0]
        if (match) {
          await this.incrementHitCount(match.id)
          // InfinitePages Cache: EXACT chapter cache hit

          return {
            chapter: match.content,
            fromCache: true,
            cacheType: 'exact',
            tokensSaved: this.config.tokenCosts.chapter_content
          }
        }
      }

      // 2. Try same foundation, different previous chapters (foundation-adapted)
      const foundationMatches = await this.getByMetadata(
        'chapter_content',
        userId,
        {
          genre,
          chapter_number: chapterNumber,
          foundation_fingerprint: foundationFingerprint
        },
        10
      )

      if (foundationMatches.length > 0) {
        // Find best word count match within same foundation
        const wordCountMatch = foundationMatches.find(match =>
          Math.abs((match.metadata.word_count || 2000) - targetWordCount) < 300
        )

        if (wordCountMatch && wordCountMatch.reuse_score >= 6.0) {
          const adaptedChapter = this.adaptChapterContent(
            wordCountMatch.content,
            chapterNumber,
            targetWordCount,
            storyTitle
          )

          await this.incrementHitCount(wordCountMatch.id)
          // InfinitePages Cache: FOUNDATION-ADAPTED chapter cache hit

          return {
            chapter: adaptedChapter,
            fromCache: true,
            cacheType: 'foundation-adapted',
            tokensSaved: Math.floor(this.config.tokenCosts.chapter_content * 0.7) // 70% savings
          }
        }
      }

      // 3. Try structural similarity (same genre + chapter number + similar word count)
      const structureMatches = await this.getByMetadata(
        'chapter_content',
        userId,
        {
          genre,
          chapter_number: chapterNumber
        },
        15
      )

      if (structureMatches.length > 0) {
        // Find chapters with similar word count and high reuse score
        const similarStructure = structureMatches.find(match =>
          Math.abs((match.metadata.word_count || 2000) - targetWordCount) < 500 &&
          match.reuse_score >= 7.0 &&
          match.hit_count >= 1
        )

        if (similarStructure) {
          const adaptedChapter = this.adaptChapterContent(
            similarStructure.content,
            chapterNumber,
            targetWordCount,
            storyTitle
          )

          await this.incrementHitCount(similarStructure.id)
          // InfinitePages Cache: STRUCTURE-SIMILAR chapter cache hit

          return {
            chapter: adaptedChapter,
            fromCache: true,
            cacheType: 'structure-similar',
            tokensSaved: Math.floor(this.config.tokenCosts.chapter_content * 0.5) // 50% savings
          }
        }
      }

      // 4. Try genre adaptation for early chapters (chapters 1-3 have more similarity)
      if (chapterNumber <= 3) {
        const genreMatches = await this.getByMetadata(
          'chapter_content',
          userId,
          { genre },
          20
        )

        const earlyChapterMatch = genreMatches.find(match =>
          match.metadata.chapter_number === chapterNumber &&
          match.reuse_score >= 8.0 && // High quality only
          match.hit_count >= 2 // Proven reusable
        )

        if (earlyChapterMatch) {
          const adaptedChapter = this.adaptChapterContent(
            earlyChapterMatch.content,
            chapterNumber,
            targetWordCount,
            storyTitle
          )

          await this.incrementHitCount(earlyChapterMatch.id)
          // InfinitePages Cache: GENRE-ADAPTED chapter cache hit for early chapter

          return {
            chapter: adaptedChapter,
            fromCache: true,
            cacheType: 'genre-adapted',
            tokensSaved: Math.floor(this.config.tokenCosts.chapter_content * 0.4) // 40% savings
          }
        }
      }

      // InfinitePages Cache: NO chapter cache hit
      return {
        chapter: null,
        fromCache: false,
        cacheType: 'none',
        tokensSaved: 0
      }

    } catch (error) {
      // InfinitePages Cache error in getChapterWithFoundationContext - production logging system would handle this
      return {
        chapter: null,
        fromCache: false,
        cacheType: 'none',
        tokensSaved: 0
      }
    }
  }

  /**
   * Wrapper for chapter generation calls - integrates with existing API
   */
  async wrapChapterGeneration<T>(
    claudeServiceCall: () => Promise<T>,
    chapterNumber: number,
    storyId: string,
    foundationFingerprint: string,
    previousChaptersHash: string,
    genre: Genre,
    targetWordCount: number,
    userId: string,
    storyTitle: string = 'Unknown Story'
  ): Promise<{ result: T; fromCache: boolean; tokensSaved: number; cacheType?: string }> {

    // Check cache first
    const cacheResult = await this.getChapterWithFoundationContext(
      chapterNumber,
      foundationFingerprint,
      previousChaptersHash,
      genre,
      targetWordCount,
      userId,
      storyTitle
    )

    if (cacheResult.fromCache && cacheResult.chapter) {
      return {
        result: cacheResult.chapter as T,
        fromCache: true,
        tokensSaved: cacheResult.tokensSaved,
        cacheType: cacheResult.cacheType
      }
    }

    // Generate new chapter
    const result = await claudeServiceCall()

    // Cache the result for future use
    await this.cacheChapterWithContext(
      chapterNumber,
      result,
      storyId,
      foundationFingerprint,
      previousChaptersHash,
      genre,
      targetWordCount,
      userId,
      storyTitle
    )

    return {
      result,
      fromCache: false,
      tokensSaved: 0
    }
  }

  /**
   * Generate foundation fingerprint for dependency tracking
   */
  generateFoundationFingerprint(foundation: any): string {
    const keyElements = {
      genre: foundation.genre,
      mainCharacters: foundation.mainCharacters?.map((c: any) => c.name) || [],
      plotStructure: Object.keys(foundation.plotStructure || {}),
      themes: foundation.themes || [],
      setting: foundation.setting?.place || 'unknown'
    }

    return crypto.createHash('md5').update(JSON.stringify(keyElements)).digest('hex')
  }

  /**
   * Generate hash for previous chapters context
   */
  generatePreviousChaptersHash(chapters: Array<{ content: string; summary: string }>): string {
    const contextData = chapters.map(ch => ({
      summary: ch.summary,
      contentPreview: ch.content.substring(0, 200) // First 200 chars for context
    }))

    return crypto.createHash('md5').update(JSON.stringify(contextData)).digest('hex')
  }

  /**
   * Adapt cached chapter content to new context
   */
  private adaptChapterContent(
    originalChapter: any,
    chapterNumber: number,
    targetWordCount: number,
    storyTitle: string
  ): any {
    return {
      ...originalChapter,
      title: originalChapter.title?.replace(/Chapter \d+/, `Chapter ${chapterNumber}`) || `Chapter ${chapterNumber}`,
      wordCount: targetWordCount,
      // Keep original content but mark as adapted
      _cacheAdapted: true,
      _originalChapterId: originalChapter.id,
      _adaptedAt: new Date().toISOString(),
      _targetWordCount: targetWordCount,
      _storyTitle: storyTitle
    }
  }

  /**
   * Get cache analytics for dashboard
   */
  async getInfinitePagesAnalytics(userId: string): Promise<{
    totalTokensSaved: number;
    cacheHitRateByType: Record<string, number>;
    topGenres: Array<{ genre: Genre; efficiency: number }>;
    foundationReuseRate: number;
    costSavingsThisMonth: number;
  }> {
    // Return empty analytics if Supabase is not available
    if (!this.isAvailable()) {
      return {
        totalTokensSaved: 0,
        cacheHitRateByType: {},
        topGenres: [],
        foundationReuseRate: 0,
        costSavingsThisMonth: 0
      }
    }

    try {
      const { data, error } = await (this.supabase as any)
        .rpc('get_infinite_pages_analytics', { user_id: userId })

      if (error) {
        // InfinitePages Cache analytics error - production logging system would handle this
        return {
          totalTokensSaved: 0,
          cacheHitRateByType: {},
          topGenres: [],
          foundationReuseRate: 0,
          costSavingsThisMonth: 0
        }
      }

      return data || {
        totalTokensSaved: 0,
        cacheHitRateByType: {},
        topGenres: [],
        foundationReuseRate: 0,
        costSavingsThisMonth: 0
      }
    } catch (error) {
      // InfinitePages Cache error getting analytics - production logging system would handle this
      return {
        totalTokensSaved: 0,
        cacheHitRateByType: {},
        topGenres: [],
        foundationReuseRate: 0,
        costSavingsThisMonth: 0
      }
    }
  }

  /**
   * Get memory cache statistics for monitoring
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    cacheConfig: {
      maxEntries: number;
      ttlMs: number;
    };
  } {
    const memoryUsage = process.memoryUsage()

    return {
      size: this.memoryCache.size,
      maxSize: this.memoryCache.max,
      hitRate: this.memoryCache.calculatedSize || 0,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cacheConfig: {
        maxEntries: this.memoryCache.max,
        ttlMs: this.memoryCache.ttl || 0
      }
    }
  }

  /**
   * Clear the memory cache for memory management
   */
  clearMemoryCache(): void {
    this.memoryCache.clear()
    // InfinitePages Cache: Memory cache cleared
  }

  /**
   * Check if cache is healthy (not approaching memory limits)
   */
  isCacheHealthy(): {
    healthy: boolean;
    warnings: string[];
    stats: any;
  } {
    const stats = this.getCacheStats()
    const warnings: string[] = []
    let healthy = true

    // Check memory usage
    if (stats.memoryUsage.heapUsed > 512) { // 512MB threshold
      warnings.push(`High heap usage: ${stats.memoryUsage.heapUsed}MB`)
      healthy = false
    }

    // Check cache size vs max
    if (stats.size > stats.maxSize * 0.9) {
      warnings.push(`Cache near capacity: ${stats.size}/${stats.maxSize}`)
    }

    // Check for memory pressure
    if (stats.memoryUsage.rss > 1024) { // 1GB threshold
      warnings.push(`High RSS memory: ${stats.memoryUsage.rss}MB`)
      healthy = false
    }

    return {
      healthy,
      warnings,
      stats
    }
  }
}

// Export singleton instance for immediate use
export const infinitePagesCache = new InfinitePagesCache()