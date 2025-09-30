# 🚩 FLAGGED ACTIONS - SYSTEMATIC RESOLUTION PLAN

**Scan Date:** 2025-09-27T04:03:39.709Z
**Total Flags:** 411

## 🔥 CRITICAL PRIORITY (2 flags)

### 1. CRITICAL: Transfer components/UnifiedStoryCreator.tsx → src/components/stories/story-creator.tsx. Main story creation component
- **File:** `src/components/stories/story-creator.tsx`
- **Category:** TRANSFER_REQUIRED
- **Effort:** 2-4 hours
- **Auto-fix:** Copy from components/UnifiedStoryCreator.tsx
- **Flag ID:** `86ec66c9-7c72-4ea0-a853-9a7750f8ea35`

### 2. CRITICAL: Found 9 story creators: GlassStoryCreatorWrapper.tsx, OptimizedUnifiedStoryCreator.tsx, StoryCreationForm.tsx, StoryList.tsx, StoryModeSelector.tsx, types.ts, StreamingStoryCreator.tsx, UnifiedStoryCreator.tsx, story-creator.tsx. Must consolidate to ONE.
- **File:** `MULTIPLE_FILES`
- **Category:** DUPLICATE_DETECTED
- **Effort:** 1-2 hours
- **Auto-fix:** Keep UnifiedStoryCreator.tsx, delete others
- **Dependencies:** `GlassStoryCreatorWrapper.tsx`, `OptimizedUnifiedStoryCreator.tsx`, `StoryCreationForm.tsx`, `StoryList.tsx`, `StoryModeSelector.tsx`, `types.ts`, `StreamingStoryCreator.tsx`, `UnifiedStoryCreator.tsx`, `story-creator.tsx`
- **Flag ID:** `6f6d6ab5-ee44-451a-951e-0eafb0876097`

## 🔥 HIGH PRIORITY (3 flags)

### 1. HIGH: Found 5 earnings components. Consolidate to one.
- **File:** `MULTIPLE_FILES`
- **Category:** DUPLICATE_DETECTED
- **Effort:** 1-3 hours
- **Auto-fix:** Keep most complete version
- **Dependencies:** `CreatorEarningsErrorBoundary.tsx`, `CreatorEarningsHub.tsx`, `CreatorEarningsLoading.tsx`, `GlassCreatorEarningsWrapper.tsx`, `earnings-hub.tsx`
- **Flag ID:** `7266d1fc-eae1-4c95-9c6a-2f2603bc0db7`

### 2. HIGH: Uses dangerouslySetInnerHTML. Verify content is sanitized.
- **File:** `\components\ChoiceBookReader.tsx`
- **Category:** SECURITY_CONCERN
- **Effort:** 1-3 hours
- **Auto-fix:** Ensure proper content sanitization
- **Flag ID:** `4b353e8a-8e2d-46b7-b438-9956cc29ce75`

### 3. HIGH: Uses dangerouslySetInnerHTML. Verify content is sanitized.
- **File:** `\infinite-pages-v3\src\components\common\secure-content-renderer.tsx`
- **Category:** SECURITY_CONCERN
- **Effort:** 1-3 hours
- **Auto-fix:** Ensure proper content sanitization
- **Flag ID:** `3bb9e59e-e717-4dc9-95e1-0068ab30d8a8`

## 🔥 MEDIUM PRIORITY (211 flags)

### 1. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\admin\error-monitoring\page.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e7740614-6e24-4213-85be-bc75af81ae03`

### 2. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\admin\request-flow\page.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e2f40503-cc17-4dc0-a628-d0ed6ca1c506`

### 3. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\admin\monthly-maintenance\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `7174b7f9-f667-4c39-b326-6b6436a0fcea`

### 4. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\admin\process-payouts\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `a2aef0d4-2c0f-4d3f-ba72-678fc6c01dda`

### 5. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\creator\earnings\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `575a528e-c5c1-4899-91a7-dd00344a0d84`

### 6. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\creators\earnings\enhanced\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `414b26ab-d522-437c-afa6-96d2df1c3ab7`

### 7. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\creators\earnings\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f271006d-a9ab-4208-be08-b998a86ad38d`

### 8. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\creators\earnings\unified\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f0dcd020-4e85-4808-a6cb-cd876491850c`

### 9. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\creators\stripe\status\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `ad0f3120-8e6c-4b72-ada3-3a62a062421f`

### 10. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\demo\story\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `cafc5944-1bf2-404f-a1d2-fefa730e0c66`

### 11. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\errors\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `fd9ba0c0-98f3-4fd2-a20f-c07a5657b723`

### 12. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\choice-books\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `9f3318ea-68e0-4b2c-b3f9-992e13865681`

### 13. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\guest\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `5662acc3-f5b1-48da-a88f-19ec2aacbd61`

### 14. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\guest\[id]\characters\generate\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `ad6a16a9-b56e-4e11-a943-0fd93424aa36`

### 15. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `730cd221-f70f-4d7d-90ba-3d3302846087`

### 16. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\stream\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `1604929a-eb4e-4690-9d17-a995e9a68494`

### 17. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\analyze\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `2e591821-8dc9-456d-9c9d-cb030a02e411`

### 18. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\chapters\generate\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `eb888744-54dc-4a31-a25e-8fd94d51ee6b`

### 19. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\chapters\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `8a7a6662-caec-469b-b19d-c45fabe86c81`

### 20. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\chapters\stream\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `93b21473-3f6d-4b26-b111-0a699532667f`

### 21. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\characters\generate\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `000c9737-04e5-455d-a80c-0d79b9477928`

### 22. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\cover\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `1ed8de90-f502-4043-8eaf-7d2665303db6`

### 23. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\export\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6c3fa4b1-a4e1-48f7-95a5-3573e550fbb1`

### 24. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\facts\extract\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `4f6dcd1e-95d2-4da1-8e1e-61c448d58691`

### 25. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\facts\optimize\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `fa21a1ca-0af4-417f-b554-dc5fd76e103e`

### 26. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\timeline\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f491f79e-a7cc-47eb-b99d-99aaafafdeba`

### 27. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\stories\[id]\universe\setup\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6a65cdf5-f4f1-4242-8a39-e583337f53df`

### 28. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\api\webhooks\stripe\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `eaf030b6-cbfd-4ef3-9eba-4eb4d7f67283`

### 29. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\dashboard\page.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e9ae2637-b03f-478d-ae2c-5db2a9c1e7bf`

### 30. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\error-monitoring-test\page.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f0d07c6a-caf8-4674-a910-3dbc366bb7bd`

### 31. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\app\request-tracking-test\page.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `5c1328c1-e30b-4b15-9e3b-2314c2f62ba6`

### 32. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\AdminCreditDistribution.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `664baa18-b229-46d7-aab0-279c3e93b269`

### 33. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\basic\AnalyticsButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `02e1eadf-6b1d-4099-bcc5-d3253e8ff174`

### 34. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\basic\FactExtractionButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `57947f66-a73b-46ae-9f71-5ca66e2744ad`

### 35. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\basic\ThreePhaseWorkflowButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `28c249fc-8bef-4892-88e0-86487a8f97c5`

### 36. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\basic\WorldBuilderButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `cb8d2c85-4df5-4db1-98b6-aa222f034290`

### 37. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\ChoiceBookReader.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `366faafd-2b37-47cd-bbeb-9222d62b62e4`

### 38. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\CreatorEarningsHub.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `41bfaad6-11f6-4f09-8af6-82915a0974aa`

### 39. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\CreditBalance.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `30a14c03-a93b-44f4-9bcd-f42096974bdc`

### 40. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\dashboard\AnalyticsDashboard.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `be80e34f-88c0-4fd5-904b-4af5a1a286c5`

### 41. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\dashboard\CreatorHub.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `4934dcd2-90be-4047-89ac-e12fef579c46`

### 42. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\dashboard\StoryLibrary.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `8a4189d2-78c7-4a21-a11e-12f03b87dc2d`

### 43. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\optimized\VirtualizedStoryList.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `b32c8a06-e97d-4139-967a-ebdbe61248fc`

### 44. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\story-creator\StoryCreationForm.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `a378ac2a-8f15-4c8c-83a6-e28d84856c86`

### 45. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\story-creator\StoryList.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `fb781771-280a-4833-b144-69a33c2dd7b7`

### 46. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\story-creator\types.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `23d10b8e-7177-420d-8483-e4e1a107bf41`

### 47. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\StoryCard.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f357afb0-17dc-40cf-8d04-6cb7718b895e`

### 48. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\StoryReader.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `7ceccea3-6fec-42a3-a7c6-2358742edf0e`

### 49. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\StreamingStoryCreator.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `833f990a-ada2-4623-9083-9e32eb643033`

### 50. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\TransparentStoryGenerator.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `431a42f3-ccf2-43df-a92f-47627583c977`

### 51. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\UnifiedAnalyticsDashboard.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `79dcefbd-9080-4335-bf73-57b62cf854ec`

### 52. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\UnifiedStoryCreator.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e167e7d6-d094-4227-bac3-82ec19b7e6b3`

### 53. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\v2\EnhancementSliders.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `b1af9103-c283-462e-b5e9-5ff8fe837b57`

### 54. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\v2\index.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `89939f31-2c31-4c2d-934f-43f5963e41d8`

### 55. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\v2\StoryLibrary.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `ef8916e6-4ef5-4c9f-acb9-28aa71f818a9`

### 56. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\v2\ThreePhaseWorkflow.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `0e3a99a5-883f-4086-b1b0-3c4782c2faba`

### 57. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\v2\TimelineVisualization.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `74a6b743-90ad-452e-9584-e01205bd67e9`

### 58. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\components\v2\WorkflowInterface.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `9babd792-d97c-489d-92ea-5b13185a6400`

### 59. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\hooks\useAIGeneration.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `3ce4c4b8-719b-4919-bde3-2db82787b6e7`

### 60. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\hooks\useCreatorEarnings.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `2a3d5f70-b636-4a3b-910d-d3b28128277f`

### 61. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\hooks\useRequestMonitoring.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6e6a8ae5-2dc7-439b-9405-7712be67904e`

### 62. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\app\api\admin\process-payouts\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `347b768e-e5a8-4bc3-bc55-bc574e8a26ff`

### 63. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\app\api\stories\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `7892bdf6-afa9-44d2-b286-353d88321305`

### 64. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\app\dashboard\page.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `958b4c22-372c-4c62-bd49-2bc3b98b759f`

### 65. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\src\components\features\stories\story-creator.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `108f17b8-071c-4f32-a926-ca76639c85e4`

### 66. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\src\hooks\useClaudeStreaming.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `8457e209-6c42-43d1-951d-0da855a4a5c0`

### 67. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\src\lib\ai\cache.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `60c0deaf-e0e4-4f48-a2d9-4518616cdecf`

### 68. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\src\lib\ai\streaming.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e9f57938-51e0-4ca8-865a-4496c70db0c6`

### 69. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\infinite-pages-v3\src\lib\auth\utils.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `2499da0a-574c-414e-b2bf-11954264e5ef`

### 70. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\auth\utils.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `5d19127d-2061-4052-a7cb-6703ff026e49`

### 71. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\character-manager.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `8c9de5f5-8f79-45f8-adca-941326c4eac9`

### 72. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\choice-books\choice-analytics.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `c47dcbc6-f569-4b4c-8862-c731799e8690`

### 73. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\choice-books\choice-generator.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6c85c777-2fd7-4a7f-923b-e4bf1ba82b4e`

### 74. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\choice-books\choice-prompts.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6714cb6c-8b4b-454b-b16f-f47d80460f70`

### 75. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\choice-books\choice-types.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6be8ee71-03ad-457f-995e-0aa1436b9f13`

### 76. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\adaptive-context.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `d04ab474-65f9-4488-9d1d-b2880b85cf31`

### 77. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\advanced-batch-processor.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `81de8e8c-b1aa-4cbc-9a87-b0571edb2ce6`

### 78. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\ai-cost-optimization-hub.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `9e80a57b-be52-4c39-9854-8097a9deb11d`

### 79. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\analytics.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `57623141-6033-4107-bc37-259aea766288`

### 80. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\batch.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `847c39f8-dbf2-47ad-a284-12ceca7931cd`

### 81. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\cache.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `4dcf0898-7705-41a8-b7e3-ad5660f60be0`

### 82. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\context-optimizer.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `fadf110f-8ea5-4f6a-a47a-64af7bd25e38`

### 83. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\enhanced-cost-analytics.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `5b7fc36a-6672-4918-8c53-53ba6bbc099e`

### 84. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\fact-extractor.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6057b528-e041-43b0-934d-eae254a44cdf`

### 85. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\hooks.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `173951e6-93cf-452f-94a7-2dd4c217d998`

### 86. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\infinitePagesCache.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `6cdc655f-63bb-44d8-aa2a-16827cb3f229`

### 87. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\prompt-templates.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `0116de52-bb6b-403a-a133-c63704c525ac`

### 88. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\prompts.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `8dcdf80b-d476-4cf3-927e-cf108daac05c`

### 89. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\service.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `d7ef5db1-5d0e-4043-baf6-efb624d0cd24`

### 90. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\sfsl-schema.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `dbaf899c-942e-4f3e-9648-c75ee3510115`

### 91. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\streaming.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `bd93de87-2c59-4b9c-b3fb-d29c32de19a8`

### 92. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\claude\v2-enhancements.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `8c91d7cb-d31c-4637-b7f4-b32dcf306fa7`

### 93. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\creator-earnings.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f1c3efeb-8be6-419f-9103-45a0e7b10fe6`

### 94. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\database\query-optimizer.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `0f5f40f1-4830-4847-9547-bb822cbc7c25`

### 95. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\error-monitoring.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `a5365d2b-fdbd-433c-b739-ff8a3edb3a99`

### 96. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\hooks\useDebounce.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `f23a467a-bbc7-4152-b616-1406b4060791`

### 97. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\hooks\useQueryCache.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `af5e0d47-e003-487f-9e9e-8e7a71b2fd37`

### 98. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\providers\QueryProvider.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `21883031-42fd-4d34-b64f-cce33b861be7`

### 99. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\rateLimit.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `0a6d4b56-a641-4731-a7ce-62ae374f7daa`

### 100. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\request-tracking-init.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e1fafafb-3182-4154-895a-d0a525fd3256`

### 101. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\request-tracking.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `1e44e12f-3766-4a98-8a6a-fcb96f136b1a`

### 102. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\series\series-context-manager.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `05b5d184-f5f9-4dc9-92d6-31f60b55b396`

### 103. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\series\series-types.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `d92d115a-6759-4435-b581-097371448601`

### 104. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\series-manager.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `163451b2-9c3e-4396-8d61-a1bd6f1ca873`

### 105. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\server-error-monitoring.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `e19e5e7b-1485-4c3d-a982-77c7cee6f4d0`

### 106. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\supabase\types.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `7af404bf-66ca-4ae3-b9a8-100cbdf68c8d`

### 107. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\types\api.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `af33cc5b-f06b-4be5-a555-f91dd6aba54e`

### 108. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\types\database.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `cc2c3b38-96d2-49ee-bf90-aa917596898f`

### 109. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\lib\utils.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `5eaeea74-2d59-479c-8f77-5a837daf82f2`

### 110. MEDIUM: Uses "any" type. Replace with proper TypeScript types.
- **File:** `\middleware.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Define proper interfaces and types
- **Flag ID:** `c6c6fd24-4659-4050-aeba-9c03b58dbf17`

### 111. MEDIUM: Missing new feature - Full story automation
- **File:** `src/lib/automation/automation-engine.ts`
- **Category:** MISSING_DEPENDENCY
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Implement new feature
- **Flag ID:** `9bed5515-2671-448b-9145-9c22754a0a74`

### 112. MEDIUM: Found 2 components matching /Loading/i. Consolidate all loading components
- **File:** `src/components/ui/loading.tsx`
- **Category:** NEEDS_CONSOLIDATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Create unified component
- **Dependencies:** `CreatorEarningsLoading.tsx`, `LoadingFallback.tsx`
- **Flag ID:** `554101e7-5f57-4111-b63d-6c220561cae6`

### 113. MEDIUM: Found 6 components matching /Error/i. Consolidate error handling
- **File:** `src/components/ui/error-boundary.tsx`
- **Category:** NEEDS_CONSOLIDATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Create unified component
- **Dependencies:** `CreatorEarningsErrorBoundary.tsx`, `ErrorBoundary.tsx`, `ErrorFallback.tsx`, `error-boundary.tsx`, `error-monitoring.ts`, `server-error-monitoring.ts`
- **Flag ID:** `3e3d4860-9116-4011-8d39-f8135f7c05db`

### 114. MEDIUM: Found 8 components matching /Button/i. Consolidate button variants
- **File:** `src/components/ui/button.tsx`
- **Category:** NEEDS_CONSOLIDATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Create unified component
- **Dependencies:** `AnalyticsButtons.tsx`, `CharacterManagerButtons.tsx`, `FactExtractionButtons.tsx`, `ThreePhaseWorkflowButtons.tsx`, `TimelineButtons.tsx`, `WorldBuilderButtons.tsx`, `button.tsx`, `button.tsx`
- **Flag ID:** `a0e33c1e-92dc-46ac-b3df-d89f03e8ab0f`

### 115. MEDIUM: Auto-generation is 0.0% complete. Missing: src/lib/story-bible/auto-generator.ts, src/components/story-bible/story-bible-manager.tsx
- **File:** `Auto-generation`
- **Category:** INCOMPLETE_IMPLEMENTATION
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Complete feature implementation
- **Dependencies:** `auto-generator.ts`, `story-bible-manager.tsx`
- **Flag ID:** `c26738ff-1e4e-452a-b360-9ca1b294ae38`

### 116. MEDIUM: Large file (18.6KB). Consider splitting.
- **File:** `\app\admin\error-monitoring\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `49e705bc-c4df-43a5-b95b-4ea10132a5ba`

### 117. MEDIUM: Large file (17.2KB). Consider splitting.
- **File:** `\app\admin\request-flow\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `3347f18a-7609-4a5b-ad24-fe7928c2dd48`

### 118. MEDIUM: Large file (10.2KB). Consider splitting.
- **File:** `\app\api\admin\process-payouts\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `fff35f8e-572a-497a-8549-ecf1e38fb3a0`

### 119. MEDIUM: Large file (40.5KB). Consider splitting.
- **File:** `\app\api\creators\earnings\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `6c5bf284-57b7-4e3b-be76-569a53e9fe0c`

### 120. MEDIUM: Large file (12.3KB). Consider splitting.
- **File:** `\app\api\creators\earnings\unified\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `b9c30021-ee84-46e4-80c7-f73a8b973c96`

### 121. MEDIUM: Large file (11.3KB). Consider splitting.
- **File:** `\app\api\creators\stripe\onboard\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `caa1fa8a-4e5c-4d79-98c5-51068a1f866c`

### 122. MEDIUM: Large file (10.2KB). Consider splitting.
- **File:** `\app\api\creators\stripe\status\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `9c518ee8-99d7-43b7-9ebf-6088436bcf01`

### 123. MEDIUM: Large file (21.4KB). Consider splitting.
- **File:** `\app\api\errors\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `bcf57694-2da1-40a4-8e69-53feb9294b9a`

### 124. MEDIUM: Large file (10.2KB). Consider splitting.
- **File:** `\app\api\stories\choice-books\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `c8298fd8-f6e6-4f6b-b753-6c39b7573df0`

### 125. MEDIUM: Large file (19.5KB). Consider splitting.
- **File:** `\app\api\stories\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `23302f45-31a4-4bfd-b7d9-8ab023fe508a`

### 126. MEDIUM: Large file (11.5KB). Consider splitting.
- **File:** `\app\api\stories\[id]\analyze\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `29c7def6-846d-4fb8-bd30-587fc7602ce7`

### 127. MEDIUM: Large file (14.4KB). Consider splitting.
- **File:** `\app\api\stories\[id]\chapters\generate\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d8840d01-9972-48d5-9712-d28fab4ec35f`

### 128. MEDIUM: Large file (10.1KB). Consider splitting.
- **File:** `\app\api\stories\[id]\chapters\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `58a17696-ba10-4c8e-ba35-535e1faaba97`

### 129. MEDIUM: Large file (12.5KB). Consider splitting.
- **File:** `\app\api\stories\[id]\characters\generate\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `3f2987f6-9470-4b3c-8588-8c13ae5f205c`

### 130. MEDIUM: Large file (11.4KB). Consider splitting.
- **File:** `\app\api\stories\[id]\cover\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `f760b5a8-9f16-47c0-9d5b-9385e4eaf995`

### 131. MEDIUM: Large file (11.5KB). Consider splitting.
- **File:** `\app\api\stories\[id]\facts\optimize\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `903d0c46-6ca1-4434-9d4c-09e8343742f1`

### 132. MEDIUM: Large file (10.8KB). Consider splitting.
- **File:** `\app\api\stories\[id]\timeline\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `80cfa29d-dbc2-402d-9993-cd864e652683`

### 133. MEDIUM: Large file (18.9KB). Consider splitting.
- **File:** `\app\api\stories\[id]\universe\setup\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `aafdfb00-e623-4036-a140-91d2ebf6c425`

### 134. MEDIUM: Large file (21.9KB). Consider splitting.
- **File:** `\app\api\webhooks\stripe\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `4ba09970-9550-4ed8-8665-88abed92cc98`

### 135. MEDIUM: Large file (20.0KB). Consider splitting.
- **File:** `\app\dashboard\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `617a8c74-808b-4d4b-8a55-6cd66d4dd385`

### 136. MEDIUM: Large file (13.7KB). Consider splitting.
- **File:** `\app\error-monitoring-test\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `cfc0ce0b-139e-409f-b32f-53ebea8c1e79`

### 137. MEDIUM: Large file (19.5KB). Consider splitting.
- **File:** `\app\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `11a378cb-8038-4276-9b5b-bfc7aea5edf3`

### 138. MEDIUM: Large file (18.2KB). Consider splitting.
- **File:** `\app\request-tracking-test\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `75ea5fc4-8515-4884-933a-c0243265507b`

### 139. MEDIUM: Large file (12.0KB). Consider splitting.
- **File:** `\components\AdminCreditDistribution.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `cdbb3a64-6d5c-4301-8881-bf3c5b4918d4`

### 140. MEDIUM: Large file (15.4KB). Consider splitting.
- **File:** `\components\AdminPayoutInterface.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `aa101d99-fc5d-46cb-9573-d3c986ab8137`

### 141. MEDIUM: Large file (14.6KB). Consider splitting.
- **File:** `\components\basic\CharacterManagerButtons.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `83df240a-0e7f-4d0d-a5a8-d2dc18ba1c25`

### 142. MEDIUM: Large file (16.0KB). Consider splitting.
- **File:** `\components\basic\WorldBuilderButtons.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `c11196b3-e89b-4a2b-ac70-8ad374734f48`

### 143. MEDIUM: Large file (17.5KB). Consider splitting.
- **File:** `\components\ChoiceBookReader.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `dc45d8e4-6487-4e44-af70-28c36d8a4d33`

### 144. MEDIUM: Large file (11.8KB). Consider splitting.
- **File:** `\components\CoverGenerator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `aed1c189-4906-4683-ab23-d16074414060`

### 145. MEDIUM: Large file (21.3KB). Consider splitting.
- **File:** `\components\CreatorEarningsHub.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `568ee92f-2ada-40c3-9e1b-237bf47dd487`

### 146. MEDIUM: Large file (17.3KB). Consider splitting.
- **File:** `\components\dashboard\AnalyticsDashboard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d9dc2e5e-2c07-4780-8587-bac47dfd4e34`

### 147. MEDIUM: Large file (18.5KB). Consider splitting.
- **File:** `\components\dashboard\CreatorHub.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `814e4e24-5d60-4de8-83b5-f70d61d7246c`

### 148. MEDIUM: Large file (15.0KB). Consider splitting.
- **File:** `\components\dashboard\StoryLibrary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `ade71f85-4179-40e1-ae06-69a747cd1092`

### 149. MEDIUM: Large file (13.1KB). Consider splitting.
- **File:** `\components\ErrorBoundary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `78777f69-7981-4f75-919e-5fabd28d3ceb`

### 150. MEDIUM: Large file (26.8KB). Consider splitting.
- **File:** `\components\GlassStoryCreatorWrapper.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `f57510c4-9d7f-4fe7-b404-17a3722ddd45`

### 151. MEDIUM: Large file (14.3KB). Consider splitting.
- **File:** `\components\story-creator\OptimizedUnifiedStoryCreator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `8006115e-85eb-4b08-98a7-6277fc7703a5`

### 152. MEDIUM: Large file (10.8KB). Consider splitting.
- **File:** `\components\story-creator\StoryCreationForm.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `fbe38f73-3eb5-4aee-acff-e513f9e23369`

### 153. MEDIUM: Large file (17.2KB). Consider splitting.
- **File:** `\components\StoryCard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `c6d531ca-3f09-4667-9782-6bad99ebf221`

### 154. MEDIUM: Large file (11.4KB). Consider splitting.
- **File:** `\components\StripeConnectOnboarding.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `aa559eb2-7dc1-413f-b658-786fbfd4aedb`

### 155. MEDIUM: Large file (22.1KB). Consider splitting.
- **File:** `\components\SubscriptionManager.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d8fa9341-5db3-4fd1-8bd8-466d5a9e0735`

### 156. MEDIUM: Large file (21.5KB). Consider splitting.
- **File:** `\components\UnifiedAnalyticsDashboard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `b54079d9-5d6b-488f-954a-b3e677c84133`

### 157. MEDIUM: Large file (30.8KB). Consider splitting.
- **File:** `\components\UnifiedStoryCreator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d971e74b-b39b-430b-8f19-e4656b3ba3f9`

### 158. MEDIUM: Large file (18.0KB). Consider splitting.
- **File:** `\components\v2\EnhancementSliders.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `c5189677-7160-4dcf-8d20-b0151b27b1e9`

### 159. MEDIUM: Large file (23.7KB). Consider splitting.
- **File:** `\components\v2\StoryLibrary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `4a24147b-fbcb-4338-928f-73248e524ab8`

### 160. MEDIUM: Large file (25.0KB). Consider splitting.
- **File:** `\components\v2\ThreePhaseWorkflow.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d41a08b1-110a-46fb-b680-51291b1836e6`

### 161. MEDIUM: Large file (19.1KB). Consider splitting.
- **File:** `\components\v2\TimelineVisualization.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `6fc2dcb6-c50c-425f-bb28-481fbb86d435`

### 162. MEDIUM: Large file (24.6KB). Consider splitting.
- **File:** `\components\v2\WorkflowInterface.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `67ae93f7-ab42-48b4-b926-83a97abdaf25`

### 163. MEDIUM: Large file (12.9KB). Consider splitting.
- **File:** `\hooks\useCreatorEarnings.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `bf8220b9-2cc8-44c8-a388-8a188905c71f`

### 164. MEDIUM: Large file (11.2KB). Consider splitting.
- **File:** `\infinite-pages-v3\app\api\admin\distribute-credits\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `e359fa67-3348-46a4-ba2f-cd7032ce09f7`

### 165. MEDIUM: Large file (10.9KB). Consider splitting.
- **File:** `\infinite-pages-v3\app\api\admin\process-payouts\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `75085930-1078-4522-bd2a-094714256d81`

### 166. MEDIUM: Large file (19.3KB). Consider splitting.
- **File:** `\infinite-pages-v3\app\api\stories\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `1973989d-52d8-464a-94bb-2d27aa2ffe47`

### 167. MEDIUM: Large file (15.6KB). Consider splitting.
- **File:** `\infinite-pages-v3\app\dashboard\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `032af0fa-30fc-410d-988c-78a5e156a539`

### 168. MEDIUM: Large file (19.4KB). Consider splitting.
- **File:** `\infinite-pages-v3\app\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d4c0b057-c6a3-49a6-88d5-013e8eb601fa`

### 169. MEDIUM: Large file (18.1KB). Consider splitting.
- **File:** `\infinite-pages-v3\middleware.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `bfbeaa63-b303-4350-ab2b-66ef87062525`

### 170. MEDIUM: Large file (12.8KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\features\creator\earnings-hub.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `f6be3a34-8273-4253-af9d-6f8322aacba8`

### 171. MEDIUM: Large file (12.6KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\features\library\ai-library-view.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `4e415812-02f7-4921-b2b1-7920e616562a`

### 172. MEDIUM: Large file (17.7KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\features\library\my-library-view.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `a1b74918-f471-401d-b61f-1e1b62238f42`

### 173. MEDIUM: Large file (24.6KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\features\stories\story-creator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `495c3e9a-d369-4cc9-bcc1-2b92f109825d`

### 174. MEDIUM: Large file (15.9KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\pricing\cost-display.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `fde723d8-8ff0-47d1-99b6-548524db0928`

### 175. MEDIUM: Large file (11.3KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\pricing\credit-purchase.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `48c01fd4-8528-459b-bb6d-108abce9b122`

### 176. MEDIUM: Large file (13.2KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\components\pricing\pricing-guard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `4a49d046-625d-4f11-a6d6-a2643ed00822`

### 177. MEDIUM: Large file (17.3KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\lib\ai\context-optimizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `841163b4-94b5-49c7-9b4b-5dc7cce4b9d1`

### 178. MEDIUM: Large file (16.9KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\lib\middleware\compression-middleware.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `92290b02-c006-4e3c-ae55-eef0d0b20935`

### 179. MEDIUM: Large file (10.5KB). Consider splitting.
- **File:** `\infinite-pages-v3\src\lib\pricing\cost-calculator.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `f036dbe1-1446-46cc-8bd1-4066378558f3`

### 180. MEDIUM: Large file (16.7KB). Consider splitting.
- **File:** `\lib\choice-books\choice-analytics.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `02cf0ab0-6070-4ad5-a1da-754357f74b09`

### 181. MEDIUM: Large file (23.0KB). Consider splitting.
- **File:** `\lib\choice-books\choice-generator.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d7cd334b-7db1-4ff0-ab3a-b600ba748834`

### 182. MEDIUM: Large file (13.9KB). Consider splitting.
- **File:** `\lib\choice-books\choice-prompts.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `700b23b1-47a8-4032-b6c6-c64cdff051c9`

### 183. MEDIUM: Large file (24.0KB). Consider splitting.
- **File:** `\lib\claude\adaptive-context.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `29d24b8f-06f3-46a1-9296-2817a626e973`

### 184. MEDIUM: Large file (17.3KB). Consider splitting.
- **File:** `\lib\claude\advanced-batch-processor.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `814002f3-0211-4a0e-a42d-8b20d797b31a`

### 185. MEDIUM: Large file (22.9KB). Consider splitting.
- **File:** `\lib\claude\ai-cost-optimization-hub.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `bff55894-aa2d-46ca-ae06-3ac3208f5d8e`

### 186. MEDIUM: Large file (45.7KB). Consider splitting.
- **File:** `\lib\claude\analytics.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `646f8c94-d24e-4937-a690-cd2d8ba12cc8`

### 187. MEDIUM: Large file (10.6KB). Consider splitting.
- **File:** `\lib\claude\batch.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `352fd0a1-3d8c-49ba-9692-824dd7a278a2`

### 188. MEDIUM: Large file (12.2KB). Consider splitting.
- **File:** `\lib\claude\cache.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `d9760f0c-ab21-4900-9e70-2c68970a78ef`

### 189. MEDIUM: Large file (15.6KB). Consider splitting.
- **File:** `\lib\claude\context-optimizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `1b929a4b-4e44-41eb-ace7-d658465629ac`

### 190. MEDIUM: Large file (20.7KB). Consider splitting.
- **File:** `\lib\claude\enhanced-cost-analytics.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `513136a4-6c82-43a1-be39-b41868c538b2`

### 191. MEDIUM: Large file (10.2KB). Consider splitting.
- **File:** `\lib\claude\fact-extractor.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `e6096aba-291b-431d-8fc1-e86244774c1f`

### 192. MEDIUM: Large file (38.4KB). Consider splitting.
- **File:** `\lib\claude\infinitePagesCache.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `0df98819-6606-4631-806f-d6b9ae711392`

### 193. MEDIUM: Large file (19.6KB). Consider splitting.
- **File:** `\lib\claude\intelligent-model-selector.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `9ee7a029-bc51-49d9-89d5-bc7d0508254f`

### 194. MEDIUM: Large file (11.0KB). Consider splitting.
- **File:** `\lib\claude\prompt-templates.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `f1655493-37be-4409-9b36-fbc74d8dbd75`

### 195. MEDIUM: Large file (29.1KB). Consider splitting.
- **File:** `\lib\claude\prompts.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `b92529a3-8f07-4ac5-a868-20a0a1cb2684`

### 196. MEDIUM: Large file (26.7KB). Consider splitting.
- **File:** `\lib\claude\service.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `00d88e31-4877-41a2-990c-440a5708c0ba`

### 197. MEDIUM: Large file (11.8KB). Consider splitting.
- **File:** `\lib\claude\streaming.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `2c59a354-2530-4117-9b0a-b186127aca3a`

### 198. MEDIUM: Large file (11.1KB). Consider splitting.
- **File:** `\lib\claude\v2-enhancements.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `ba141d0c-ce99-42f9-9eb4-ab4a169404e8`

### 199. MEDIUM: Large file (14.0KB). Consider splitting.
- **File:** `\lib\database\query-optimizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `e718fa18-7c59-41ff-a96b-7b55be797dcb`

### 200. MEDIUM: Large file (10.4KB). Consider splitting.
- **File:** `\lib\hooks\useQueryCache.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `9e675f32-23d7-4d28-b846-272032d1bc4a`

### 201. MEDIUM: Large file (14.3KB). Consider splitting.
- **File:** `\lib\rateLimit.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `8328a6bd-c872-4768-9e40-701646c25b80`

### 202. MEDIUM: Large file (11.3KB). Consider splitting.
- **File:** `\lib\request-tracking-init.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `6c025d72-853b-4b61-8a4f-54cb24265010`

### 203. MEDIUM: Large file (15.7KB). Consider splitting.
- **File:** `\lib\request-tracking.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `25040e98-5608-4f96-8544-f247f12f5c0c`

### 204. MEDIUM: Large file (27.2KB). Consider splitting.
- **File:** `\lib\series\series-context-manager.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `b0d69d37-f087-43cb-b438-2fad46c1c052`

### 205. MEDIUM: Large file (22.2KB). Consider splitting.
- **File:** `\lib\series-manager.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `fed17d1c-b799-4c1e-a44c-525e68711391`

### 206. MEDIUM: Large file (11.0KB). Consider splitting.
- **File:** `\lib\server-error-monitoring.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `c1c5ece5-acd7-4758-b574-334765216907`

### 207. MEDIUM: Large file (26.7KB). Consider splitting.
- **File:** `\lib\supabase\types.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `a73ace6e-c56f-44b1-804d-106cb052d7e8`

### 208. MEDIUM: Large file (11.7KB). Consider splitting.
- **File:** `\lib\types\ai.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `1e94a9ce-a279-4968-a884-943a46e0ed40`

### 209. MEDIUM: Large file (10.8KB). Consider splitting.
- **File:** `\lib\types\components.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `75362092-68b5-40cd-a8ed-a0eaf9ae527a`

### 210. MEDIUM: Large file (11.2KB). Consider splitting.
- **File:** `\lib\v2-feature-flags.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `fa18afe3-e7eb-4f14-bf53-e338ac9136ca`

### 211. MEDIUM: Large file (16.5KB). Consider splitting.
- **File:** `\middleware.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 30 minutes - 1 hour
- **Auto-fix:** Split into smaller, focused components
- **Flag ID:** `aca34031-93a5-401d-94bf-8bfea5eb7e4e`

## 🔥 LOW PRIORITY (195 flags)

### 1. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\admin\distribute-credits\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `1ce95627-109a-4429-84db-8db181f22fa4`

### 2. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\admin\monthly-maintenance\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `6840b0f4-0f6d-4cce-8851-387519fae116`

### 3. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\admin\process-payouts\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `c0896768-2bb2-487c-a159-e5e387cd1aa3`

### 4. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\admin\revert-excess-credits\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `15037564-c14f-4ed3-addd-2b2c0d1c8a2c`

### 5. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\creator\earnings\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `196ee7a8-147c-49b9-98a7-5c053d2921ac`

### 6. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\creators\earnings\enhanced\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `5a26b4a8-c5e4-4e86-9c66-4f37a1563ed3`

### 7. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\creators\stripe\status\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `9885271d-06e3-4839-b779-dc69a21023ee`

### 8. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\errors\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `842066be-e6cd-448d-8027-ec18824f2e32`

### 9. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\guest\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `e62b9647-143b-4fa2-9eb2-e09a61c18d6e`

### 10. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `13d44c2e-617a-4c46-8636-732f4d71f334`

### 11. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\[id]\analyze\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `a8bae2dd-8bcb-4c33-96b8-941bc612d7bf`

### 12. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\[id]\chapters\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `6036e003-b5b8-451f-9670-e6ed935521d8`

### 13. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\[id]\facts\extract\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `e655626e-6341-460d-9048-b543d73df0ee`

### 14. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\[id]\facts\optimize\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `6ad0a1cb-dd6c-467c-9ac3-70d43bacea0d`

### 15. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\stories\[id]\timeline\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `65a77b3c-3669-43de-886e-7e96a3b7419d`

### 16. LOW: Contains console.log statements. Remove for production.
- **File:** `\app\api\webhooks\stripe\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `644bfa3b-e21d-4807-a585-644ff730bd70`

### 17. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\basic\CharacterManagerButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `db9e9150-41a6-433c-bcb6-7f73f157f882`

### 18. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\basic\FactExtractionButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `1e2a85ac-477f-4ab6-92be-9575efcecbca`

### 19. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\basic\ThreePhaseWorkflowButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `6ffafb5c-08b9-4d2b-8560-0feea386cd94`

### 20. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\basic\TimelineButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `be8f6125-bdc8-4e10-a33f-3fa05fc389de`

### 21. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\basic\WorldBuilderButtons.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `d2418479-05b1-45ef-8a73-963387ec45fb`

### 22. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\ChoiceBookReader.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `a84672c2-03e8-4211-a366-6591e31969dc`

### 23. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\dashboard\CreatorHub.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `2c9831fd-ef87-4e9b-a754-18e743889fab`

### 24. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\dashboard\StoryLibrary.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `ca7c4c1b-b620-42e4-8a18-f464adbbcd19`

### 25. LOW: Contains console.log statements. Remove for production.
- **File:** `\components\v2\WorkflowInterface.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `18d0a965-0440-40e4-b16d-531bd42937c6`

### 26. LOW: Contains console.log statements. Remove for production.
- **File:** `\infinite-pages-v3\app\api\admin\distribute-credits\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `1e8653cb-8a6c-4639-b9a5-2f7ac9bc3e4c`

### 27. LOW: Contains console.log statements. Remove for production.
- **File:** `\infinite-pages-v3\app\api\admin\process-payouts\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `49fb8d02-3d45-4387-bd81-99c486b062d9`

### 28. LOW: Contains console.log statements. Remove for production.
- **File:** `\infinite-pages-v3\app\api\billing\webhook\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `3bf149a6-16a0-467c-bcd1-b7da7c301f41`

### 29. LOW: Contains console.log statements. Remove for production.
- **File:** `\infinite-pages-v3\app\api\stories\route.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `3a69bf19-3d37-4b64-a421-f65f2fc1db1f`

### 30. LOW: Contains console.log statements. Remove for production.
- **File:** `\infinite-pages-v3\middleware.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `ec9ca1ee-34e6-4b1a-96b4-5bc464f1aad9`

### 31. LOW: Contains console.log statements. Remove for production.
- **File:** `\infinite-pages-v3\src\lib\middleware\rate-limit.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `9826583a-d85a-4343-8951-cc7b5010ea0f`

### 32. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\claude\analytics.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `515b4928-3263-4a01-bdb3-eeb7b305ba42`

### 33. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\claude\cache.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `2a0ded9c-e284-42b8-8d2a-4332101a426f`

### 34. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\claude\fact-extractor.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `9002a82a-cb8b-4bbb-b4f3-7e0948e7ced9`

### 35. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\claude\infinitePagesCache.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `adaa69b0-fef3-452f-b82e-93da0bb75687`

### 36. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\feature-flags.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `40c811e7-a150-4e64-ad80-7508e0792160`

### 37. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\hooks\useDebounce.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `5cae6faa-8cde-4b17-8e5d-9e913922e9a3`

### 38. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\providers\QueryProvider.tsx`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `1b61be4e-c977-413c-a6d9-2bbfd759aa94`

### 39. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\rateLimit.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `37e0542a-090e-4c64-b63f-02dc44af4f5e`

### 40. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\request-tracking-init.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `a4bdb6f8-3d20-4cc3-89a7-10dddc04a471`

### 41. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\series\series-context-manager.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `d4333050-57de-4f3f-9145-1410e7d6fcda`

### 42. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\supabase\client.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `b0cbcb0f-b024-447d-b5cd-babea7e797b0`

### 43. LOW: Contains console.log statements. Remove for production.
- **File:** `\lib\v2-feature-flags.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `c0db5635-a614-4471-b507-16f1dbf75c3f`

### 44. LOW: Contains console.log statements. Remove for production.
- **File:** `\middleware.ts`
- **Category:** ARCHITECTURAL_VIOLATION
- **Effort:** 15-30 minutes
- **Auto-fix:** Replace with proper logging system
- **Flag ID:** `c29f7455-fa9a-4710-9290-97024b317e65`

### 45. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\admin\error-monitoring\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `66e981e5-862f-4a90-96d6-2b45cdc5da99`

### 46. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\admin\request-flow\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ca7c6439-66d5-4e9f-b7cb-392c5af18a6a`

### 47. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\admin\distribute-credits\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `25e6b021-3e7c-4f63-8a4a-13bd902e07ac`

### 48. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\admin\monthly-maintenance\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `93fe7729-7f03-4a5f-8ae2-b00370a7df5a`

### 49. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\admin\process-payouts\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `f849e1bd-b676-44c3-8e5a-2bc51bb0c705`

### 50. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\admin\revert-excess-credits\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `cb428ccc-4644-4516-b7fd-fd34b521970a`

### 51. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\ai-usage\track\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `a6046833-d849-4488-a91f-bd0cec6a3387`

### 52. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creator\earnings\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `d56641f0-b4f9-4218-b4b6-f0ca5c7ffbb6`

### 53. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\earnings\enhanced\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e569d04a-5be1-49db-a4ab-1f1697f36e6f`

### 54. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\earnings\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `1df06a72-e328-43e6-8af8-82a143b6643c`

### 55. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\earnings\unified\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `8246e4e5-b4ff-46f6-b73a-fc0a64252a03`

### 56. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\payout\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `c699ca8c-9f85-4a0d-93b3-ee7115e90609`

### 57. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\stripe\callback\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e9997205-906e-44f2-8169-b373ca5a59f1`

### 58. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\stripe\onboard\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `1dbcb888-6b17-48d8-9e1c-2b70d1f8737e`

### 59. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\stripe\refresh\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `67eb25a9-0638-49d4-94fb-341a4d4c29e6`

### 60. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\creators\stripe\status\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `041e2115-27df-4b48-9a17-2dbc75264d72`

### 61. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\errors\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `40369b04-8506-42bf-ba1e-e8841d3a55b3`

### 62. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\request-tracking\log\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9fbe2b31-9624-4b92-bc8b-6eb3ce28078e`

### 63. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\choice-books\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `27972ba5-ea2c-4ae6-9cc4-6952a4b91471`

### 64. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\guest\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `cb2325e5-2f50-47c5-bb23-cb6fa9bddf32`

### 65. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `1296ddbf-b543-404b-b839-18c82bcf44a4`

### 66. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\analyze\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `84d7b709-41e3-48f3-94ab-16a352edda6a`

### 67. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\chapters\generate\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `481fa2e1-c035-421d-8046-b2b47f792e6d`

### 68. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\chapters\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4d144a46-fef9-43b5-8759-94e35b535970`

### 69. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\chapters\stream\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6d1b99f5-0870-42f8-bffe-dfde1b49f526`

### 70. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\characters\generate\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e54ba922-e06c-4f6b-828e-a0b494f67576`

### 71. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\choices\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7833ede7-1e58-422d-8a2f-7d62428db7a3`

### 72. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\cover\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `d81561d1-bae2-4c10-bf9c-cb532c0016e7`

### 73. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\export\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `391fdd68-b5f1-446d-a063-7df92546a795`

### 74. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\facts\extract\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9bd66485-bf7f-4239-986f-5983618e1eea`

### 75. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\facts\optimize\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `68e67a4b-c5c2-47c3-92ff-1bd8322a9d44`

### 76. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\generate-choice-chapter\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4d6461f6-6dc4-4a66-b0f9-648891ceb15b`

### 77. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\timeline\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `c3a0ce8d-bfee-4166-9f29-3c201e5846f0`

### 78. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\stories\[id]\universe\setup\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ad3b98e1-734c-4272-934b-9551c065a904`

### 79. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\api\webhooks\stripe\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `08ae1596-b05b-4d31-b0fd-93546ad9e0a2`

### 80. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\auth\signup\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6689e838-002d-42f5-b1a9-644e841dfe8b`

### 81. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\dashboard\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6e0259f0-500c-4ba0-b0fb-9b4e6944640e`

### 82. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\error-monitoring-test\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `477a87e9-8219-4dbc-bf28-11de273c01d4`

### 83. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `14cd1d6b-9e6c-48a8-9b7d-6a67b6179ec1`

### 84. LOW: Large component without memoization. Consider React.memo.
- **File:** `\app\request-tracking-test\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `c5b3e9c8-1901-4c20-9121-ce1a203ce761`

### 85. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\AdminCreditDistribution.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `81f0a0e2-cfac-4219-8474-870473bfaeda`

### 86. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\AdminPayoutInterface.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4812afde-5665-434f-b38e-754f8309f597`

### 87. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\AICostDisplay.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `87fd27e7-2bdd-43b9-8a97-1f46f2a568ec`

### 88. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\basic\CharacterManagerButtons.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `b96e6f9e-b2b6-42f8-8b93-90fc5d4074b5`

### 89. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\basic\FactExtractionButtons.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `cad72fd0-e059-4949-a2c2-a36e0afd8196`

### 90. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\basic\ThreePhaseWorkflowButtons.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4bce24b9-a48d-4c13-9188-2d651499683d`

### 91. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\basic\WorldBuilderButtons.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `1d172e9f-a149-4265-9325-598c60899e79`

### 92. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CacheChart.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e4c06d49-7fba-454f-b283-944822df1b0d`

### 93. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\ChoiceBookReader.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e4364168-00c2-4808-9026-512d1e4ec541`

### 94. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CoverGenerator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `678cf620-5a0d-4863-bf6f-52733494ffb7`

### 95. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CreatorEarningsErrorBoundary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `c46e17d7-c9bb-473b-972d-efb1d809b3ea`

### 96. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CreatorEarningsHub.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6fbe5061-cc08-4bb6-a085-dacc35eef001`

### 97. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CreatorEarningsLoading.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `03514c6a-d9e3-4414-b1d5-96189575b562`

### 98. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CreditBalance.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `2259794a-5ea4-4643-9efd-4efc0435bde0`

### 99. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\CreditPurchase.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `c67adda6-c68f-4578-83fd-8b2ba7a79d7f`

### 100. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\dashboard\AnalyticsDashboard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6c2f035b-a5b3-4331-bd87-123d39a28985`

### 101. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\dashboard\CreatorHub.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `12abe09b-3485-41f0-8563-89cecb18f178`

### 102. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\dashboard\StoryLibrary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `edbc5288-355a-442b-82a0-f70f5991bc4d`

### 103. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\ErrorBoundary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `62eb1185-6a27-4cc2-9917-55c52d9df08c`

### 104. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\GlassCreatorEarningsWrapper.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `508e4707-69f1-4c8a-b3bd-365c0e43155f`

### 105. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\GlassStoryCreatorWrapper.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `5cf40e16-e6cf-448b-94af-cdcc84779fa3`

### 106. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\LibraryReader.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `5bf50453-568f-4034-a4a9-680c11df9977`

### 107. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\LoadingFallback.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `190509da-b7cf-40e3-9634-da38d5a2bde0`

### 108. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\PremiumUpgradePrompt.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `606c6e62-e6ba-4ec2-baad-d95cfc6a6a9d`

### 109. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\RequestTrackingStatus.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `dd38975d-54a7-4a40-b9aa-8030ea67f87e`

### 110. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\StoryCard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `dec27ff2-74df-4aa9-85e1-fd06aafcfb36`

### 111. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\StoryReader.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `54a1f443-70ee-4fb5-a74d-ee51843a8d9f`

### 112. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\StreamingStoryCreator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `016c2fc3-b70f-43e5-bbe7-656060dc7b7f`

### 113. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\StripeConnectOnboarding.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `40907ec3-a2eb-4195-b26a-27c76aaf775d`

### 114. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\SubscriptionManager.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `a431e668-0466-45e9-b14d-0fd96b4bad86`

### 115. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\TransparentStoryGenerator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `004363ef-4828-4b2e-a1c8-44dd46de0cc7`

### 116. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\ui\select.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ea96bb9a-794b-489e-861b-0291bf571593`

### 117. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\UnifiedAnalyticsDashboard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `580a26fe-f999-42bb-8fc4-1b27f62cc057`

### 118. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\UnifiedStoryCreator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `f725a93a-d909-48af-88ca-644e8423e9f2`

### 119. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\v2\EnhancementSliders.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7de6c1c4-a7fe-4bf1-9035-119783af4530`

### 120. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\v2\StoryLibrary.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `5ea886de-b461-4018-bb85-ec795ab0ee94`

### 121. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\v2\ThreePhaseWorkflow.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `80ab50a3-ed88-4d98-9f7a-01909cc61715`

### 122. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\v2\TimelineVisualization.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ab0e1189-8f28-4535-938c-248febf4ee21`

### 123. LOW: Large component without memoization. Consider React.memo.
- **File:** `\components\v2\WorkflowInterface.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `8e56a37f-f726-4eab-84d2-ae998bda7963`

### 124. LOW: Large component without memoization. Consider React.memo.
- **File:** `\hooks\useAIGeneration.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `bcc8cf53-e82c-46e6-8980-16c0ef0a1873`

### 125. LOW: Large component without memoization. Consider React.memo.
- **File:** `\hooks\useCreatorEarnings.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `467e53bb-baa7-452d-9fb6-7755efab4835`

### 126. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\api\admin\distribute-credits\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `31992d81-202a-4071-adf1-7d0d5a746b40`

### 127. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\api\admin\process-payouts\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `f253dfe6-9262-4e7f-b349-fc571500f50f`

### 128. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\api\billing\webhook\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `52cd19a0-b103-4ffb-96cd-5692bf9d979e`

### 129. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\api\stories\route.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `393d02f4-5a10-4caa-9b4d-3de3ffb7945b`

### 130. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\auth\signin\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `3354c7af-dffa-40a5-80bd-ba2b5ad130d6`

### 131. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\auth\signup\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `a61293f6-c50d-4626-a0f4-7d39bb6becfc`

### 132. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\dashboard\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6452da90-730a-4012-a5be-3638e2e72a80`

### 133. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\app\page.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `df4e6848-4aa1-43a0-9b56-07ca52dcd37a`

### 134. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\middleware.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ca601139-705f-4d72-a5cf-8128cd3a4e67`

### 135. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\features\creator\earnings-hub.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4e763448-8072-43dd-bf5b-6da559b82190`

### 136. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\features\library\ai-library-view.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `d72f2f23-1271-411c-8e61-c80f8e2db183`

### 137. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\features\library\my-library-view.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6bd16094-2005-4990-96af-78af610fd980`

### 138. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\features\stories\story-creator.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `2b4519b7-561a-469e-95bb-ac4cee286086`

### 139. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\pricing\cost-display.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `25fe19e6-ba97-4f84-adef-59bbba8c302d`

### 140. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\pricing\credit-purchase.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `dba515cc-3559-42b5-9fa3-c98cdf9981d1`

### 141. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\pricing\pricing-guard.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6c5b2308-50ed-41b0-b8bd-80c244cb2ae1`

### 142. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\components\ui\select.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9783059c-3c3a-4e59-af48-d89441356840`

### 143. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\lib\ai\context-optimizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e0208db4-53e5-4743-b953-875656dedfd8`

### 144. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\lib\ai\streaming.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7ff1b2a7-d674-4855-b904-8af82b3ac694`

### 145. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\lib\middleware\compression-middleware.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `97dd3293-ef16-41c4-96d0-e9d1d3b88b29`

### 146. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\lib\pricing\cost-calculator.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `b25b7820-33ce-43a6-82e8-267aea1cfb4e`

### 147. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\lib\security\content-sanitizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `b368fd60-230f-4479-9e1c-8e530ebc5e6d`

### 148. LOW: Large component without memoization. Consider React.memo.
- **File:** `\infinite-pages-v3\src\lib\utils\constants.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `40f3373a-b6e4-4fd6-9ba1-23a9e948b1c2`

### 149. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\ai-cost-calculator.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `3e975b2f-905e-4925-9c44-be518728a896`

### 150. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\character-manager.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4529d6ad-5b89-49f5-8170-fbf5d20cad8f`

### 151. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\choice-books\choice-analytics.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `68ca3574-68bf-4bea-bd76-e73c5a03415e`

### 152. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\choice-books\choice-generator.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `f939c55d-2008-4e9f-9ea2-e19d852cdb0d`

### 153. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\choice-books\choice-prompts.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `b29565ef-2aae-434f-8cc7-4ae9eb0827cd`

### 154. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\choice-books\choice-types.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `54c77b24-b4c9-4688-9f16-031df1b0c40a`

### 155. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\adaptive-context.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7b9d2bf8-61ef-47c3-9af7-9e3dbf15e050`

### 156. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\advanced-batch-processor.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `4780e216-d21a-4a8a-a4a2-ae768e92c9b5`

### 157. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\ai-cost-optimization-hub.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9b2e39e5-57ed-4edc-8464-0245af84c1a9`

### 158. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\analytics.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `a7ec7b1c-f613-420f-bd67-58b5cbd576bb`

### 159. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\batch.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9a5f0a3c-6ba5-4948-becc-8ac93022202a`

### 160. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\cache.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `42d55014-9d43-4873-bd9f-a503b4b26e06`

### 161. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\context-optimizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `36657d0e-1de6-4904-8fe6-3d15cc430c16`

### 162. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\enhanced-cost-analytics.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `c0f2cd25-19d4-4dd6-a224-9d07827549f3`

### 163. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\fact-extractor.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `d936c714-5b28-420c-a0d2-62f766fdf439`

### 164. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\infinitePagesCache.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ff1759c6-0468-42a9-9723-e54cb17258a1`

### 165. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\intelligent-model-selector.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `486d541f-3ac9-4616-a7b8-85730728f5c7`

### 166. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\prompt-templates.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `d8fb61b9-9af8-49a2-a07b-19f96e35a69e`

### 167. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\prompts.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6684ecb6-24f1-42af-b712-9a3586470129`

### 168. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\service.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `087ed664-6f48-4846-a419-f2e9e11e0d87`

### 169. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\sfsl-schema.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9d7bf10c-bbe7-48c3-9672-2b5faae83efc`

### 170. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\streaming.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `43479c5a-02de-49b9-9817-2b174245d842`

### 171. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\claude\v2-enhancements.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7e98719f-c510-4434-b504-b2503769b032`

### 172. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\constants.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `590aaa9f-449f-449e-b586-26cc1100108b`

### 173. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\creator-earnings.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `6df9fe2f-a1bc-4cc7-9323-3073aaeead7d`

### 174. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\database\query-optimizer.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `f9b5f455-80a3-4ce9-8c74-7b0034b9db3b`

### 175. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\error-monitoring.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `e5aea884-bdcd-4aa5-9835-7818bced3b16`

### 176. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\hooks\useDebounce.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `b9bd0d9c-1e29-4371-baf2-ebb47dd191a3`

### 177. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\hooks\useQueryCache.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `268148dc-e15a-41f6-ade0-b9ebbacfcc63`

### 178. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\providers\QueryProvider.tsx`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `5f2136b2-1c81-40a3-a4ea-50893e055e51`

### 179. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\rateLimit.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `a5c6dbcb-439d-4c0c-b80a-ff41856fc352`

### 180. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\request-tracking-init.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `cfd903d6-e0dc-42da-a819-59c417ee44fb`

### 181. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\request-tracking.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `dc72d5d9-f393-4a3d-9802-12d98dfca99c`

### 182. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\series\series-context-manager.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `5ee7fa76-69f0-4148-9518-e7fd222788f6`

### 183. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\series\series-types.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `9602b637-2ed2-4552-bb84-7bc2b0e682ad`

### 184. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\series-manager.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ccf109a1-4405-4f65-bb29-0055c0cb850b`

### 185. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\server-error-monitoring.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `f848d19b-3ecf-46d0-b5e0-b6b1e69ea8a3`

### 186. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\stripe-payouts.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `cf1328a4-f53a-4e99-8877-e0bb7ec17c2e`

### 187. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\supabase\types.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7fdb1dec-9a5d-46c2-8558-af890a3ced25`

### 188. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\types\ai.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `bb7de337-6ad4-4bd7-a003-35f88de15852`

### 189. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\types\api.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `d69ad42b-c6ee-4cad-9739-c2b102f435b2`

### 190. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\types\components.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `7340bc86-c5a9-4516-abd7-f0cf8d7d8f25`

### 191. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\types\database.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `ef070049-2b25-4d30-a5d1-9efece325033`

### 192. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\types\index.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `46bee402-ced8-4975-af21-a9b1350d436d`

### 193. LOW: Large component without memoization. Consider React.memo.
- **File:** `\lib\v2-feature-flags.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `1af8499d-4d8a-472b-9226-a1faf34a24a6`

### 194. LOW: Large component without memoization. Consider React.memo.
- **File:** `\middleware.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `cf9537db-40c5-49a5-a5c6-cd6d7765b7d8`

### 195. LOW: Large component without memoization. Consider React.memo.
- **File:** `\types\creator-earnings.ts`
- **Category:** PERFORMANCE_ISSUE
- **Effort:** 15-30 minutes
- **Auto-fix:** Add React.memo if component props are stable
- **Flag ID:** `60aa9b76-b284-4109-b1f1-42ac61cdca67`


## 📋 RESOLUTION WORKFLOW

1. Start with CRITICAL flags
2. Mark flags as IN_PROGRESS when starting
3. Mark as RESOLVED when complete
4. Use flag ID for tracking

**Commands:**
```bash
npm run flags:list           # Show all flags
npm run flags:resolve <id>   # Mark flag as resolved
npm run flags:progress <id>  # Mark flag as in progress
```
