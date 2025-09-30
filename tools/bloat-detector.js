#!/usr/bin/env node

/**
 * BLOAT DETECTION SYSTEM
 * Identifies duplicate components, redundant code, and architectural violations
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

class BloatDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.duplicates = []
    this.violations = []
    this.redundancies = []
    this.fileHashes = new Map()
    this.componentSignatures = new Map()
  }

  async detectAllBloat() {
    log('blue', '\n🚫 RUNNING COMPREHENSIVE BLOAT DETECTION\n')

    await this.detectDuplicateFiles()
    await this.detectDuplicateComponents()
    await this.detectArchitecturalViolations()
    await this.detectRedundantCode()

    this.generateBloatReport()
  }

  async detectDuplicateFiles() {
    log('yellow', '📁 Detecting duplicate files...')

    const files = await this.getAllSourceFiles()

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const hash = crypto.createHash('md5').update(content).digest('hex')

        if (this.fileHashes.has(hash)) {
          this.duplicates.push({
            type: 'DUPLICATE_FILE',
            files: [this.fileHashes.get(hash), file.replace(this.projectRoot, '')],
            severity: 'HIGH',
            reason: 'Identical file content'
          })
        } else {
          this.fileHashes.set(hash, file.replace(this.projectRoot, ''))
        }
      } catch (error) {
        // File might not be readable
      }
    }
  }

  async detectDuplicateComponents() {
    log('yellow', '🧩 Detecting duplicate components...')

    const files = await this.getAllTypeScriptFiles()
    const storyCreators = []
    const apiEndpoints = new Map()
    const earningsComponents = []

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const fileName = path.basename(file, path.extname(file))

        // Check for story creator duplicates
        if (fileName.toLowerCase().includes('storycreator') ||
            fileName.toLowerCase().includes('story-creator')) {
          storyCreators.push({
            file: file.replace(this.projectRoot, ''),
            content,
            size: content.length
          })
        }

        // Check for earnings component duplicates
        if (fileName.toLowerCase().includes('earnings') &&
            (fileName.toLowerCase().includes('component') || fileName.toLowerCase().includes('hub'))) {
          earningsComponents.push({
            file: file.replace(this.projectRoot, ''),
            content,
            size: content.length
          })
        }

        // Check for API endpoint duplicates
        if (file.includes('/api/') && file.endsWith('route.ts')) {
          const endpoint = this.extractApiEndpoint(file)
          if (!apiEndpoints.has(endpoint)) {
            apiEndpoints.set(endpoint, [])
          }
          apiEndpoints.get(endpoint).push({
            file: file.replace(this.projectRoot, ''),
            content,
            methods: this.extractApiMethods(content)
          })
        }
      } catch (error) {
        // File might not exist
      }
    }

    // Report story creator duplicates
    if (storyCreators.length > 1) {
      this.duplicates.push({
        type: 'MULTIPLE_STORY_CREATORS',
        count: storyCreators.length,
        components: storyCreators,
        severity: 'CRITICAL',
        reason: 'Multiple story creator implementations found'
      })
    }

    // Report earnings component duplicates
    if (earningsComponents.length > 1) {
      this.duplicates.push({
        type: 'MULTIPLE_EARNINGS_COMPONENTS',
        count: earningsComponents.length,
        components: earningsComponents,
        severity: 'HIGH',
        reason: 'Multiple earnings components found'
      })
    }

    // Report API endpoint duplicates
    for (const [endpoint, implementations] of apiEndpoints.entries()) {
      if (implementations.length > 1) {
        this.duplicates.push({
          type: 'DUPLICATE_API_ENDPOINT',
          endpoint,
          count: implementations.length,
          implementations,
          severity: 'CRITICAL',
          reason: `Multiple implementations of ${endpoint} endpoint`
        })
      }
    }
  }

  async detectArchitecturalViolations() {
    log('yellow', '🏗️ Detecting architectural violations...')

    const files = await this.getAllTypeScriptFiles()

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const relativePath = file.replace(this.projectRoot, '')

        // Check for direct database access in components
        if (relativePath.includes('/components/') && this.hasDirectDatabaseAccess(content)) {
          this.violations.push({
            type: 'DIRECT_DB_ACCESS_IN_COMPONENT',
            file: relativePath,
            severity: 'HIGH',
            reason: 'Components should not access database directly'
          })
        }

        // Check for API calls in server components
        if (relativePath.includes('/app/') && !relativePath.includes('/api/') && this.hasClientSideApiCalls(content)) {
          this.violations.push({
            type: 'CLIENT_API_CALLS_IN_SERVER_COMPONENT',
            file: relativePath,
            severity: 'MEDIUM',
            reason: 'Server components should use direct database access'
          })
        }

        // Check for console.log in production code
        if (content.includes('console.log') || content.includes('console.warn')) {
          this.violations.push({
            type: 'CONSOLE_STATEMENTS',
            file: relativePath,
            severity: 'LOW',
            reason: 'Console statements should be removed from production code'
          })
        }

        // Check for 'any' type usage
        if (content.includes(': any') || content.includes('as any')) {
          this.violations.push({
            type: 'ANY_TYPE_USAGE',
            file: relativePath,
            severity: 'MEDIUM',
            reason: 'Avoid using "any" type - use proper TypeScript types'
          })
        }
      } catch (error) {
        // File might not exist
      }
    }
  }

  async detectRedundantCode() {
    log('yellow', '🔄 Detecting redundant code patterns...')

    const files = await this.getAllTypeScriptFiles()
    const functionSignatures = new Map()

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const functions = this.extractFunctions(content)

        for (const func of functions) {
          const signature = this.createFunctionSignature(func)
          if (!functionSignatures.has(signature)) {
            functionSignatures.set(signature, [])
          }
          functionSignatures.get(signature).push({
            file: file.replace(this.projectRoot, ''),
            function: func
          })
        }
      } catch (error) {
        // File might not exist
      }
    }

    // Find redundant functions
    for (const [signature, implementations] of functionSignatures.entries()) {
      if (implementations.length > 1) {
        this.redundancies.push({
          type: 'REDUNDANT_FUNCTION',
          signature,
          count: implementations.length,
          implementations,
          severity: 'MEDIUM',
          reason: 'Similar function implementations found - consider consolidation'
        })
      }
    }
  }

  generateBloatReport() {
    log('blue', '\n📊 BLOAT DETECTION REPORT')
    log('blue', '=========================\n')

    // File duplicates
    const fileDuplicates = this.duplicates.filter(d => d.type === 'DUPLICATE_FILE')
    if (fileDuplicates.length > 0) {
      log('red', `📁 DUPLICATE FILES (${fileDuplicates.length}):`)
      fileDuplicates.forEach(dup => {
        log('red', `   ❌ ${dup.files.join(' ↔ ')}`)
      })
      log('red', '')
    }

    // Component duplicates
    const componentDuplicates = this.duplicates.filter(d => d.type.includes('MULTIPLE_') || d.type.includes('DUPLICATE_'))
    if (componentDuplicates.length > 0) {
      log('red', `🧩 COMPONENT DUPLICATES (${componentDuplicates.length}):`)
      componentDuplicates.forEach(dup => {
        log('red', `   ❌ ${dup.type}: ${dup.count} implementations found`)
        if (dup.components) {
          dup.components.forEach(comp => {
            log('red', `      📄 ${comp.file} (${comp.size} chars)`)
          })
        }
        if (dup.implementations) {
          dup.implementations.forEach(impl => {
            log('red', `      📄 ${impl.file}`)
          })
        }
      })
      log('red', '')
    }

    // Architectural violations
    if (this.violations.length > 0) {
      log('yellow', `🏗️ ARCHITECTURAL VIOLATIONS (${this.violations.length}):`)
      const groupedViolations = this.groupBy(this.violations, 'type')
      for (const [type, violations] of Object.entries(groupedViolations)) {
        log('yellow', `   ⚠️  ${type}: ${violations.length} occurrences`)
        violations.slice(0, 3).forEach(v => {
          log('yellow', `      📄 ${v.file}`)
        })
        if (violations.length > 3) {
          log('yellow', `      ... and ${violations.length - 3} more`)
        }
      }
      log('yellow', '')
    }

    // Redundancies
    if (this.redundancies.length > 0) {
      log('magenta', `🔄 REDUNDANT CODE (${this.redundancies.length}):`)
      this.redundancies.slice(0, 5).forEach(red => {
        log('magenta', `   🔄 ${red.signature}: ${red.count} similar implementations`)
      })
      log('magenta', '')
    }

    // Summary and recommendations
    const totalIssues = this.duplicates.length + this.violations.length + this.redundancies.length
    if (totalIssues === 0) {
      log('green', '✅ NO BLOAT DETECTED - ARCHITECTURE IS CLEAN!')
    } else {
      log('red', `🚨 TOTAL BLOAT ISSUES: ${totalIssues}`)

      log('yellow', '\n📋 IMMEDIATE ACTIONS REQUIRED:')
      const criticalIssues = [...this.duplicates, ...this.violations].filter(i => i.severity === 'CRITICAL')
      if (criticalIssues.length > 0) {
        log('red', `1. 🔥 CRITICAL: Fix ${criticalIssues.length} critical issues immediately`)
      }

      log('yellow', '2. 🧹 HIGH: Remove duplicate components')
      log('yellow', '3. 🏗️ MEDIUM: Fix architectural violations')
      log('yellow', '4. 🔄 LOW: Consolidate redundant code')
    }
  }

  // Helper methods
  async getAllSourceFiles() {
    const files = []
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    function scanDir(dir) {
      try {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath)
          } else if (extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }

    scanDir(this.projectRoot)
    return files
  }

  async getAllTypeScriptFiles() {
    return (await this.getAllSourceFiles()).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  }

  extractApiEndpoint(filePath) {
    const apiIndex = filePath.indexOf('/api/')
    const routePath = filePath.substring(apiIndex + 4).replace('/route.ts', '')
    return routePath.replace(/\[([^\]]+)\]/g, ':$1') // Convert [id] to :id
  }

  extractApiMethods(content) {
    const methods = []
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g
    let match
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1])
    }
    return methods
  }

  hasDirectDatabaseAccess(content) {
    return content.includes('supabase.from(') ||
           content.includes('createClient()') ||
           content.includes('createServerClient()')
  }

  hasClientSideApiCalls(content) {
    return content.includes('fetch(') &&
           (content.includes("'use client'") || content.includes('"use client"'))
  }

  extractFunctions(content) {
    const functions = []
    const funcRegex = /(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|export\s+function\s+\w+)/g
    let match
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(match[1])
    }
    return functions
  }

  createFunctionSignature(func) {
    // Simplified signature - just the function name and parameter pattern
    return func.replace(/\s+/g, ' ').substring(0, 50)
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key]
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {})
  }
}

// Run bloat detection
async function runBloatDetection() {
  const projectRoot = process.cwd()
  const detector = new BloatDetector(projectRoot)
  await detector.detectAllBloat()
}

if (require.main === module) {
  runBloatDetection().catch(error => {
    log('red', `Bloat detection failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { BloatDetector }