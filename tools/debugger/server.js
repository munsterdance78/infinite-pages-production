// server.js - Infinite Pages Website Debugger Server with Safety Monitoring
const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const ProcessMonitor = require('./process-monitor');
const { classifyIssue, getEndpointTests, analyzeEndpointResults } = require('./autofix-rules');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize process monitor with safety limits
const monitor = new ProcessMonitor({
  maxMemoryMB: 100, // VERY CONSERVATIVE - once we get main bugs we can increase time
  maxBrowserMemoryMB: 80, // VERY CONSERVATIVE
  maxSystemMemoryPercent: 60, // VERY CONSERVATIVE
  maxScanTimeoutMs: 10 * 1000, // VERY SHORT: 10 seconds - will increase after main bugs fixed
  monitorIntervalMs: 2 * 1000, // CHECK EVERY 2 SECONDS
  logFile: './claude-debugger/monitor.log'
});

// Simple URL validation
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Main crawl endpoint with Infinite Pages specific testing and safety monitoring
app.post('/crawl', async (req, res) => {
  const { url, options = {} } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL format' });

  // Check memory limits before starting scan
  const preCheck = await monitor.checkMemoryLimits();
  if (!preCheck.memoryOk) {
    return res.status(503).json({
      error: 'Cannot start scan - safety limits exceeded',
      reasons: preCheck.reasons,
      memory: preCheck.memory
    });
  }

  const results = {
    url,
    timestamp: new Date().toISOString(),
    errors: [],
    warnings: [],
    accessibility: [],
    performance: {},
    infinitePages: {
      endpointTests: [],
      storyCreationStatus: 'unknown',
      authStatus: 'unknown',
      adminStatus: 'unknown'
    },
    safety: {
      monitorEnabled: true,
      memoryLimitMB: monitor.options.maxMemoryMB,
      browserLimitMB: monitor.options.maxBrowserMemoryMB,
      timeoutMs: monitor.options.maxScanTimeoutMs
    },
    summary: { errorCount: 0, warningCount: 0, status: 'unknown' }
  };

  let browser, page;
  const startTime = Date.now();
  let scanTimedOut = false;

  // Set up scan timeout to prevent hanging
  const scanTimeout = setTimeout(async () => {
    scanTimedOut = true;
    await monitor.logMessage(`⏰ Scan timeout reached for ${url} after ${monitor.options.maxScanTimeoutMs / 1000}s`);

    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Browser already closed or crashed
      }
    }
  }, monitor.options.maxScanTimeoutMs);

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--memory-pressure-off',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
    page = await browser.newPage();

    // Periodic memory checks during scan
    const memoryCheckInterval = setInterval(async () => {
      if (scanTimedOut) {
        clearInterval(memoryCheckInterval);
        return;
      }

      const check = await monitor.checkMemoryLimits();
      if (!check.memoryOk) {
        scanTimedOut = true;
        clearInterval(memoryCheckInterval);

        await monitor.logMessage(`🚨 Memory limit exceeded during scan of ${url}`);
        for (const reason of check.reasons) {
          await monitor.logMessage(`   • ${reason}`);
        }

        try {
          if (browser) await browser.close();
        } catch (e) {
          // Browser cleanup failed
        }

        return res.status(503).json({
          error: 'Scan terminated - memory safety limits exceeded',
          reasons: check.reasons,
          memory: check.memory,
          partialResults: results
        });
      }
    }, 5000); // Check every 5 seconds during scan

    // Enhanced console error capture with Infinite Pages context
    page.on('console', msg => {
      if (scanTimedOut) return;

      if (msg.type() === 'error') {
        const error = {
          type: 'console_error',
          message: msg.text(),
          location: msg.location()
        };
        const classification = classifyIssue(error);
        results.errors.push({ ...error, ...classification });
      } else if (msg.type() === 'warning') {
        results.warnings.push({
          type: 'console_warning',
          message: msg.text()
        });
      }
    });

    // Enhanced network monitoring for Infinite Pages APIs
    page.on('response', response => {
      if (scanTimedOut) return;

      const url = response.url();
      const status = response.status();

      // Log all API responses for analysis
      if (url.includes('/api/')) {
        results.infinitePages.endpointTests.push({
          endpoint: new URL(url).pathname,
          status: status,
          statusText: response.statusText(),
          method: 'GET', // This will be the method from navigation
          url: url
        });
      }

      // Classify failures
      if (status >= 400) {
        const error = {
          type: status === 404 ? 'endpoint_not_found' :
                status === 500 ? 'server_error' :
                status === 503 ? 'service_unavailable' : 'network_error',
          message: `${status} ${response.statusText()} - ${url}`,
          status: status,
          url: url
        };
        const classification = classifyIssue(error);
        results.errors.push({ ...error, ...classification });
      }
    });

    // Navigate to page with timeout protection
    try {
      if (!scanTimedOut) {
        const response = await page.goto(url, {
          timeout: Math.min(30000, monitor.options.maxScanTimeoutMs - 5000),
          waitUntil: 'networkidle'
        });

        if (!response?.ok()) {
          results.errors.push({
            type: 'page_load_error',
            message: `Page returned ${response?.status()} ${response?.statusText()}`,
            status: response?.status()
          });
        }
      }
    } catch (e) {
      if (!scanTimedOut) {
        results.errors.push({
          type: 'navigation_error',
          message: e.message
        });
      }
    }

    // Test Infinite Pages specific API endpoints with safety checks
    if (!scanTimedOut && options.testEndpoints !== false) {
      const endpointTests = getEndpointTests();

      for (const endpointConfig of endpointTests) {
        if (scanTimedOut) break;

        // Check memory before each endpoint test
        const midCheck = await monitor.checkMemoryLimits();
        if (!midCheck.memoryOk) {
          results.warnings.push({
            type: 'endpoint_test_aborted',
            message: 'Endpoint testing stopped due to memory limits'
          });
          break;
        }

        for (const method of endpointConfig.methods) {
          if (scanTimedOut) break;

          try {
            // Test endpoint with fetch
            const testResult = await page.evaluate(async ({ endpoint, method: testMethod }) => {
              try {
                const response = await fetch(endpoint, {
                  method: testMethod,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  ...(testMethod === 'POST' ? {
                    body: JSON.stringify({
                      genre: 'fantasy',
                      premise: 'Test story premise',
                      title: 'Test Story'
                    })
                  } : {})
                });

                return {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok
                };
              } catch (error) {
                return {
                  status: 'error',
                  statusText: error.message,
                  ok: false
                };
              }
            }, { endpoint: endpointConfig.endpoint, method });

            results.infinitePages.endpointTests.push({
              endpoint: endpointConfig.endpoint,
              method: method,
              description: endpointConfig.description,
              status: testResult.status,
              statusText: testResult.statusText,
              expected_auth: endpointConfig.expected_auth,
              expected_admin: endpointConfig.expected_admin
            });

          } catch (error) {
            results.infinitePages.endpointTests.push({
              endpoint: endpointConfig.endpoint,
              method: method,
              status: 'test_failed',
              error: error.message
            });
          }
        }
      }
    }

    // Performance metrics with safety tracking
    const loadTime = Date.now() - startTime;
    results.performance = {
      loadTime: `${loadTime}ms`,
      status: loadTime > 3000 ? 'slow' : loadTime > 1000 ? 'moderate' : 'fast',
      safetyTimeout: scanTimedOut
    };

    // Enhanced page analysis for Infinite Pages with timeout protection
    if (!scanTimedOut) {
      try {
        const pageAnalysis = await page.evaluate(() => {
          const issues = [];

          // Standard accessibility checks
          const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
          imagesWithoutAlt.forEach((img) => {
            const src = img.src || img.getAttribute('src') || '';
            issues.push({
              type: 'missing_alt_text',
              message: `Image missing alt text: ${src.split('/').pop()}`,
              element: `img[src*="${src.split('/').pop()}"]`,
              fix_suggestion: `Add alt="${src.split('/').pop().replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}"`
            });
          });

          // Page title check
          const title = document.querySelector('title');
          if (!title || !title.textContent.trim()) {
            issues.push({
              type: 'missing_page_title',
              message: 'Page missing title',
              element: 'title',
              fix_suggestion: 'Add <title>Infinite Pages - AI Story Creation</title>'
            });
          } else if (!title.textContent.includes('Infinite Pages')) {
            issues.push({
              type: 'title_missing_branding',
              message: 'Page title missing Infinite Pages branding',
              element: 'title',
              fix_suggestion: `Update title to include "Infinite Pages" brand`
            });
          }

          // Meta description check with Infinite Pages context
          const metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            issues.push({
              type: 'missing_meta_description',
              message: 'Missing meta description for story platform',
              element: 'head',
              fix_suggestion: 'Add <meta name="description" content="Create infinite stories with AI collaboration on Infinite Pages">'
            });
          }

          // Heading structure
          const h1s = document.querySelectorAll('h1');
          if (h1s.length === 0) {
            issues.push({
              type: 'missing_h1',
              message: 'No h1 heading found',
              element: 'body',
              fix_suggestion: 'Add <h1>Create Your Story</h1> or similar main heading'
            });
          } else if (h1s.length > 1) {
            issues.push({
              type: 'multiple_h1',
              message: `${h1s.length} h1 headings found (should be 1)`,
              element: 'h1:nth-of-type(n+2)',
              fix_suggestion: 'Change extra h1 tags to h2, h3, etc.'
            });
          }

          // Check for error messages on page (indicating failed API calls)
          const errorMessages = document.querySelectorAll('[class*="error"], .error-message, [role="alert"]');
          errorMessages.forEach((errorEl) => {
            if (errorEl.textContent.trim()) {
              issues.push({
                type: 'page_error_displayed',
                message: `Error message shown to user: ${errorEl.textContent.trim().substring(0, 100)}`,
                element: errorEl.className || errorEl.tagName.toLowerCase(),
                fix_suggestion: 'Investigate and resolve the underlying error'
              });
            }
          });

          return issues;
        });

        // Classify all accessibility issues
        results.accessibility = pageAnalysis.map(issue => {
          const classification = classifyIssue(issue);
          return { ...issue, ...classification };
        });

      } catch (e) {
        results.warnings.push({
          type: 'page_analysis_failed',
          message: 'Could not run page analysis: ' + e.message
        });
      }
    }

    // Clear memory check interval
    clearInterval(memoryCheckInterval);

  } catch (error) {
    const errorItem = {
      type: 'crawler_error',
      message: error.message
    };
    const classification = classifyIssue(errorItem);
    results.errors.push({ ...errorItem, ...classification });
  } finally {
    // Clear scan timeout
    clearTimeout(scanTimeout);

    // Always close browser
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Browser cleanup failed - log but continue
        await monitor.logMessage(`⚠️  Browser cleanup failed: ${e.message}`);
      }
    }
  }

  // Add safety status to results
  const finalMemoryCheck = await monitor.checkMemoryLimits();
  results.safety = {
    ...results.safety,
    finalMemoryCheck: finalMemoryCheck,
    scanCompletedSafely: !scanTimedOut && finalMemoryCheck.memoryOk
  };

  // Analyze endpoint test results
  const endpointIssues = analyzeEndpointResults(results.infinitePages.endpointTests);
  endpointIssues.forEach(issue => {
    const classification = classifyIssue(issue);
    results.errors.push({ ...issue, ...classification });
  });

  // Determine Infinite Pages specific status
  const storyEndpoints = results.infinitePages.endpointTests.filter(t => t.endpoint.includes('/api/stories'));
  const demoEndpoint = results.infinitePages.endpointTests.find(t => t.endpoint.includes('/api/demo/story'));
  const adminEndpoints = results.infinitePages.endpointTests.filter(t => t.endpoint.includes('/api/admin'));

  results.infinitePages.storyCreationStatus = storyEndpoints.some(e => e.status === 500 || e.status === 503) ? 'failing' :
                                             storyEndpoints.some(e => e.status === 404) ? 'missing_endpoints' :
                                             storyEndpoints.some(e => e.status === 401) ? 'auth_required' : 'unknown';

  results.infinitePages.authStatus = results.infinitePages.endpointTests.some(e => e.status === 401) ? 'working' : 'unknown';
  results.infinitePages.adminStatus = adminEndpoints.some(e => e.status === 401) ? 'secured' : 'unknown';

  // Generate comprehensive summary with auto-fix analysis
  const allIssues = [...results.errors, ...results.accessibility];
  const autoFixable = allIssues.filter(issue => issue.can_auto_fix);
  const needsApproval = allIssues.filter(issue => issue.requires_approval);
  const criticalIssues = allIssues.filter(issue => issue.priority === 'critical');

  results.summary = {
    errorCount: results.errors.length,
    warningCount: results.warnings.length + results.accessibility.length,
    status: scanTimedOut ? 'timeout' :
            !finalMemoryCheck.memoryOk ? 'memory_limit' :
            criticalIssues.length > 0 ? 'critical' :
            results.errors.length > 0 ? 'failed' :
            results.warnings.length > 0 ? 'warnings' : 'passed',

    // Auto-fix summary for Claude Code
    autofix: {
      can_auto_fix: autoFixable.length,
      needs_approval: needsApproval.length,
      critical_issues: criticalIssues.length,

      auto_fixes: autoFixable.map(issue => ({
        issue: issue.message,
        type: issue.type,
        element: issue.element,
        fix: issue.fix_suggestion || issue.fix_instructions,
        priority: issue.priority || 'low'
      })),

      approval_needed: needsApproval.map(issue => ({
        issue: issue.message,
        type: issue.type,
        reason: issue.rule?.reason || 'Requires human review',
        suggested_fix: issue.fix_instructions,
        risk_level: issue.rule?.risk || 'medium',
        priority: issue.priority
      })),

      // Infinite Pages specific recommendations
      infinite_pages_status: {
        story_creation: results.infinitePages.storyCreationStatus,
        authentication: results.infinitePages.authStatus,
        admin_panel: results.infinitePages.adminStatus,
        critical_endpoints_down: criticalIssues.filter(i => i.infinite_pages_specific).length
      },

      recommendation: scanTimedOut ?
        `⏰ TIMEOUT: Scan exceeded ${monitor.options.maxScanTimeoutMs / 1000}s safety limit` :
        !finalMemoryCheck.memoryOk ?
        `🚨 MEMORY: Scan terminated due to memory safety limits` :
        criticalIssues.length > 0 ?
        `CRITICAL: ${criticalIssues.length} critical issues detected. Story creation may be broken.` :
        autoFixable.length > 0 ?
        `Claude can automatically fix ${autoFixable.length} issues. ${needsApproval.length > 0 ? `${needsApproval.length} issues need approval first.` : ''}` :
        needsApproval.length > 0 ?
        `${needsApproval.length} issues found - all require approval before fixing.` :
        'Infinite Pages is functioning well - no critical issues detected.'
    }
  };

  res.json(results);
});

// Health check with safety monitoring
app.get('/health', async (req, res) => {
  const status = await monitor.getStatus();
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    service: 'Infinite Pages Debugger (Safety Monitored)',
    safety: status
  });
});

// Process status endpoint
app.get('/status', async (req, res) => {
  const status = await monitor.getStatus();
  res.json(status);
});

// Quick endpoint test with safety monitoring
app.get('/test-endpoints/:domain?', async (req, res) => {
  const domain = req.params.domain || 'www.infinite-pages.com';
  const testUrl = domain.startsWith('http') ? domain : `https://${domain}`;

  // Check memory before starting test
  const preCheck = await monitor.checkMemoryLimits();
  if (!preCheck.memoryOk) {
    return res.status(503).json({
      error: 'Cannot start endpoint test - safety limits exceeded',
      reasons: preCheck.reasons,
      url: testUrl
    });
  }

  try {
    const testRes = await fetch(`http://localhost:${process.env.PORT || 3001}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl,
        options: { testEndpoints: true }
      })
    });
    const data = await testRes.json();
    res.json({
      url: testUrl,
      summary: data.summary,
      infinitePages: data.infinitePages,
      safety: data.safety,
      criticalIssues: data.errors?.filter(e => e.priority === 'critical') || []
    });
  } catch (error) {
    res.status(500).json({ error: `Could not test ${testUrl}: ${error.message}` });
  }
});

// Emergency stop endpoint
app.post('/emergency-stop', async (req, res) => {
  await monitor.logMessage(`🛑 Emergency stop requested via API`);
  res.json({ message: 'Emergency shutdown initiated' });

  setTimeout(async () => {
    await monitor.performEmergencyShutdown(['Manual emergency stop via API']);
  }, 100);
});

// Start server with process monitoring
async function startServer() {
  try {
    // Initialize safety monitoring
    await monitor.startMonitoring();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      monitor.logMessage(`\n🚀 Infinite Pages Debugger Server ready on port ${PORT}`);
      monitor.logMessage(`🛡️  Safety monitoring enabled with automatic shutdown`);
      monitor.logMessage(`📋 Usage for Claude Code:`);
      monitor.logMessage(`   curl -X POST http://localhost:${PORT}/crawl -H "Content-Type: application/json" -d '{"url":"https://www.infinite-pages.com"}'`);
      monitor.logMessage(`   curl http://localhost:${PORT}/test-endpoints/www.infinite-pages.com`);
      monitor.logMessage(`   curl http://localhost:${PORT}/status`);
      monitor.logMessage(`\n🎯 Infinite Pages specific testing enabled`);
      monitor.logMessage(`   - Story creation endpoint testing`);
      monitor.logMessage(`   - Authentication flow verification`);
      monitor.logMessage(`   - Admin panel security checks`);
      monitor.logMessage(`   - Claude API integration status`);
      monitor.logMessage(`\n🛡️  Safety Features:`);
      monitor.logMessage(`   - Memory limit: ${monitor.options.maxMemoryMB}MB`);
      monitor.logMessage(`   - Browser limit: ${monitor.options.maxBrowserMemoryMB}MB per process`);
      monitor.logMessage(`   - System limit: ${monitor.options.maxSystemMemoryPercent}%`);
      monitor.logMessage(`   - Scan timeout: ${monitor.options.maxScanTimeoutMs / 1000}s`);
      monitor.logMessage(`   - Auto-shutdown on limit breach`);
      monitor.logMessage(`\n✅ Ready to safely debug infinite-pages.com!\n`);
    });

  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();