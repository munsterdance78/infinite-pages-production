#!/usr/bin/env node

/**
 * TRANSFER TRACKING SYSTEM
 * Tracks progress of component transfers and identifies what needs to be revisited
 */

const fs = require('fs')
const path = require('path')

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

class TransferTracker {
  constructor(oldProjectRoot, newProjectRoot) {
    this.oldProjectRoot = oldProjectRoot
    this.newProjectRoot = newProjectRoot
    this.transferLog = this.loadTransferLog()
    this.requiredTransfers = this.defineRequiredTransfers()
  }

  defineRequiredTransfers() {
    return {
      'Core Infrastructure': [
        { from: 'middleware.ts', to: 'middleware.ts', priority: 'CRITICAL', status: 'PENDING' },
        { from: 'lib/supabase/client.ts', to: 'src/lib/database/supabase.ts', priority: 'CRITICAL', status: 'COMPLETED' },
        { from: 'lib/constants.ts', to: 'src/lib/utils/constants.ts', priority: 'HIGH', status: 'PENDING' },
      ],
      'API Endpoints': [
        { from: 'app/api/auth/callback/route.ts', to: 'app/api/auth/callback/route.ts', priority: 'CRITICAL', status: 'PENDING' },
        { from: 'app/api/stories/route.ts', to: 'app/api/stories/route.ts', priority: 'HIGH', status: 'PENDING' },
        { from: 'app/api/billing/webhook/route.ts', to: 'app/api/billing/webhook/route.ts', priority: 'HIGH', status: 'PENDING' },
      ],
      'Core Components': [
        { from: 'components/UnifiedStoryCreator.tsx', to: 'src/components/features/stories/story-creator.tsx', priority: 'HIGH', status: 'PENDING' },
        { from: 'components/CreditPurchase.tsx', to: 'src/components/pricing/credit-purchase.tsx', priority: 'MEDIUM', status: 'PENDING' },
      ],
      'Database Schema': [
        { from: 'supabase/migrations/', to: 'supabase/migrations/', priority: 'CRITICAL', status: 'PENDING' },
      ],
      'New Features': [
        { from: 'NEW', to: 'src/components/pricing/cost-calculator.tsx', priority: 'HIGH', status: 'PENDING' },
        { from: 'NEW', to: 'src/lib/middleware/compression-middleware.ts', priority: 'HIGH', status: 'PENDING' },
        { from: 'NEW', to: 'app/ai-library/page.tsx', priority: 'MEDIUM', status: 'PENDING' },
        { from: 'NEW', to: 'app/my-library/page.tsx', priority: 'MEDIUM', status: 'PENDING' },
      ]
    }
  }

  loadTransferLog() {
    const logPath = path.join(this.newProjectRoot, 'transfer-log.json')
    try {
      if (fs.existsSync(logPath)) {
        return JSON.parse(fs.readFileSync(logPath, 'utf8'))
      }
    } catch (error) {
      // Log file doesn't exist or is corrupted
    }
    return {
      startDate: new Date().toISOString(),
      transfers: [],
      lastUpdate: new Date().toISOString()
    }
  }

  saveTransferLog() {
    const logPath = path.join(this.newProjectRoot, 'transfer-log.json')
    this.transferLog.lastUpdate = new Date().toISOString()
    fs.writeFileSync(logPath, JSON.stringify(this.transferLog, null, 2))
  }

  markTransferCompleted(fromPath, toPath, notes = '') {
    const transfer = {
      from: fromPath,
      to: toPath,
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      notes
    }

    this.transferLog.transfers.push(transfer)
    this.saveTransferLog()

    log('green', `✅ Transfer completed: ${fromPath} → ${toPath}`)
  }

  markTransferPending(fromPath, toPath, reason = '') {
    const transfer = {
      from: fromPath,
      to: toPath,
      status: 'PENDING',
      reason,
      flaggedAt: new Date().toISOString()
    }

    this.transferLog.transfers.push(transfer)
    this.saveTransferLog()

    log('yellow', `⏳ Transfer pending: ${fromPath} → ${toPath} (${reason})`)
  }

  markForRevisit(filePath, reason, priority = 'MEDIUM') {
    const revisit = {
      file: filePath,
      reason,
      priority,
      flaggedAt: new Date().toISOString(),
      status: 'NEEDS_REVISIT'
    }

    this.transferLog.transfers.push(revisit)
    this.saveTransferLog()

    const color = priority === 'CRITICAL' ? 'red' : priority === 'HIGH' ? 'yellow' : 'blue'
    log(color, `🔄 Marked for revisit: ${filePath} (${reason})`)
  }

  generateTransferReport() {
    log('blue', '\n📊 TRANSFER PROGRESS REPORT')
    log('blue', '============================\n')

    // Overall progress
    const totalRequired = Object.values(this.requiredTransfers)
      .flat()
      .length

    const completed = this.transferLog.transfers
      .filter(t => t.status === 'COMPLETED')
      .length

    const percentage = totalRequired > 0 ? (completed / totalRequired * 100).toFixed(1) : 0

    log('blue', `📈 Overall Progress: ${completed}/${totalRequired} (${percentage}%)`)
    log('blue', `📅 Started: ${new Date(this.transferLog.startDate).toLocaleDateString()}`)
    log('blue', `🕒 Last Update: ${new Date(this.transferLog.lastUpdate).toLocaleString()}\n`)

    // Progress by category
    for (const [category, transfers] of Object.entries(this.requiredTransfers)) {
      const categoryCompleted = transfers.filter(t =>
        this.transferLog.transfers.some(log =>
          log.to === t.to && log.status === 'COMPLETED'
        )
      ).length

      const categoryProgress = transfers.length > 0 ? (categoryCompleted / transfers.length * 100).toFixed(1) : 0

      log('magenta', `📂 ${category}: ${categoryCompleted}/${transfers.length} (${categoryProgress}%)`)

      // Show status of each transfer
      transfers.forEach(transfer => {
        const logEntry = this.transferLog.transfers.find(log => log.to === transfer.to)
        const status = logEntry?.status || transfer.status

        const icon = status === 'COMPLETED' ? '✅' :
                    status === 'PENDING' ? '⏳' :
                    status === 'NEEDS_REVISIT' ? '🔄' : '❌'

        const color = status === 'COMPLETED' ? 'green' :
                     status === 'PENDING' ? 'yellow' :
                     status === 'NEEDS_REVISIT' ? 'blue' : 'red'

        log(color, `   ${icon} ${transfer.to}`)
      })

      log('reset', '')
    }

    // Items needing revisit
    const needsRevisit = this.transferLog.transfers.filter(t => t.status === 'NEEDS_REVISIT')
    if (needsRevisit.length > 0) {
      log('yellow', `🔄 ITEMS NEEDING REVISIT (${needsRevisit.length}):`)
      needsRevisit.forEach(item => {
        const color = item.priority === 'CRITICAL' ? 'red' :
                     item.priority === 'HIGH' ? 'yellow' : 'blue'
        log(color, `   ${item.priority}: ${item.file} - ${item.reason}`)
      })
      log('reset', '')
    }

    // Pending transfers
    const pending = this.transferLog.transfers.filter(t => t.status === 'PENDING')
    if (pending.length > 0) {
      log('yellow', `⏳ PENDING TRANSFERS (${pending.length}):`)
      pending.forEach(item => {
        log('yellow', `   📄 ${item.from} → ${item.to}`)
        if (item.reason) {
          log('yellow', `      Reason: ${item.reason}`)
        }
      })
      log('reset', '')
    }

    // Next priorities
    log('blue', '📋 NEXT PRIORITIES:')
    const criticalPending = Object.values(this.requiredTransfers)
      .flat()
      .filter(t => t.priority === 'CRITICAL' && t.status === 'PENDING')

    if (criticalPending.length > 0) {
      log('red', '🔥 CRITICAL (do these first):')
      criticalPending.forEach(item => {
        log('red', `   1. ${item.from} → ${item.to}`)
      })
    }

    const highPending = Object.values(this.requiredTransfers)
      .flat()
      .filter(t => t.priority === 'HIGH' && t.status === 'PENDING')

    if (highPending.length > 0) {
      log('yellow', '⚡ HIGH PRIORITY:')
      highPending.slice(0, 3).forEach((item, index) => {
        log('yellow', `   ${index + 1}. ${item.from} → ${item.to}`)
      })
    }
  }

  checkForMissingDependencies() {
    log('blue', '\n🔍 CHECKING FOR MISSING DEPENDENCIES...\n')

    const criticalFiles = [
      'middleware.ts',
      'src/lib/database/supabase.ts',
      'src/lib/billing/stripe.ts',
      'src/lib/ai/claude-client.ts'
    ]

    criticalFiles.forEach(file => {
      const fullPath = path.join(this.newProjectRoot, file)
      if (!fs.existsSync(fullPath)) {
        log('red', `❌ MISSING CRITICAL FILE: ${file}`)
        this.markTransferPending('OLD_PROJECT', file, 'Critical dependency missing')
      } else {
        log('green', `✅ ${file}`)
      }
    })
  }

  suggestNextActions() {
    log('blue', '\n💡 SUGGESTED NEXT ACTIONS:\n')

    const actions = [
      '1. Complete all CRITICAL transfers first',
      '2. Run gap detection after each major component',
      '3. Run bloat detection before adding new features',
      '4. Test each feature as it\'s transferred',
      '5. Update transfer log after each completion'
    ]

    actions.forEach(action => {
      log('yellow', action)
    })
  }
}

// CLI interface
async function runTransferTracker() {
  const oldProject = path.resolve('../')  // Parent directory (old project)
  const newProject = process.cwd()        // Current directory (new project)

  const tracker = new TransferTracker(oldProject, newProject)

  const command = process.argv[2]

  switch (command) {
    case 'report':
      tracker.generateTransferReport()
      tracker.checkForMissingDependencies()
      tracker.suggestNextActions()
      break

    case 'complete':
      const fromPath = process.argv[3]
      const toPath = process.argv[4]
      const notes = process.argv[5] || ''
      if (fromPath && toPath) {
        tracker.markTransferCompleted(fromPath, toPath, notes)
      } else {
        log('red', 'Usage: node transfer-tracker.js complete <from> <to> [notes]')
      }
      break

    case 'revisit':
      const filePath = process.argv[3]
      const reason = process.argv[4]
      const priority = process.argv[5] || 'MEDIUM'
      if (filePath && reason) {
        tracker.markForRevisit(filePath, reason, priority)
      } else {
        log('red', 'Usage: node transfer-tracker.js revisit <file> <reason> [priority]')
      }
      break

    default:
      log('blue', 'Transfer Tracker Usage:')
      log('yellow', '  node transfer-tracker.js report                          - Show progress report')
      log('yellow', '  node transfer-tracker.js complete <from> <to> [notes]    - Mark transfer complete')
      log('yellow', '  node transfer-tracker.js revisit <file> <reason> [priority] - Mark for revisit')
  }
}

if (require.main === module) {
  runTransferTracker().catch(error => {
    log('red', `Transfer tracker failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { TransferTracker }