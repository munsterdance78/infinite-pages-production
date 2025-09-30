// process-monitor.js - Self-monitoring with automatic shutdown for infinite-pages.com testing
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class ProcessMonitor {
  constructor(options = {}) {
    this.options = {
      maxMemoryMB: options.maxMemoryMB || 100, // VERY CONSERVATIVE: 100MB
      maxBrowserMemoryMB: options.maxBrowserMemoryMB || 80, // VERY CONSERVATIVE: 80MB per browser
      maxSystemMemoryPercent: options.maxSystemMemoryPercent || 60, // VERY CONSERVATIVE: 60%
      maxScanTimeoutMs: options.maxScanTimeoutMs || 10 * 1000, // VERY SHORT: 10 seconds as requested
      monitorIntervalMs: options.monitorIntervalMs || 2 * 1000, // CHECK EVERY 2 SECONDS
      pidFile: options.pidFile || path.join(__dirname, '.debugger.pid'),
      logFile: options.logFile || path.join(__dirname, 'monitor.log'),
      ...options
    };

    this.startTime = Date.now();
    this.isShuttingDown = false;
    this.monitorInterval = null;
    this.processes = new Set();
    this.emergencyShutdownReasons = [];
  }

  // Prevent multiple instances from running
  async checkForExistingInstance() {
    try {
      const pidData = await fs.readFile(this.options.pidFile, 'utf8');
      const existingPid = parseInt(pidData.trim());

      if (existingPid && await this.isProcessRunning(existingPid)) {
        console.log(`🚫 Another debugger instance is already running (PID: ${existingPid})`);
        console.log(`   Use 'npm run stop' or kill ${existingPid} to stop it first`);
        process.exit(1);
      }
    } catch (error) {
      // PID file doesn't exist or is invalid - we can proceed
    }
  }

  async isProcessRunning(pid) {
    try {
      process.kill(pid, 0); // Signal 0 checks if process exists without killing
      return true;
    } catch {
      return false;
    }
  }

  async writePidFile() {
    try {
      await fs.writeFile(this.options.pidFile, process.pid.toString());
      console.log(`📝 Process ID ${process.pid} saved to ${this.options.pidFile}`);
    } catch (error) {
      console.warn(`⚠️  Could not write PID file: ${error.message}`);
    }
  }

  async removePidFile() {
    try {
      await fs.unlink(this.options.pidFile);
    } catch {
      // File doesn't exist or can't be removed - that's okay
    }
  }

  async logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    console.log(message);
    try {
      await fs.appendFile(this.options.logFile, logEntry);
    } catch {
      // Can't write to log file - continue without logging
    }
  }

  getMemoryUsage() {
    const processMemory = process.memoryUsage();
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };

    return {
      process: {
        rss: Math.round(processMemory.rss / 1024 / 1024), // MB
        heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
        external: Math.round(processMemory.external / 1024 / 1024) // MB
      },
      system: {
        totalMB: Math.round(systemMemory.total / 1024 / 1024),
        freeMB: Math.round(systemMemory.free / 1024 / 1024),
        usedMB: Math.round(systemMemory.used / 1024 / 1024),
        usedPercent: Math.round((systemMemory.used / systemMemory.total) * 100)
      }
    };
  }

  async getBrowserProcessesMemory() {
    try {
      // Get all chrome/playwright processes
      let browserProcesses = [];

      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const { stdout } = await execAsync('tasklist /fo csv | findstr chrome');
        const lines = stdout.split('\n').filter(line => line.trim());

        browserProcesses = lines.map(line => {
          const parts = line.replace(/"/g, '').split(',');
          return {
            pid: parseInt(parts[1]) || 0,
            memory: parseFloat(parts[4]?.replace(/,/g, '')) / 1024 || 0 // Convert KB to MB
          };
        }).filter(proc => proc.pid > 0);
      } else {
        // Linux/Mac - use ps command
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const { stdout } = await execAsync('ps aux | grep -E "(chrome|chromium|playwright)" | grep -v grep');
        const lines = stdout.split('\n').filter(line => line.trim());

        browserProcesses = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parseInt(parts[1]) || 0,
            memory: parseFloat(parts[3]) * os.totalmem() / 100 / 1024 / 1024 || 0 // Convert %MEM to MB
          };
        }).filter(proc => proc.pid > 0);
      }

      return browserProcesses;
    } catch (error) {
      // Can't get browser processes - return empty array
      return [];
    }
  }

  async checkMemoryLimits() {
    const memory = this.getMemoryUsage();
    const browserProcesses = await this.getBrowserProcessesMemory();
    const reasons = [];

    // Check main process memory
    if (memory.process.rss > this.options.maxMemoryMB) {
      reasons.push(`Main process using ${memory.process.rss}MB > ${this.options.maxMemoryMB}MB limit`);
    }

    // Check browser processes memory
    for (const proc of browserProcesses) {
      if (proc.memory > this.options.maxBrowserMemoryMB) {
        reasons.push(`Browser process ${proc.pid} using ${Math.round(proc.memory)}MB > ${this.options.maxBrowserMemoryMB}MB limit`);
      }
    }

    // Check total system memory
    if (memory.system.usedPercent > this.options.maxSystemMemoryPercent) {
      reasons.push(`System memory at ${memory.system.usedPercent}% > ${this.options.maxSystemMemoryPercent}% limit`);
    }

    // Check scan timeout
    const scanTime = Date.now() - this.startTime;
    if (scanTime > this.options.maxScanTimeoutMs) {
      reasons.push(`Scan running for ${Math.round(scanTime / 1000)}s > ${this.options.maxScanTimeoutMs / 1000}s timeout`);
    }

    return {
      memoryOk: reasons.length === 0,
      reasons,
      memory,
      browserProcesses,
      scanTimeMs: scanTime
    };
  }

  async performEmergencyShutdown(reasons) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    await this.logMessage(`🚨 EMERGENCY SHUTDOWN TRIGGERED:`);
    for (const reason of reasons) {
      await this.logMessage(`   • ${reason}`);
    }

    // Kill browser processes immediately
    const browserProcesses = await this.getBrowserProcessesMemory();
    for (const proc of browserProcesses) {
      try {
        process.kill(proc.pid, 'SIGKILL');
        await this.logMessage(`💀 Killed browser process ${proc.pid}`);
      } catch (error) {
        await this.logMessage(`⚠️  Failed to kill process ${proc.pid}: ${error.message}`);
      }
    }

    // Clear monitoring interval
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    // Remove PID file
    await this.removePidFile();

    await this.logMessage(`🛑 Emergency shutdown complete - exiting for safety`);

    // Force exit after 1 second to ensure cleanup
    setTimeout(() => {
      process.exit(2); // Exit code 2 = emergency shutdown
    }, 1000);

    process.exit(2);
  }

  async startMonitoring() {
    await this.checkForExistingInstance();
    await this.writePidFile();

    await this.logMessage(`🔥 Starting Infinite Pages debugger with safety monitoring`);
    await this.logMessage(`   Memory limit: ${this.options.maxMemoryMB}MB`);
    await this.logMessage(`   Browser limit: ${this.options.maxBrowserMemoryMB}MB per process`);
    await this.logMessage(`   System limit: ${this.options.maxSystemMemoryPercent}%`);
    await this.logMessage(`   Timeout: ${this.options.maxScanTimeoutMs / 1000}s`);
    await this.logMessage(`   Monitor interval: ${this.options.monitorIntervalMs / 1000}s`);

    // Set up periodic memory monitoring
    this.monitorInterval = setInterval(async () => {
      const check = await this.checkMemoryLimits();

      if (!check.memoryOk) {
        await this.performEmergencyShutdown(check.reasons);
      } else {
        // Log periodic status
        const { memory, scanTimeMs } = check;
        await this.logMessage(`✅ Memory OK: ${memory.process.rss}MB process, ${memory.system.usedPercent}% system, ${Math.round(scanTimeMs / 1000)}s runtime`);
      }
    }, this.options.monitorIntervalMs);

    // Set up graceful shutdown handlers
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGQUIT', () => this.gracefulShutdown('SIGQUIT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      await this.logMessage(`💥 Uncaught exception: ${error.message}`);
      await this.performEmergencyShutdown([`Uncaught exception: ${error.message}`]);
    });

    process.on('unhandledRejection', async (reason) => {
      await this.logMessage(`💥 Unhandled rejection: ${reason}`);
      await this.performEmergencyShutdown([`Unhandled rejection: ${reason}`]);
    });

    return this;
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    await this.logMessage(`📱 Received ${signal} - shutting down gracefully`);

    // Clear monitoring interval
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    // Clean up
    await this.removePidFile();

    const totalTime = Math.round((Date.now() - this.startTime) / 1000);
    await this.logMessage(`✅ Graceful shutdown complete after ${totalTime}s`);

    process.exit(0);
  }

  async getStatus() {
    const memory = this.getMemoryUsage();
    const browserProcesses = await this.getBrowserProcessesMemory();
    const check = await this.checkMemoryLimits();

    return {
      pid: process.pid,
      status: check.memoryOk ? 'healthy' : 'danger',
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      memory: memory,
      browserProcesses: browserProcesses.length,
      browserMemoryMB: Math.round(browserProcesses.reduce((total, proc) => total + proc.memory, 0)),
      limits: {
        maxMemoryMB: this.options.maxMemoryMB,
        maxBrowserMemoryMB: this.options.maxBrowserMemoryMB,
        maxSystemMemoryPercent: this.options.maxSystemMemoryPercent,
        maxScanTimeoutMs: this.options.maxScanTimeoutMs
      },
      warnings: check.reasons
    };
  }
}

module.exports = ProcessMonitor;