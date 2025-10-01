# Complete Session Handoff - Infinite Pages V3
# Sessions 1 & 2: 2025-09-30

---

## Executive Summary

**Total Development Time:** ~8 hours across 2 sessions
**Status:** Complete architecture built, partially tested
**Major Achievement:** Closed-loop fact system + story planning system

### What Actually Works (Tested)
✅ **Session 1:**
- Story generation - Created test story successfully
- Chapter 1 generation - Generated with fact extraction
- Basic fact extraction - 13 facts extracted to `story_facts` table
- Chapter 2 generation - Used Chapter 1 facts for consistency
- Consistency verification - Chapter 2 maintained character names, locations, magic rules

**Proof the loop worked:**
- Kael appeared by name in Chapter 2 (from Chapter 1 extraction)
- Crystal Kingdom referenced consistently
- "Crystals are frozen music" maintained as world rule

✅ **Session 2:**
- Database migrations executed (6 specialized fact tables + outline table)
- Code updated for 6-table extraction (not tested)
- Story outline generation implemented (not tested)
- Token limits and logging added (not tested)
- Similarity detection for duplicate prevention (not tested)

### What's Built But Untested
⚠️ 6-Table Fact Extraction - Code rewritten, not tested
⚠️ Similarity Detection - Logic implemented, not tested
⚠️ Outline Generation - Comprehensive planner built, not tested
⚠️ Outline → Chapter Integration - Wired up, not tested
⚠️ Token Limits - Added to all methods, not tested

---

## Architecture Overview

### The Closed-Loop System

**Before (One-Way Pipeline):**
```
Content → Extract Facts → Store in Database
```
Problem: Facts extracted but never used in future generation

**After (Closed Loop):**
```
Story Premise
    ↓
Generate Outline (5 chapters) ← Use existing facts from 6 tables
    ↓
For each chapter:
    ↓
Fetch Outline + Facts (last 3 chapters only)
    ↓
Generate Chapter (following plan + maintaining consistency)
    ↓
Extract to 6 Specialized Tables (with similarity detection)
    ↓
Facts inform next outline generation ←──┘
```

**Key Improvements:**
- ✅ Purposeful progression (outline prevents wandering)
- ✅ Detailed fact tracking (23 character fields vs 5)
- ✅ Intelligent deduplication (>80% similarity skipped)
- ✅ Cost controls (token limits, retrieval limits)
- ✅ Story structure awareness (three-act, character arcs)
- ✅ Mystery management (planned reveals)
- ✅ Pacing control (varied tension levels)

### Token Cost Analysis

**Session 1 System (1 generic table):**
- Chapter generation: ~$0.008
- Fact extraction: ~$0.004
- Total per chapter: ~$0.012

**Session 2 System (6 specialized tables + outlines):**
- Chapter generation: ~$0.015 (4000 token limit)
- Fact extraction: ~$0.120 (8000 tokens, 6 categories)
- Outline generation (amortized): ~$0.030 (generates 5 at once)
- **Total per chapter: ~$0.165**

**Cost increase justified by:**
- 6x more detailed fact extraction
- Story planning prevents aimless generation
- Similarity detection reduces redundant extractions
- Better consistency = fewer rewrites

**30-chapter novel estimate:**
- Generation: ~$5.00
- Fact extraction: ~$3.60
- Outline generation: ~$0.90
- **Total: ~$9.50**

**Mitigation strategies:**
- Token limits prevent overruns
- Fact retrieval limited to last 3 chapters (not all)
- Similarity detection skips duplicates
- Outline generates 5 chapters at once (batch efficiency)

---

## Database Schema Changes

### Session 1: Foundation Tables

**Created via `add-missing-tables.sql`:**
- `subscription_logs` - Subscription audit trail
- `character_voice_patterns` - Character dialogue consistency
- `infinite_pages_cache` - AI response caching (80% cost savings)
- `claude_analytics` - AI usage tracking
- `reader_paths` - Reader journey tracking
- `choice_analytics` - Choice-based story analytics
- `series` - Multi-book series management
- `series_facts` - Series continuity data
- `character_arcs` - Character development tracking
- `world_state_changes` - World evolution tracking
- `plot_threads` - Multi-book plot management
- `foreshadowing_elements` - Foreshadowing tracking
- `error_reports` - Error monitoring

**Created via `002-story-facts.sql`:**
- `story_facts` - Generic fact storage (DEPRECATED in Session 2)
  - Columns: `fact_type`, `entity_name`, `fact_data` (JSONB), `confidence`
  - Status: ✅ Tested and working in Session 1
  - Future: Will be replaced by 6 specialized tables

### Session 2: Specialized Fact Tables

**Migration 003: `003-fact-tables-restructure.sql`**
Status: ✅ Executed in production Supabase
Breaking Change: **Yes** - old `story_facts` data abandoned (no migration)

**1. `character_facts` (23 fields)**
- **Physical:** `description`, `age`, `appearance`
- **Personality:** `personality_traits`, `speech_patterns`, `dialogue_examples`
- **Relationships:** `relationships` (JSONB with dynamics and history)
- **Goals:** `short_term_goals`, `long_term_goals`
- **State:** `emotional_state`, `internal_conflicts`, `character_arc_notes`
- **Skills:** `skills_abilities` (array)
- **Metadata:** `confidence`, `extraction_cost_usd`, `extraction_model`

**2. `location_facts` (14 fields)**
- **Physical:** `layout_description`, `atmosphere_mood`, `key_features`
- **Sensory:** `sensory_details` (JSONB: sounds, smells, temperature, lighting)
- **Context:** `history_significance`, `controlled_by`, `connected_locations`
- **Emotional:** `character_interactions`, `emotional_associations`
- **Safety:** `danger_level`

**3. `plot_event_facts` (17 fields)**
- **Event:** `event_description`, `chapter_position`, `characters_involved`
- **Impact:** `significance`, `immediate_consequences`, `long_term_consequences`
- **Structure:** `foreshadowing`, `payoff_for_setup`, `unresolved_threads`
- **Reader:** `emotional_impact`, `tension_level`, `pacing_notes`, `stakes`

**4. `world_rule_facts` (11 fields)**
- **Definition:** `rule_description`, `rule_category`, `mechanics`
- **Constraints:** `costs_limitations`, `exceptions`
- **Implications:** `how_rule_affects_world`
- **Consistency:** `consistency_notes` (avoid contradictions)

**5. `timeline_facts` (11 fields)**
- **Timeline:** `event_name`, `chronological_order`, `time_reference`
- **Structure:** `is_flashback`, `parallel_storyline`
- **Mystery:** `reader_knowledge_gap`, `mystery_elements`

**6. `theme_facts` (10 fields)**
- **Theme:** `motif_description`, `symbolic_elements`, `related_conflicts`
- **Message:** `message_meaning`
- **Style:** `narrative_voice`, `prose_style_notes`

**Common to all tables:**
- RLS policies for user isolation
- Indexes on `story_id`, `chapter_id`, name fields
- Foreign keys with CASCADE delete
- UNIQUE constraints on `(story_id, name)` where applicable
- Confidence scores and extraction cost tracking
- Timestamps (`created_at`, `updated_at`)

**Migration 004: `004-story-outline-system.sql`**
Status: ✅ Executed in production Supabase

**`story_outline` table:**
- **Planning:** `planned_purpose`, `chapter_type`, `word_count_target`
- **Characters/World:** `new_characters_to_introduce` (JSONB), `new_locations_to_introduce`
- **Conflict:** `conflicts_to_escalate`, `conflicts_to_resolve`, `stakes_level` (1-10)
- **Mystery:** `mysteries_to_deepen`, `mysteries_to_reveal`
- **Structure:** `foreshadowing_to_plant`, `callbacks_to_earlier_chapters`, `key_events_planned`
- **Emotion/Pacing:** `emotional_target`, `pacing_target`, `tone_guidance`
- **Helper function:** `get_next_chapter_plan()` - Returns context for planning

---

## Code Changes (Session 1)

### 1. Authentication Middleware Fix
**File:** `src/lib/auth/middleware.ts`
**Issue:** Code queried `user_profiles` table, actual table is `profiles`
**Fix:** Changed table name in `requireAdminAuth()` and `requireCreatorAuth()`
**Status:** ✅ Tested and working

### 2. Dual Auth Support
**File:** `src/lib/auth/middleware.ts`
**Added:** Support for Bearer token + cookie authentication

```typescript
// Header-based auth (for API tests)
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.substring(7)
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}
// Cookie-based auth (for browser)
else {
  supabase = createRouteHandlerClient<Database>({ cookies })
}
```

### 3. Claude Service - Fact Extraction (Session 1)
**File:** `src/lib/claude/service.ts`

**Method: `extractChapterFacts()` (lines 885-1117)**
- Extracts structured facts from chapter content
- Builds detailed prompt requesting JSON with categories:
  - `characters[]` - name, traits, description, relationships, goals, voicePattern
  - `locations[]` - name, description, atmosphere, features
  - `plotEvents[]` - event, significance, consequences, involvedCharacters
  - `worldRules[]` - rule, category, implications
- Robust JSON parsing with fallback handling
- Transforms parsed data into flat array of fact objects
- Returns: `{ facts, extractionCost, tokensUsed, model }`

**Method: `getStoredFactsForStory()` (lines 1122-1154)**
- Queries `story_facts` table with proper error handling
- Returns empty array on error (doesn't throw)
- Orders by `extracted_at DESC`

**Method: `saveExtractedFacts()` (lines 1159-1211)**
- Loops through facts array
- Uses `upsert()` with `onConflict` to handle duplicates
- Logs errors but doesn't throw (non-blocking)
- Returns `{ saved, failed }` count object

### 4. Chapter Generation API
**File:** `app/api/stories/[storyId]/chapters/route.ts`

**POST /api/stories/[storyId]/chapters**
- Authenticates user with `requireAuth`
- Validates user owns the story
- Validates chapter number (1-1000)
- Checks for duplicate chapters
- Fetches story and previous chapters from database
- Calls `claudeService.generateChapter()` with full context
- Parses chapter JSON response with fallback handling
- Saves chapter to `chapters` table with metadata
- Updates story `word_count` and `chapter_count`
- Updates user `tokens_remaining` and stats
- Logs to `generation_logs` table
- **Background fact extraction** - fires `extractChapterFacts()` without blocking response
- Returns created chapter with token usage

**GET /api/stories/[storyId]/chapters**
- Fetches all chapters for a story
- Validates ownership
- Returns chapters in order

---

## Code Changes (Session 2)

### 1. Model Name Update (4 files)
**Files:**
- `src/lib/constants.ts`
- `src/lib/utils/constants.ts`
- `src/lib/ai/claude-client.ts`
- `src/lib/claude/service.ts`

**Issue:** Used deprecated `claude-3-sonnet-20240229`
**Fix:** Updated to `claude-sonnet-4-20250514`
**Status:** ✅ Tested and working

### 2. Chapter INSERT Fix
**File:** `app/api/stories/[storyId]/chapters/route.ts`
**Issue:** Tried to insert into non-existent columns (`metadata`, `prompt_type`, `summary`)
**Fix:** Reduced INSERT to only: `story_id`, `chapter_number`, `content`
**Status:** ✅ Tested and working

### 3. Fact Extraction Rewrite (6 Tables)
**File:** `src/lib/claude/service.ts`
**Method:** `extractChapterFacts()` - Complete rewrite

**Changes:**
- Comprehensive prompt requesting all 6 fact categories
- Detailed field-by-field extraction:
  - 23 character fields (dialogue examples, internal conflicts, arc notes)
  - 14 location fields (sensory details, emotional associations)
  - 17 plot event fields (tension level, stakes, pacing notes)
  - 11 world rule fields (consistency notes)
  - 11 timeline fields (mystery elements, reader knowledge gap)
  - 10 theme fields (narrative voice, prose style)
- Saves to 6 specialized tables instead of 1 generic
- **Token limit:** 8000 max (~6,000 words)
- **Returns:** `{ characters, locations, plot_events, world_rules, timeline, themes, extractionCost, tokensUsed, model }`

**Status:** ⚠️ Code complete, untested

### 4. Similarity Detection
**File:** `src/lib/claude/service.ts`
**Function:** `calculateFactSimilarity(existingFactData, newFactData)`

**Logic:**
- Compares JSON objects field by field
- Excludes metadata: `extraction_cost_usd`, `extraction_model`, `confidence`, timestamps
- Handles arrays (order-independent comparison)
- Handles nested objects (deep comparison)
- Returns percentage match (0-100)

**Applied to all 6 table saves:**
- >80% match = skip save (duplicate)
- <80% match = update with new details
- No match = save new fact

**Logging:**
```
[Fact Extraction] Skipped duplicate: Kael (87% match)
[Fact Extraction] Updated with new details: Crystal Kingdom (65% match)
```

**Returns enhanced metrics:**
- `duplicatesSkipped` - Facts skipped due to >80% similarity
- `updatedWithNewDetails` - Facts updated with <80% similarity

**Status:** ⚠️ Code complete, untested

### 5. Story Outline Generation
**File:** `src/lib/claude/service.ts`
**Method:** `generateStoryOutline()`

**10 Advanced Features:**

1. **Story Structure Awareness**
   - Calculates position in three-act/five-act/hero-journey
   - Maps chapters to acts
   - Identifies missing story beats

2. **Character Arc Analysis**
   - Tracks character progression
   - Identifies development needs
   - Suggests next growth opportunities

3. **Conflict Layering**
   - Extracts active conflicts from events
   - Tracks conflict intensity
   - Plans escalation and resolution timing

4. **Mystery Management**
   - Catalogs active mysteries
   - Estimates optimal reveal timing
   - Tracks clue distribution

5. **Pacing Intelligence**
   - Varies rhythm (slow/moderate/fast/climax)
   - Plans tension sequences
   - Avoids monotonous pacing

6. **Thematic Consistency**
   - Reinforces themes through events
   - Tracks symbolic elements
   - Ensures message coherence

7. **Reader Engagement**
   - Plans hooks and reveals
   - Times "earned moments"
   - Manages payoff satisfaction

8. **Worldbuilding Progression**
   - Gradual detail introduction
   - Avoids info dumps
   - Tracks rule establishment

9. **Ensemble Management**
   - Distributes character focus
   - Prevents character neglect
   - Plans introduction timing

10. **Setup/Payoff Tracking**
    - Foreshadowing with planned payoff chapters
    - Callbacks to earlier chapters
    - Ensures satisfying arcs

**Helper Methods:**
- `calculateStructurePosition()` - Maps chapters to act structure
- `analyzeCharacterArcs()` - Tracks character progression
- `extractActiveConflicts()` - Identifies unresolved threads
- `extractActiveMysteries()` - Catalogs mysteries with reveal timing
- `validateOutlines()` - Quality checks (stakes escalation, pacing variety)

**Parameters:**
- `story` - Story object with premise, genre, target chapter count
- `currentChapterNumber` - Starting point for outline
- `chaptersToOutline` - Number to plan (max 5, validated)
- `allExistingFacts` - From all 6 fact tables
- `storyArcTarget` - 'three-act' | 'five-act' | 'hero-journey' | 'custom'

**Token limit:** 6000 max (sufficient for 5 chapter outlines)

**Returns:**
```javascript
{
  outlines: [...],
  outlinesGenerated: 5,
  fromChapter: 3,
  toChapter: 7,
  structuralPosition: "Act 1: Setup, 20%",
  stakesRange: "3 → 7",
  pacingDistribution: { slow: 2, moderate: 2, fast: 1 },
  newCharactersPlanned: 3,
  mysteriesActive: 5,
  validationWarnings: [],
  cost: 0.15,
  tokensUsed: 5200
}
```

**Status:** ⚠️ Code complete, untested

### 6. Outline Integration into Chapter Generation
**Files:**
- `app/api/stories/[storyId]/chapters/route.ts`
- `src/lib/claude/service.ts`

**Flow:**
1. API route checks for outline before generation
2. If no outline exists:
   - Fetch all facts from 6 specialized tables
   - Call `generateStoryOutline()` for next 5 chapters
   - Save outlines to `story_outline` table with UPSERT
3. Fetch outline for requested chapter
4. Pass outline + facts (last 3 chapters only) to `generateChapter()`

**Prompt injection:**
```
## CHAPTER OUTLINE - FOLLOW THIS PLAN

Purpose: {planned_purpose}
Emotional Target: {emotional_target}
Pacing: {pacing_target}
Tone: {tone_guidance}
Stakes Level: {stakes_level}/10

Key Events to Include:
{map key_events_planned}

New Characters to Introduce:
{map new_characters_to_introduce with context}

Conflicts to Escalate:
{map conflicts_to_escalate}

Mysteries to Deepen:
{map mysteries_to_deepen}

Foreshadowing to Plant:
{map foreshadowing_to_plant with payoff_chapter}

Callbacks to Earlier Chapters:
{map callbacks_to_earlier_chapters}

YOU MUST incorporate these planned elements while maintaining consistency with established facts.
```

**Token limit:** 4000 max (~3,000 word chapters)
**Fact retrieval optimization:**
```sql
-- Only fetch facts from last 3 chapters
SELECT id FROM chapters
WHERE story_id = ?
ORDER BY chapter_number DESC
LIMIT 3
```

**Status:** ⚠️ Code complete, untested

### 7. Token Usage Logging
**All Claude API calls now log:**
```
[Token Usage] {methodName}: input={x}, output={y}, cost=$X.XXXX
```

**Limits applied:**
- `extractChapterFacts`: 8000 tokens
- `generateStoryOutline`: 6000 tokens (max 5 chapters validated)
- `generateChapter`: 4000 tokens

**Status:** ⚠️ Code complete, untested

---

## Testing Sequence (Session 2)

### Prerequisites
- ✅ Dev server running (`npm run dev`)
- ✅ Fresh auth token (`.\test-login.ps1`)
- ✅ Migrations executed in Supabase
- ✅ `ANTHROPIC_API_KEY` in `.env.local`
- ✅ Development bypass header: `x-development-bypass: true`

### Phase 1: Verify Tables Exist (5 min)
```sql
-- In Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'character_facts',
  'location_facts',
  'plot_event_facts',
  'world_rule_facts',
  'timeline_facts',
  'theme_facts',
  'story_outline'
);
```
**Expected:** 7 rows returned

### Phase 2: Create Fresh Test Story (3 min)
```powershell
$token = Get-Content test-token.txt -Raw | ForEach-Object {$_.Trim()}
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "x-development-bypass" = "true"
}
$body = @{
    title = "Test Story - 6 Tables"
    genre = "Fantasy"
    premise = "A scholar discovers an ancient crystal kingdom and must restore it before dark forces claim its power."
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/stories" -Method POST -Headers $headers -Body $body
$storyId = $response.story.id
$storyId | Out-File -FilePath test-story-id.txt -NoNewline
Write-Host "Story ID: $storyId" -ForegroundColor Green
```

### Phase 3: Generate Chapter 1 (3-5 min)
```powershell
$chapterBody = @{
    chapterNumber = 1
    chapterPlan = @{
        purpose = "Introduce protagonist and discover the crystal gateway"
        keyEvents = @("Scholar finds crystal cavern", "Ancient symbols glow", "Portal opens")
    }
} | ConvertTo-Json

Write-Host "Generating Chapter 1..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/stories/$storyId/chapters" -Method POST -Headers $headers -Body $chapterBody
Write-Host "Chapter 1 generated!" -ForegroundColor Green
```

**Watch dev server logs for:**
```
[Chapter Generation] No outline exists, generating for chapters 1-5
[Outline Generation] Generated 5 outlines, cost: $0.15
[Chapter Generation] Using outline for chapter 1
[Token Usage] generateChapter: input=3200, output=3800, cost=$0.0666
[Fact Extraction] Starting extraction for chapter...
[Token Usage] extractChapterFacts: input=2500, output=7200, cost=$0.1155
[Fact Extraction] Saved: characters=3, locations=2, events=4, rules=2, timeline=3, themes=1
[Fact Extraction] Duplicates skipped: 0, Updated with new details: 0
```

### Phase 4: Verify Fact Extraction (5 min)
```sql
-- Characters
SELECT character_name, personality_traits, dialogue_examples
FROM character_facts
WHERE story_id = 'YOUR_STORY_ID';

-- Locations
SELECT location_name, atmosphere_mood, sensory_details
FROM location_facts
WHERE story_id = 'YOUR_STORY_ID';

-- Plot Events
SELECT event_name, tension_level, pacing_notes, stakes
FROM plot_event_facts
WHERE story_id = 'YOUR_STORY_ID';

-- World Rules
SELECT rule_name, mechanics, consistency_notes
FROM world_rule_facts
WHERE story_id = 'YOUR_STORY_ID';

-- Timeline
SELECT event_name, chronological_order, mystery_elements
FROM timeline_facts
WHERE story_id = 'YOUR_STORY_ID';

-- Themes
SELECT theme_name, narrative_voice, prose_style_notes
FROM theme_facts
WHERE story_id = 'YOUR_STORY_ID';
```

**Success criteria:**
- ✅ Each table has at least 1 row
- ✅ JSONB fields populated with arrays/objects (not null)
- ✅ `dialogue_examples` contains actual quotes from chapter
- ✅ `sensory_details` has sounds/smells/temperature/lighting
- ✅ `emotional_impact` and `pacing_notes` are descriptive
- ✅ Confidence scores between 0.7-1.0

### Phase 5: Verify Outline Generation (5 min)
```sql
SELECT
  chapter_number,
  planned_purpose,
  emotional_target,
  pacing_target,
  stakes_level,
  chapter_type,
  new_characters_to_introduce,
  key_events_planned
FROM story_outline
WHERE story_id = 'YOUR_STORY_ID'
ORDER BY chapter_number;
```

**Success criteria:**
- ✅ 5 rows (chapters 1-5 outlined)
- ✅ `stakes_level` escalates (e.g., 3 → 4 → 6 → 7 → 8)
- ✅ `pacing_target` varies (not all "fast")
- ✅ `new_characters_to_introduce` is JSONB array with objects
- ✅ `key_events_planned` has specific events

### Phase 6: Generate Chapter 2 (3-5 min)
```powershell
$chapterBody = @{
    chapterNumber = 2
    chapterPlan = @{
        purpose = "Follow the outline's plan for chapter 2"
        keyEvents = @("Event from outline")
    }
} | ConvertTo-Json

Write-Host "Generating Chapter 2..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/stories/$storyId/chapters" -Method POST -Headers $headers -Body $chapterBody
Write-Host "Chapter 2 generated!" -ForegroundColor Green
```

**Watch dev server logs for:**
```
[Chapter Generation] Using existing outline for chapter 2
[Chapter Generation] Fetching facts from last 3 chapters
[Token Usage] generateChapter: input=4500, output=3600, cost=$0.0681
[Fact Extraction] Duplicates skipped: 5, Updated with new details: 2
```

### Phase 7: Verify Consistency & Outline Following (10 min)

**A) Check if Chapter 2 followed the outline:**
1. Go to Supabase → `story_outline` table
2. Find row where `chapter_number = 2`
3. Read `planned_purpose` and `key_events_planned`
4. Go to `chapters` table → find chapter 2 → read `content`
5. **Verify:** Does chapter content incorporate the planned events?

**B) Check if Chapter 2 used Chapter 1 facts:**
1. Go to `character_facts` → note character names from Chapter 1
2. Read Chapter 2 content
3. **Verify:** Do those characters appear by name in Chapter 2?

**C) Check similarity detection:**
1. Check `character_facts` for duplicate entries
2. Look at `duplicatesSkipped` in extraction logs
3. **Verify:** Same characters not saved twice with identical data

### Phase 8: Generate Chapter 3 (3-5 min)
```powershell
$chapterBody = @{
    chapterNumber = 3
    chapterPlan = @{
        purpose = "Continue story progression"
        keyEvents = @("Follow outline plan")
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/stories/$storyId/chapters" -Method POST -Headers $headers -Body $chapterBody
```

**Watch for:**
```
[Chapter Generation] Using existing outline for chapter 3
[Fact Extraction] Duplicates skipped: 8, Updated with new details: 3
```
Higher duplicate count = similarity detection working

---

## Known Issues & Risks

### High Risk (Could Block Testing)

**1. JSON Parsing Failures**
- Claude might return malformed JSON for complex 6-category extraction
- **Mitigation:** Fallback parsing implemented, but untested
- **Symptom:** `[Fact Extraction] Failed to parse response`

**2. Database Foreign Key Violations**
- If `chapter_id` doesn't exist when saving facts
- **Mitigation:** Facts save references valid `chapter_id` from generation
- **Symptom:** `foreign key constraint violation`

**3. Token Limit Truncation**
- 8000 token extraction might cut off mid-JSON
- **Mitigation:** Prompt prioritizes most important categories first
- **Symptom:** Incomplete fact extraction, only characters saved

**4. Outline Generation Timeout**
- Generating 5 chapter outlines with full fact context could exceed API timeout
- **Mitigation:** Fact context limited to last 3 chapters
- **Symptom:** API timeout error after 60+ seconds

### Medium Risk (Could Degrade Quality)

**1. Similarity Detection False Positives**
- Might skip legitimate updates if >80% threshold too aggressive
- **Symptom:** Character facts never update with new details

**2. Outline Not Followed**
- Chapter generation might ignore outline guidance
- **Symptom:** Generated chapter doesn't include planned events

**3. Fact Retrieval Performance**
- Querying 6 tables separately might be slow
- **Symptom:** Chapter generation takes >10 seconds before API call

### Low Risk (Minor Issues)

**1. Cost Overruns**
- Token limits might not be respected by API
- **Symptom:** Costs exceed $0.20/chapter

**2. RLS Policy Blocks**
- User might not have permission to read their own facts
- **Symptom:** Empty fact arrays despite successful extraction

**3. Duplicate Outlines**
- Multiple outline generations could create duplicate chapter plans
- **Symptom:** `story_outline` UNIQUE constraint violation

---

## Debugging Guide

### If Extraction Fails
**Symptom:** No facts saved to any of the 6 tables

**Check:**
1. Dev server logs for `[Fact Extraction]` errors
2. Supabase logs (Dashboard → Logs → API)
3. Did extraction API call succeed? Look for token usage log
4. Did JSON parsing fail? Look for "Failed to parse"

**Likely causes:**
- Claude returned non-JSON response
- All 6 table inserts failed (check Supabase RLS policies)
- `chapter_id` doesn't exist (foreign key violation)

**Fix:**
1. Check Claude response format in logs
2. Verify RLS policies allow INSERT for authenticated users
3. Ensure chapter saved successfully before extraction

### If Outline Generation Fails
**Symptom:** No rows in `story_outline` table

**Check:**
1. Dev server logs for `[Outline Generation]` errors
2. Did outline API call succeed? Look for token usage
3. Did validation fail? Look for `validationWarnings`

**Likely causes:**
- Prompt too long, exceeded token limit
- JSON parsing failed
- `story_id` doesn't exist (foreign key violation)

**Fix:**
1. Reduce fact context in outline prompt
2. Check Claude response format
3. Verify story exists in database

### If Chapter Generation Ignores Outline
**Symptom:** Chapter content doesn't include planned events

**Check:**
1. Is outline being passed to generation? Look for log: `[Chapter Generation] Using existing outline for chapter X`
2. Read the outline from database - is `planned_purpose` generic or specific?
3. Read the generated chapter - any mention of outline elements?

**Likely causes:**
- Outline fetch failed silently
- Prompt injection of outline not working
- Outline too vague for Claude to follow

**Fix:**
1. Add more detailed logging in chapter generation
2. Make outline more specific and prescriptive
3. Increase weight of outline vs facts in prompt

### If Similarity Detection Blocks All Updates
**Symptom:** `duplicatesSkipped` count very high, facts never update

**Check:**
1. Similarity threshold (currently 80%)
2. Are facts genuinely duplicates or legitimate updates?
3. Check `calculateFactSimilarity()` logic

**Fix:**
1. Lower threshold to 60-70%
2. Exclude more fields from comparison (e.g., `emotional_state`)
3. Add logging to show similarity percentage

### If Costs Exceed Estimates
**Symptom:** Token usage logs show >$0.20 per chapter

**Check:**
1. Actual token counts vs estimates
2. Are token limits being respected?
3. Is fact context including all chapters instead of last 3?

**Fix:**
1. Lower `max_tokens` parameters
2. Verify fact retrieval `LIMIT 3` clause
3. Reduce outline prompt verbosity

---

## Success Criteria

### Minimum Viable (Must Work)
- ✅ Story creation succeeds
- ✅ Chapter generation succeeds
- ✅ At least 1 fact saved to each of the 6 tables
- ✅ Outline generates for next 5 chapters
- ✅ Chapter 2 references Chapter 1 characters by name

### Full Success (System Working as Designed)
- ✅ All 6 fact tables populated with detailed data
- ✅ Dialogue examples include actual quotes
- ✅ Sensory details are JSONB with 4+ fields
- ✅ Outline includes specific planned events (not generic)
- ✅ Stakes escalate across outline (3→4→6→7→8)
- ✅ Pacing varies (slow/moderate/fast/climax distribution)
- ✅ Chapter 2 follows outline's `planned_purpose`
- ✅ Chapter 2 maintains consistency with Chapter 1 facts
- ✅ Similarity detection skips duplicates (5+ skipped by Chapter 3)
- ✅ Costs stay under $0.20/chapter
- ✅ Token usage logged for all API calls

### Excellence (Publication-Ready Quality)
- ✅ Character arcs progress across chapters
- ✅ New characters introduced at logical times (per outline)
- ✅ Mysteries deepen before reveals
- ✅ Foreshadowing planted and paid off
- ✅ Callbacks to earlier chapters create satisfaction
- ✅ Conflicts escalate meaningfully
- ✅ Tone consistency maintained
- ✅ No contradictions in world rules
- ✅ Timeline remains coherent (no continuity errors)

---

## Environment Setup

### Supabase Configuration
- **URL:** `https://tktntttemkbmnqkalkch.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdG50dHRlbWtibW5xa2Fsa2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjczNTAsImV4cCI6MjA3NDg0MzM1MH0.kbfMla_CIz6Ywzp_IGL-KdT6zpH2coqDGpJDTOENHMQ`
- **Service Role Key:** Available in `.env.local`

### Test User
- **Email:** `test@example.com`
- **Password:** `TestPassword123!`
- **Token saved in:** `test-token.txt`

### Development Server
- **URL:** `http://localhost:3001`
- **Port:** 3001 (not 3000)
- **Command:** `npm run dev`

### Environment Variables Required
```bash
# Required in .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://tktntttemkbmnqkalkch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://www.infinite-pages.com

# Optional:
NODE_ENV=development
```

---

## Quick Reference Commands

### Start Development Server
```powershell
npm run dev
```

### Get Auth Token (expires in 1 hour)
```powershell
.\test-login.ps1
```

### Test Story Creation
```powershell
$token = Get-Content test-token.txt -Raw | ForEach-Object {$_.Trim()}
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    title = "The Crystal Kingdom"
    genre = "fantasy"
    premise = "A young mage discovers a hidden kingdom made entirely of crystal."
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/stories" -Method POST -Headers $headers -Body $body
```

### Test Chapter Generation
```powershell
$storyId = Get-Content test-story-id.txt -Raw | ForEach-Object {$_.Trim()}
$body = @{
    chapterNumber = 1
    chapterPlan = @{
        purpose = "Introduce protagonist and discover the crystal gateway"
        keyEvents = @("Aria finds strange crystal", "Portal opens")
    }
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/stories/$storyId/chapters" -Method POST -Headers $headers -Body $body
```

### Check Extracted Facts (wait 30 seconds after chapter generation)
```sql
-- In Supabase SQL Editor
SELECT fact_type, entity_name, confidence, extraction_cost_usd
FROM story_facts
WHERE story_id = 'YOUR_STORY_ID'
ORDER BY extracted_at DESC;
```

### Check Server Logs
Look for:
```
[Fact Extraction] Story: ... - Saved: 8, Failed: 0, Cost: $0.003500
[Token Usage] generateChapter: input=3200, output=3800, cost=$0.0666
```

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Authentication required` (401) | Token expired or invalid | Run `test-login.ps1` to get new token |
| `Invalid input` (400) | Validation failed | Check server logs for which field |
| `Story not found` (404) | Wrong story ID | Verify ID from `test-story-id.txt` |
| `Insufficient tokens` (400) | User out of credits | Update `profiles.tokens_remaining` in Supabase |
| `Missing Supabase environment variables` | `.env.local` incomplete | Add all 3 Supabase keys |
| `ANTHROPIC_API_KEY environment variable is required` | Missing API key | Add to `.env.local` |
| `Failed to fetch user profile` (500) | Database error | Check Supabase connection |
| `Failed to parse chapter JSON` | Claude returned markdown-wrapped JSON | Already fixed with `.replace()` |
| `Could not find the 'metadata' column` | Tried to insert non-existent column | Already fixed - INSERT reduced to minimum |

---

## Files Modified (Complete List)

### Database Migrations
1. `src/lib/supabase/migrations/add-missing-tables.sql` - 13 foundation tables
2. `src/lib/supabase/migrations/002-story-facts.sql` - Generic fact table (Session 1)
3. `src/lib/supabase/migrations/003-fact-tables-restructure.sql` - 6 specialized tables (Session 2)
4. `src/lib/supabase/migrations/004-story-outline-system.sql` - Story outline table (Session 2)

### Core Services
5. `src/lib/claude/service.ts` - Major rewrite in both sessions
   - Session 1: `extractChapterFacts()`, `getStoredFactsForStory()`, `saveExtractedFacts()`
   - Session 2: Complete rewrite for 6 tables, `generateStoryOutline()`, `calculateFactSimilarity()`, helper methods

### API Routes
6. `app/api/stories/[storyId]/chapters/route.ts`
   - Session 1: Created endpoint, background extraction
   - Session 2: Outline integration, fact retrieval limits, fixed INSERT

### Authentication
7. `src/lib/auth/middleware.ts`
   - Session 1: Dual auth support (Bearer + cookies), table name fix

### Constants
8. `src/lib/constants.ts` - Updated Claude model (Session 2)
9. `src/lib/utils/constants.ts` - Updated Claude model (Session 2)
10. `src/lib/ai/claude-client.ts` - Updated Claude model (Session 2)

### Test Scripts
11. `test-login.ps1` - Authentication script (Session 1)
12. `test-api.ps1` - Story creation test (Session 1)

**Total:** 12 files modified

---

## Next Session Priorities

### 1. Testing (2-3 hours)
Execute test plan above, debug issues as they arise

### 2. If Testing Succeeds - Enhancement (1-2 hours)
- Add UI for viewing extracted facts
- Add UI for viewing/editing outlines
- Add "regenerate outline" button

### 3. If Testing Fails - Debugging (2-4 hours)
- Fix JSON parsing issues
- Adjust similarity threshold
- Simplify prompts if token limits cause problems
- Add more detailed error logging

### 4. Optimization (if time allows)
- Batch fact saves (1 transaction instead of 6)
- Cache outline generation (don't regenerate if recent)
- Add fact search/filter functionality

---

## Questions for Next Session

1. **Similarity threshold:** Is 80% too aggressive? Should we lower to 60-70%?
2. **Outline frequency:** Regenerate every 5 chapters? Or only when user requests?
3. **Fact retrieval:** Is last 3 chapters enough context? Or should we fetch more?
4. **Token limits:** Are they too restrictive? Should we increase extraction to 10,000 tokens?
5. **Cost tolerance:** Is $0.165/chapter acceptable? Or do we need further optimization?
6. **UI priority:** Build fact viewer first, or outline editor?

---

## Estimated Completion Time

**To production-ready:**
- Testing & debugging: 3-5 hours
- UI for fact viewing: 2-3 hours
- UI for outline editing: 2-3 hours
- Polish & optimization: 2-3 hours
- **Total: 9-14 hours (2-3 more sessions)**

**To beta-testable:**
- Testing & debugging: 3-5 hours
- Basic fact display (no editing): 1 hour
- **Total: 4-6 hours (1-2 more sessions)**

---

## Critical Reminders for Next Session

1. ⚠️ **Restart dev server** after pulling code changes
2. 🔑 **Get fresh auth token** if expired (`.\test-login.ps1`)
3. 🔧 **Use development bypass header** in all API tests
4. 📊 **Check Supabase logs** if database operations fail
5. 💰 **Monitor token usage logs** to catch cost overruns early
6. 💾 **Save story_id** after creation for all subsequent tests
7. ⏱️ **Wait 30-60 seconds** after chapter generation for fact extraction to complete
8. 📋 **Check ALL 6 tables** for fact population, not just one
9. 📖 **Read outline from database** to verify it's specific enough
10. ✅ **Compare Chapter 2 to outline plan** to verify following

---

## Summary

**Session 1:** Built foundation - authentication, basic fact extraction (1 table), chapter generation API, test infrastructure. Tested and verified working end-to-end.

**Session 2:** Transformed system - 6 specialized fact tables, story outline planning, similarity detection, token limits, comprehensive narrative architecture. Built but untested.

**The Gap:** We have a complete closed-loop system on paper. Next session validates it works in practice.

**If testing succeeds:** We'll have a production-ready AI novel generation system with genuine story structure instead of aimless wandering.

**If testing fails:** We'll debug, adjust thresholds, simplify prompts, and iterate until it works.

---

**Last updated:** 2025-09-30 02:45 AM
**Sessions:** 1 & 2
**Total time:** ~8 hours
**Lines of code:** ~3,000
**Database tables:** 14 (7 from Session 1, 7 from Session 2)
**Methods implemented:** 13
**Ready for:** Session 3 - Testing & Validation
