#!/usr/bin/env node
// cli.js - Infinite Pages Website Debugger CLI with Safety Monitoring
const { chromium } = require('playwright');
const ProcessMonitor = require('./process-monitor');
const { classifyIssue, getEndpointTests, analyzeEndpointResults } = require('./autofix-rules');

const args = process.argv.slice(2);
const url = args[0] || 'https://www.infinite-pages.com';

// Initialize process monitor with safety limits
let monitor = new ProcessMonitor({
  maxMemoryMB: 600, // Higher limit for Playwright memory needs
  maxBrowserMemoryMB: 400, // Per browser process
  maxSystemMemoryPercent: 80, // System memory limit
  maxScanTimeoutMs: 120 * 1000, // 2 minute timeout
  monitorIntervalMs: 10 * 1000, // Check every 10 seconds
  logFile: './monitor.log'
});

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Infinite Pages Website Debugger CLI (Safety Monitored)

Usage: node cli.js [url] [options]

Arguments:
  url                 Website URL to test (default: https://www.infinite-pages.com)

Options:
  --json              Output raw JSON for parsing
  --endpoints         Test API endpoints only
  --story-creation    Test story creation functionality specifically
  --auto-fix-only     Show only issues Claude can auto-fix
  --approval-only     Show only issues needing approval
  --fix-plan          Show detailed fix instructions
  --status            Show process status and memory usage
  --stop              Stop any running debugger processes
  --help, -h          Show this help

Safety Features:
  - Memory limit: 400MB (process) + 300MB (each browser)
  - System memory limit: 80%
  - Scan timeout: 2 minutes (automatic termination)
  - Process monitoring: Every 10 seconds
  - Automatic shutdown on limit breach
  - Prevents multiple instances

Infinite Pages Specific Tests:
  - Story creation endpoints (/api/stories/*, /api/demo/story)
  - Authentication system (login/signup)
  - Admin panel security
  - Claude API integration status
  - Database connectivity

Examples:
  node cli.js https://www.infinite-pages.com
  node cli.js --endpoints --json
  node cli.js --story-creation --fix-plan
  node cli.js http://localhost:3000 --auto-fix-only
  node cli.js --status
  node cli.js --stop
  `);
  process.exit(0);
}

// Handle status command
if (args.includes('--status')) {
  (async () => {
    try {
      const status = await monitor.getStatus();
      console.log('\n🔍 Debugger Process Status:');
      console.log(`   PID: ${status.pid}`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Uptime: ${status.uptime}s`);
      console.log(`   Memory: ${status.memory.process.rss}MB / ${status.limits.maxMemoryMB}MB`);
      console.log(`   Browser processes: ${status.browserProcesses} (${status.browserMemoryMB}MB total)`);
      console.log(`   System: ${status.memory.system.usedPercent}% / ${status.limits.maxSystemMemoryPercent}%`);

      if (status.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        status.warnings.forEach(warning => console.log(`   • ${warning}`));
      }

      console.log('\n🛡️  Safety Limits:');
      console.log(`   Max process memory: ${status.limits.maxMemoryMB}MB`);
      console.log(`   Max browser memory: ${status.limits.maxBrowserMemoryMB}MB each`);
      console.log(`   Max system memory: ${status.limits.maxSystemMemoryPercent}%`);
      console.log(`   Max scan time: ${status.limits.maxScanTimeoutMs / 1000}s`);

      process.exit(status.status === 'healthy' ? 0 : 1);
    } catch (error) {
      console.error(`❌ Could not get status: ${error.message}`);
      process.exit(1);
    }
  })();
  return;
}

// Handle stop command
if (args.includes('--stop')) {
  (async () => {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const pidFile = path.join(__dirname, '.debugger.pid');

      try {
        const pidData = await fs.readFile(pidFile, 'utf8');
        const pid = parseInt(pidData.trim());

        if (pid && await monitor.isProcessRunning(pid)) {
          console.log(`🛑 Stopping debugger process ${pid}...`);
          process.kill(pid, 'SIGTERM');

          // Wait a bit for graceful shutdown
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check if still running
          if (await monitor.isProcessRunning(pid)) {
            console.log(`💀 Force killing process ${pid}...`);
            process.kill(pid, 'SIGKILL');
          }

          console.log('✅ Debugger stopped successfully');
        } else {
          console.log('ℹ️  No debugger process is currently running');
        }

        // Clean up PID file
        try {
          await fs.unlink(pidFile);
        } catch {
          // File already deleted
        }

      } catch (error) {
        console.log('ℹ️  No debugger process found to stop');
      }

      process.exit(0);
    } catch (error) {
      console.error(`❌ Failed to stop debugger: ${error.message}`);
      process.exit(1);
    }
  })();
  return;
}

async function testInfinitePagesSafely(targetUrl) {
  // Start safety monitoring
  await monitor.startMonitoring();

  // Check memory limits before starting
  const preCheck = await monitor.checkMemoryLimits();
  if (!preCheck.memoryOk) {
    await monitor.logMessage(`🚫 Cannot start scan - safety limits already exceeded:`);
    for (const reason of preCheck.reasons) {
      await monitor.logMessage(`   • ${reason}`);
    }
    throw new Error(`Safety limits exceeded: ${preCheck.reasons.join(', ')}`);
  }

  const results = {
    url: targetUrl,
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
    summary: { status: 'unknown', errorCount: 0, warningCount: 0, autofix: {} }
  };

  const startTime = Date.now();
  let browser, page;
  let scanAborted = false;

  // Set up memory monitoring during scan
  const memoryCheckInterval = setInterval(async () => {
    if (scanAborted) {
      clearInterval(memoryCheckInterval);
      return;
    }

    const check = await monitor.checkMemoryLimits();
    if (!check.memoryOk) {
      scanAborted = true;
      clearInterval(memoryCheckInterval);
      await monitor.logMessage(`🚨 Scan aborted due to memory safety limits:`);
      for (const reason of check.reasons) {
        await monitor.logMessage(`   • ${reason}`);
      }

      // Force browser shutdown
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Browser already closed
        }
      }

      throw new Error(`Scan terminated for safety: ${check.reasons.join(', ')}`);
    }
  }, 5000); // Check every 5 seconds during scan

  try {
    await monitor.logMessage(`🔍 Starting safe scan of ${targetUrl}`);

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

    // Capture console errors with Infinite Pages context
    page.on('console', msg => {
      if (scanAborted) return;

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

    // Monitor network requests for API endpoints
    page.on('response', response => {
      if (scanAborted) return;

      const responseUrl = response.url();
      const status = response.status();

      // Track API endpoint responses
      if (responseUrl.includes('/api/')) {
        results.infinitePages.endpointTests.push({
          endpoint: new URL(responseUrl).pathname,
          status: status,
          statusText: response.statusText(),
          method: 'GET',
          url: responseUrl
        });
      }

      // Classify failures
      if (status >= 400) {
        const error = {
          type: status === 404 ? 'endpoint_not_found' :
                status === 500 ? 'server_error' :
                status === 503 ? 'service_unavailable' : 'network_error',
          message: `${status} ${response.statusText()} - ${responseUrl}`,
          status: status,
          url: responseUrl
        };
        const classification = classifyIssue(error);
        results.errors.push({ ...error, ...classification });
      }
    });

    // Navigate to page with safety timeout
    try {
      if (!scanAborted) {
        await page.goto(targetUrl, {
          timeout: Math.min(30000, monitor.options.maxScanTimeoutMs - 10000),
          waitUntil: 'networkidle'
        });
        await monitor.logMessage(`✅ Page loaded: ${targetUrl}`);
      }
    } catch (e) {
      if (!scanAborted) {
        results.errors.push({
          type: 'navigation_error',
          message: e.message
        });
        await monitor.logMessage(`⚠️  Navigation warning: ${e.message}`);
      }
    }

    // Test specific Infinite Pages endpoints with safety checks
    // RE-ENABLED with memory fixes
    if (!scanAborted && !args.includes('--no-endpoint-tests')) {
      await monitor.logMessage('🧪 Testing Infinite Pages API endpoints...');
      const endpointConfigs = getEndpointTests();

      // MEMORY-EFFICIENT: Test only first 3 endpoint groups to prevent memory overload
      const limitedConfigs = endpointConfigs.slice(0, 3);
      await monitor.logMessage(`🔬 Testing ${limitedConfigs.length}/${endpointConfigs.length} endpoint groups for memory safety`);

      for (const config of limitedConfigs) {
        if (scanAborted) break;

        // Check memory before each endpoint test
        const midCheck = await monitor.checkMemoryLimits();
        if (!midCheck.memoryOk) {
          results.warnings.push({
            type: 'endpoint_test_aborted',
            message: 'Endpoint testing stopped due to memory limits'
          });
          break;
        }

        // MEMORY FIX: Test only first method per endpoint to reduce memory usage
        const limitedMethods = config.methods.slice(0, 1);
        for (const method of limitedMethods) {
          if (scanAborted) break;

          // MEMORY FIX: Longer delay to allow garbage collection
          await new Promise(resolve => setTimeout(resolve, 500));

          try {
            const testResult = await page.evaluate(async ({ endpoint, method: testMethod, description, baseUrl }) => {
              try {
                // Construct full URL to prevent chrome-error:// URLs
                const fullUrl = endpoint.startsWith('/') ? baseUrl + endpoint : endpoint;

                const response = await fetch(fullUrl, {
                  method: testMethod,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  ...(testMethod === 'POST' ? {
                    body: JSON.stringify({
                      genre: 'fantasy',
                      premise: 'A brave adventurer discovers ancient magic',
                      title: 'Test Adventure'
                    })
                  } : {})
                });

                return {
                  endpoint,
                  method: testMethod,
                  description,
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  headers: {
                    contentType: response.headers.get('content-type'),
                    rateLimitRemaining: response.headers.get('x-ratelimit-remaining')
                  }
                };
              } catch (error) {
                return {
                  endpoint,
                  method: testMethod,
                  description,
                  status: 'fetch_failed',
                  statusText: error.message,
                  ok: false
                };
              }
            }, { endpoint: config.endpoint, method, description: config.description, baseUrl: targetUrl.replace(/\/$/, '') });

            results.infinitePages.endpointTests.push(testResult);

          } catch (error) {
            results.infinitePages.endpointTests.push({
              endpoint: config.endpoint,
              method: method,
              description: config.description,
              status: 'test_failed',
              error: error.message
            });
          }

          // MEMORY FIX: Force garbage collection after each test
          if (global.gc) {
            global.gc();
          }
        }

        // MEMORY FIX: Check memory after each endpoint group
        const postCheck = await monitor.checkMemoryLimits();
        if (!postCheck.memoryOk) {
          await monitor.logMessage(`⚠️  Memory warning after ${config.endpoint}: ${postCheck.memory.process.rss}MB`);
          results.warnings.push({
            type: 'memory_warning_during_testing',
            message: `Memory usage high after testing ${config.endpoint}: ${postCheck.memory.process.rss}MB`
          });
        }
      }
      await monitor.logMessage(`✅ Endpoint tests completed: ${results.infinitePages.endpointTests.length} tests`);
    }

    // Page analysis for Infinite Pages specific issues
    if (!scanAborted) {
      try {
        const pageAnalysis = await page.evaluate(() => {
          const issues = [];

          // Check for Infinite Pages branding and context
          const title = document.querySelector('title');
          if (!title || !title.textContent.includes('Infinite Pages')) {
            issues.push({
              type: 'missing_infinite_pages_branding',
              message: 'Page title missing "Infinite Pages" branding',
              element: 'title',
              fix_suggestion: 'Update title to include "Infinite Pages"'
            });
          }

          // Check for story creation elements
          const storyElements = document.querySelectorAll('[class*="story"], [class*="create"]');
          const createButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.toLowerCase().includes('create')
          );

          if (storyElements.length === 0 && createButtons.length === 0) {
            issues.push({
              type: 'missing_story_creation_ui',
              message: 'No story creation interface elements found',
              element: 'body',
              fix_suggestion: 'Add story creation interface to the page'
            });
          }

          // Check for error displays (indicating API failures)
          const errorDisplays = document.querySelectorAll('.error, [role="alert"], .alert-error, [class*="error"]');
          errorDisplays.forEach(el => {
            const errorText = el.textContent.trim();
            if (errorText && errorText.length > 0) {
              issues.push({
                type: 'page_error_displayed',
                message: `Error shown to user: "${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}"`,
                element: el.className || el.tagName.toLowerCase(),
                fix_suggestion: 'Investigate and resolve the underlying error causing this message'
              });
            }
          });

          // Standard accessibility checks
          const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
          imagesWithoutAlt.forEach(img => {
            const src = img.src || img.getAttribute('src') || '';
            if (src) {
              issues.push({
                type: 'missing_alt_text',
                message: `Image missing alt text: ${src.split('/').pop()}`,
                element: `img[src*="${src.split('/').pop()}"]`,
                fix_suggestion: `Add alt="${src.split('/').pop().replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}"`
              });
            }
          });

          // Missing meta description
          if (!document.querySelector('meta[name="description"]')) {
            issues.push({
              type: 'missing_meta_description',
              message: 'Missing meta description for story creation platform',
              element: 'head',
              fix_suggestion: 'Add <meta name="description" content="Create infinite AI-powered stories - Infinite Pages">'
            });
          }

          // H1 structure
          const h1s = document.querySelectorAll('h1');
          if (h1s.length === 0) {
            issues.push({
              type: 'missing_h1',
              message: 'No main heading (h1) found',
              element: 'body',
              fix_suggestion: 'Add <h1>Create Your Story</h1> or similar main heading'
            });
          } else if (h1s.length > 1) {
            issues.push({
              type: 'multiple_h1',
              message: `${h1s.length} h1 headings found (should be 1)`,
              element: 'h1:nth-of-type(n+2)',
              fix_suggestion: 'Change additional h1 tags to h2, h3, etc.'
            });
          }

          return issues;
        });

        results.accessibility = pageAnalysis.map(issue => {
          const classification = classifyIssue(issue);
          return { ...issue, ...classification };
        });

        await monitor.logMessage(`✅ Page analysis completed: ${results.accessibility.length} accessibility issues found`);

      } catch (e) {
        results.warnings.push({
          type: 'page_analysis_failed',
          message: 'Could not analyze page content: ' + e.message
        });
        await monitor.logMessage(`⚠️  Page analysis failed: ${e.message}`);
      }
    }

    // Clear memory monitoring interval
    clearInterval(memoryCheckInterval);

  } catch (error) {
    clearInterval(memoryCheckInterval);

    if (scanAborted) {
      // Don't add duplicate error - already handled by memory check
      await monitor.logMessage(`🚨 Scan was aborted due to safety limits`);
    } else {
      const errorItem = {
        type: 'test_execution_failed',
        message: error.message
      };
      const classification = classifyIssue(errorItem);
      results.errors.push({ ...errorItem, ...classification });
      await monitor.logMessage(`❌ Test execution error: ${error.message}`);
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
        await monitor.logMessage(`✅ Browser closed safely`);
      } catch (e) {
        await monitor.logMessage(`⚠️  Browser cleanup warning: ${e.message}`);
      }
    }
  }

  // Performance metrics with safety tracking
  const loadTime = Date.now() - startTime;
  results.performance = {
    loadTime: `${loadTime}ms`,
    status: loadTime > 3000 ? 'slow' : loadTime > 1000 ? 'moderate' : 'fast',
    safetyAborted: scanAborted
  };

  // Final safety check
  const finalCheck = await monitor.checkMemoryLimits();
  results.safety = {
    ...results.safety,
    finalCheck: finalCheck,
    scanCompletedSafely: !scanAborted && finalCheck.memoryOk
  };

  // Analyze endpoint results for Infinite Pages specific issues
  const endpointIssues = analyzeEndpointResults(results.infinitePages.endpointTests);
  endpointIssues.forEach(issue => {
    const classification = classifyIssue(issue);
    results.errors.push({ ...issue, ...classification });
  });

  // Determine Infinite Pages status
  const storyEndpoints = results.infinitePages.endpointTests.filter(t =>
    t.endpoint && t.endpoint.includes('/api/stories')
  );
  const demoEndpoints = results.infinitePages.endpointTests.filter(t =>
    t.endpoint && t.endpoint.includes('/api/demo')
  );
  const adminEndpoints = results.infinitePages.endpointTests.filter(t =>
    t.endpoint && t.endpoint.includes('/api/admin')
  );

  // Classify story creation status
  if (storyEndpoints.some(e => e.status === 500 || e.status === 503)) {
    results.infinitePages.storyCreationStatus = 'failing_server_error';
  } else if (storyEndpoints.some(e => e.status === 404)) {
    results.infinitePages.storyCreationStatus = 'missing_endpoints';
  } else if (storyEndpoints.some(e => e.status === 401)) {
    results.infinitePages.storyCreationStatus = 'auth_required_normal';
  } else if (demoEndpoints.some(e => e.status === 200)) {
    results.infinitePages.storyCreationStatus = 'demo_available';
  } else {
    results.infinitePages.storyCreationStatus = 'unknown';
  }

  results.infinitePages.authStatus = storyEndpoints.some(e => e.status === 401) ? 'working' : 'unknown';
  results.infinitePages.adminStatus = adminEndpoints.some(e => e.status === 401) ? 'secured' : 'unknown';

  // Generate summary with autofix analysis
  const allIssues = [...results.errors, ...results.accessibility];
  const autoFixable = allIssues.filter(issue => issue.can_auto_fix);
  const needsApproval = allIssues.filter(issue => issue.requires_approval);
  const criticalIssues = allIssues.filter(issue => issue.priority === 'critical');
  const infinitePagesSpecific = allIssues.filter(issue => issue.infinite_pages_specific);

  results.summary = {
    errorCount: results.errors.length,
    warningCount: results.warnings.length + results.accessibility.length,
    status: scanAborted ? 'aborted_safety' :
            !finalCheck.memoryOk ? 'memory_limit' :
            criticalIssues.length > 0 ? 'critical' :
            results.errors.length > 0 ? 'failed' :
            results.warnings.length > 0 ? 'warnings' : 'passed',

    autofix: {
      can_auto_fix: autoFixable.length,
      needs_approval: needsApproval.length,
      critical_issues: criticalIssues.length,
      infinite_pages_issues: infinitePagesSpecific.length,

      auto_fixes: autoFixable.map(issue => ({
        issue: issue.message,
        type: issue.type,
        element: issue.element,
        fix: issue.fix_suggestion || issue.fix_instructions,
        priority: issue.priority || 'low',
        code_fix: issue.rule?.code_fix ? issue.rule.code_fix() : null
      })),

      approval_needed: needsApproval.map(issue => ({
        issue: issue.message,
        type: issue.type,
        reason: issue.rule?.reason || 'Requires human review',
        suggested_fix: issue.fix_instructions,
        risk_level: issue.rule?.risk || 'medium',
        priority: issue.priority,
        infinite_pages_specific: !!issue.infinite_pages_specific,
        code_fix: issue.rule?.code_fix ? issue.rule.code_fix() : null
      })),

      infinite_pages_status: {
        story_creation: results.infinitePages.storyCreationStatus,
        authentication: results.infinitePages.authStatus,
        admin_panel: results.infinitePages.adminStatus,
        endpoints_tested: results.infinitePages.endpointTests.length
      },

      recommendation: scanAborted ?
        `🚨 SAFETY ABORT: Scan terminated due to memory/timeout limits` :
        !finalCheck.memoryOk ?
        `🚨 MEMORY WARNING: Final memory check failed` :
        criticalIssues.length > 0 ?
        `🚨 CRITICAL: ${criticalIssues.length} critical issues found. Infinite Pages story creation likely broken.` :
        infinitePagesSpecific.length > 0 ?
        `⚠️ INFINITE PAGES: ${infinitePagesSpecific.length} platform-specific issues detected.` :
        autoFixable.length > 0 ?
        `✅ AUTO-FIX: ${autoFixable.length} issues can be fixed automatically. ${needsApproval.length > 0 ? `${needsApproval.length} need approval.` : ''}` :
        needsApproval.length > 0 ?
        `⚠️ APPROVAL: ${needsApproval.length} issues require human review before fixing.` :
        '🎉 ALL GOOD: Infinite Pages is functioning well!'
    }
  };

  await monitor.logMessage(`✅ Scan completed safely in ${loadTime}ms`);
  return results;
}

// Main execution with safety monitoring
(async () => {
  console.log(`🔍 Testing Infinite Pages: ${url}`);
  console.log(`🎯 Focus: Story creation, API endpoints, and platform functionality`);
  console.log(`🛡️  Safety monitoring enabled with automatic shutdown`);
  console.log('');

  try {
    const results = await testInfinitePagesSafely(url);

    if (args.includes('--json')) {
      console.log(JSON.stringify(results, null, 2));
      await monitor.gracefulShutdown('NORMAL_COMPLETION');
      return;
    }

    // Filter based on options
    const showEndpointsOnly = args.includes('--endpoints');
    const showStoryCreationOnly = args.includes('--story-creation');
    const showAutoFixOnly = args.includes('--auto-fix-only');
    const showApprovalOnly = args.includes('--approval-only');
    const showFixPlan = args.includes('--fix-plan');

    // Header with safety status
    console.log(`📊 Infinite Pages Test Results`);
    console.log(`URL: ${url}`);
    console.log(`Status: ${results.summary.status.toUpperCase()}`);
    console.log(`Load Time: ${results.performance.loadTime} (${results.performance.status})`);
    if (results.safety) {
      console.log(`Safety: ${results.safety.scanCompletedSafely ? '✅ Safe' : '⚠️  Limits Reached'}`);
    }

    // Infinite Pages Status Overview
    console.log(`\n🎯 INFINITE PAGES STATUS:`);
    console.log(`   📝 Story Creation: ${results.infinitePages.storyCreationStatus}`);
    console.log(`   🔐 Authentication: ${results.infinitePages.authStatus}`);
    console.log(`   👑 Admin Panel: ${results.infinitePages.adminStatus}`);
    console.log(`   🧪 Endpoints Tested: ${results.infinitePages.endpointTests.length}`);

    // Auto-fix summary
    const autofix = results.summary.autofix;
    console.log(`\n🤖 AUTO-FIX ANALYSIS:`);
    console.log(`   ✅ Can auto-fix: ${autofix.can_auto_fix} issues`);
    console.log(`   ⚠️  Need approval: ${autofix.needs_approval} issues`);
    console.log(`   🚨 Critical issues: ${autofix.critical_issues} issues`);
    console.log(`   🎯 Infinite Pages specific: ${autofix.infinite_pages_issues} issues`);
    console.log(`   📋 ${autofix.recommendation}`);

    // Show endpoint test results
    if ((showEndpointsOnly || !showAutoFixOnly) && results.infinitePages.endpointTests.length > 0) {
      console.log(`\n🌐 API ENDPOINT TESTS:`);
      results.infinitePages.endpointTests.forEach(test => {
        const statusIcon = test.status === 200 || test.status === 201 ? '✅' :
                          test.status === 401 ? '🔒' :
                          test.status === 404 ? '❌' :
                          test.status === 500 ? '💥' :
                          test.status === 503 ? '🚫' : '⚠️';
        console.log(`  ${statusIcon} ${test.method} ${test.endpoint}: ${test.status} ${test.statusText}`);
        if (test.description) {
          console.log(`     📝 ${test.description}`);
        }
      });
    }

    // Show auto-fixable issues
    if (autofix.auto_fixes.length > 0 && !showApprovalOnly) {
      console.log(`\n✅ CLAUDE CAN AUTO-FIX (${autofix.auto_fixes.length}):`);
      autofix.auto_fixes.forEach((fix, i) => {
        console.log(`  ${i + 1}. ${fix.issue}`);
        if (showFixPlan) {
          console.log(`     🔧 Fix: ${fix.fix}`);
          console.log(`     📍 Element: ${fix.element || 'N/A'}`);
          console.log(`     🎯 Priority: ${fix.priority}`);

          if (fix.code_fix) {
            console.log(`\n     💾 ACTUAL CODE TO FIX THIS ISSUE:`);
            console.log(`     ${'='.repeat(50)}`);
            console.log(fix.code_fix.split('\n').map(line => `     ${line}`).join('\n'));
            console.log(`     ${'='.repeat(50)}\n`);
          }
        }
      });
    }

    // Show issues needing approval
    if (autofix.approval_needed.length > 0 && !showAutoFixOnly) {
      console.log(`\n⚠️  NEEDS APPROVAL (${autofix.approval_needed.length}):`);
      autofix.approval_needed.forEach((issue, i) => {
        const priorityIcon = issue.priority === 'critical' ? '🚨' : issue.priority === 'high' ? '⚠️' : 'ℹ️';
        const ipIcon = issue.infinite_pages_specific ? ' 🎯' : '';
        console.log(`  ${i + 1}. ${priorityIcon}${ipIcon} [${issue.risk_level?.toUpperCase() || 'UNKNOWN'}] ${issue.issue}`);
        console.log(`     🚫 Reason: ${issue.reason}`);
        if (showFixPlan && issue.suggested_fix) {
          console.log(`     💡 Suggested: ${issue.suggested_fix}`);

          if (issue.code_fix) {
            console.log(`\n     💾 ACTUAL CODE TO FIX THIS ISSUE (REQUIRES APPROVAL):`);
            console.log(`     ${'='.repeat(60)}`);
            console.log(issue.code_fix.split('\n').map(line => `     ${line}`).join('\n'));
            console.log(`     ${'='.repeat(60)}\n`);
          }
        }
      });
    }

    // Show critical issues fix plan
    if (autofix.critical_issues > 0 && showFixPlan) {
      console.log(`\n🚨 CRITICAL ISSUES DETECTED:`);
      const criticalIssues = [...results.errors, ...results.accessibility].filter(i => i.priority === 'critical');
      criticalIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.message}`);
        console.log(`     🔧 Action needed: ${issue.fix_instructions || 'Manual intervention required'}`);
        if (issue.infinite_pages_specific) {
          console.log(`     🎯 Infinite Pages core functionality affected`);
        }
      });
    }

    // Safety summary
    if (results.safety && !results.safety.scanCompletedSafely) {
      console.log(`\n🛡️  SAFETY SUMMARY:`);
      console.log(`   Memory limit: ${results.safety.memoryLimitMB}MB`);
      console.log(`   Browser limit: ${results.safety.browserLimitMB}MB per process`);
      console.log(`   Timeout: ${results.safety.timeoutMs / 1000}s`);
      console.log(`   Scan completed safely: ${results.safety.scanCompletedSafely ? '✅ Yes' : '⚠️  No'}`);
    }

    // Success/summary message
    if (results.summary.status === 'passed') {
      console.log(`\n🎉 All tests passed! Infinite Pages is working well.`);
    } else if (results.summary.status === 'aborted_safety') {
      console.log(`\n🚨 SCAN ABORTED: Safety limits reached to prevent system damage.`);
      console.log(`💡 TIP: Try reducing browser memory usage or running fewer concurrent processes.`);
    } else if (autofix.critical_issues > 0) {
      console.log(`\n🚨 URGENT: Critical issues detected that may break story creation.`);
      console.log(`💡 TIP: Run with --fix-plan to see detailed fix instructions.`);
    } else if (autofix.can_auto_fix > 0) {
      console.log(`\n💡 TIP: Claude can automatically fix ${autofix.can_auto_fix} issues.`);
      console.log(`Run with --fix-plan for detailed instructions.`);
    }

    // Graceful shutdown
    await monitor.gracefulShutdown('NORMAL_COMPLETION');

    // Exit codes: 0 = all good, 1 = has issues, 2 = critical/aborted, 3 = error
    const exitCode = results.summary.status === 'aborted_safety' ? 2 :
                     autofix.critical_issues > 0 ? 2 :
                     autofix.needs_approval > 0 || results.errors.length > 0 ? 1 : 0;

    process.exit(exitCode);

  } catch (error) {
    console.error(`❌ Test execution failed: ${error.message}`);
    if (error.stack && !error.message.includes('Safety limits exceeded')) {
      console.error(`Stack trace: ${error.stack}`);
    }

    try {
      await monitor.gracefulShutdown('ERROR');
    } catch (shutdownError) {
      // Shutdown failed - force exit
    }

    process.exit(3);
  }
})();