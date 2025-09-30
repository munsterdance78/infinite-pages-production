#!/usr/bin/env node

/**
 * AUTOMATED FLAG SYSTEM
 * Automatically flags files, creates flag database, no user interaction required
 * Run once to flag everything, then address flags systematically
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

class AutoFlagSystem {
  constructor(oldProjectRoot, newProjectRoot) {
    this.oldProjectRoot = oldProjectRoot
    this.newProjectRoot = newProjectRoot
    this.flagDatabase = this.initializeFlagDatabase()
    this.flagCount = 0
  }

  initializeFlagDatabase() {
    return {
      scanDate: new Date().toISOString(),
      flags: {
        TRANSFER_REQUIRED: [],
        DUPLICATE_DETECTED: [],
        ARCHITECTURAL_VIOLATION: [],
        MISSING_DEPENDENCY: [],
        NEEDS_CONSOLIDATION: [],
        INCOMPLETE_IMPLEMENTATION: [],
        SECURITY_CONCERN: [],
        PERFORMANCE_ISSUE: []
      },
      summary: {
        totalFlags: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    }
  }

  async runCompleteSystemScan() {
    log('blue', '\n🚩 RUNNING COMPLETE AUTOMATED FLAG SCAN\n')
    log('yellow', '📊 This will flag EVERYTHING that needs attention...\n')

    await this.flagRequiredTransfers()
    await this.flagDuplicates()
    await this.flagArchitecturalViolations()
    await this.flagMissingDependencies()
    await this.flagConsolidationNeeds()
    await this.flagIncompleteImplementations()
    await this.flagSecurityConcerns()
    await this.flagPerformanceIssues()

    this.generateFlagDatabase()
    this.displayFlagSummary()
  }

  createFlag(category, file, issue, priority, autoFix = null, dependencies = []) {
    const flag = {
      id: crypto.randomUUID(),
      file,
      issue,
      priority, // CRITICAL, HIGH, MEDIUM, LOW
      category,
      autoFix,
      dependencies,
      flaggedAt: new Date().toISOString(),
      status: 'FLAGGED', // FLAGGED, IN_PROGRESS, RESOLVED
      estimatedEffort: this.estimateEffort(priority, issue),
      notes: []
    }

    this.flagDatabase.flags[category].push(flag)
    this.flagCount++
    this.flagDatabase.summary[priority.toLowerCase()]++

    return flag.id
  }

  async flagRequiredTransfers() {
    log('yellow', '📁 Flagging required transfers...')

    const criticalTransfers = [
      { from: 'middleware.ts', to: 'middleware.ts', reason: 'Security and rate limiting core' },
      { from: 'lib/constants.ts', to: 'src/lib/utils/constants.ts', reason: 'Core configuration constants' },
      { from: 'components/UnifiedStoryCreator.tsx', to: 'src/components/stories/story-creator.tsx', reason: 'Main story creation component' },
      { from: 'supabase/migrations/', to: 'supabase/migrations/', reason: 'Database schema and data' },
    ]

    const highTransfers = [
      { from: 'app/api/stories/route.ts', to: 'app/api/stories/route.ts', reason: 'Core story API' },
      { from: 'app/api/billing/', to: 'app/api/billing/', reason: 'Payment system' },
      { from: 'components/CreditPurchase.tsx', to: 'src/components/pricing/credit-purchase.tsx', reason: 'Credit system' },
    ]

    // Flag critical transfers
    for (const transfer of criticalTransfers) {
      const oldExists = fs.existsSync(path.join(this.oldProjectRoot, transfer.from))
      const newExists = fs.existsSync(path.join(this.newProjectRoot, transfer.to))

      if (oldExists && !newExists) {
        this.createFlag(
          'TRANSFER_REQUIRED',
          transfer.to,
          `CRITICAL: Transfer ${transfer.from} → ${transfer.to}. ${transfer.reason}`,
          'CRITICAL',
          `Copy from ${transfer.from}`,
          []
        )
      }
    }

    // Flag high priority transfers
    for (const transfer of highTransfers) {
      const oldExists = fs.existsSync(path.join(this.oldProjectRoot, transfer.from))
      const newExists = fs.existsSync(path.join(this.newProjectRoot, transfer.to))

      if (oldExists && !newExists) {
        this.createFlag(
          'TRANSFER_REQUIRED',
          transfer.to,
          `HIGH: Transfer ${transfer.from} → ${transfer.to}. ${transfer.reason}`,
          'HIGH',
          `Copy and adapt from ${transfer.from}`,
          []
        )
      }
    }
  }

  async flagDuplicates() {
    log('yellow', '🔍 Flagging duplicates in old project...')

    // Check for multiple story creators in old project
    const oldFiles = await this.getAllFiles(this.oldProjectRoot)
    const storyCreators = oldFiles.filter(f =>
      f.toLowerCase().includes('storycreator') ||
      f.toLowerCase().includes('story-creator')
    )

    if (storyCreators.length > 1) {
      this.createFlag(
        'DUPLICATE_DETECTED',
        'MULTIPLE_FILES',
        `CRITICAL: Found ${storyCreators.length} story creators: ${storyCreators.map(f => path.basename(f)).join(', ')}. Must consolidate to ONE.`,
        'CRITICAL',
        'Keep UnifiedStoryCreator.tsx, delete others',
        storyCreators
      )
    }

    // Check for multiple earnings components
    const earningsComponents = oldFiles.filter(f =>
      f.toLowerCase().includes('earnings') &&
      (f.toLowerCase().includes('component') || f.toLowerCase().includes('hub'))
    )

    if (earningsComponents.length > 1) {
      this.createFlag(
        'DUPLICATE_DETECTED',
        'MULTIPLE_FILES',
        `HIGH: Found ${earningsComponents.length} earnings components. Consolidate to one.`,
        'HIGH',
        'Keep most complete version',
        earningsComponents
      )
    }

    // Check for duplicate API endpoints
    const apiFiles = oldFiles.filter(f => f.includes('/api/') && f.endsWith('route.ts'))
    const endpointMap = new Map()

    for (const file of apiFiles) {
      const endpoint = this.extractApiEndpoint(file)
      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, [])
      }
      endpointMap.get(endpoint).push(file)
    }

    for (const [endpoint, files] of endpointMap.entries()) {
      if (files.length > 1) {
        this.createFlag(
          'DUPLICATE_DETECTED',
          endpoint,
          `CRITICAL: Duplicate API endpoint '${endpoint}' found in ${files.length} files. Must consolidate.`,
          'CRITICAL',
          'Merge functionality into single endpoint',
          files
        )
      }
    }
  }

  async flagArchitecturalViolations() {
    log('yellow', '🏗️ Flagging architectural violations...')

    const oldFiles = await this.getTypeScriptFiles(this.oldProjectRoot)

    for (const file of oldFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const relativePath = file.replace(this.oldProjectRoot, '')

        // Flag console.log in production code
        if (content.includes('console.log') || content.includes('console.warn')) {
          this.createFlag(
            'ARCHITECTURAL_VIOLATION',
            relativePath,
            'LOW: Contains console.log statements. Remove for production.',
            'LOW',
            'Replace with proper logging system',
            []
          )
        }

        // Flag 'any' type usage
        if (content.includes(': any') || content.includes('as any')) {
          this.createFlag(
            'ARCHITECTURAL_VIOLATION',
            relativePath,
            'MEDIUM: Uses "any" type. Replace with proper TypeScript types.',
            'MEDIUM',
            'Define proper interfaces and types',
            []
          )
        }

        // Flag direct database access in components
        if (relativePath.includes('/components/') && this.hasDirectDatabaseAccess(content)) {
          this.createFlag(
            'ARCHITECTURAL_VIOLATION',
            relativePath,
            'HIGH: Component has direct database access. Use API routes instead.',
            'HIGH',
            'Move database logic to API routes',
            []
          )
        }

        // Flag missing error boundaries
        if (relativePath.includes('/components/') && !content.includes('ErrorBoundary') && content.includes('export')) {
          this.createFlag(
            'ARCHITECTURAL_VIOLATION',
            relativePath,
            'MEDIUM: Component lacks error boundary. Add error handling.',
            'MEDIUM',
            'Wrap with ErrorBoundary component',
            []
          )
        }

      } catch (error) {
        // File might not be readable
      }
    }
  }

  async flagMissingDependencies() {
    log('yellow', '📦 Flagging missing dependencies...')

    const requiredNewFiles = [
      { file: 'src/lib/pricing/cost-calculator.ts', reason: 'Real-time pricing system', priority: 'CRITICAL' },
      { file: 'src/lib/middleware/compression-middleware.ts', reason: 'Context compression for AI cost savings', priority: 'HIGH' },
      { file: 'src/components/pricing/pricing-guard.tsx', reason: 'Prevent actions without credits', priority: 'HIGH' },
      { file: 'app/ai-library/page.tsx', reason: 'AI-generated stories library', priority: 'MEDIUM' },
      { file: 'app/my-library/page.tsx', reason: 'User-created stories library', priority: 'MEDIUM' },
      { file: 'src/lib/automation/automation-engine.ts', reason: 'Full story automation', priority: 'MEDIUM' },
    ]

    for (const required of requiredNewFiles) {
      const exists = fs.existsSync(path.join(this.newProjectRoot, required.file))
      if (!exists) {
        this.createFlag(
          'MISSING_DEPENDENCY',
          required.file,
          `${required.priority}: Missing new feature - ${required.reason}`,
          required.priority,
          'Implement new feature',
          []
        )
      }
    }
  }

  async flagConsolidationNeeds() {
    log('yellow', '🔄 Flagging consolidation needs...')

    // Flag old project files that need consolidation
    const oldComponents = await this.getTypeScriptFiles(this.oldProjectRoot)

    // Look for components that should be consolidated
    const patterns = [
      { pattern: /Loading/i, target: 'src/components/ui/loading.tsx', reason: 'Consolidate all loading components' },
      { pattern: /Error/i, target: 'src/components/ui/error-boundary.tsx', reason: 'Consolidate error handling' },
      { pattern: /Button/i, target: 'src/components/ui/button.tsx', reason: 'Consolidate button variants' },
    ]

    for (const pattern of patterns) {
      const matches = oldComponents.filter(f => pattern.pattern.test(path.basename(f)))
      if (matches.length > 1) {
        this.createFlag(
          'NEEDS_CONSOLIDATION',
          pattern.target,
          `MEDIUM: Found ${matches.length} components matching ${pattern.pattern}. ${pattern.reason}`,
          'MEDIUM',
          'Create unified component',
          matches
        )
      }
    }
  }

  async flagIncompleteImplementations() {
    log('yellow', '🎯 Flagging incomplete implementations...')

    const features = [
      {
        name: 'Pricing System',
        files: ['src/lib/pricing/cost-calculator.ts', 'src/components/pricing/cost-display.tsx'],
        priority: 'CRITICAL'
      },
      {
        name: 'AI Compression',
        files: ['src/lib/middleware/compression-middleware.ts', 'src/lib/ai/context-optimizer.ts'],
        priority: 'HIGH'
      },
      {
        name: 'Library Separation',
        files: ['app/ai-library/page.tsx', 'app/my-library/page.tsx'],
        priority: 'HIGH'
      },
      {
        name: 'Auto-generation',
        files: ['src/lib/story-bible/auto-generator.ts', 'src/components/story-bible/story-bible-manager.tsx'],
        priority: 'MEDIUM'
      }
    ]

    for (const feature of features) {
      const missing = []
      for (const file of feature.files) {
        if (!fs.existsSync(path.join(this.newProjectRoot, file))) {
          missing.push(file)
        }
      }

      if (missing.length > 0) {
        const completion = ((feature.files.length - missing.length) / feature.files.length * 100).toFixed(1)
        this.createFlag(
          'INCOMPLETE_IMPLEMENTATION',
          feature.name,
          `${feature.priority}: ${feature.name} is ${completion}% complete. Missing: ${missing.join(', ')}`,
          feature.priority,
          'Complete feature implementation',
          missing
        )
      }
    }
  }

  async flagSecurityConcerns() {
    log('yellow', '🔒 Flagging security concerns...')

    // Check for hardcoded secrets in old project
    const oldFiles = await this.getTypeScriptFiles(this.oldProjectRoot)

    for (const file of oldFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const relativePath = file.replace(this.oldProjectRoot, '')

        // Look for potential hardcoded secrets
        const secretPatterns = [
          /sk_live_[a-zA-Z0-9]+/g, // Stripe live keys
          /sk_test_[a-zA-Z0-9]+/g, // Stripe test keys
          /eyJ[a-zA-Z0-9-_]*\.[a-zA-Z0-9-_]*\.[a-zA-Z0-9-_]*/g, // JWT tokens
        ]

        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            this.createFlag(
              'SECURITY_CONCERN',
              relativePath,
              'CRITICAL: Contains potential hardcoded secrets. Must use environment variables.',
              'CRITICAL',
              'Move secrets to environment variables',
              []
            )
          }
        }

        // Check for unsafe practices
        if (content.includes('dangerouslySetInnerHTML')) {
          this.createFlag(
            'SECURITY_CONCERN',
            relativePath,
            'HIGH: Uses dangerouslySetInnerHTML. Verify content is sanitized.',
            'HIGH',
            'Ensure proper content sanitization',
            []
          )
        }

      } catch (error) {
        // File might not be readable
      }
    }
  }

  async flagPerformanceIssues() {
    log('yellow', '⚡ Flagging performance issues...')

    const oldFiles = await this.getTypeScriptFiles(this.oldProjectRoot)

    for (const file of oldFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const relativePath = file.replace(this.oldProjectRoot, '')

        // Flag large files that might need splitting
        if (content.length > 10000) { // 10KB+
          this.createFlag(
            'PERFORMANCE_ISSUE',
            relativePath,
            `MEDIUM: Large file (${(content.length / 1000).toFixed(1)}KB). Consider splitting.`,
            'MEDIUM',
            'Split into smaller, focused components',
            []
          )
        }

        // Flag missing React.memo for large components
        if (content.includes('export') && content.length > 5000 && !content.includes('React.memo') && !content.includes('memo(')) {
          this.createFlag(
            'PERFORMANCE_ISSUE',
            relativePath,
            'LOW: Large component without memoization. Consider React.memo.',
            'LOW',
            'Add React.memo if component props are stable',
            []
          )
        }

      } catch (error) {
        // File might not be readable
      }
    }
  }

  generateFlagDatabase() {
    this.flagDatabase.summary.totalFlags = this.flagCount

    // Save flag database
    const flagPath = path.join(this.newProjectRoot, 'flag-database.json')
    fs.writeFileSync(flagPath, JSON.stringify(this.flagDatabase, null, 2))

    // Generate prioritized action list
    const actionList = this.generateActionList()
    const actionPath = path.join(this.newProjectRoot, 'flagged-actions.md')
    fs.writeFileSync(actionPath, actionList)

    log('green', `\n✅ Flag database saved: flag-database.json`)
    log('green', `✅ Action list saved: flagged-actions.md`)
  }

  generateActionList() {
    let markdown = '# 🚩 FLAGGED ACTIONS - SYSTEMATIC RESOLUTION PLAN\n\n'
    markdown += `**Scan Date:** ${this.flagDatabase.scanDate}\n`
    markdown += `**Total Flags:** ${this.flagDatabase.summary.totalFlags}\n\n`

    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    for (const priority of priorities) {
      const priorityFlags = []

      // Collect all flags of this priority
      for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
        const priorityFlagsInCategory = flags.filter(f => f.priority === priority)
        priorityFlags.push(...priorityFlagsInCategory)
      }

      if (priorityFlags.length > 0) {
        markdown += `## 🔥 ${priority} PRIORITY (${priorityFlags.length} flags)\n\n`

        priorityFlags.forEach((flag, index) => {
          markdown += `### ${index + 1}. ${flag.issue}\n`
          markdown += `- **File:** \`${flag.file}\`\n`
          markdown += `- **Category:** ${flag.category}\n`
          markdown += `- **Effort:** ${flag.estimatedEffort}\n`

          if (flag.autoFix) {
            markdown += `- **Auto-fix:** ${flag.autoFix}\n`
          }

          if (flag.dependencies.length > 0) {
            markdown += `- **Dependencies:** ${flag.dependencies.map(d => `\`${path.basename(d)}\``).join(', ')}\n`
          }

          markdown += `- **Flag ID:** \`${flag.id}\`\n\n`
        })
      }
    }

    markdown += '\n## 📋 RESOLUTION WORKFLOW\n\n'
    markdown += '1. Start with CRITICAL flags\n'
    markdown += '2. Mark flags as IN_PROGRESS when starting\n'
    markdown += '3. Mark as RESOLVED when complete\n'
    markdown += '4. Use flag ID for tracking\n\n'
    markdown += '**Commands:**\n'
    markdown += '```bash\n'
    markdown += 'npm run flags:list           # Show all flags\n'
    markdown += 'npm run flags:resolve <id>   # Mark flag as resolved\n'
    markdown += 'npm run flags:progress <id>  # Mark flag as in progress\n'
    markdown += '```\n'

    return markdown
  }

  displayFlagSummary() {
    log('blue', '\n📊 AUTOMATED FLAG SUMMARY')
    log('blue', '==========================\n')

    log('red', `🔥 CRITICAL: ${this.flagDatabase.summary.critical} flags`)
    log('yellow', `⚡ HIGH: ${this.flagDatabase.summary.high} flags`)
    log('blue', `📋 MEDIUM: ${this.flagDatabase.summary.medium} flags`)
    log('green', `📝 LOW: ${this.flagDatabase.summary.low} flags`)

    log('magenta', `\n📊 TOTAL FLAGS: ${this.flagDatabase.summary.totalFlags}`)

    log('yellow', '\n📋 NEXT STEPS:')
    log('yellow', '1. Review flagged-actions.md for prioritized list')
    log('yellow', '2. Start with CRITICAL flags')
    log('yellow', '3. Use npm run flags:* commands to track progress')
    log('yellow', '4. Re-scan after major changes')

    log('blue', '\n📁 FILES CREATED:')
    log('blue', '  - flag-database.json (complete flag data)')
    log('blue', '  - flagged-actions.md (prioritized action plan)')
  }

  // Helper methods
  estimateEffort(priority, issue) {
    if (priority === 'CRITICAL') return issue.includes('Transfer') ? '2-4 hours' : '1-2 hours'
    if (priority === 'HIGH') return '1-3 hours'
    if (priority === 'MEDIUM') return '30 minutes - 1 hour'
    return '15-30 minutes'
  }

  async getAllFiles(rootDir) {
    const files = []
    function scanDir(dir) {
      try {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath)
          } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }
    scanDir(rootDir)
    return files
  }

  async getTypeScriptFiles(rootDir) {
    return (await this.getAllFiles(rootDir)).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  }

  extractApiEndpoint(filePath) {
    const apiIndex = filePath.indexOf('/api/')
    return filePath.substring(apiIndex + 4).replace('/route.ts', '')
  }

  hasDirectDatabaseAccess(content) {
    return content.includes('supabase.from(') || content.includes('createClient()')
  }
}

// CLI interface
async function runAutoFlagSystem() {
  const oldProject = path.resolve('../')  // Parent directory (old project)
  const newProject = process.cwd()        // Current directory (new project)

  const flagger = new AutoFlagSystem(oldProject, newProject)
  await flagger.runCompleteSystemScan()
}

if (require.main === module) {
  runAutoFlagSystem().catch(error => {
    log('red', `Auto-flag system failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { AutoFlagSystem }