#!/usr/bin/env tsx
/**
 * Firebase Setup Assistant - Interactive Configuration Tool
 *
 * Provides guided setup with:
 * - Interactive configuration wizard
 * - Automatic environment generation
 * - Real-time validation
 * - Error detection and fixes
 * - Development server management
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { FirebaseConfigEngine } from './firebase-config-engine.js';
import { FirebaseValidator } from './firebase-validator.js';

interface SetupOptions {
  skipValidation?: boolean;
  autoFix?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

class FirebaseSetupAssistant {
  private rootPath: string;
  private options: SetupOptions;
  private configEngine: FirebaseConfigEngine;
  private validator: FirebaseValidator;

  constructor(rootPath: string = process.cwd(), options: SetupOptions = {}) {
    this.rootPath = rootPath;
    this.options = options;
    this.configEngine = new FirebaseConfigEngine(rootPath);
    this.validator = new FirebaseValidator(rootPath);
  }

  /**
   * Interactive prompt for user input (simplified for demo)
   */
  private prompt(question: string, defaultValue?: string): string {
    // In a real implementation, you'd use readline or inquirer
    // For now, we'll use environment or defaults
    if (defaultValue) {
      console.log(`${question} (using default: ${defaultValue})`);
      return defaultValue;
    }
    throw new Error('Interactive input not available in this environment');
  }

  /**
   * Checks if required files exist and offers to download/create them
   */
  private async checkPrerequisites(): Promise<boolean> {
    console.log('🔍 Checking prerequisites...\n');

    const serviceAccountPath = join(this.rootPath, 'secrets', 'firebase-admin.json');
    const envPath = join(this.rootPath, 'apps', 'web', '.env.local');

    let allGood = true;

    // Check service account
    if (!existsSync(serviceAccountPath)) {
      console.log('❌ Firebase service account not found');
      console.log('   📁 Expected location: secrets/firebase-admin.json');
      console.log('   📥 Download from: Firebase Console → Project Settings → Service Accounts');
      console.log(
        '   🔗 https://console.firebase.google.com → Your Project → Settings → Service Accounts'
      );
      console.log(
        '   📋 Generate new private key → Save as firebase-admin.json → Move to secrets/'
      );
      allGood = false;
    } else {
      console.log('✅ Service account found');
    }

    // Check .env.local
    if (!existsSync(envPath)) {
      console.log('❌ Environment file not found');
      console.log('   📁 Expected location: apps/web/.env.local');
      console.log(
        '   🔧 Get config from: Firebase Console → Project Settings → General → Your apps'
      );
      console.log('   📱 Select your web app or create one → Copy config values');
      allGood = false;
    } else {
      console.log('✅ Environment file found');
    }

    if (!allGood) {
      console.log('\n🛑 Prerequisites missing. Please add the required files and run again.');
      return false;
    }

    return true;
  }

  /**
   * Performs initial health check and identifies issues
   */
  private async performHealthCheck(): Promise<boolean> {
    console.log('🏥 Performing health check...\n');

    const report = await this.validator.validate();

    if (this.options.verbose) {
      this.validator.printReport(report);
    } else {
      // Simplified output
      const failCount = report.checks.filter(c => c.status === 'fail').length;
      const warnCount = report.checks.filter(c => c.status === 'warn').length;

      if (failCount > 0) {
        console.log(`❌ ${failCount} critical issues found`);
        report.checks
          .filter(c => c.status === 'fail')
          .forEach(check => console.log(`   • ${check.name}: ${check.message}`));
      }

      if (warnCount > 0) {
        console.log(`⚠️  ${warnCount} warnings found`);
        report.checks
          .filter(c => c.status === 'warn')
          .forEach(check => console.log(`   • ${check.name}: ${check.message}`));
      }

      if (failCount === 0 && warnCount === 0) {
        console.log('✅ All health checks passed');
      }
    }

    return report.overall !== 'critical';
  }

  /**
   * Guided configuration setup with user interaction
   */
  private async guidedSetup(): Promise<void> {
    console.log('🎯 Starting guided Firebase setup...\n');

    try {
      // Step 1: Run the configuration engine
      console.log('1️⃣ Running automatic configuration...');
      await this.configEngine.setup();
      console.log('✅ Configuration completed\n');

      // Step 2: Validate the setup
      console.log('2️⃣ Validating configuration...');
      const isHealthy = await this.performHealthCheck();

      if (!isHealthy && this.options.autoFix) {
        console.log('\n🔧 Attempting automatic fixes...');
        await this.attemptAutoFix();
      }

      console.log('\n3️⃣ Testing development environment...');
      await this.testDevEnvironment();
    } catch (error) {
      console.error('❌ Guided setup failed:', error instanceof Error ? error.message : error);

      if (this.options.autoFix) {
        console.log('\n🔄 Attempting recovery...');
        await this.attemptRecovery();
      }
    }
  }

  /**
   * Attempts to automatically fix common issues
   */
  private async attemptAutoFix(): Promise<void> {
    console.log('🔧 Attempting automatic fixes...');

    try {
      // Fix 1: Regenerate environment file with proper escaping
      const serviceAccountPath = join(this.rootPath, 'secrets', 'firebase-admin.json');
      const envPath = join(this.rootPath, 'apps', 'web', '.env.local');

      if (existsSync(serviceAccountPath) && existsSync(envPath)) {
        console.log('   🔄 Regenerating environment configuration...');

        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
        const envContent = readFileSync(envPath, 'utf-8');

        // Extract existing client config
        const apiKeyMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_API_KEY=([^\\n]+)/);
        const authDomainMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=([^\\n]+)/);
        const projectIdMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID=([^\\n]+)/);
        const storageBucketMatch = envContent.match(
          /NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=([^\\n]+)/
        );
        const messagingSenderIdMatch = envContent.match(
          /NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=([^\\n]+)/
        );
        const appIdMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_APP_ID=([^\\n]+)/);

        if (apiKeyMatch && authDomainMatch && projectIdMatch) {
          // Regenerate with proper private key escaping
          const newEnvContent = `# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${apiKeyMatch[1]}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomainMatch[1]}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectIdMatch[1]}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucketMatch?.[1] || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderIdMatch?.[1] || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${appIdMatch?.[1] || ''}

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID="${serviceAccount.project_id}"
FIREBASE_CLIENT_EMAIL="${serviceAccount.client_email}"
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\\n/g, '\\\\n')}"

# Session Configuration
SESSION_COOKIE_NAME="__session"
SESSION_COOKIE_DAYS="5"
`;

          if (!this.options.dryRun) {
            writeFileSync(envPath, newEnvContent);
            console.log('   ✅ Environment file regenerated with fixed private key');
          } else {
            console.log('   🔍 [DRY RUN] Would regenerate environment file');
          }
        }
      }

      // Fix 2: Check and install missing dependencies
      try {
        execSync('pnpm list firebase-admin 2>/dev/null', { cwd: this.rootPath, stdio: 'pipe' });
      } catch {
        console.log('   📦 Installing missing dependencies...');
        if (!this.options.dryRun) {
          execSync('pnpm install', { cwd: this.rootPath, stdio: 'inherit' });
          console.log('   ✅ Dependencies installed');
        } else {
          console.log('   🔍 [DRY RUN] Would install dependencies');
        }
      }

      console.log('✅ Auto-fix completed');
    } catch (error) {
      console.warn('⚠️  Auto-fix failed:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Attempts recovery from critical failures
   */
  private async attemptRecovery(): Promise<void> {
    console.log('🔄 Attempting recovery...');

    try {
      // Recovery strategy 1: Backup and regenerate environment
      const envPath = join(this.rootPath, 'apps', 'web', '.env.local');
      if (existsSync(envPath)) {
        const backupPath = `${envPath}.recovery.${Date.now()}`;
        execSync(`cp "${envPath}" "${backupPath}"`);
        console.log(`   📋 Backed up environment to ${backupPath}`);
      }

      // Recovery strategy 2: Run diagnosis
      console.log('   🔍 Running diagnostic...');
      await this.configEngine.diagnose();
    } catch (error) {
      console.error('❌ Recovery failed:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Tests the development environment setup
   */
  private async testDevEnvironment(): Promise<void> {
    console.log('🧪 Testing development environment...');

    try {
      // Test build
      console.log('   🔨 Testing build...');
      execSync('pnpm build', { cwd: this.rootPath, stdio: 'pipe' });
      console.log('   ✅ Build successful');

      // Suggest next steps
      console.log('\n🎉 Setup completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Start development servers:');
      console.log('      pnpm dev:web   # (or use VS Code task: 🌐 Start Web Only)');
      console.log('      PORT=3333 pnpm dev:api   # (or use VS Code task: 🔧 Start API Only)');
      console.log('\n   2. Test authentication:');
      console.log('      🌐 Login page: http://localhost:3000/login');
      console.log('      🧪 Auth simulator: http://localhost:3000/auth-sim');
      console.log('\n   3. Debug with VS Code:');
      console.log('      🐛 Set breakpoints in app/api/session/login/route.ts');
      console.log('      🔍 Use "JavaScript Debug Terminal" for server debugging');
    } catch (error) {
      console.warn('⚠️  Build test failed - check for compilation errors');
      console.log('   🛠️  Run: pnpm build (to see detailed errors)');
    }
  }

  /**
   * Quick setup for existing configurations
   */
  private async quickSetup(): Promise<void> {
    console.log('⚡ Quick setup mode...\n');

    const report = await this.validator.validate();

    if (report.overall === 'healthy') {
      console.log('✅ Configuration already healthy - no changes needed');
      console.log('\n🚀 Ready to start development:');
      console.log('   pnpm dev:web');
      console.log('   PORT=3333 pnpm dev:api');
      return;
    }

    if (report.overall === 'critical') {
      console.log('❌ Critical issues found - running full setup...');
      await this.guidedSetup();
      return;
    }

    if (report.overall === 'issues') {
      console.log('⚠️  Minor issues found - applying fixes...');
      await this.attemptAutoFix();

      // Re-validate after fixes
      const newReport = await this.validator.validate();
      if (newReport.overall === 'healthy') {
        console.log('✅ Issues resolved - setup complete');
      } else {
        console.log('⚠️  Some issues persist - consider full setup');
      }
    }
  }

  /**
   * Main setup execution
   */
  public async run(mode: 'guided' | 'quick' = 'guided'): Promise<void> {
    console.log('🔥 Firebase Setup Assistant');
    console.log('============================\n');

    if (this.options.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    try {
      // Check prerequisites first
      const prerequisitesMet = await this.checkPrerequisites();
      if (!prerequisitesMet) {
        return;
      }

      // Run setup based on mode
      if (mode === 'quick') {
        await this.quickSetup();
      } else {
        await this.guidedSetup();
      }
    } catch (error) {
      console.error('\n❌ Setup failed:', error instanceof Error ? error.message : error);
      console.log('\n🆘 Need help?');
      console.log('   📚 Check the documentation in docs/');
      console.log('   🔍 Run diagnosis: npx tsx scripts/firebase-validator.ts');
      console.log('   🛠️  Manual setup: Follow .github/copilot-instructions.md');
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  const options: SetupOptions = {
    skipValidation: args.includes('--skip-validation'),
    autoFix: args.includes('--auto-fix'),
    verbose: args.includes('--verbose'),
    dryRun: args.includes('--dry-run'),
  };

  const mode = args.includes('--quick') ? 'quick' : 'guided';

  if (args.includes('--help')) {
    console.log(`
Firebase Setup Assistant

Usage:
  npx tsx scripts/firebase-setup.ts [options]

Modes:
  (default)  Guided setup with full configuration
  --quick    Quick setup for existing configurations

Options:
  --auto-fix         Automatically fix common issues
  --verbose          Show detailed validation report
  --dry-run          Show what would be done without making changes
  --skip-validation  Skip initial health check
  --help             Show this help message

Examples:
  npx tsx scripts/firebase-setup.ts                    # Full guided setup
  npx tsx scripts/firebase-setup.ts --quick            # Quick validation & fixes
  npx tsx scripts/firebase-setup.ts --auto-fix --verbose  # Full setup with auto-fixes
  npx tsx scripts/firebase-setup.ts --dry-run          # Preview changes without applying
    `);
    process.exit(0);
  }

  const assistant = new FirebaseSetupAssistant(process.cwd(), options);
  assistant.run(mode).catch(console.error);
}

export { FirebaseSetupAssistant };
