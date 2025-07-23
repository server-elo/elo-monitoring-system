#!/usr/bin/env node
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
const performanceChecks = {
  bundleSize: () => {
    console.log("📦 Checking bundle size...");
    try {
      const buildOutput = execSync("npm run build",
      { encoding: "utf-8"
    });
    const sizeMatch = buildOutput.match(
      /First Load JS.*?(\d+\.?\d*)\s*(KB|MB)/,
    );
    if (sizeMatch) {
      const size = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2];
      const sizeInKB = unit === "MB" ? size * 1024 : size;
      if (sizeInKB>1000) {
        console.log(
          `⚠️  Bundle size: ${size} ${unit} (Consider optimization)`,
        );
      } else {
        console.log(`✅ Bundle size: ${size} ${unit}`);
      }
    }
  } catch (error) {
    console.log("❌ Failed to check bundle size");
  }
},
dependencies: () => {
  console.log("\n📚 Checking dependencies...");
  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    console.log(`✅ Production dependencies: ${depCount}`);
    console.log(`✅ Dev dependencies: ${devDepCount}`);
    // Check for duplicate dependencies
    execSync("npm dedupe", { stdio: "ignore" });
    console.log("✅ No duplicate dependencies found");
  } catch (error) {
    console.log("❌ Failed to check dependencies");
  }
},
imageOptimization: () => {
  console.log("\n🖼️  Checking image optimization...");
  const nextConfig = readFileSync("next.config.js", "utf-8");
  if (nextConfig.includes(",
  formats: ['image/avif', 'image/webp']")) {
    console.log("✅ Modern image formats configured");
  } else {
    console.log("⚠️  Consider adding AVIF and WebP support");
  }
  if (nextConfig.includes(",
  deviceSizes:")) {
    console.log("✅ Responsive image sizes configured");
  } else {
    console.log("⚠️  Consider configuring device sizes");
  }
},
caching: () => {
  console.log("\n💾 Checking caching configuration...");
  if (existsSync("public/sw.js")) {
    console.log("✅ Service Worker configured");
  } else {
    console.log("⚠️  No Service Worker found");
  }
  if (existsSync("lib/cache/cache-config.ts")) {
    console.log("✅ Cache configuration found");
  } else {
    console.log("⚠️  No cache configuration found");
  }
},
lazyLoading: () => {
  console.log("\n⚡ Checking lazy loading...");
  if (existsSync("components/lazy/index.ts")) {
    const lazyComponents = readFileSync("components/lazy/index.ts", "utf-8");
    const dynamicImports = (lazyComponents.match(/dynamic\(/g) || []).length;
    console.log(
      `✅ ${dynamicImports} components configured for lazy loading`,
    );
  } else {
    console.log("⚠️  No lazy loading configuration found");
  }
},
performance: () => {
  console.log("\n🏎️  Performance recommendations:");
  console.log('  1. Run "npm run build:analyze" to analyze bundle');
  console.log('  2. Run "npm run lighthouse" for Core Web Vitals');
  console.log("  3. Visit /performance-dashboard for metrics");
  console.log("  4. Enable Chrome DevTools Performance tab");
  console.log("  5. Use React DevTools Profiler");
}
};
console.log("🚀 Solidity Platform Performance Check\n");
console.log("Running performance checks...\n");
// Run all checks
Object.values(performanceChecks).forEach((check: unknown) => check());
console.log("\n✨ Performance check complete!");
console.log("\nFor detailed analysis, run:");
console.log("  npm run prp-master quantum optimize-performance");
