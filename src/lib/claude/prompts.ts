export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: 'story' | 'chapter' | 'improvement' | 'analysis' | 'general'
  template: string
  variables: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'array'
    required: boolean
    description: string
    defaultValue?: string | number | boolean | string[]
    options?: string[] // For enum-like variables
  }>
  metadata: {
    author?: string
    version: string
    tags: string[]
    rating?: number
    usageCount: number
    createdAt: Date
    updatedAt: Date
  }
  examples?: Array<{
    input: Record<string, unknown>
    expectedOutput: string
  }>
}

export interface PromptVariable {
  name: string
  value: string | number | boolean | string[]
}

export class PromptTemplateManager {
  private templates = new Map<string, PromptTemplate>()
  private categories = new Map<string, PromptTemplate[]>()

  constructor() {
    this.loadDefaultTemplates()
  }

  /**
   * Register a new prompt template
   */
  registerTemplate(template: Omit<PromptTemplate, 'metadata'> & {
    metadata?: Partial<PromptTemplate['metadata']>
  }): void {
    const fullTemplate: PromptTemplate = {
      ...template,
      metadata: {
        version: '1.0.0',
        tags: [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...template.metadata
      }
    }

    this.templates.set(template.id, fullTemplate)
    this.updateCategories(fullTemplate)
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): PromptTemplate | null {
    const template = this.templates.get(id)
    if (template) {
      template.metadata.usageCount++
      template.metadata.updatedAt = new Date()
    }
    return template || null
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return this.categories.get(category) || []
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): PromptTemplate[] {
    const searchTerm = query.toLowerCase()
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateId: string, variables: PromptVariable[]): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // Convert variables array to object
    const variableMap = new Map(variables.map(v => [v.name, v.value]))
    
    // Validate required variables
    const missingVariables = template.variables
      .filter(v => v.required && !variableMap.has(v.name))
      .map(v => v.name)
    
    if (missingVariables.length > 0) {
      throw new Error(`Missing required variables: ${missingVariables.join(', ')}`)
    }

    // Render template
    let rendered = template.template
    
    // Replace variables
    template.variables.forEach(variable => {
      const value = variableMap.get(variable.name) ?? variable.defaultValue ?? ''
      const placeholder = `{{${variable.name}}}`
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value))
    })

    // Replace conditional blocks
    rendered = this.renderConditionalBlocks(rendered, variableMap)

    return rendered
  }

  /**
   * Render conditional blocks in template
   */
  private renderConditionalBlocks(template: string, variables: Map<string, unknown>): string {
    // Handle {{#if variable}}...{{/if}} blocks
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
    let rendered = template.replace(ifRegex, (match, variableName, content) => {
      const value = variables.get(variableName)
      return value ? content : ''
    })

    // Handle {{#unless variable}}...{{/unless}} blocks
    const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g
    rendered = rendered.replace(unlessRegex, (match, variableName, content) => {
      const value = variables.get(variableName)
      return !value ? content : ''
    })

    return rendered
  }

  /**
   * Update categories map
   */
  private updateCategories(template: PromptTemplate): void {
    const category = template.category
    if (!this.categories.has(category)) {
      this.categories.set(category, [])
    }
    
    const categoryTemplates = this.categories.get(category)!
    const existingIndex = categoryTemplates.findIndex(t => t.id === template.id)
    
    if (existingIndex >= 0) {
      categoryTemplates[existingIndex] = template
    } else {
      categoryTemplates.push(template)
    }
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Story Foundation Template
    this.registerTemplate({
      id: 'story_foundation_comprehensive',
      name: 'Comprehensive Story Foundation',
      description: 'Generate a detailed story foundation with characters, plot, and structure',
      category: 'story',
      template: `Create a comprehensive story foundation for a {{genre}} story with this premise: "{{premise}}".

Please provide a structured JSON response with the following elements:
{
  "title": "{{title}}",
  "genre": "{{genre}}",
  "premise": "{{premise}}",
  "mainCharacters": [
    {
      "name": "Character Name",
      "role": "protagonist/antagonist/supporting",
      "description": "Detailed character description including appearance, personality, background",
      "motivation": "What drives this character",
      "arc": "How this character will change throughout the story"
    }
  ],
  "setting": {
    "time": "When the story takes place (specific era, season, etc.)",
    "place": "Where the story takes place (specific locations)",
    "atmosphere": "Mood and tone of the setting",
    "worldbuilding": "Unique aspects of this world"
  },
  "plotStructure": {
    "incitingIncident": "What kicks off the story",
    "risingAction": "Key conflicts and complications that build tension",
    "climax": "The story's turning point and highest tension",
    "fallingAction": "How tensions begin to resolve",
    "resolution": "How conflicts are ultimately resolved"
  },
  "themes": ["Primary themes and messages of the story"],
  "tone": "Overall tone and style (e.g., dark and gritty, light and humorous, etc.)",
  "targetAudience": "Who this story is intended for",
  "chapterOutline": [
    {
      "number": 1,
      "title": "Chapter title",
      "summary": "What happens in this chapter",
      "purpose": "How this chapter serves the overall story",
      "keyEvents": ["Important events that occur"],
      "characterDevelopment": "How characters grow or change"
    }
  ]
}

{{#if includeWritingTips}}
Additionally, provide writing tips specific to the {{genre}} genre and suggestions for maintaining consistency throughout the story.
{{/if}}

Make this foundation comprehensive, engaging, and detailed. This will serve as the blueprint for writing a complete novel.`,
      variables: [
        {
          name: 'title',
          type: 'string',
          required: false,
          description: 'Story title',
          defaultValue: 'Untitled Story'
        },
        {
          name: 'genre',
          type: 'string',
          required: true,
          description: 'Story genre',
          options: ['Fantasy', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Horror', 'Literary Fiction', 'Historical Fiction', 'Young Adult', 'Adventure', 'Contemporary', 'Dystopian', 'Comedy', 'Drama']
        },
        {
          name: 'premise',
          type: 'string',
          required: true,
          description: 'Story premise or concept'
        },
        {
          name: 'includeWritingTips',
          type: 'boolean',
          required: false,
          description: 'Include genre-specific writing tips',
          defaultValue: false
        }
      ],
      metadata: {
        author: 'System',
        tags: ['story', 'foundation', 'comprehensive', 'json'],
        rating: 4.8
      }
    })

    // Chapter Generation Template
    this.registerTemplate({
      id: 'chapter_generation_contextual',
      name: 'Contextual Chapter Generation',
      description: 'Generate a chapter with full story context and previous chapter information',
      category: 'chapter',
      template: `Write Chapter {{chapterNumber}} for this story:

**Story Context:**
Title: {{storyTitle}}
Genre: {{genre}}
Premise: {{premise}}
Foundation: {{foundation}}

**Previous Chapters:**
{{#if previousChapters}}
{{previousChapters}}
{{else}}
This is the first chapter.
{{/if}}

**Chapter Requirements:**
- Word count: approximately {{targetWordCount}} words
- Maintain consistency with the story foundation and previous chapters
- Flow naturally from previous chapters (if any)
- Advance the plot meaningfully
- Include engaging dialogue and vivid descriptions
- Develop characters in meaningful ways
- End with appropriate tension or resolution for this point in the story
- Use proper pacing for this stage of the story

**Writing Style:**
{{#if writingStyle}}
{{writingStyle}}
{{else}}
Use a professional, engaging writing style appropriate for the {{genre}} genre.
{{/if}}

Return the response as JSON:
{
  "title": "Chapter {{chapterNumber}} title",
  "content": "The full chapter content",
  "summary": "Brief summary of what happens in this chapter",
  "wordCount": number_of_words,
  "keyEvents": ["Important events that occur in this chapter"],
  "characterDevelopment": "How characters grow or change in this chapter",
  "foreshadowing": "Any hints or foreshadowing for future events",
  "pacingNotes": "Notes about the pacing and structure of this chapter"
}

Make this chapter compelling, well-written, and integral to the overall story.`,
      variables: [
        {
          name: 'chapterNumber',
          type: 'number',
          required: true,
          description: 'Chapter number'
        },
        {
          name: 'storyTitle',
          type: 'string',
          required: true,
          description: 'Story title'
        },
        {
          name: 'genre',
          type: 'string',
          required: true,
          description: 'Story genre'
        },
        {
          name: 'premise',
          type: 'string',
          required: true,
          description: 'Story premise'
        },
        {
          name: 'foundation',
          type: 'string',
          required: true,
          description: 'Story foundation JSON'
        },
        {
          name: 'previousChapters',
          type: 'string',
          required: false,
          description: 'Previous chapters context'
        },
        {
          name: 'targetWordCount',
          type: 'number',
          required: false,
          description: 'Target word count',
          defaultValue: 2000
        },
        {
          name: 'writingStyle',
          type: 'string',
          required: false,
          description: 'Specific writing style instructions'
        }
      ],
      metadata: {
        author: 'System',
        tags: ['chapter', 'generation', 'contextual', 'json'],
        rating: 4.7
      }
    })

    // Content Improvement Template
    this.registerTemplate({
      id: 'content_improvement_targeted',
      name: 'Targeted Content Improvement',
      description: 'Improve content with specific focus areas and detailed feedback',
      category: 'improvement',
      template: `You are a professional editor and writing coach. Please improve the following content based on the feedback provided.

**Content to Improve:**
{{content}}

**Feedback:**
{{feedback}}

**Improvement Focus:** {{improvementType}}

**Additional Context:**
{{#if genre}}
Genre: {{genre}}
{{/if}}
{{#if targetAudience}}
Target Audience: {{targetAudience}}
{{/if}}
{{#if wordLimit}}
Word Limit: {{wordLimit}}
{{/if}}

**Improvement Guidelines:**
- Maintain the author's voice and style
- Focus specifically on {{improvementType}} improvements
- Ensure the content flows naturally
- Keep the core message and intent intact
- Make changes that enhance readability and engagement

Return the improved content as JSON:
{
  "improvedContent": "The enhanced version of the content",
  "changes": ["List of specific changes made"],
  "reasoning": "Explanation of why these improvements were made",
  "wordCount": number_of_words,
  "improvementAreas": ["Areas that were specifically addressed"],
  "beforeAfter": {
    "before": "Key problematic sections before improvement",
    "after": "How those sections were improved"
  }
}

Focus on making meaningful improvements that enhance the overall quality while preserving the original intent and voice.`,
      variables: [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content to improve'
        },
        {
          name: 'feedback',
          type: 'string',
          required: true,
          description: 'Improvement feedback'
        },
        {
          name: 'improvementType',
          type: 'string',
          required: true,
          description: 'Type of improvement',
          options: ['general', 'dialogue', 'description', 'pacing', 'character', 'plot', 'style', 'grammar']
        },
        {
          name: 'genre',
          type: 'string',
          required: false,
          description: 'Content genre'
        },
        {
          name: 'targetAudience',
          type: 'string',
          required: false,
          description: 'Target audience'
        },
        {
          name: 'wordLimit',
          type: 'number',
          required: false,
          description: 'Word count limit'
        }
      ],
      metadata: {
        author: 'System',
        tags: ['improvement', 'editing', 'feedback', 'json'],
        rating: 4.6
      }
    })

    // Content Analysis Template
    this.registerTemplate({
      id: 'content_analysis_comprehensive',
      name: 'Comprehensive Content Analysis',
      description: 'Analyze content for quality, structure, and improvement suggestions',
      category: 'analysis',
      template: `You are a professional literary analyst and writing coach. Analyze the following content and provide detailed insights.

**Content to Analyze:**
{{content}}

**Analysis Focus:**
{{#if analysisType}}
{{analysisType}}
{{else}}
Comprehensive analysis including quality, structure, style, and improvement suggestions
{{/if}}

**Context:**
{{#if genre}}
Genre: {{genre}}
{{/if}}
{{#if targetAudience}}
Target Audience: {{targetAudience}}
{{/if}}
{{#if purpose}}
Purpose: {{purpose}}
{{/if}}

Provide your analysis as JSON:
{
  "overallQuality": "excellent|good|fair|needs_work",
  "wordCount": number_of_words,
  "readabilityScore": "score out of 100",
  "strengths": ["What the content does well"],
  "areasForImprovement": ["Areas that could be enhanced"],
  "writingStyle": {
    "tone": "Overall tone detected",
    "pacing": "Assessment of pacing",
    "dialogue": "Quality of dialogue (if present)",
    "description": "Quality of descriptions",
    "voice": "Assessment of author voice"
  },
  "structure": {
    "organization": "How well the content is organized",
    "flow": "How well ideas flow together",
    "coherence": "Overall coherence and logic"
  },
  "suggestions": ["Specific actionable suggestions for improvement"],
  "targetAudience": "Who this content would appeal to",
  "genreAlignment": "How well it fits typical genre conventions",
  "comparisonScore": "How this compares to similar content (1-10)",
  "recommendedActions": ["Priority actions to take"]
}

Provide honest, constructive feedback that will help improve the writing quality.`,
      variables: [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content to analyze'
        },
        {
          name: 'analysisType',
          type: 'string',
          required: false,
          description: 'Type of analysis',
          options: ['comprehensive', 'style', 'structure', 'quality', 'readability', 'genre']
        },
        {
          name: 'genre',
          type: 'string',
          required: false,
          description: 'Content genre'
        },
        {
          name: 'targetAudience',
          type: 'string',
          required: false,
          description: 'Target audience'
        },
        {
          name: 'purpose',
          type: 'string',
          required: false,
          description: 'Content purpose'
        }
      ],
      metadata: {
        author: 'System',
        tags: ['analysis', 'feedback', 'quality', 'json'],
        rating: 4.9
      }
    })

    // SFSL Story Fact Extraction Template
    this.registerTemplate({
      id: 'story_fact_extraction_comprehensive',
      name: 'Comprehensive Story Fact Extraction',
      description: 'Extract story facts using SFSL format with compression and compliance analysis',
      category: 'analysis',
      template: `Extract story facts using SFSL format:

CONTENT TO ANALYZE:
{{content}}

EXISTING CONTEXT:
{{existingContext}}

EXTRACTION TYPE: {{factType}}

CHARACTER VOICE PATTERNS TO DETECT:
{{voicePatterns}}

Extract using Story Facts Shorthand Language (SFSL):

**Characters (C:name|P:physical|E:emotional|R:relationships|G:goals|S:status|V:voice_pattern):**
- Focus on voice consistency with established patterns
- Track emotional arc progression
- Note relationship changes

**World Elements (W:element|R:rules|L:limitations|U:unique_aspects|F:frequency):**
- Magic system consistency
- Geographic/cultural accuracy
- Rule adherence

**Plot Threads (T:thread|S:status|K:stakes|N:next|C:connections|Q:quality):**
- Active vs dormant threads
- Escalation tracking
- Connection mapping

**Timeline (@ch{num}:{event}→{consequence}|I:impact|A:affected):**
- Chronological accuracy
- Consequence tracking
- Character involvement

Return JSON:
{
  "extractedFacts": {
    "characters": ["SFSL format strings"],
    "world": ["SFSL format strings"],
    "plot": ["SFSL format strings"],
    "timeline": ["SFSL format strings"]
  },
  "compressionStats": {
    "originalTokens": number,
    "compressedTokens": number,
    "compressionRatio": number
  },
  "storyBibleCompliance": {
    "overallScore": number,
    "violations": ["list of violations"],
    "recommendations": ["improvement suggestions"]
  }
}`,
      variables: [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content to extract facts from'
        },
        {
          name: 'existingContext',
          type: 'string',
          required: false,
          description: 'Previous story facts for context',
          defaultValue: ''
        },
        {
          name: 'factType',
          type: 'string',
          required: true,
          description: 'Type of fact extraction',
          options: ['universe', 'series', 'book', 'chapter']
        },
        {
          name: 'voicePatterns',
          type: 'string',
          required: false,
          description: 'Known character voice patterns',
          defaultValue: ''
        }
      ],
      metadata: {
        author: 'SFSL System',
        tags: ['sfsl', 'fact-extraction', 'compression', 'analysis'],
        rating: 5.0
      }
    })

    // Character Voice Analysis Template
    this.registerTemplate({
      id: 'character_voice_consistency_analysis',
      name: 'Character Voice Consistency Analysis',
      description: 'Analyze character voice consistency against established patterns',
      category: 'analysis',
      template: `Analyze character voice consistency:

CONTENT WITH DIALOGUE:
{{content}}

ESTABLISHED VOICE PATTERNS:
{{establishedPatterns}}

CHARACTER FOCUS: {{characterName}}

Analyze voice consistency and return JSON:
{
  "characterName": "{{characterName}}",
  "voiceConsistencyScore": number_out_of_100,
  "establishedPatterns": {
    "speechStyle": "pattern description",
    "interruptionStyle": "pattern description",
    "thematicLanguage": "recurring themes/metaphors"
  },
  "detectedPatterns": {
    "speechStyle": "observed in content",
    "interruptionStyle": "observed in content",
    "thematicLanguage": "observed themes"
  },
  "consistencyIssues": ["specific inconsistencies found"],
  "recommendations": ["suggestions for improvement"],
  "exampleDialogue": ["authentic dialogue examples"],
  "voiceFingerprint": {
    "sentenceLength": "average word count",
    "vocabularyLevel": "formal/casual/mixed",
    "emotionalRange": "pattern of emotional expression",
    "interruptionFrequency": "how often they cut off/are cut off"
  }
}`,
      variables: [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content with character dialogue to analyze'
        },
        {
          name: 'establishedPatterns',
          type: 'string',
          required: true,
          description: 'Known voice patterns for this character'
        },
        {
          name: 'characterName',
          type: 'string',
          required: true,
          description: 'Name of character to analyze'
        }
      ],
      metadata: {
        author: 'SFSL System',
        tags: ['character', 'voice', 'consistency', 'dialogue', 'analysis'],
        rating: 4.8
      }
    })

    // Story Bible Compliance Template
    this.registerTemplate({
      id: 'story_bible_compliance_check',
      name: 'Story Bible Compliance Check',
      description: 'Check content against established story bible for consistency violations',
      category: 'analysis',
      template: `Analyze content for story bible compliance:

NEW CONTENT:
{{newContent}}

ESTABLISHED STORY FACTS:
{{storyFacts}}

CHARACTER VOICE PATTERNS:
{{voicePatterns}}

WORLD BUILDING RULES:
{{worldRules}}

Perform comprehensive compliance analysis and return JSON:
{
  "overallComplianceScore": number_out_of_100,
  "analysisDetails": {
    "characterVoiceCompliance": number_out_of_100,
    "worldBuildingCompliance": number_out_of_100,
    "timelineCompliance": number_out_of_100,
    "plotConsistency": number_out_of_100
  },
  "violations": [
    {
      "type": "character_voice|world_building|timeline|plot",
      "severity": "critical|major|minor",
      "description": "detailed description of violation",
      "location": "where in content the violation occurs",
      "establishedRule": "what story bible rule was violated",
      "suggestion": "how to fix the violation"
    }
  ],
  "strengths": ["aspects that maintain good consistency"],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "voice|world|plot|timeline",
      "suggestion": "specific improvement suggestion",
      "impact": "why this improvement matters"
    }
  ],
  "consistencyTrends": {
    "improvingAreas": ["areas showing better consistency"],
    "decliningAreas": ["areas needing attention"],
    "stableAreas": ["consistently well-maintained aspects"]
  }
}`,
      variables: [
        {
          name: 'newContent',
          type: 'string',
          required: true,
          description: 'New content to check for compliance'
        },
        {
          name: 'storyFacts',
          type: 'string',
          required: true,
          description: 'Established story facts and rules'
        },
        {
          name: 'voicePatterns',
          type: 'string',
          required: false,
          description: 'Character voice patterns to validate against',
          defaultValue: ''
        },
        {
          name: 'worldRules',
          type: 'string',
          required: false,
          description: 'World building rules and limitations',
          defaultValue: ''
        }
      ],
      metadata: {
        author: 'SFSL System',
        tags: ['compliance', 'story-bible', 'consistency', 'validation'],
        rating: 4.9
      }
    })

    // SFSL Compression Optimization Template
    this.registerTemplate({
      id: 'sfsl_compression_optimization',
      name: 'SFSL Compression Optimization',
      description: 'Optimize story content compression using SFSL techniques',
      category: 'analysis',
      template: `Optimize content compression using SFSL:

CONTENT TO COMPRESS:
{{content}}

COMPRESSION TARGET: {{compressionTarget}}%

PRIORITY ELEMENTS:
{{priorityElements}}

Compress using SFSL while maintaining story integrity:

**Compression Strategy:**
1. Identify redundant information
2. Extract core story facts
3. Compress using SFSL format
4. Validate information preservation

Return JSON:
{
  "originalStats": {
    "characterCount": number,
    "wordCount": number,
    "estimatedTokens": number
  },
  "compressedContent": {
    "sfslFormat": "compressed content in SFSL",
    "characterCount": number,
    "estimatedTokens": number
  },
  "compressionResults": {
    "compressionRatio": number,
    "spaceSaved": number,
    "tokensSaved": number,
    "estimatedCostSavings": number
  },
  "qualityMetrics": {
    "informationRetention": number_out_of_100,
    "readabilityScore": number_out_of_100,
    "usabilityScore": number_out_of_100
  },
  "optimizationTechniques": ["techniques used for compression"],
  "preservedElements": ["critical elements maintained"],
  "compressionBreakdown": {
    "charactersCompressed": number,
    "worldElementsCompressed": number,
    "plotThreadsCompressed": number,
    "timelineEventsCompressed": number
  }
}`,
      variables: [
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content to compress using SFSL'
        },
        {
          name: 'compressionTarget',
          type: 'number',
          required: false,
          description: 'Target compression percentage',
          defaultValue: 80
        },
        {
          name: 'priorityElements',
          type: 'string',
          required: false,
          description: 'Elements to prioritize during compression',
          defaultValue: 'characters,plot,world'
        }
      ],
      metadata: {
        author: 'SFSL System',
        tags: ['compression', 'optimization', 'sfsl', 'efficiency'],
        rating: 4.7
      }
    })
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get template statistics
   */
  getTemplateStats(): {
    totalTemplates: number
    templatesByCategory: Record<string, number>
    mostUsedTemplates: Array<{ id: string; name: string; usageCount: number }>
    averageRating: number
  } {
    const templates = Array.from(this.templates.values())
    const templatesByCategory: Record<string, number> = {}
    
    templates.forEach(template => {
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1
    })

    const mostUsedTemplates = templates
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, 5)
      .map(t => ({ id: t.id, name: t.name, usageCount: t.metadata.usageCount }))

    const ratings = templates
      .filter(t => t.metadata.rating)
      .map(t => t.metadata.rating!)
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      mostUsedTemplates,
      averageRating
    }
  }

  /**
   * Export templates
   */
  exportTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()), null, 2)
  }

  /**
   * Import templates
   */
  importTemplates(templatesJson: string): void {
    try {
      const templates: PromptTemplate[] = JSON.parse(templatesJson)
      templates.forEach(template => {
        this.registerTemplate(template)
      })
    } catch (error) {
      throw new Error('Invalid templates JSON format')
    }
  }
}

// Export singleton instance
export const promptTemplateManager = new PromptTemplateManager()

