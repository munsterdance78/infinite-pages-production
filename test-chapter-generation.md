# Chapter Generation & Fact Extraction Test Plan

## Prerequisites Check

### 1. Verify Environment Variables

Check your `.env.local` file has all required keys:

```bash
# Open .env.local and verify these exist:
NEXT_PUBLIC_SUPABASE_URL=https://tktntttemkbmnqkalkch.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-...
```

✅ **All 4 variables must be present**

### 2. Verify Database Tables Exist

Go to Supabase Dashboard → SQL Editor and run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('stories', 'chapters', 'story_facts', 'profiles', 'generation_logs');
```

**Expected:** All 5 tables should exist. If not, run the migrations first.

### 3. Start Development Server

```bash
npm run dev
```

**Expected output:**
```
> next dev
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## Test Sequence

### **Step 1: Create a Test Story**

**Request:**
```bash
curl -X POST http://localhost:3000/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -d '{
    "title": "The Crystal Kingdom",
    "genre": "Fantasy",
    "premise": "A young mage discovers a hidden kingdom made entirely of crystal, where shadows have been stealing people's memories."
  }'
```

**How to get YOUR_SUPABASE_ACCESS_TOKEN:**
1. Go to Supabase Dashboard → Authentication → Users
2. Create a test user or use existing
3. Copy the user's access token from the user details

**Expected Response (201):**
```json
{
  "story": {
    "id": "abc-123-def-456",
    "title": "The Crystal Kingdom",
    "genre": "Fantasy",
    "premise": "A young mage discovers...",
    "foundation": { ... },
    "user_id": "your-user-id",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "tokensUsed": 150,
  "remainingTokens": 9850,
  "message": "Story created successfully"
}
```

✅ **Save the `story.id` - you'll need it for next steps**

---

### **Step 2: Generate First Chapter**

**Request:**
```bash
curl -X POST http://localhost:3000/api/stories/abc-123-def-456/chapters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -d '{
    "chapterNumber": 1,
    "chapterPlan": {
      "purpose": "Introduce protagonist and discover the crystal gateway",
      "keyEvents": ["Aria finds strange crystal in forest", "Crystal reveals portal", "She steps through"]
    }
  }'
```

**Replace `abc-123-def-456` with your actual story ID**

**Expected Response (201):**
```json
{
  "chapter": {
    "id": "chapter-1-id",
    "story_id": "abc-123-def-456",
    "chapter_number": 1,
    "title": "The Crystal Gateway",
    "content": "Aria had never seen anything like it...",
    "summary": "Aria discovers a magical crystal portal",
    "word_count": 2043,
    "tokens_used": 1800,
    "generation_cost_usd": 0.0045,
    "metadata": {
      "keyEvents": ["Aria finds crystal", "Portal opens"],
      "characterDevelopment": "...",
      "optimization": { ... }
    },
    "created_at": "2025-01-15T10:35:00Z"
  },
  "tokensUsed": 180,
  "remainingTokens": 9670,
  "message": "Chapter generated successfully"
}
```

✅ **Chapter created successfully**

---

### **Step 3: Check Fact Extraction (Background Process)**

**Wait 10-30 seconds** for background fact extraction to complete.

**Check server logs:**
```
[Fact Extraction] Story: abc-123-def-456, Chapter: chapter-1-id - Saved: 8, Failed: 0, Cost: $0.003500
```

**Check Supabase `story_facts` table:**

Go to Supabase Dashboard → Table Editor → `story_facts`

**Expected rows (8-12 facts):**

| fact_type   | entity_name | fact_data                                    | confidence | chapter_id    |
|-------------|-------------|----------------------------------------------|------------|---------------|
| character   | Aria        | {traits: ["curious", "brave"], ...}          | 0.90       | chapter-1-id  |
| location    | Crystal Forest | {description: "Dense forest...", ...}      | 0.90       | chapter-1-id  |
| plot_event  | Discovery of portal | {significance: "...", ...}         | 0.85       | chapter-1-id  |
| world_rule  | Crystals hold magic | {category: "magic", ...}           | 0.95       | chapter-1-id  |

✅ **Facts extracted and saved to database**

**Alternative: Query via SQL:**
```sql
SELECT fact_type, entity_name, confidence, extraction_cost_usd
FROM story_facts
WHERE story_id = 'abc-123-def-456'
ORDER BY extracted_at DESC;
```

---

### **Step 4: Generate Second Chapter**

**Request:**
```bash
curl -X POST http://localhost:3000/api/stories/abc-123-def-456/chapters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -d '{
    "chapterNumber": 2,
    "chapterPlan": {
      "purpose": "Explore the crystal kingdom and meet the guardian",
      "keyEvents": ["Aria enters crystal city", "Meets Keeper of Memories", "Learns about shadow thieves"]
    }
  }'
```

**Expected Response (201):**
```json
{
  "chapter": {
    "id": "chapter-2-id",
    "chapter_number": 2,
    "title": "The Keeper of Memories",
    "content": "The crystal city sparkled...",
    "word_count": 2156,
    ...
  },
  "tokensUsed": 190,
  "remainingTokens": 9480,
  "message": "Chapter generated successfully"
}
```

✅ **Second chapter created**

---

### **Step 5: Verify Facts Accumulate**

**Wait 10-30 seconds**, then check `story_facts` table again.

**Expected: More facts added (total 15-25 rows)**

```sql
SELECT
  chapter_id,
  fact_type,
  COUNT(*) as fact_count
FROM story_facts
WHERE story_id = 'abc-123-def-456'
GROUP BY chapter_id, fact_type
ORDER BY chapter_id;
```

**Expected output:**
```
chapter_id    | fact_type   | fact_count
--------------+-------------+-----------
chapter-1-id  | character   | 2
chapter-1-id  | location    | 3
chapter-1-id  | plot_event  | 2
chapter-1-id  | world_rule  | 1
chapter-2-id  | character   | 3  (new character: Keeper)
chapter-2-id  | location    | 4  (crystal city)
chapter-2-id  | plot_event  | 3
chapter-2-id  | world_rule  | 2
```

✅ **Facts from both chapters stored separately**

---

## How to Check Logs for Background Extraction

### **1. Terminal Logs (Development Server)**

Watch the terminal where `npm run dev` is running:

```
[Fact Extraction] Story: abc-123-def-456, Chapter: chapter-1-id - Saved: 8, Failed: 0, Cost: $0.003500
```

**What to look for:**
- ✅ `Saved: X, Failed: 0` means all facts saved successfully
- ⚠️ `Saved: X, Failed: Y` means some facts failed (check next line for error)
- ❌ `[Fact Extraction Error]` means extraction completely failed

### **2. Browser Network Tab**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make POST request to create chapter
4. Look for the response - it should return immediately (200ms-2s)
5. Fact extraction happens **after** response, so you won't see it in Network tab

### **3. Check Database Directly**

```sql
-- See all extraction activity
SELECT
  story_id,
  chapter_id,
  COUNT(*) as total_facts,
  SUM(extraction_cost_usd) as total_cost,
  MAX(extracted_at) as last_extraction
FROM story_facts
GROUP BY story_id, chapter_id;
```

---

## What to Do If Something Fails

### **Error: "ANTHROPIC_API_KEY environment variable is required"**

**Fix:**
1. Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local`
2. Restart dev server: `Ctrl+C`, then `npm run dev`

---

### **Error: "Story not found" (404)**

**Fix:**
1. Verify the story ID in your request URL matches the ID from Step 1
2. Check you're using the correct auth token for the user who created the story

---

### **Error: "Insufficient tokens" (400)**

**Fix:**
1. Go to Supabase → Table Editor → `profiles`
2. Find your user and update `tokens_remaining` to `10000`
3. Try again

---

### **Error: "Failed to fetch previous chapters" (500)**

**Fix:**
1. Check that `chapters` table exists in Supabase
2. Run migration: `src/lib/supabase/migrations/add-missing-tables.sql`

---

### **No facts appearing in `story_facts` table**

**Possible causes:**

1. **Table doesn't exist**
   - Run migration: `src/lib/supabase/migrations/002-story-facts.sql`

2. **Background task silently failed**
   - Check server logs for `[Fact Extraction Error]`
   - Common error: `relation "story_facts" does not exist`

3. **Takes longer than expected**
   - Wait up to 60 seconds for first extraction
   - Claude API might be slow or rate-limited

**Manual check:**
```sql
-- Check if ANY facts exist
SELECT COUNT(*) FROM story_facts;

-- If 0, check for errors in generation_logs
SELECT * FROM generation_logs
WHERE operation_type = 'fact_extraction'
ORDER BY created_at DESC
LIMIT 5;
```

---

### **Error: "Could not parse fact extraction response"**

**This means Claude returned invalid JSON**

**What happens:**
- Chapter is still created ✅
- Facts are NOT saved ❌
- Error logged to console

**Fix:**
1. Check server logs for the actual Claude response
2. This is rare - usually Claude returns valid JSON
3. If it persists, the prompt might need adjustment

---

### **TypeError: Cannot read property 'generateChapter' of undefined**

**Fix:**
1. Restart the dev server
2. Check that `src/lib/claude/service.ts` exports `claudeService`
3. Check for TypeScript compilation errors: `npm run type-check`

---

## Success Criteria

✅ **All tests pass if:**

1. Story created (Step 1) → Returns 201 with story object
2. Chapter 1 generated (Step 2) → Returns 201 with chapter object
3. Facts extracted (Step 3) → 8-12 rows in `story_facts` table
4. Chapter 2 generated (Step 4) → Returns 201 with chapter object
5. Facts accumulate (Step 5) → 15-25 total rows in `story_facts`

**Server logs show:**
```
[Fact Extraction] Story: ... - Saved: 8, Failed: 0, Cost: $0.003500
[Fact Extraction] Story: ... - Saved: 10, Failed: 0, Cost: $0.004200
```

**Database state:**
- `stories` table: 1 row with `chapter_count = 2`, `word_count > 4000`
- `chapters` table: 2 rows
- `story_facts` table: 15-25 rows
- `generation_logs` table: 2 rows (1 per chapter)
- `profiles` table: User's `tokens_remaining` decreased by ~350-400

---

## Quick Troubleshooting Commands

```bash
# Check if server is running
curl http://localhost:3000/api/stories

# Check TypeScript compilation
npm run type-check

# Check for linting errors
npm run lint

# Restart dev server
# Press Ctrl+C, then:
npm run dev
```

---

## Notes

- **First chapter takes 30-60 seconds** (includes foundation + chapter generation)
- **Subsequent chapters take 15-30 seconds**
- **Fact extraction adds 5-15 seconds** but happens in background
- **Token costs**: ~150 credits per story, ~180 credits per chapter
- **API costs**: ~$0.005 per chapter + ~$0.004 per fact extraction

---

## Next Steps After Testing

Once all tests pass:

1. **Deploy to production**: Push to GitHub → Vercel auto-deploys
2. **Set up monitoring**: Check Supabase logs for errors
3. **Add rate limiting**: Implement per-user chapter generation limits
4. **Build UI**: Create frontend components for chapter generation
5. **Add fact display**: Show extracted facts in story dashboard
