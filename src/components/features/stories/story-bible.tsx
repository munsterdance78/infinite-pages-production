'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronRight, Star, MapPin, Users, BookOpen, Palette, Globe } from 'lucide-react'

interface StoryBibleProps {
  storyId: string
}

interface FactData {
  characters: any[]
  character_voices: any[]
  locations: any[]
  plot_events: any[]
  themes: any[]
  world_states: any[]
}

export default function StoryBible({ storyId }: StoryBibleProps) {
  const [facts, setFacts] = useState<FactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchFacts = async () => {
      try {
        const response = await fetch(`/api/stories/${storyId}/facts`)
        if (!response.ok) {
          throw new Error('Failed to fetch story facts')
        }
        const data = await response.json()
        setFacts(data.facts)
      } catch (err) {
        console.error('Error fetching facts:', err)
        setError(err instanceof Error ? err.message : 'Failed to load story facts')
      } finally {
        setLoading(false)
      }
    }

    fetchFacts()
  }, [storyId])

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedCards(newExpanded)
  }

  const renderConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null
    
    const getConfidenceColor = (conf: number) => {
      if (conf >= 0.8) return 'bg-green-500/20 text-green-300 border-green-500/30'
      if (conf >= 0.6) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      return 'bg-red-500/20 text-red-300 border-red-500/30'
    }

    return (
      <Badge 
        variant="outline" 
        className={`${getConfidenceColor(confidence)} text-xs`}
      >
        <Star className="h-3 w-3 mr-1" />
        {Math.round(confidence * 100)}%
      </Badge>
    )
  }

  const renderGenreMetadata = (metadata: any) => {
    if (!metadata || Object.keys(metadata).length === 0) return null

    return (
      <div className="mt-3 pt-3 border-t border-white/20">
        <div className="text-xs text-white/70 mb-2">Genre Metadata:</div>
        <div className="text-xs text-white/60">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-white/80">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4 bg-white/10" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-6">
          <div className="text-red-300 text-center">
            <h3 className="font-semibold mb-2">Error Loading Story Bible</h3>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!facts) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6">
          <div className="text-white/70 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">No Story Bible Data</h3>
            <p className="text-sm">Generate some chapters to see story facts here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalFacts = Object.values(facts).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Story Bible</h2>
        <p className="text-white/70">
          {totalFacts} facts across {Object.keys(facts).length} categories
        </p>
      </div>

      {/* Victorian-themed Tabs */}
      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-white/5 border border-white/20 rounded-lg p-1">
          <TabsTrigger 
            value="characters" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-500 data-[state=active]:text-amber-300 border border-transparent transition-all"
          >
            <Users className="h-4 w-4 mr-2" />
            Characters ({facts.characters.length})
          </TabsTrigger>
          <TabsTrigger 
            value="voices" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-500 data-[state=active]:text-amber-300 border border-transparent transition-all"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Voices ({facts.character_voices.length})
          </TabsTrigger>
          <TabsTrigger 
            value="locations" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-500 data-[state=active]:text-amber-300 border border-transparent transition-all"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Locations ({facts.locations.length})
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-500 data-[state=active]:text-amber-300 border border-transparent transition-all"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Events ({facts.plot_events.length})
          </TabsTrigger>
          <TabsTrigger 
            value="themes" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-500 data-[state=active]:text-amber-300 border border-transparent transition-all"
          >
            <Palette className="h-4 w-4 mr-2" />
            Themes ({facts.themes.length})
          </TabsTrigger>
          <TabsTrigger 
            value="world" 
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-500 data-[state=active]:text-amber-300 border border-transparent transition-all"
          >
            <Globe className="h-4 w-4 mr-2" />
            World ({facts.world_states.length})
          </TabsTrigger>
        </TabsList>

        {/* Characters Tab */}
        <TabsContent value="characters" className="space-y-4">
          {facts.characters.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center text-white/70">
                No character facts found. Generate chapters to extract character information.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {facts.characters.map((character, index) => (
                <Card 
                  key={character.id || index} 
                  className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif text-white">
                        {character.character_name}
                      </CardTitle>
                      {renderConfidenceBadge(character.confidence)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {character.physical_description && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Physical Description</div>
                        <div className="text-sm text-white/70 line-clamp-3">
                          {character.physical_description}
                        </div>
                      </div>
                    )}
                    
                    {character.personality_traits && character.personality_traits.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Personality</div>
                        <div className="flex flex-wrap gap-1">
                          {character.personality_traits.slice(0, 3).map((trait: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs bg-white/10 border-white/30 text-white/80">
                              {trait}
                            </Badge>
                          ))}
                          {character.personality_traits.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-white/10 border-white/30 text-white/60">
                              +{character.personality_traits.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {character.goals_shortterm && character.goals_shortterm.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Short-term Goals</div>
                        <div className="text-sm text-white/70">
                          {character.goals_shortterm.slice(0, 2).map((goal: string, i: number) => (
                            <div key={i} className="mb-1">• {goal}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {renderGenreMetadata(character.genre_metadata)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Character Voices Tab */}
        <TabsContent value="voices" className="space-y-4">
          {facts.character_voices.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center text-white/70">
                No character voice patterns found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {facts.character_voices.map((voice, index) => (
                <Card 
                  key={voice.id || index} 
                  className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-serif text-white">
                      {voice.character_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {voice.vocabulary_style && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Vocabulary Style</div>
                        <div className="text-sm text-white/70">{voice.vocabulary_style}</div>
                      </div>
                    )}
                    
                    {voice.tonal_characteristics && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Tonal Characteristics</div>
                        <div className="text-sm text-white/70">{voice.tonal_characteristics}</div>
                      </div>
                    )}

                    {voice.speech_patterns && voice.speech_patterns.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Speech Patterns</div>
                        <div className="flex flex-wrap gap-1">
                          {voice.speech_patterns.slice(0, 4).map((pattern: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs bg-white/10 border-white/30 text-white/80">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          {facts.locations.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center text-white/70">
                No location facts found. Generate chapters to extract location information.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {facts.locations.map((location, index) => (
                <Card 
                  key={location.id || index} 
                  className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif text-white">
                        {location.location_name}
                      </CardTitle>
                      {renderConfidenceBadge(location.confidence)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {location.physical_layout && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Layout</div>
                        <div className="text-sm text-white/70 line-clamp-3">
                          {location.physical_layout}
                        </div>
                      </div>
                    )}
                    
                    {location.atmosphere_mood && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Atmosphere</div>
                        <div className="text-sm text-white/70">{location.atmosphere_mood}</div>
                      </div>
                    )}

                    {location.danger_level && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Danger Level</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            location.danger_level.toLowerCase().includes('high') 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : location.danger_level.toLowerCase().includes('medium')
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              : 'bg-green-500/20 text-green-300 border-green-500/30'
                          }`}
                        >
                          {location.danger_level}
                        </Badge>
                      </div>
                    )}

                    {renderGenreMetadata(location.genre_metadata)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Plot Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {facts.plot_events.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center text-white/70">
                No plot events found. Generate chapters to extract plot information.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {facts.plot_events.map((event, index) => (
                <Card 
                  key={event.id || index} 
                  className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif text-white">
                        {event.event_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {event.chapter_position && (
                          <Badge variant="outline" className="text-xs bg-white/10 border-white/30 text-white/80">
                            Chapter {event.chapter_position}
                          </Badge>
                        )}
                        {renderConfidenceBadge(event.confidence)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-white/80 mb-1">Description</div>
                      <div className="text-sm text-white/70">{event.event_description}</div>
                    </div>
                    
                    {event.significance && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Significance</div>
                        <div className="text-sm text-white/70">{event.significance}</div>
                      </div>
                    )}

                    {event.tension_level && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Tension Level</div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            event.tension_level.toLowerCase().includes('high') || event.tension_level.toLowerCase().includes('climax')
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : event.tension_level.toLowerCase().includes('medium')
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              : 'bg-green-500/20 text-green-300 border-green-500/30'
                          }`}
                        >
                          {event.tension_level}
                        </Badge>
                      </div>
                    )}

                    {renderGenreMetadata(event.genre_metadata)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-4">
          {facts.themes.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center text-white/70">
                No theme facts found. Generate chapters to extract thematic information.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {facts.themes.map((theme, index) => (
                <Card 
                  key={theme.id || index} 
                  className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif text-white">
                        {theme.theme_name}
                      </CardTitle>
                      {renderConfidenceBadge(theme.confidence)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {theme.motif_description && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Motif Description</div>
                        <div className="text-sm text-white/70">{theme.motif_description}</div>
                      </div>
                    )}
                    
                    {theme.message_meaning && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Message & Meaning</div>
                        <div className="text-sm text-white/70">{theme.message_meaning}</div>
                      </div>
                    )}

                    {theme.narrative_voice && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Narrative Voice</div>
                        <div className="text-sm text-white/70">{theme.narrative_voice}</div>
                      </div>
                    )}

                    {renderGenreMetadata(theme.genre_metadata)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* World States Tab */}
        <TabsContent value="world" className="space-y-4">
          {facts.world_states.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center text-white/70">
                No world state changes found. Generate chapters to track world evolution.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {facts.world_states.map((worldState, index) => (
                <Card 
                  key={worldState.id || index} 
                  className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/15 transition-all"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif text-white">
                        {worldState.change_type}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {worldState.book_number && (
                          <Badge variant="outline" className="text-xs bg-white/10 border-white/30 text-white/80">
                            Book {worldState.book_number}
                          </Badge>
                        )}
                        {worldState.scope && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              worldState.scope === 'global'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : worldState.scope === 'regional'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-green-500/20 text-green-300 border-green-500/30'
                            }`}
                          >
                            {worldState.scope}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-white/80 mb-1">Description</div>
                      <div className="text-sm text-white/70">{worldState.description}</div>
                    </div>
                    
                    {worldState.consequences && worldState.consequences.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-white/80 mb-1">Consequences</div>
                        <div className="text-sm text-white/70">
                          {worldState.consequences.map((consequence: string, i: number) => (
                            <div key={i} className="mb-1">• {consequence}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 text-xs text-white/60">
                      {worldState.affects_future_books && (
                        <span>Affects future books</span>
                      )}
                      {worldState.reversible && (
                        <span>Reversible</span>
                      )}
                      {worldState.duration && (
                        <span>Duration: {worldState.duration}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
