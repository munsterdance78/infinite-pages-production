// autofix-rules.js - Infinite Pages specific debugging and auto-fix rules
const INFINITE_PAGES_AUTOFIX_RULES = {
  // Safe fixes - Claude can apply these automatically for Infinite Pages
  AUTO_FIX: [
    {
      type: 'missing_alt_text',
      description: 'Add alt text to images',
      risk: 'low',
      applies_to: ['img[src]:not([alt])', 'img[alt=""]'],
      fix_template: 'Add descriptive alt text based on story/writing context',
      code_fix: (element) => `
// AUTO-FIX: Add descriptive alt text to images
const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
images.forEach(img => {
  const src = img.src || img.getAttribute('src') || '';
  const filename = src.split('/').pop().replace(/\.[^/.]+$/, '');
  const altText = filename.replace(/[-_]/g, ' ') || 'Story illustration';
  img.setAttribute('alt', altText);
  console.log(\`✅ Added alt text: "\${altText}" to \${src}\`);
});`
    },
    {
      type: 'missing_page_title',
      description: 'Add page title for story pages',
      risk: 'low',
      applies_to: ['title:empty', 'head:not(:has(title))'],
      fix_template: 'Add <title>Infinite Pages - AI Story Creation</title> or story-specific title',
      code_fix: () => `
<!-- AUTO-FIX: Add page title -->
<title>Infinite Pages - Create Infinite AI Stories</title>

// Or dynamically:
document.title = 'Infinite Pages - Create Infinite AI Stories';
console.log('✅ Added page title for Infinite Pages');`
    },
    {
      type: 'missing_meta_description',
      description: 'Add meta description for story platform',
      risk: 'low',
      applies_to: ['head:not(:has(meta[name="description"]))'],
      fix_template: 'Add <meta name="description" content="Create infinite stories with AI collaboration">',
      code_fix: () => `
<!-- AUTO-FIX: Add meta description -->
<meta name="description" content="Create infinite AI-powered stories with collaborative writing. Start your adventure with Infinite Pages - where imagination meets artificial intelligence.">

// Or dynamically:
const metaDesc = document.createElement('meta');
metaDesc.name = 'description';
metaDesc.content = 'Create infinite AI-powered stories with collaborative writing. Start your adventure with Infinite Pages - where imagination meets artificial intelligence.';
document.head.appendChild(metaDesc);
console.log('✅ Added meta description for Infinite Pages');`
    },
    {
      type: 'missing_h1',
      description: 'Add main heading to story pages',
      risk: 'low',
      applies_to: ['body:not(:has(h1))'],
      fix_template: 'Add appropriate <h1> tag for story creation page',
      code_fix: () => `
<!-- AUTO-FIX: Add main heading -->
<h1 class="text-4xl font-bold text-center mb-8">Create Your Infinite Story</h1>

// Or dynamically:
const mainHeading = document.createElement('h1');
mainHeading.className = 'text-4xl font-bold text-center mb-8';
mainHeading.textContent = 'Create Your Infinite Story';
document.body.insertBefore(mainHeading, document.body.firstChild);
console.log('✅ Added main heading for story creation page');`
    },
    {
      type: 'missing_lang_attribute',
      description: 'Add language attribute',
      risk: 'low',
      applies_to: ['html:not([lang])'],
      fix_template: 'Add lang="en" to <html> tag',
      code_fix: () => `
<!-- AUTO-FIX: Add language attribute -->
<html lang="en">

// Or dynamically:
document.documentElement.setAttribute('lang', 'en');
console.log('✅ Added language attribute to HTML tag');`
    },
    {
      type: 'missing_viewport_meta',
      description: 'Add responsive viewport meta tag',
      risk: 'low',
      applies_to: ['head:not(:has(meta[name="viewport"]))'],
      fix_template: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      code_fix: () => `
<!-- AUTO-FIX: Add responsive viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

// Or dynamically:
const viewport = document.createElement('meta');
viewport.name = 'viewport';
viewport.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
document.head.appendChild(viewport);
console.log('✅ Added responsive viewport meta tag');`
    },
    {
      type: 'story_creation_button_missing_aria',
      description: 'Add accessibility to story creation buttons',
      risk: 'low',
      applies_to: ['button:contains("Create Story"):not([aria-label])'],
      fix_template: 'Add aria-label to story creation buttons',
      code_fix: () => `
// AUTO-FIX: Add accessibility labels to story creation buttons
const storyButtons = document.querySelectorAll('button:not([aria-label])');
storyButtons.forEach(btn => {
  const text = btn.textContent.trim();
  if (text.toLowerCase().includes('create') || text.toLowerCase().includes('story')) {
    btn.setAttribute('aria-label', \`\${text} - Start creating your AI-powered story\`);
    console.log(\`✅ Added aria-label to button: "\${text}"\`);
  }
});`
    },
    {
      type: 'cors_error',
      description: 'Fix CORS configuration for API endpoints',
      risk: 'medium',
      applies_to: ['api endpoints'],
      fix_template: 'Update CORS headers to allow automation tools',
      code_fix: () => `
// AUTO-FIX: Update CORS configuration in middleware.ts
const corsOptions = {
  origin: [
    'https://www.infinite-pages.com',
    'http://localhost:3000',
    'http://localhost:3001',
    // Add for automated testing:
    'null' // For headless browsers
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

// Apply to all API routes:
res.headers.set('Access-Control-Allow-Origin', origin || '*');
res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.headers.set('Access-Control-Allow-Credentials', 'false');

console.log('✅ Updated CORS configuration to allow automation tools');`
    }
  ],

  // Infinite Pages specific issues requiring approval
  NEEDS_APPROVAL: [
    {
      type: 'claude_api_error',
      description: 'Claude API integration failure',
      risk: 'critical',
      reason: 'Story creation depends on Claude API - affects core functionality',
      fix_template: 'Fix Claude API integration: check ANTHROPIC_API_KEY and error handling',
      code_fix: () => `
// AUTO-FIX: Claude API error handling (requires approval)
// 1. Check environment variable in your .env.local:
ANTHROPIC_API_KEY=sk-ant-api03-...your-key...

// 2. Add error handling to your Claude service:
try {
  const response = await claudeService.generateStoryFoundation(params);
  return response;
} catch (error) {
  console.error('Claude API Error:', error);

  // Fallback or retry logic
  if (error.status === 503) {
    // Retry after delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return await claudeService.generateStoryFoundation(params);
  }

  throw new Error(\`Story generation failed: \${error.message}\`);
}

// 3. Update API route error responses:
return NextResponse.json({
  error: 'Story generation temporarily unavailable',
  details: 'Please try again in a moment',
  fallback: 'Use story templates while AI is recovering'
}, { status: 503 });`
    },
    {
      type: 'story_endpoint_404',
      description: 'Story creation endpoints not found',
      risk: 'critical',
      reason: 'Missing API endpoints break story creation workflow',
      fix_template: 'Deploy missing endpoints: /api/stories/novel, /api/stories/ai-assisted',
      code_fix: () => `
// AUTO-FIX: Create missing story endpoints
// 1. Create app/api/stories/novel/route.ts:
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) return authResult;

  const body = await request.json();
  const { title, genre, premise, chapterCount = 10 } = body;

  // Novel creation logic here
  const novel = await createNovelWithChapters({
    title, genre, premise, chapterCount
  });

  return NextResponse.json({ novel }, { status: 201 });
}

export async function GET(request: NextRequest) {
  // List existing novels
  return NextResponse.json({ novels: [] });
}

// 2. Create app/api/stories/ai-assisted/route.ts:
export async function POST(request: NextRequest) {
  // AI-assisted story creation logic
  const collaboration = await startAICollaboration(body);
  return NextResponse.json({ collaboration }, { status: 201 });
}

// 3. Deploy to Vercel:
// git add . && git commit -m "Add missing story endpoints" && git push`
    },
    {
      type: 'demo_story_500_error',
      description: 'Demo story creation failing with 500 error',
      risk: 'high',
      reason: 'Prevents users from trying the platform',
      fix_template: 'Debug and fix demo story generation service',
      code_fix: () => `
// AUTO-FIX: Fix demo story 500 errors
// 1. Add error handling to app/api/demo/story/route.ts:
export async function POST(request: NextRequest) {
  try {
    // Add request validation
    const body = await request.json();
    if (!body.genre || !body.premise) {
      return NextResponse.json({
        error: 'Missing required fields: genre and premise'
      }, { status: 400 });
    }

    // Add rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const canProceed = await checkDemoRateLimit(ip);
    if (!canProceed) {
      return NextResponse.json({
        error: 'Demo rate limit exceeded. Try again in 5 minutes.'
      }, { status: 429 });
    }

    // Generate demo story with fallback
    let story;
    try {
      story = await generateDemoStory(body);
    } catch (aiError) {
      // Fallback to template story
      story = getDemoStoryTemplate(body.genre);
      console.warn('Demo AI failed, using template:', aiError);
    }

    return NextResponse.json({ story }, { status: 201 });

  } catch (error) {
    console.error('Demo story error:', error);
    return NextResponse.json({
      error: 'Demo story creation failed',
      message: 'Please try a simpler premise or try again later'
    }, { status: 500 });
  }
}`
    },
    {
      type: 'supabase_auth_error',
      description: 'Authentication system errors',
      risk: 'high',
      reason: 'User login/signup affects platform access',
      fix_template: 'Check Supabase configuration and auth middleware',
      code_fix: () => `
// AUTO-FIX: Supabase auth configuration
// 1. Verify environment variables in .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

// 2. Fix auth middleware in lib/auth/middleware.ts:
export async function requireAuth(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth session error:', error);
      return NextResponse.json({
        error: 'Authentication failed',
        details: 'Please log in again'
      }, { status: 401 });
    }

    if (!session?.user) {
      return NextResponse.json({
        error: 'Authentication required',
        loginUrl: '/auth/login'
      }, { status: 401 });
    }

    return { success: true, user: session.user, supabase };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({
      error: 'Authentication system error'
    }, { status: 500 });
  }
}

// 3. Add auth error boundaries in components:
if (error?.message?.includes('auth')) {
  // Redirect to login or show auth error
  router.push('/auth/login?error=session-expired');
}`
    },
    {
      type: 'admin_endpoint_unauthorized',
      description: 'Admin endpoints returning 401 without proper auth',
      risk: 'medium',
      reason: 'Admin functionality needs proper authentication flow',
      fix_template: 'Implement proper admin authentication flow',
      code_fix: () => `
// AUTO-FIX: Admin authentication flow
// 1. Add admin check middleware:
export async function requireAdmin(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) return authResult;

  const { user, supabase } = authResult;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile?.is_admin) {
    return NextResponse.json({
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    }, { status: 403 });
  }

  return { success: true, user, supabase, isAdmin: true };
}

// 2. Use in admin endpoints:
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) return adminAuth;

  // Admin functionality here
  return NextResponse.json({ adminData: 'success' });
}

// 3. Add admin UI protection:
const AdminPanel = () => {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return <div>Admin access required</div>;
  }

  return <AdminContent />;
};`
    },
    {
      type: 'rate_limiting_too_aggressive',
      description: 'Rate limiting blocking legitimate usage',
      risk: 'medium',
      reason: 'May prevent users from creating stories',
      fix_template: 'Adjust rate limiting for story creation endpoints',
      code_fix: () => `
// AUTO-FIX: Adjust rate limiting configuration
// 1. Update middleware.ts rate limits:
const ROUTE_RATE_LIMITS = {
  '/api/stories': {
    requests: 10, // Increased from 5
    window: 60000, // 1 minute
    subscription_multiplier: { pro: 3, premium: 5 }
  },
  '/api/stories/guest': {
    requests: 3, // For unauthenticated users
    window: 300000 // 5 minutes
  },
  '/api/demo/story': {
    requests: 5, // More lenient for demos
    window: 600000 // 10 minutes
  }
};

// 2. Add monitoring bypass:
const monitoringPaths = [
  '/api/admin/request-flow/health',
  '/api/health',
  '/api/admin/request-flow/stats'
];

if (monitoringPaths.includes(pathname)) {
  return res; // Skip rate limiting
}

// 3. Add graceful degradation:
if (!rateLimitResult.success) {
  // Instead of blocking, add delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({
    warning: 'Rate limit reached - request delayed',
    retryAfter: rateLimitResult.retryAfter
  }, {
    status: 200, // Don't block, just warn
    headers: rateLimitResult.headers
  });
}`
    }
  ],

  // Critical issues requiring manual intervention
  MANUAL_ONLY: [
    {
      type: 'environment_variables_missing',
      description: 'Missing environment variables in Vercel',
      risk: 'critical',
      reason: 'Requires access to Vercel dashboard and API keys'
    },
    {
      type: 'database_migration_needed',
      description: 'Database schema missing required tables',
      risk: 'critical',
      reason: 'Requires database admin access and migration execution'
    },
    {
      type: 'vercel_deployment_config',
      description: 'Vercel deployment configuration issues',
      risk: 'high',
      reason: 'Requires Vercel dashboard access and deployment settings'
    },
    {
      type: 'stripe_payment_integration',
      description: 'Payment processing issues',
      risk: 'high',
      reason: 'Requires Stripe dashboard access and financial configuration'
    }
  ],

  // Infinite Pages specific endpoint checks
  ENDPOINT_CHECKS: [
    {
      endpoint: '/api/stories',
      methods: ['GET', 'POST'],
      description: 'Main story creation and listing',
      expected_auth: true,
      expected_responses: {
        GET: { authenticated: 200, unauthenticated: 401 },
        POST: { authenticated: 201, unauthenticated: 401 }
      }
    }
  ]
};

// Helper function to classify Infinite Pages specific issues
function classifyInfinitePageIssue(issue) {
  // Check for Infinite Pages specific patterns
  const issueText = (issue.message || issue.type || '').toLowerCase();

  // Claude API specific errors
  if (issueText.includes('claude') || issueText.includes('anthropic') ||
      issueText.includes('story generation failed') || issueText.includes('503 service unavailable')) {
    return {
      category: 'NEEDS_APPROVAL',
      rule: INFINITE_PAGES_AUTOFIX_RULES.NEEDS_APPROVAL.find(r => r.type === 'claude_api_error'),
      can_auto_fix: false,
      requires_approval: true,
      priority: 'critical',
      infinite_pages_specific: true
    };
  }

  // Story endpoint 404 errors
  if (issueText.includes('404') && (issueText.includes('/api/stories/novel') || issueText.includes('/api/stories/ai-assisted'))) {
    return {
      category: 'NEEDS_APPROVAL',
      rule: INFINITE_PAGES_AUTOFIX_RULES.NEEDS_APPROVAL.find(r => r.type === 'story_endpoint_404'),
      can_auto_fix: false,
      requires_approval: true,
      priority: 'critical',
      infinite_pages_specific: true
    };
  }

  // Demo story 500 errors
  if (issueText.includes('500') && issueText.includes('demo')) {
    return {
      category: 'NEEDS_APPROVAL',
      rule: INFINITE_PAGES_AUTOFIX_RULES.NEEDS_APPROVAL.find(r => r.type === 'demo_story_500_error'),
      can_auto_fix: false,
      requires_approval: true,
      priority: 'high',
      infinite_pages_specific: true
    };
  }

  // Supabase/auth errors
  if (issueText.includes('supabase') || issueText.includes('auth') || issueText.includes('unauthorized')) {
    return {
      category: 'NEEDS_APPROVAL',
      rule: INFINITE_PAGES_AUTOFIX_RULES.NEEDS_APPROVAL.find(r => r.type === 'supabase_auth_error'),
      can_auto_fix: false,
      requires_approval: true,
      priority: 'high',
      infinite_pages_specific: true
    };
  }

  // Fall back to standard classification
  return classifyStandardIssue(issue);
}

// Standard issue classification (from original rules)
function classifyStandardIssue(issue) {
  // Check AUTO_FIX rules
  for (const rule of INFINITE_PAGES_AUTOFIX_RULES.AUTO_FIX) {
    if (issue.type === rule.type ||
        (issue.message && issue.message.toLowerCase().includes(rule.type.replace('_', ' ')))) {
      return {
        category: 'AUTO_FIX',
        rule: rule,
        can_auto_fix: true,
        fix_instructions: rule.fix_template,
        priority: 'low'
      };
    }
  }

  // Check NEEDS_APPROVAL rules
  for (const rule of INFINITE_PAGES_AUTOFIX_RULES.NEEDS_APPROVAL) {
    if (issue.type === rule.type ||
        (issue.message && issue.message.toLowerCase().includes(rule.type.replace('_', ' ')))) {
      return {
        category: 'NEEDS_APPROVAL',
        rule: rule,
        can_auto_fix: false,
        requires_approval: true,
        fix_instructions: rule.fix_template,
        priority: rule.risk === 'critical' ? 'critical' : rule.risk === 'high' ? 'high' : 'medium'
      };
    }
  }

  // Check MANUAL_ONLY rules
  for (const rule of INFINITE_PAGES_AUTOFIX_RULES.MANUAL_ONLY) {
    if (issue.type === rule.type) {
      return {
        category: 'MANUAL_ONLY',
        rule: rule,
        can_auto_fix: false,
        requires_manual_fix: true,
        reason: rule.reason,
        priority: 'critical'
      };
    }
  }

  // Default: needs approval for unknown issues
  return {
    category: 'NEEDS_APPROVAL',
    can_auto_fix: false,
    requires_approval: true,
    reason: 'Unknown issue type - requires human review',
    priority: 'medium'
  };
}

// Main classification function
function classifyIssue(issue) {
  return classifyInfinitePageIssue(issue);
}

// Function to get endpoint testing configuration
function getEndpointTests() {
  return INFINITE_PAGES_AUTOFIX_RULES.ENDPOINT_CHECKS;
}

// Function to analyze endpoint test results
function analyzeEndpointResults(endpointResults) {
  const issues = [];

  for (const result of endpointResults) {
    const config = INFINITE_PAGES_AUTOFIX_RULES.ENDPOINT_CHECKS.find(c => c.endpoint === result.endpoint);
    if (!config) continue;

    // Check if endpoint exists (not 404)
    if (result.status === 404) {
      issues.push({
        type: 'story_endpoint_404',
        message: `${result.endpoint} returned 404 - endpoint missing`,
        endpoint: result.endpoint,
        severity: 'critical'
      });
    }

    // Check for 500 errors on demo endpoints
    if (result.endpoint.includes('demo') && result.status === 500) {
      issues.push({
        type: 'demo_story_500_error',
        message: `${result.endpoint} failing with 500 error`,
        endpoint: result.endpoint,
        severity: 'high'
      });
    }

    // Check for Claude API errors (503 Service Unavailable)
    if (result.status === 503) {
      issues.push({
        type: 'claude_api_error',
        message: `${result.endpoint} returning 503 - likely Claude API issue`,
        endpoint: result.endpoint,
        severity: 'critical'
      });
    }
  }

  return issues;
}

module.exports = {
  INFINITE_PAGES_AUTOFIX_RULES,
  classifyIssue,
  getEndpointTests,
  analyzeEndpointResults
};