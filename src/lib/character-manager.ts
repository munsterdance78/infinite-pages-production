import { claudeService } from './claude/service'
import { createClient } from './supabase/client'

interface StoryContext {
  genre?: string
  setting?: string
  tone?: string
  themes?: string[]
  [key: string]: unknown
}

interface ExistingCharacter {
  name: string
  role: string
  personality?: string
  [key: string]: unknown
}

interface CharacterGenerationOptions {
  role: string
  traits: string[]
  storyContext: StoryContext
  existingCharacters: ExistingCharacter[]
}

interface VoicePattern {
  characterName: string
  speechPatterns: string[]
  vocabularyStyle: string
  tonalCharacteristics: string
  dialogueExamples: string[]
  consistency_markers: string[]
}

interface VoiceConsistencyResult {
  isConsistent: boolean
  consistencyScore: number
  deviations: string[]
  suggestions: string[]
  updatedPattern?: VoicePattern
}

export class CharacterManager {
  private supabase = createClient()

  async generateCharacter(options: CharacterGenerationOptions) {
    try {
      // Use existing ClaudeService for generation
      const result = await claudeService.generateContent({
        prompt: this.buildCharacterPrompt(options),
        operation: 'character_generation'
      })

      // Parse the JSON response
      const parsedResult = 'content' in result ? JSON.parse(result.content) : result

      // Store voice pattern for consistency tracking
      if (parsedResult.character) {
        await this.storeVoicePattern(parsedResult.character)
      }

      return parsedResult
    } catch (error) {
      console.error('Character generation failed:', error)
      throw new Error('Failed to generate character')
    }
  }

  async analyzeVoiceConsistency(characterName: string, dialogue: string): Promise<VoiceConsistencyResult> {
    try {
      const storedPattern = await this.getVoicePattern(characterName)

      if (!storedPattern) {
        throw new Error(`No voice pattern found for character: ${characterName}`)
      }

      const result = await claudeService.generateContent({
        prompt: this.buildVoiceAnalysisPrompt(dialogue, storedPattern),
        operation: 'voice_consistency_analysis'
      })

      // Parse the JSON response with type guard
      const parsedResult = 'content' in result ? JSON.parse(result.content) : result
      return parsedResult as VoiceConsistencyResult
    } catch (error) {
      console.error('Voice consistency analysis failed:', error)
      throw new Error('Failed to analyze voice consistency')
    }
  }

  async updateCharacterVoicePattern(characterName: string, newDialogue: string) {
    try {
      const existingPattern = await this.getVoicePattern(characterName)

      if (!existingPattern) {
        throw new Error(`Character ${characterName} not found`)
      }

      // Analyze new dialogue and update pattern
      const analysisResult = await this.analyzeVoiceConsistency(characterName, newDialogue)

      if (analysisResult.updatedPattern) {
        await this.storeVoicePattern(analysisResult.updatedPattern)
      }

      return analysisResult
    } catch (error) {
      console.error('Failed to update voice pattern:', error)
      throw error
    }
  }

  async getAllCharacterVoices(storyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('character_voice_patterns')
        .select('*')
        .eq('story_id', storyId)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to get character voices:', error)
      throw new Error('Failed to retrieve character voice patterns')
    }
  }

  private buildCharacterPrompt(options: CharacterGenerationOptions): string {
    return `
You are an expert character creator for narrative fiction. Create a detailed character based on the following specifications:

**Character Requirements:**
- Role: ${options.role}
- Key Traits: ${options.traits.join(', ')}

**Story Context:**
${JSON.stringify(options.storyContext, null, 2)}

**Existing Characters to Consider:**
${options.existingCharacters.map(char => `- ${char.name}: ${char.role}`).join('\n')}

**Instructions:**
1. Create a unique character that fits seamlessly into the existing story world
2. Ensure the character has distinct voice patterns and speech characteristics
3. Develop relationships and potential conflicts with existing characters
4. Include specific dialogue examples that showcase their voice
5. Provide detailed voice pattern analysis for consistency tracking

**Required Output Format:**
{
  "character": {
    "name": "Character Name",
    "role": "their role in the story",
    "personality": "detailed personality description",
    "background": "character background and history",
    "motivations": "primary motivations and goals",
    "relationships": "relationships with existing characters",
    "voicePattern": {
      "speechPatterns": ["pattern1", "pattern2"],
      "vocabularyStyle": "description of vocabulary choices",
      "tonalCharacteristics": "tone and emotional patterns",
      "dialogueExamples": ["example1", "example2"],
      "consistency_markers": ["marker1", "marker2"]
    }
  }
}
    `.trim()
  }

  private buildVoiceAnalysisPrompt(dialogue: string, storedPattern: VoicePattern): string {
    return `
You are an expert in character voice consistency analysis. Analyze the following dialogue against the established voice pattern:

**Character Voice Pattern:**
- Speech Patterns: ${storedPattern.speechPatterns.join(', ')}
- Vocabulary Style: ${storedPattern.vocabularyStyle}
- Tonal Characteristics: ${storedPattern.tonalCharacteristics}
- Consistency Markers: ${storedPattern.consistency_markers.join(', ')}

**Previous Dialogue Examples:**
${storedPattern.dialogueExamples.map(ex => `"${ex}"`).join('\n')}

**New Dialogue to Analyze:**
"${dialogue}"

**Analysis Requirements:**
1. Compare the new dialogue against established patterns
2. Identify any deviations from the character's voice
3. Calculate a consistency score (0-100)
4. Provide specific suggestions for improvement if needed
5. Update the voice pattern if the dialogue is consistent and adds value

**Required Output Format:**
{
  "isConsistent": boolean,
  "consistencyScore": number,
  "deviations": ["deviation1", "deviation2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "updatedPattern": {
    "characterName": "${storedPattern.characterName}",
    "speechPatterns": ["updated patterns"],
    "vocabularyStyle": "updated style",
    "tonalCharacteristics": "updated characteristics",
    "dialogueExamples": ["updated examples"],
    "consistency_markers": ["updated markers"]
  }
}
    `.trim()
  }

  private async storeVoicePattern(character: { name?: string; storyId?: string; voicePattern?: VoicePattern; characterName?: string; [key: string]: unknown }): Promise<void> {
    try {
      const voicePattern = character.voicePattern || character

      const { error } = await this.supabase
        .from('character_voice_patterns')
        .upsert({
          character_name: character.name || voicePattern.characterName,
          story_id: character.storyId || 'default',
          speech_patterns: voicePattern.speechPatterns || [],
          vocabulary_style: voicePattern.vocabularyStyle || '',
          tonal_characteristics: voicePattern.tonalCharacteristics || '',
          dialogue_examples: voicePattern.dialogueExamples || [],
          consistency_markers: voicePattern.consistency_markers || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'character_name,story_id'
        })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Failed to store voice pattern:', error)
      throw new Error('Failed to store character voice pattern')
    }
  }

  private async getVoicePattern(characterName: string): Promise<VoicePattern | null> {
    try {
      const { data, error } = await this.supabase
        .from('character_voice_patterns')
        .select('*')
        .eq('character_name', characterName)
        .single() as { data: {
          character_name: string
          speech_patterns: string[]
          vocabulary_style: string
          tonal_characteristics: string
          dialogue_examples: string[]
          consistency_markers: string[]
        } | null, error: Error | null }

      if (error && (error as { code?: string }).code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      if (!data) {
        return null
      }

      return {
        characterName: data.character_name,
        speechPatterns: data.speech_patterns || [],
        vocabularyStyle: data.vocabulary_style || '',
        tonalCharacteristics: data.tonal_characteristics || '',
        dialogueExamples: data.dialogue_examples || [],
        consistency_markers: data.consistency_markers || []
      }
    } catch (error) {
      console.error('Failed to get voice pattern:', error)
      return null
    }
  }

  async getCharactersByStory(storyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('character_voice_patterns')
        .select('character_name, vocabulary_style, tonal_characteristics')
        .eq('story_id', storyId)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to get characters by story:', error)
      throw new Error('Failed to retrieve story characters')
    }
  }

  async deleteCharacterVoicePattern(characterName: string, storyId: string) {
    try {
      const { error } = await this.supabase
        .from('character_voice_patterns')
        .delete()
        .eq('character_name', characterName)
        .eq('story_id', storyId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to delete character voice pattern:', error)
      throw new Error('Failed to delete character voice pattern')
    }
  }
}

// Export singleton instance
export const characterManager = new CharacterManager()