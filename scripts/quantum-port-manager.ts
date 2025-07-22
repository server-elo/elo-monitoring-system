#!/usr/bin/env node
/**
* Quantum Port Manager
* Advanced port conflict resolution with process management
*/
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
interface PortProcess {
  port: number;
  pid: number;
  process: string;
  command: string;
}
interface QuantumAnalysis {
  conflictingPorts: PortProcess[];
  zombieProcesses: number[];
  recommendations: string[];
  cleanPorts: number[];
}
class QuantumPortManager {
  private readonly portRange = { start: 3000, end: 3010 };
  private readonly lockDir = path.join(process.env.HOME || "", ".port-locks");
  constructor() {
    // Ensure lock directory exists
    if (!fs.existsSync(this.lockDir)) {
      fs.mkdirSync(this.lockDir, { recursive: true });
    }
  }
  /**
  * Quantum analysis of port states across multiple dimensions
  */
  async analyzePortConflicts(): Promise<QuantumAnalysis> {
    console.log("🔍 Initiating quantum port analysis...\n");
    const analysis: QuantumAnalysis = {
      conflictingPorts: [],
      zombieProcesses: [],
      recommendations: [],
      cleanPorts: []
    };
    // Scan port range
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      const portInfo = this.checkPort(port);
      if (portInfo) {
        analysis.conflictingPorts.push(portInfo);
      } else {
        analysis.cleanPorts.push(port);
      }
    }
    // Detect zombie processes
    analysis.zombieProcesses = this.findZombieProcesses();
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    return analysis;
  }
  /**
  * Check if a specific port is in use
  */
  private checkPort(port: number): PortProcess | null {
    try {
      const result = execSync(`ss -tulpn | grep ":${port}"`, {
        encoding: "utf8"
      });
      const match = result.match(/users:\(\("([^"]+)",pid=(\d+)/);
      if (match) {
        const processInfo = this.getProcessInfo(parseInt(match[2]));
        return {
          port,
          pid: parseInt(match[2]),
          process: match[1],
          command: processInfo
        };
      }
    } catch (error) {
      // Port is free
    }
    return null;
  }
  /**
  * Get detailed process information
  */
  private getProcessInfo(pid: number): string {
    try {
      return execSync(`ps -p ${pid} -o command=`, { encoding: "utf8" }).trim();
    } catch {
      return "Unknown process";
    }
  }
  /**
  * Find zombie or orphaned Node.js processes
  */
  private findZombieProcesses(): number[] {
    const zombies: number[] = [];
    try {
      const processes = execSync(
        'ps aux | grep -E "node|next|webpack|vite" | grep -v grep',
        { encoding: "utf8" },
      )
      .split("\n")
      .filter(Boolean);
      for (const process of processes) {
        const parts = process.split(/\s+/);
        const pid = parseInt(parts[1]);
        const cpu = parseFloat(parts[2]);
        const mem = parseFloat(parts[3]);
        // Detect potential zombies: low CPU/memory but still running
        if (cpu < 0.1 && mem < 0.1 && process.includes("next-server")) {
          // Check if process is actually serving
          try {
            execSync(`kill -0 ${pid} 2>/dev/null`);
            // Process exists but might be zombie
            const age = this.getProcessAge(pid);
            if (age>3600) {
              // Older than 1 hour with low activity
              zombies.push(pid);
            }
          } catch {
            // Process doesn't exist
          }
        }
      }
    } catch {
      // No processes found
    }
    return zombies;
  }
  /**
  * Get process age in seconds
  */
  private getProcessAge(pid: number): number {
    try {
      const stat = fs.statSync(`/proc/${pid}`);
      return (Date.now() - stat.ctimeMs) / 1000;
    } catch {
      return 0;
    }
  }
  /**
  * Generate intelligent recommendations
  */
  private generateRecommendations(analysis: QuantumAnalysis): string[] {
    const recommendations: string[] = [];
    if (analysis.conflictingPorts.length>0) {
      recommendations.push(
        "⚠️  Multiple processes detected on development ports",
      );
      recommendations.push(
        "💡 Consider using PORT environment variable for explicit port assignment",
      );
    }
    if (analysis.zombieProcesses.length>0) {
      recommendations.push(
        "🧟 Zombie processes detected that should be cleaned",
      );
      recommendations.push(
        "💡 Use process managers like PM2 for better process control",
      );
    }
    if (analysis.cleanPorts.length === 0) {
      recommendations.push("🚨 All ports in range are occupied!");
      recommendations.push("💡 Expand port range or clean existing processes");
    }
    return recommendations;
  }
  /**
  * Resolve port conflicts with quantum precision
  */
  async resolveConflicts(force: boolean = false): Promise<void> {
    const analysis = await this.analyzePortConflicts();
    console.log("📊 Quantum Port Analysis Results:\n");
    console.log(`✅ Clean ports available: ${analysis.cleanPorts.join(", ")}`);
    console.log(
      `❌ Conflicting ports: ${analysis.conflictingPorts.map((p: unknown) => p.port).join(", ")}`,
    );
    console.log(`🧟 Zombie processes: ${analysis.zombieProcesses.length}\n`);
    if (
      analysis.conflictingPorts.length === 0 &&
      analysis.zombieProcesses.length === 0
    ) {
      console.log("✨ All ports are clean! No conflicts detected.\n");
      return;
    }
    if (!force) {
      console.log(
        "🤔 Would you like to resolve these conflicts? Run with --force to auto-resolve\n",
      );
      this.printAnalysis(analysis);
      return;
    }
    console.log("🔧 Resolving conflicts...\n");
    // Kill zombie processes
    for (const pid of analysis.zombieProcesses) {
      this.killProcess(pid, "zombie");
    }
    // Handle conflicting ports
    for (const portInfo of analysis.conflictingPorts) {
      console.log(
        `🎯 Handling process on port ${portInfo.port} (PID: ${portInfo.pid})`,
      );
      // Check if it's a development server
      if (
        portInfo.process.includes("next-server") ||
        portInfo.process.includes("webpack")
      ) {
        this.killProcess(portInfo.pid, "development server");
      } else {
        console.log(
          `⏭️  Skipping non-development process: ${portInfo.process}`,
        );
      }
    }
    // Clean up socket locks
    this.cleanSocketLocks();
    console.log("\n✅ Port conflict resolution complete!\n");
  }
  /**
  * Kill a process safely
  */
  private killProcess(pid: number, type: string): void {
    try {
      console.log(`🔪 Terminating ${type} process (PID: ${pid})`);
      // Try graceful shutdown first
      execSync(`kill -TERM ${pid} 2>/dev/null || true`);
      // Wait a moment
      execSync("sleep 1");
      // Force kill if still running
      try {
        execSync(`kill -0 ${pid} 2>/dev/null`);
        execSync(`kill -KILL ${pid} 2>/dev/null || true`);
        console.log(`   ✅ Force killed process ${pid}`);
      } catch {
        console.log(`   ✅ Process ${pid} terminated gracefully`);
      }
    } catch (error) {
      console.log(`   ⚠️  Failed to kill process ${pid}: Already terminated`);
    }
  }
  /**
  * Clean up socket lock files
  */
  private cleanSocketLocks(): void {
    console.log("\n🧹 Cleaning socket locks...");
    // Clean system socket locks
    const sockDirs = [
    "/tmp",
    "/var/run",
    path.join(process.env.HOME || "", ".local/share")
    ];
    for (const dir of sockDirs) {
      try {
        const files = execSync(
          `find ${dir} -name "*.sock" -o -name "*.lock" 2>/dev/null | grep -E "(node|next|webpack)" || true`,
          { encoding: "utf8" },
        )
        .split("\n")
        .filter(Boolean);
        for (const file of files) {
          try {
            fs.unlinkSync(file);
            console.log(`   🗑️  Removed lock: ${file}`);
          } catch {
            // File might be in use
          }
        }
      } catch {
        // Directory might not exist or be accessible
      }
    }
  }
  /**
  * Print detailed analysis
  */
  private printAnalysis(analysis: QuantumAnalysis): void {
    console.log("📋 Detailed Port Analysis:\n");
    if (analysis.conflictingPorts.length>0) {
      console.log("🔴 Conflicting Ports:");
      for (const port of analysis.conflictingPorts) {
        console.log(`   Port ${port.port}: ${port.process} (PID: ${port.pid})`);
        console.log(`   Command: ${port.command}\n`);
      }
    }
    if (analysis.zombieProcesses.length>0) {
      console.log("🧟 Zombie Processes:");
      for (const pid of analysis.zombieProcesses) {
        const info = this.getProcessInfo(pid);
        console.log(`   PID ${pid}: ${info}`);
      }
      console.log("");
    }
    if (analysis.recommendations.length>0) {
      console.log("💡 Recommendations:");
      for (const rec of analysis.recommendations) {
        console.log(`   ${rec}`);
      }
    }
  }
  /**
  * Set up proper port management
  */
  async setupPortManagement(): Promise<void> {
    console.log("🚀 Setting up quantum port management...\n");
    // Create port management script
    const scriptContent = `#!/bin/bash
    # Quantum Port Management Helper
    # Function to find next available port
    find_available_port() {
      local start_port=\${1:-3000}
      local end_port=\${2:-3010}
      for port in \$(seq \$start_port \$end_port); do
      if ! ss -tulpn | grep -q ":\$port"; then
      echo \$port
      return 0
      fi
      done
      echo "No available ports in range \$start_port-\$end_port" >&2
      return 1
    }
    # Function to kill process on port
    kill_port() {
      local port=\$1
      local pid=\$(ss -tulpn | grep ":\$port" | grep -oP 'pid=\\K[0-9]+' | head -1)
      if [ -n "\$pid" ]; then
      echo "Killing process \$pid on port \$port"
      kill -9 \$pid 2>/dev/null || true
      else
      echo "No process found on port \$port"
      fi
    }
    # Export functions
    export -f find_available_port
    export -f kill_port
    # Auto-detect port for Next.js
    if [ -z "\$PORT" ]; then
    export PORT=\$(find_available_port)
    echo "Auto-assigned PORT=\$PORT"
    fi
    `;
    const helperPath = path.join(
      process.env.HOME || "",
      ".local/bin/port-helper.sh",
    );
    fs.writeFileSync(helperPath, scriptContent, { mode: 0o755 });
    // Create systemd user service for port monitoring
    const serviceContent = `[Unit]
    Description=Quantum Port Monitor
    After=network.target
    [Service]
    Type=simple
    ExecStart=/usr/bin/node ${__filename} monitor
    Restart=on-failure
    RestartSec=10
    [Install]
    WantedBy=default.target
    `;
    const servicePath = path.join(
      process.env.HOME || "",
      ".config/systemd/user/port-monitor.service",
    );
    const serviceDir = path.dirname(servicePath);
    if (!fs.existsSync(serviceDir)) {
      fs.mkdirSync(serviceDir, { recursive: true });
    }
    fs.writeFileSync(servicePath, serviceContent);
    console.log("✅ Port management setup complete!");
    console.log("\n📝 Usage:");
    console.log("   source ~/.local/bin/port-helper.sh");
    console.log("   PORT=$(find_available_port) npm run dev");
    console.log("   kill_port 3000\n");
  }
  /**
  * Monitor ports continuously
  */
  async monitor(): Promise<void> {
    console.log("👁️  Quantum Port Monitor Active\n");
    setInterval(async () => {
      const analysis = await this.analyzePortConflicts();
      if (analysis.zombieProcesses.length>0) {
        console.log(
          `⚠️  [${new Date().toISOString()}] Detected ${analysis.zombieProcesses.length} zombie processes`,
        );
        // Auto-clean zombies
        for (const pid of analysis.zombieProcesses) {
          this.killProcess(pid, "zombie");
        }
      }
    }, 60000); // Check every minute
  }
}
// CLI Interface
async function main(): void {
  const manager = new QuantumPortManager();
  const args = process.argv.slice(2);
  const command = args[0] || "analyze";
  switch (command) {
    case ",
    analyze":
    await manager.analyzePortConflicts();
    break;
    case ",
    resolve":
    await manager.resolveConflicts(args.includes("--force"));
    break;
    case ",
    setup":
    await manager.setupPortManagement();
    break;
    case ",
    monitor":
    await manager.monitor();
    break;
    default:
    console.log(
      ",
      Usage: quantum-port-manager [analyze|resolve|setup|monitor] [--force]",
    );
  }
}
// Run if called directly
if (require.main === module) {
  main().catch (console.error);
}
export { QuantumPortManager };
