/**
 * AI character generation types
 */

import type { StoryGenerationRequest } from './ai-story-generation'

export interface Character {
  id: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'mentor' | 'ally' | 'neutral'
  age?: number
  description: string
  personality: {
    traits: string[]
    motivations: string[]
    fears: string[]
    goals: string[]
  }
  background: {
    origin: string
    education?: string
    occupation?: string
    familyStatus?: string
    keyExperiences: string[]
  }
  appearance: {
    height?: string
    build?: string
    hairColor?: string
    eyeColor?: string
    distinctiveFeatures: string[]
  }
  relationships: Array<{
    characterId: string
    relationshipType: string
    description: string
  }>
  skills: string[]
  equipment?: string[]
  arc?: {
    startingState: string
    characterDevelopment: string[]
    endingState: string
  }
}

export interface CharacterGenerationRequest extends StoryGenerationRequest {
  characterRole: Character['role']
  existingCharacters?: Character[]
  storyContext: string
}

export interface WorldBuilding {
  setting: {
    name: string
    type: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'post-apocalyptic'
    timeframe: string
    geography: {
      climate: string
      terrain: string
      notableLocations: Array<{
        name: string
        description: string
        significance: string
      }>
    }
    culture: {
      government: string
      economy: string
      religion: string[]
      traditions: string[]
      language: string
    }
    technology: {
      level: string
      notableInventions: string[]
      restrictions?: string[]
    }
    magic?: {
      system: string
      rules: string[]
      limitations: string[]
      practitioners: string[]
    }
  }
  history: {
    ancientEvents: string[]
    recentEvents: string[]
    ongoingConflicts: string[]
  }
  threats: {
    environmental: string[]
    political: string[]
    supernatural?: string[]
  }
}