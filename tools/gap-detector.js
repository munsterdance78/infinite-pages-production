#!/usr/bin/env node

/**
 * GAP DETECTION SYSTEM
 * Identifies missing components, broken imports, and incomplete transfers
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

class GapDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.gaps = []
    this.missingImports = []
    this.brokenReferences = []
    this.componentMap = new Map()
  }

  async detectAllGaps() {
    log('blue', '\n🔍 RUNNING COMPREHENSIVE GAP DETECTION\n')

    await this.scanDirectoryStructure()
    await this.detectMissingImports()
    await this.detectBrokenComponents()
    await this.detectIncompleteFeatures()

    this.generateReport()
  }

  async scanDirectoryStructure() {
    log('yellow', '📁 Scanning directory structure...')

    const expectedDirs = [
      'app/api/stories',
      'app/api/billing',
      'app/api/auth',
      'src/components/ui',
      'src/components/pricing',
      'src/components/story-bible',
      'src/components/workflow',
      'src/lib/pricing',
      'src/lib/ai',
      'src/lib/database',
      'supabase/migrations'
    ]

    for (const dir of expectedDirs) {
      const fullPath = path.join(this.projectRoot, dir)
      if (!fs.existsSync(fullPath)) {
        this.gaps.push({
          type: 'MISSING_DIRECTORY',
          path: dir,
          severity: 'HIGH',
          description: `Required directory missing: ${dir}`
        })
      }
    }
  }

  async detectMissingImports() {
    log('yellow', '📦 Detecting missing imports...')

    const files = await this.getAllTypeScriptFiles()

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const imports = this.extractImports(content)

        for (const importPath of imports) {
          if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
            const resolvedPath = this.resolveImportPath(file, importPath)
            if (!fs.existsSync(resolvedPath)) {
              this.missingImports.push({
                type: 'MISSING_IMPORT',
                file: file.replace(this.projectRoot, ''),
                importPath,
                resolvedPath: resolvedPath.replace(this.projectRoot, ''),
                severity: 'HIGH'
              })
            }
          }
        }
      } catch (error) {
        // File might not exist or be readable
      }
    }
  }

  async detectBrokenComponents() {
    log('yellow', '🧩 Detecting broken component references...')

    const files = await this.getAllTypeScriptFiles()

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')

        // Look for component usage patterns
        const componentUsage = content.match(/<([A-Z][a-zA-Z0-9]*)/g)
        if (componentUsage) {
          for (const usage of componentUsage) {
            const componentName = usage.substring(1)
            if (!this.isComponentDefined(content, componentName)) {
              this.brokenReferences.push({
                type: 'UNDEFINED_COMPONENT',
                file: file.replace(this.projectRoot, ''),
                component: componentName,
                severity: 'MEDIUM'
              })
            }
          }
        }
      } catch (error) {
        // File might not exist
      }
    }
  }

  async detectIncompleteFeatures() {
    log('yellow', '🎯 Detecting incomplete features...')

    const features = [
      {
        name: 'Pricing System',
        requiredFiles: [
          'src/lib/pricing/cost-calculator.ts',
          'src/components/pricing/cost-display.tsx',
          'app/api/pricing/calculate/route.ts'
        ]
      },
      {
        name: 'Story Bible System',
        requiredFiles: [
          'src/lib/story-bible/auto-generator.ts',
          'src/components/story-bible/story-bible-manager.tsx',
          'app/api/stories/[id]/story-bible/generate/route.ts'
        ]
      },
      {
        name: 'AI Integration',
        requiredFiles: [
          'src/lib/ai/claude-client.ts',
          'src/lib/ai/cost-aware-requests.ts',
          'src/lib/middleware/compression-middleware.ts'
        ]
      },
      {
        name: 'Library Separation',
        requiredFiles: [
          'app/ai-library/page.tsx',
          'app/my-library/page.tsx',
          'src/lib/libraries/ai-library-manager.ts'
        ]
      }
    ]

    for (const feature of features) {
      const missingFiles = []
      for (const file of feature.requiredFiles) {
        const fullPath = path.join(this.projectRoot, file)
        if (!fs.existsSync(fullPath)) {
          missingFiles.push(file)
        }
      }

      if (missingFiles.length > 0) {
        this.gaps.push({
          type: 'INCOMPLETE_FEATURE',
          feature: feature.name,
          missingFiles,
          severity: 'HIGH',
          completion: ((feature.requiredFiles.length - missingFiles.length) / feature.requiredFiles.length * 100).toFixed(1)
        })
      }
    }
  }

  generateReport() {
    log('blue', '\n📊 GAP DETECTION REPORT')
    log('blue', '========================\n')

    // Directory gaps
    const dirGaps = this.gaps.filter(g => g.type === 'MISSING_DIRECTORY')
    if (dirGaps.length > 0) {
      log('red', `📁 MISSING DIRECTORIES (${dirGaps.length}):`)
      dirGaps.forEach(gap => {
        log('red', `   ❌ ${gap.path}`)
      })
      log('red', '')
    }

    // Missing imports
    if (this.missingImports.length > 0) {
      log('red', `📦 MISSING IMPORTS (${this.missingImports.length}):`)
      this.missingImports.forEach(imp => {
        log('red', `   ❌ ${imp.file}: ${imp.importPath}`)
      })
      log('red', '')
    }

    // Broken components
    if (this.brokenReferences.length > 0) {
      log('yellow', `🧩 UNDEFINED COMPONENTS (${this.brokenReferences.length}):`)
      this.brokenReferences.forEach(ref => {
        log('yellow', `   ⚠️  ${ref.file}: <${ref.component}>`)
      })
      log('yellow', '')
    }

    // Incomplete features
    const featureGaps = this.gaps.filter(g => g.type === 'INCOMPLETE_FEATURE')
    if (featureGaps.length > 0) {
      log('magenta', `🎯 INCOMPLETE FEATURES (${featureGaps.length}):`)
      featureGaps.forEach(gap => {
        log('magenta', `   🔄 ${gap.feature}: ${gap.completion}% complete`)
        gap.missingFiles.forEach(file => {
          log('red', `      ❌ ${file}`)
        })
      })
      log('magenta', '')
    }

    // Summary
    const totalIssues = this.gaps.length + this.missingImports.length + this.brokenReferences.length
    if (totalIssues === 0) {
      log('green', '✅ NO GAPS DETECTED - ARCHITECTURE IS COMPLETE!')
    } else {
      log('red', `🚨 TOTAL ISSUES DETECTED: ${totalIssues}`)
      log('yellow', '\n📋 NEXT ACTIONS NEEDED:')
      log('yellow', '1. Create missing directories')
      log('yellow', '2. Implement missing components')
      log('yellow', '3. Fix broken imports')
      log('yellow', '4. Complete feature implementations')
    }
  }

  // Helper methods
  async getAllTypeScriptFiles() {
    const files = []

    function scanDir(dir) {
      try {
        const items = fs.readdirSync(dir)
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDir(fullPath)
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
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

  extractImports(content) {
    const imports = []
    const importRegex = /import.*?from\s+['"](.*?)['"]/g
    let match

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }

    return imports
  }

  resolveImportPath(fromFile, importPath) {
    if (importPath.startsWith('@/')) {
      return path.join(this.projectRoot, 'src', importPath.substring(2))
    } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return path.resolve(path.dirname(fromFile), importPath)
    }
    return importPath
  }

  isComponentDefined(content, componentName) {
    // Check if component is imported or defined in file
    const importRegex = new RegExp(`import.*?${componentName}.*?from`, 'i')
    const defineRegex = new RegExp(`(function|const|class)\\s+${componentName}`, 'i')

    return importRegex.test(content) || defineRegex.test(content)
  }
}

// Run gap detection
async function runGapDetection() {
  const projectRoot = process.cwd()
  const detector = new GapDetector(projectRoot)
  await detector.detectAllGaps()
}

if (require.main === module) {
  runGapDetection().catch(error => {
    log('red', `Gap detection failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { GapDetector }