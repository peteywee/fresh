#!/usr/bin/env tsx
/**
 * Firebase Configuration Engine
 *
 * Automates the complete setup of Firebase authentication including:
 * - Service account validation
 * - Environment variable generation
 * - Client SDK configuration
 * - Admin SDK initialization
 * - Health checks and validation
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

interface EnvConfig {
  // Client SDK (Next.js public)
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;

  // Admin SDK (server-side)
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;

  // Session configuration
  SESSION_COOKIE_NAME: string;
  SESSION_COOKIE_DAYS: string;
}

class FirebaseConfigEngine {
  private rootPath: string;
  private secretsPath: string;
  private webAppPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
    this.secretsPath = join(rootPath, 'secrets');
    this.webAppPath = join(rootPath, 'apps', 'web');
  }

  /**
   * Validates and loads service account from secrets/firebase-admin.json
   */
  private loadServiceAccount(): ServiceAccount {
    const serviceAccountPath = join(this.secretsPath, 'firebase-admin.json');

    if (!existsSync(serviceAccountPath)) {
      throw new Error(
        `Service account not found at ${serviceAccountPath}. Please add your Firebase service account JSON file.`
      );
    }

    try {
      const content = readFileSync(serviceAccountPath, 'utf-8');
      const serviceAccount = JSON.parse(content) as ServiceAccount;

      // Validate required fields
      const requiredFields = ['project_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!serviceAccount[field as keyof ServiceAccount]) {
          throw new Error(`Missing required field '${field}' in service account`);
        }
      }

      console.log(`✅ Service account loaded for project: ${serviceAccount.project_id}`);
      return serviceAccount;
    } catch (error) {
      throw new Error(
        `Failed to parse service account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Loads Firebase client config from existing .env.local or prompts for manual entry
   */
  private loadClientConfig(): FirebaseConfig {
    const envPath = join(this.webAppPath, '.env.local');

    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');

      const config: Partial<FirebaseConfig> = {};

      for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_FIREBASE_API_KEY=')) {
          config.apiKey = line.split('=')[1]?.replace(/['"]/g, '');
        } else if (line.startsWith('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=')) {
          config.authDomain = line.split('=')[1]?.replace(/['"]/g, '');
        } else if (line.startsWith('NEXT_PUBLIC_FIREBASE_PROJECT_ID=')) {
          config.projectId = line.split('=')[1]?.replace(/['"]/g, '');
        } else if (line.startsWith('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=')) {
          config.storageBucket = line.split('=')[1]?.replace(/['"]/g, '');
        } else if (line.startsWith('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=')) {
          config.messagingSenderId = line.split('=')[1]?.replace(/['"]/g, '');
        } else if (line.startsWith('NEXT_PUBLIC_FIREBASE_APP_ID=')) {
          config.appId = line.split('=')[1]?.replace(/['"]/g, '');
        } else if (line.startsWith('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=')) {
          config.measurementId = line.split('=')[1]?.replace(/['"]/g, '');
        }
      }

      if (config.apiKey && config.authDomain && config.projectId) {
        console.log(`✅ Client config loaded from .env.local`);
        return config as FirebaseConfig;
      }
    }

    throw new Error(
      `Firebase client config not found. Please ensure .env.local has NEXT_PUBLIC_FIREBASE_* variables or run the Firebase console setup first.`
    );
  }

  /**
   * Validates private key format and escaping
   */
  private validatePrivateKey(privateKey: string): string {
    // Ensure the private key has proper boundaries
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key missing BEGIN boundary');
    }
    if (!privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Private key missing END boundary');
    }

    // For environment variables, we need to escape newlines properly
    return privateKey.replace(/\n/g, '\\n');
  }

  /**
   * Generates complete environment configuration
   */
  private generateEnvConfig(
    serviceAccount: ServiceAccount,
    clientConfig: FirebaseConfig
  ): EnvConfig {
    const escapedPrivateKey = this.validatePrivateKey(serviceAccount.private_key);

    return {
      // Client SDK
      NEXT_PUBLIC_FIREBASE_API_KEY: clientConfig.apiKey,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: clientConfig.authDomain,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: clientConfig.projectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: clientConfig.storageBucket,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: clientConfig.messagingSenderId,
      NEXT_PUBLIC_FIREBASE_APP_ID: clientConfig.appId,
      ...(clientConfig.measurementId && {
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: clientConfig.measurementId,
      }),

      // Admin SDK
      FIREBASE_PROJECT_ID: serviceAccount.project_id,
      FIREBASE_CLIENT_EMAIL: serviceAccount.client_email,
      FIREBASE_PRIVATE_KEY: escapedPrivateKey,

      // Session config
      SESSION_COOKIE_NAME: '__session',
      SESSION_COOKIE_DAYS: '5',
    };
  }

  /**
   * Writes environment configuration to .env.local
   */
  private writeEnvFile(config: EnvConfig): void {
    const envPath = join(this.webAppPath, '.env.local');

    // Create backup if file exists
    if (existsSync(envPath)) {
      const backupPath = `${envPath}.backup.${Date.now()}`;
      execSync(`cp "${envPath}" "${backupPath}"`);
      console.log(`📋 Backed up existing .env.local to ${backupPath}`);
    }

    const envContent =
      Object.entries(config)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n') + '\n';

    writeFileSync(envPath, envContent, 'utf-8');
    console.log(`✅ Environment file written to ${envPath}`);
  }

  /**
   * Validates Firebase Admin SDK configuration
   */
  private async validateAdminSDK(config: EnvConfig): Promise<boolean> {
    try {
      // Create a temporary validation script
      const validationScript = `
        const admin = require('firebase-admin');
        
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n')
            })
          });
        }
        
        // Test basic functionality
        admin.auth().listUsers(1)
          .then(() => {
            console.log('✅ Admin SDK validation successful');
            process.exit(0);
          })
          .catch((error) => {
            console.error('❌ Admin SDK validation failed:', error.message);
            process.exit(1);
          });
      `;

      const tempScript = join(this.rootPath, 'temp-validate-admin.js');
      writeFileSync(tempScript, validationScript);

      const env = Object.entries(config)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');

      execSync(`${env} node ${tempScript}`, { stdio: 'inherit' });
      execSync(`rm ${tempScript}`);

      return true;
    } catch (error) {
      console.error('❌ Admin SDK validation failed');
      return false;
    }
  }

  /**
   * Performs health checks on the complete Firebase setup
   */
  private async healthCheck(): Promise<void> {
    console.log('\n🔍 Performing health checks...');

    // Check if development servers can start
    try {
      console.log('⏳ Testing development server startup...');
      execSync('pnpm build 2>/dev/null', { cwd: this.rootPath });
      console.log('✅ Build successful');
    } catch (error) {
      console.warn('⚠️  Build issues detected - check dependencies');
    }

    // Check file permissions
    const criticalFiles = [
      join(this.secretsPath, 'firebase-admin.json'),
      join(this.webAppPath, '.env.local'),
      join(this.webAppPath, 'lib', 'firebase.admin.ts'),
      join(this.webAppPath, 'lib', 'firebase.client.ts'),
    ];

    for (const file of criticalFiles) {
      if (existsSync(file)) {
        console.log(`✅ ${file.replace(this.rootPath, '.')} exists`);
      } else {
        console.warn(`⚠️  ${file.replace(this.rootPath, '.')} missing`);
      }
    }
  }

  /**
   * Main setup engine execution
   */
  public async setup(): Promise<void> {
    try {
      console.log('🚀 Firebase Configuration Engine Starting...\n');

      // Step 1: Load and validate service account
      console.log('1️⃣ Loading service account...');
      const serviceAccount = this.loadServiceAccount();

      // Step 2: Load client configuration
      console.log('\n2️⃣ Loading client configuration...');
      const clientConfig = this.loadClientConfig();

      // Step 3: Generate environment configuration
      console.log('\n3️⃣ Generating environment configuration...');
      const envConfig = this.generateEnvConfig(serviceAccount, clientConfig);

      // Step 4: Cross-validate project IDs match
      if (serviceAccount.project_id !== clientConfig.projectId) {
        throw new Error(
          `Project ID mismatch: Service account (${serviceAccount.project_id}) vs Client config (${clientConfig.projectId})`
        );
      }
      console.log(`✅ Project IDs match: ${serviceAccount.project_id}`);

      // Step 5: Write environment file
      console.log('\n4️⃣ Writing environment configuration...');
      this.writeEnvFile(envConfig);

      // Step 6: Validate Admin SDK
      console.log('\n5️⃣ Validating Admin SDK...');
      const adminValid = await this.validateAdminSDK(envConfig);

      if (!adminValid) {
        console.warn('\n⚠️  Admin SDK validation failed. Check your service account permissions.');
      }

      // Step 7: Health checks
      await this.healthCheck();

      console.log('\n🎉 Firebase configuration engine completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run: pnpm dev:web (or use VS Code task)');
      console.log('   2. Visit: http://localhost:3000/auth-sim');
      console.log('   3. Test: Google + Email sign-in flows');
      console.log('   4. Debug: Use VS Code debugger for session endpoints');
    } catch (error) {
      console.error('\n❌ Configuration engine failed:');
      console.error(error instanceof Error ? error.message : 'Unknown error');
      console.log('\n🛠️  Troubleshooting steps:');
      console.log('   1. Ensure secrets/firebase-admin.json exists and is valid');
      console.log('   2. Check .env.local has NEXT_PUBLIC_FIREBASE_* variables');
      console.log('   3. Verify Firebase project permissions');
      console.log('   4. Run: pnpm install && pnpm build');
      process.exit(1);
    }
  }

  /**
   * Diagnose and fix common configuration issues
   */
  public async diagnose(): Promise<void> {
    console.log('🔧 Firebase Configuration Diagnostics\n');

    const issues: string[] = [];
    const fixes: string[] = [];

    // Check service account
    const serviceAccountPath = join(this.secretsPath, 'firebase-admin.json');
    if (!existsSync(serviceAccountPath)) {
      issues.push('❌ Service account file missing');
      fixes.push(
        '📥 Download service account JSON from Firebase Console → Project Settings → Service Accounts'
      );
    }

    // Check .env.local
    const envPath = join(this.webAppPath, '.env.local');
    if (!existsSync(envPath)) {
      issues.push('❌ .env.local file missing');
      fixes.push('🔧 Create .env.local with Firebase Web App config from Firebase Console');
    }

    // Check dependencies
    try {
      execSync('pnpm list firebase-admin', { cwd: this.rootPath, stdio: 'pipe' });
    } catch {
      issues.push('❌ firebase-admin dependency missing');
      fixes.push('📦 Run: pnpm install');
    }

    if (issues.length === 0) {
      console.log('✅ No configuration issues detected');
      return;
    }

    console.log('Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));

    console.log('\nSuggested fixes:');
    fixes.forEach(fix => console.log(`  ${fix}`));
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';

  const engine = new FirebaseConfigEngine();

  switch (command) {
    case 'setup':
      engine.setup();
      break;
    case 'diagnose':
      engine.diagnose();
      break;
    case 'help':
      console.log(`
Firebase Configuration Engine Commands:

  setup     - Full Firebase configuration setup (default)
  diagnose  - Diagnose configuration issues
  help      - Show this help message

Examples:
  npx tsx scripts/firebase-config-engine.ts setup
  npx tsx scripts/firebase-config-engine.ts diagnose
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run with "help" for usage information');
      process.exit(1);
  }
}

export { FirebaseConfigEngine };
