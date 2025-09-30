#!/usr/bin/env node

/**
 * FLAG MANAGEMENT SYSTEM
 * Manage flagged items without user interaction during flagging
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

class FlagManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.flagDbPath = path.join(projectRoot, 'flag-database.json')
    this.flagDatabase = this.loadFlagDatabase()
  }

  loadFlagDatabase() {
    try {
      if (fs.existsSync(this.flagDbPath)) {
        return JSON.parse(fs.readFileSync(this.flagDbPath, 'utf8'))
      }
    } catch (error) {
      log('red', 'Error loading flag database')
    }
    return null
  }

  saveFlagDatabase() {
    fs.writeFileSync(this.flagDbPath, JSON.stringify(this.flagDatabase, null, 2))
  }

  listFlags(priority = null, category = null, status = 'FLAGGED') {
    if (!this.flagDatabase) {
      log('red', 'No flag database found. Run auto-flag-system first.')
      return
    }

    log('blue', '\n📋 FLAGGED ITEMS LIST')
    log('blue', '=====================\n')

    const allFlags = []
    for (const [cat, flags] of Object.entries(this.flagDatabase.flags)) {
      for (const flag of flags) {
        if ((!priority || flag.priority === priority) &&
            (!category || cat === category) &&
            (!status || flag.status === status)) {
          allFlags.push({ ...flag, category: cat })
        }
      }
    }

    if (allFlags.length === 0) {
      log('green', '✅ No flags matching criteria!')
      return
    }

    // Group by priority
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    for (const pri of priorities) {
      const priFlags = allFlags.filter(f => f.priority === pri)
      if (priFlags.length > 0) {
        const color = pri === 'CRITICAL' ? 'red' : pri === 'HIGH' ? 'yellow' : 'blue'
        log(color, `\n🔥 ${pri} (${priFlags.length} flags):`)

        priFlags.forEach((flag, index) => {
          const statusIcon = flag.status === 'FLAGGED' ? '🚩' :
                            flag.status === 'IN_PROGRESS' ? '🔄' : '✅'

          log(color, `   ${statusIcon} [${flag.id.substring(0, 8)}] ${flag.issue}`)
          log(color, `      📁 ${flag.file}`)
          log(color, `      ⏱️  ${flag.estimatedEffort}`)
          if (flag.autoFix) {
            log(color, `      🔧 Auto-fix: ${flag.autoFix}`)
          }
        })
      }
    }

    log('blue', `\n📊 Total: ${allFlags.length} flags`)
  }

  resolveFlag(flagId) {
    if (!this.flagDatabase) {
      log('red', 'No flag database found.')
      return
    }

    let found = false
    for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
      const flag = flags.find(f => f.id.startsWith(flagId))
      if (flag) {
        flag.status = 'RESOLVED'
        flag.resolvedAt = new Date().toISOString()
        this.saveFlagDatabase()

        log('green', `✅ Flag resolved: ${flag.issue}`)
        log('green', `📁 File: ${flag.file}`)
        found = true
        break
      }
    }

    if (!found) {
      log('red', `Flag ID not found: ${flagId}`)
    }
  }

  markInProgress(flagId) {
    if (!this.flagDatabase) {
      log('red', 'No flag database found.')
      return
    }

    let found = false
    for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
      const flag = flags.find(f => f.id.startsWith(flagId))
      if (flag) {
        flag.status = 'IN_PROGRESS'
        flag.startedAt = new Date().toISOString()
        this.saveFlagDatabase()

        log('yellow', `🔄 Flag marked in progress: ${flag.issue}`)
        log('yellow', `📁 File: ${flag.file}`)
        found = true
        break
      }
    }

    if (!found) {
      log('red', `Flag ID not found: ${flagId}`)
    }
  }

  addNote(flagId, note) {
    if (!this.flagDatabase) {
      log('red', 'No flag database found.')
      return
    }

    let found = false
    for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
      const flag = flags.find(f => f.id.startsWith(flagId))
      if (flag) {
        if (!flag.notes) flag.notes = []
        flag.notes.push({
          note,
          addedAt: new Date().toISOString()
        })
        this.saveFlagDatabase()

        log('blue', `📝 Note added to flag: ${flag.issue}`)
        log('blue', `📝 Note: ${note}`)
        found = true
        break
      }
    }

    if (!found) {
      log('red', `Flag ID not found: ${flagId}`)
    }
  }

  showProgress() {
    if (!this.flagDatabase) {
      log('red', 'No flag database found.')
      return
    }

    const summary = {
      FLAGGED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }

    for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
      for (const flag of flags) {
        summary[flag.status]++
        summary[flag.priority]++
      }
    }

    const total = summary.FLAGGED + summary.IN_PROGRESS + summary.RESOLVED
    const completed = summary.RESOLVED
    const percentage = total > 0 ? (completed / total * 100).toFixed(1) : 0

    log('blue', '\n📊 FLAG RESOLUTION PROGRESS')
    log('blue', '============================\n')

    log('blue', `📈 Overall Progress: ${completed}/${total} (${percentage}%)`)
    log('green', `✅ Resolved: ${summary.RESOLVED}`)
    log('yellow', `🔄 In Progress: ${summary.IN_PROGRESS}`)
    log('red', `🚩 Flagged: ${summary.FLAGGED}`)

    log('blue', '\n🎯 Priority Breakdown:')
    log('red', `🔥 Critical: ${summary.CRITICAL}`)
    log('yellow', `⚡ High: ${summary.HIGH}`)
    log('blue', `📋 Medium: ${summary.MEDIUM}`)
    log('green', `📝 Low: ${summary.LOW}`)

    // Show completion rate by priority
    for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
      const categoryFlags = flags.length
      const categoryResolved = flags.filter(f => f.status === 'RESOLVED').length
      const categoryProgress = categoryFlags > 0 ? (categoryResolved / categoryFlags * 100).toFixed(1) : 0

      if (categoryFlags > 0) {
        log('magenta', `📂 ${category}: ${categoryResolved}/${categoryFlags} (${categoryProgress}%)`)
      }
    }
  }

  getNextAction() {
    if (!this.flagDatabase) {
      log('red', 'No flag database found.')
      return
    }

    // Find highest priority flagged item
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

    for (const priority of priorities) {
      for (const [category, flags] of Object.entries(this.flagDatabase.flags)) {
        const nextFlag = flags.find(f => f.priority === priority && f.status === 'FLAGGED')
        if (nextFlag) {
          const color = priority === 'CRITICAL' ? 'red' : priority === 'HIGH' ? 'yellow' : 'blue'

          log(color, '\n🎯 NEXT RECOMMENDED ACTION:')
          log(color, '===========================\n')
          log(color, `🔥 Priority: ${nextFlag.priority}`)
          log(color, `📋 Issue: ${nextFlag.issue}`)
          log(color, `📁 File: ${nextFlag.file}`)
          log(color, `⏱️  Estimated Effort: ${nextFlag.estimatedEffort}`)
          log(color, `🆔 Flag ID: ${nextFlag.id.substring(0, 8)}`)

          if (nextFlag.autoFix) {
            log(color, `🔧 Suggested Fix: ${nextFlag.autoFix}`)
          }

          if (nextFlag.dependencies.length > 0) {
            log(color, `📦 Dependencies: ${nextFlag.dependencies.join(', ')}`)
          }

          log(color, '\n📋 Commands:')
          log(color, `  npm run flags:progress ${nextFlag.id.substring(0, 8)}`)
          log(color, `  npm run flags:resolve ${nextFlag.id.substring(0, 8)}`)

          return
        }
      }
    }

    log('green', '🎉 All flags resolved! Great job!')
  }
}

// CLI interface
async function runFlagManager() {
  const projectRoot = process.cwd()
  const manager = new FlagManager(projectRoot)

  const command = process.argv[2]
  const arg1 = process.argv[3]
  const arg2 = process.argv[4]

  switch (command) {
    case 'list':
      manager.listFlags(arg1, arg2) // priority, category
      break

    case 'resolve':
      if (arg1) {
        manager.resolveFlag(arg1)
      } else {
        log('red', 'Usage: npm run flags:resolve <flag-id>')
      }
      break

    case 'progress':
      if (arg1) {
        manager.markInProgress(arg1)
      } else {
        log('red', 'Usage: npm run flags:progress <flag-id>')
      }
      break

    case 'note':
      if (arg1 && arg2) {
        manager.addNote(arg1, arg2)
      } else {
        log('red', 'Usage: npm run flags:note <flag-id> "note text"')
      }
      break

    case 'summary':
      manager.showProgress()
      break

    case 'next':
      manager.getNextAction()
      break

    default:
      log('blue', 'Flag Manager Commands:')
      log('yellow', '  npm run flags:list [priority] [category]  - List all flags')
      log('yellow', '  npm run flags:resolve <id>                - Mark flag as resolved')
      log('yellow', '  npm run flags:progress <id>               - Mark flag as in progress')
      log('yellow', '  npm run flags:note <id> "note"            - Add note to flag')
      log('yellow', '  npm run flags:summary                     - Show progress summary')
      log('yellow', '  npm run flags:next                        - Get next recommended action')
  }
}

if (require.main === module) {
  runFlagManager().catch(error => {
    log('red', `Flag manager failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { FlagManager }