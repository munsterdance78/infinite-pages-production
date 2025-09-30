# Claude Debugger for Infinite Pages

🛡️ **Self-monitoring website debugger with AUTOMATIC SAFETY SHUTDOWN**

A specialized debugging tool for testing https://www.infinite-pages.com with **automatic memory monitoring and emergency shutdown** to prevent system crashes.

## 🚨 CRITICAL SAFETY FEATURES

**AUTOMATIC SHUTDOWN TRIGGERS:**
- ❌ Process memory > **400MB**
- ❌ Browser process > **300MB each**
- ❌ System memory > **80%**
- ❌ Scan time > **2 minutes**

**NO MANUAL INTERVENTION NEEDED** - The tool will **kill itself automatically** if limits are exceeded.

## 🚀 Quick Start

```bash
cd claude-debugger
npm install
npm run setup    # Install Playwright browser
npm run test-site # Test infinite-pages.com with safety monitoring
```

## 📋 Available Commands

### Essential Commands
```bash
npm run test-site      # Test infinite-pages.com (safe mode)
npm run scan          # JSON output for automation
npm run scan-fixes    # Get fix plan in JSON format
npm run status        # Check memory usage and health
npm run stop          # Stop any running processes
npm run emergency-stop # Force kill all debugger processes
```

### Monitoring Commands
```bash
npm run monitor       # Watch memory usage every 30s
npm run logs          # View safety monitoring logs
npm run health        # Check server health (if running)
npm run clean         # Clean up PID files and logs
```

### Testing Variations
```bash
npm test              # API endpoints only
npm run test-story    # Story creation focus + fix plan
npm run test-local    # Test localhost:3000
npm run test-json     # Full JSON output for Claude
```

### Server Mode
```bash
npm start             # Start monitoring server on port 3001
npm run dev           # Development mode with file watching
```

## 🛡️ Safety Monitoring Details

### Memory Limits (AUTOMATIC SHUTDOWN)
- **Main Process**: 400MB maximum
- **Each Browser**: 300MB maximum
- **System Total**: 80% maximum
- **Scan Timeout**: 2 minutes maximum

### Monitoring Frequency
- **Normal operation**: Every 10 seconds
- **During scan**: Every 5 seconds
- **Browser processes**: Continuously tracked

### Emergency Actions
1. **IMMEDIATE SHUTDOWN** when limits exceeded
2. **Force kill browser processes** (SIGKILL)
3. **Log shutdown reason** with timestamp
4. **Clean up PID files** automatically
5. **Exit with code 2** (emergency shutdown)

## 🎯 Infinite Pages Testing

### Story Creation Endpoints
- `/api/stories` - Main story creation
- `/api/stories/novel` - Enhanced novel creation
- `/api/stories/ai-assisted` - AI collaborative writing
- `/api/stories/guest` - Guest story creation
- `/api/demo/story` - Demo with rate limiting

### Authentication & Admin
- User authentication middleware
- Admin panel security verification
- Rate limiting functionality
- Claude API integration status

### Auto-Fix Categories

**✅ Claude Can Auto-Fix (Safe)**
- Missing alt text on images
- Missing page titles and meta descriptions
- Heading structure issues (h1, h2 hierarchy)
- Basic accessibility improvements

**⚠️ Needs Approval (Requires Review)**
- Claude API errors (500/503 responses)
- Missing endpoints (404 errors)
- Authentication issues
- Performance problems

## 📊 Usage Examples

### Basic Testing
```bash
# Test with safety monitoring
npm run test-site

# Get JSON results for Claude Code
npm run scan

# Focus on story creation issues
npm run test-story
```

### Process Management
```bash
# Check if running and memory usage
npm run status

# Stop gracefully
npm run stop

# Emergency stop (force kill)
npm run emergency-stop

# Monitor memory usage live
npm run monitor
```

### Server API Usage
```bash
# Start server with monitoring
npm start

# Test via HTTP API
curl -X POST http://localhost:3001/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.infinite-pages.com"}'

# Quick endpoint check
curl http://localhost:3001/test-endpoints/www.infinite-pages.com

# Get process status
curl http://localhost:3001/status
```

## 🔧 CLI Options

```bash
node cli.js [url] [options]

Options:
  --json              Raw JSON output
  --endpoints         API endpoints only
  --story-creation    Story creation focus
  --auto-fix-only     Only auto-fixable issues
  --approval-only     Only approval-needed issues
  --fix-plan          Detailed fix instructions
  --status            Memory and process status
  --stop              Stop running processes
  --help, -h          Show help
```

## 📈 Exit Codes

- `0` - All tests passed, no issues
- `1` - Non-critical issues found (warnings, needs approval)
- `2` - Critical issues OR emergency shutdown (memory/timeout)
- `3` - Test execution failed (tool error)

## 🚨 Troubleshooting

### Memory Issues
```bash
# Check current memory usage
npm run status

# Stop all processes immediately
npm run emergency-stop

# Clean up any leftover files
npm run clean
```

### Process Stuck
```bash
# Force kill everything
npm run force-stop

# Verify nothing is running
npm run status

# Clean start
npm run clean && npm run test-site
```

### Playwright Issues
```bash
# Reinstall browser
npm run setup

# Check if browser processes are stuck
tasklist | findstr chrome  # Windows
ps aux | grep chrome       # Mac/Linux
```

## 🛡️ Safety Features Summary

| Feature | Limit | Action |
|---------|--------|--------|
| Process Memory | 400MB | Immediate shutdown |
| Browser Memory | 300MB each | Force kill process |
| System Memory | 80% total | Emergency shutdown |
| Scan Timeout | 2 minutes | Abort and cleanup |
| Multiple Instances | Prevented | Exit with error |
| Stuck Processes | Auto-detected | Force termination |

## 🎯 Integration with Claude Code

This tool is designed for seamless Claude Code integration:

1. **JSON Output**: `npm run scan` for automation
2. **Fix Plans**: `npm run scan-fixes` for specific fixes
3. **Safety First**: Never crashes or hangs your system
4. **Context Aware**: Understands Infinite Pages architecture
5. **Auto-Classification**: Separates auto-fixes from approval-needed

### For Claude Code Developers
```bash
# Get auto-fix instructions in JSON
npm run scan-fixes

# Quick health check
npm run health

# Monitor while developing
npm run monitor
```

---

**Built specifically for Infinite Pages story creation platform testing and debugging with automatic safety shutdown to protect your system.**

⚠️ **IMPORTANT**: This tool will automatically terminate itself if memory usage becomes dangerous. No manual intervention required - your system safety is guaranteed.