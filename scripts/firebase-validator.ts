#!/usr/bin/env tsx
/**
 * Firebase Authentication Health Check & Validation System
 *
 * Comprehensive validation and testing for:
 * - Firebase project connectivity
 * - Admin SDK configuration
 * - Client SDK configuration
 * - Authentication flow testing
 * - Session management validation
 * - Environment variable validation
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}

interface ValidationReport {
  overall: 'healthy' | 'issues' | 'critical';
  checks: HealthCheckResult[];
  suggestions: string[];
}

class FirebaseValidator {
  private rootPath: string;
  private webAppPath: string;
  private secretsPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
    this.webAppPath = join(rootPath, 'apps', 'web');
    this.secretsPath = join(rootPath, 'secrets');
  }

  /**
   * Validates service account JSON structure and credentials
   */
  private checkServiceAccount(): HealthCheckResult {
    const serviceAccountPath = join(this.secretsPath, 'firebase-admin.json');

    if (!existsSync(serviceAccountPath)) {
      return {
        name: 'Service Account File',
        status: 'fail',
        message: 'Service account JSON file not found',
        details: `Expected at: ${serviceAccountPath}`,
      };
    }

    try {
      const content = readFileSync(serviceAccountPath, 'utf-8');
      const serviceAccount = JSON.parse(content);

      const requiredFields = [
        'type',
        'project_id',
        'private_key_id',
        'private_key',
        'client_email',
        'client_id',
        'auth_uri',
        'token_uri',
      ];

      const missingFields = requiredFields.filter(field => !serviceAccount[field]);

      if (missingFields.length > 0) {
        return {
          name: 'Service Account File',
          status: 'fail',
          message: 'Service account missing required fields',
          details: `Missing: ${missingFields.join(', ')}`,
        };
      }

      // Validate private key format
      if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
        return {
          name: 'Service Account File',
          status: 'fail',
          message: 'Private key format invalid',
          details: '\n🛑 Prerequisites missing. Please add the required files and run again.',
        };
      }

      // Check if it's a service account type
      if (serviceAccount.type !== 'service_account') {
        return {
          name: 'Service Account File',
          status: 'warn',
          message: 'Unexpected account type',
          details: `Expected 'service_account', found '${serviceAccount.type}'`,
        };
      }

      return {
        name: 'Service Account File',
        status: 'pass',
        message: `Valid service account for project: ${serviceAccount.project_id}`,
      };
    } catch (error) {
      return {
        name: 'Service Account File',
        status: 'fail',
        message: 'Failed to parse service account JSON',
        details: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Validates .env.local file and Firebase client configuration
   */
  private checkEnvironmentFile(): HealthCheckResult {
    const envPath = join(this.webAppPath, '.env.local');

    if (!existsSync(envPath)) {
      return {
        name: 'Environment File',
        status: 'fail',
        message: '.env.local file not found',
        details: `Expected at: ${envPath}`,
      };
    }

    try {
      const content = readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');

      const requiredClientVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
      ];

      const requiredAdminVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
      ];

      const allRequiredVars = [...requiredClientVars, ...requiredAdminVars];
      const foundVars: string[] = [];

      for (const line of lines) {
        const [key] = line.split('=');
        if (key && allRequiredVars.includes(key)) {
          foundVars.push(key);
        }
      }

      const missingVars = allRequiredVars.filter(v => !foundVars.includes(v));

      if (missingVars.length > 0) {
        return {
          name: 'Environment File',
          status: 'fail',
          message: 'Missing required environment variables',
          details: `Missing: ${missingVars.join(', ')}`,
        };
      }

      // Check for private key format in env
      const privateKeyLine = lines.find(line => line.startsWith('FIREBASE_PRIVATE_KEY='));
      if (privateKeyLine && !privateKeyLine.includes('BEGIN PRIVATE KEY')) {
        return {
          name: 'Environment File',
          status: 'warn',
          message: 'Private key may be malformed in .env.local',
          details: 'Ensure the private key includes BEGIN/END boundaries',
        };
      }

      return {
        name: 'Environment File',
        status: 'pass',
        message: `All required environment variables present (${foundVars.length})`,
      };
    } catch (error) {
      return {
        name: 'Environment File',
        status: 'fail',
        message: 'Failed to read environment file',
        details: error instanceof Error ? error.message : 'Unknown read error',
      };
    }
  }

  /**
   * Validates project ID consistency across service account and client config
   */
  private checkProjectIdConsistency(): HealthCheckResult {
    try {
      // Get project ID from service account
      const serviceAccountPath = join(this.secretsPath, 'firebase-admin.json');
      if (!existsSync(serviceAccountPath)) {
        return {
          name: 'Project ID Consistency',
          status: 'fail',
          message: 'Cannot validate - service account missing',
        };
      }

      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      const serviceProjectId = serviceAccount.project_id;

      // Get project ID from .env.local
      const envPath = join(this.webAppPath, '.env.local');
      if (!existsSync(envPath)) {
        return {
          name: 'Project ID Consistency',
          status: 'fail',
          message: 'Cannot validate - .env.local missing',
        };
      }

      const envContent = readFileSync(envPath, 'utf-8');
      const clientProjectIdMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID=([^\n]+)/);
      const adminProjectIdMatch = envContent.match(/FIREBASE_PROJECT_ID=([^\n]+)/);

      if (!clientProjectIdMatch || !adminProjectIdMatch) {
        return {
          name: 'Project ID Consistency',
          status: 'fail',
          message: 'Project ID environment variables not found',
        };
      }

      const clientProjectId = clientProjectIdMatch[1].replace(/['"]/g, '');
      const adminProjectId = adminProjectIdMatch[1].replace(/['"]/g, '');

      if (serviceProjectId !== clientProjectId || serviceProjectId !== adminProjectId) {
        return {
          name: 'Project ID Consistency',
          status: 'fail',
          message: 'Project ID mismatch between configurations',
          details: `Service: ${serviceProjectId}, Client: ${clientProjectId}, Admin: ${adminProjectId}`,
        };
      }

      return {
        name: 'Project ID Consistency',
        status: 'pass',
        message: `Project IDs consistent: ${serviceProjectId}`,
      };
    } catch (error) {
      return {
        name: 'Project ID Consistency',
        status: 'fail',
        message: 'Failed to validate project ID consistency',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Tests Firebase Admin SDK initialization
   */
  private async checkAdminSDKConnection(): Promise<HealthCheckResult> {
    try {
      // Create a test script that tries to initialize the Admin SDK
      const testScript = `
        const admin = require('firebase-admin');
        const fs = require('fs');
        
        try {
          const envPath = '${join(this.webAppPath, '.env.local')}';
          const envContent = fs.readFileSync(envPath, 'utf-8');
          
          const env = {};
          envContent.split('\\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
              env[key] = value.replace(/['"]/g, '');
            }
          });
          
          if (admin.apps.length === 0) {
            admin.initializeApp({
              credential: admin.credential.cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                // Replace literal '\n' (escaped in .env) with actual newlines for private key
                privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
              })
            });
          }
          
          // Test basic Admin SDK functionality
          admin.auth().listUsers(1)
            .then(() => {
              console.log('ADMIN_SDK_SUCCESS');
              process.exit(0);
            })
            .catch((error) => {
              console.log('ADMIN_SDK_ERROR:' + error.message);
              process.exit(1);
            });
            
        } catch (error) {
          console.log('ADMIN_SDK_INIT_ERROR:' + error.message);
          process.exit(1);
        }
      `;

      const tempScript = join(this.rootPath, 'temp-admin-test.js');
      require('fs').writeFileSync(tempScript, testScript);

      try {
        const result = execSync(`node ${tempScript}`, {
          cwd: this.rootPath,
          encoding: 'utf-8',
          timeout: 10000,
        });

        execSync(`rm ${tempScript}`);

        if (result.includes('ADMIN_SDK_SUCCESS')) {
          return {
            name: 'Admin SDK Connection',
            status: 'pass',
            message: 'Firebase Admin SDK initialized successfully',
          };
        } else {
          return {
            name: 'Admin SDK Connection',
            status: 'fail',
            message: 'Admin SDK test failed',
            details: result,
          };
        }
      } catch (error) {
        execSync(`rm -f ${tempScript}`);

        const errorOutput =
          error instanceof Error && 'stdout' in error
            ? (error as any).stdout
            : 'Unknown execution error';

        if (errorOutput.includes('ADMIN_SDK_ERROR:')) {
          const errorMessage = errorOutput.split('ADMIN_SDK_ERROR:')[1]?.trim();
          return {
            name: 'Admin SDK Connection',
            status: 'fail',
            message: 'Firebase Admin SDK connection failed',
            details: errorMessage,
          };
        }

        if (errorOutput.includes('ADMIN_SDK_INIT_ERROR:')) {
          const errorMessage = errorOutput.split('ADMIN_SDK_INIT_ERROR:')[1]?.trim();
          return {
            name: 'Admin SDK Connection',
            status: 'fail',
            message: 'Firebase Admin SDK initialization failed',
            details: errorMessage,
          };
        }

        return {
          name: 'Admin SDK Connection',
          status: 'fail',
          message: 'Admin SDK test execution failed',
          details: errorOutput,
        };
      }
    } catch (error) {
      return {
        name: 'Admin SDK Connection',
        status: 'fail',
        message: 'Failed to test Admin SDK connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Checks if critical Firebase files exist and are accessible
   */
  private checkCriticalFiles(): HealthCheckResult {
    const criticalFiles = [
      { path: join(this.webAppPath, 'lib', 'firebase.admin.ts'), name: 'Admin SDK config' },
      { path: join(this.webAppPath, 'lib', 'firebase.client.ts'), name: 'Client SDK config' },
      { path: join(this.webAppPath, 'lib', 'session.ts'), name: 'Session utilities' },
      {
        path: join(this.webAppPath, 'app', 'api', 'session', 'login', 'route.ts'),
        name: 'Login API route',
      },
      {
        path: join(this.webAppPath, 'app', 'api', 'session', 'logout', 'route.ts'),
        name: 'Logout API route',
      },
      { path: join(this.webAppPath, 'middleware.ts'), name: 'Auth middleware' },
    ];

    const missingFiles: string[] = [];
    const presentFiles: string[] = [];

    for (const file of criticalFiles) {
      if (existsSync(file.path)) {
        presentFiles.push(file.name);
      } else {
        missingFiles.push(file.name);
      }
    }

    if (missingFiles.length > 0) {
      return {
        name: 'Critical Files',
        status: 'warn',
        message: `Some authentication files missing (${missingFiles.length})`,
        details: `Missing: ${missingFiles.join(', ')}`,
      };
    }

    return {
      name: 'Critical Files',
      status: 'pass',
      message: `All critical authentication files present (${presentFiles.length})`,
    };
  }

  /**
   * Tests development server startup capability
   */
  private checkDevServerStartup(): HealthCheckResult {
    try {
      // Test if we can build the project
      execSync('pnpm build 2>/dev/null', {
        cwd: this.rootPath,
        timeout: 30000,
      });

      return {
        name: 'Dev Server Startup',
        status: 'pass',
        message: 'Project builds successfully',
      };
    } catch (error) {
      return {
        name: 'Dev Server Startup',
        status: 'warn',
        message: 'Build issues detected',
        details: 'Run `pnpm build` to see detailed build errors',
      };
    }
  }

  /**
   * Performs comprehensive Firebase validation
   */
  public async validate(): Promise<ValidationReport> {
    console.log('🔍 Running Firebase Authentication Health Checks...\n');

    const checks: HealthCheckResult[] = [];

    // Run all health checks
    checks.push(this.checkServiceAccount());
    checks.push(this.checkEnvironmentFile());
    checks.push(this.checkProjectIdConsistency());
    checks.push(await this.checkAdminSDKConnection());
    checks.push(this.checkCriticalFiles());
    checks.push(this.checkDevServerStartup());

    // Analyze results
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;
    const passCount = checks.filter(c => c.status === 'pass').length;

    let overall: 'healthy' | 'issues' | 'critical';
    if (failCount > 0) {
      overall = 'critical';
    } else if (warnCount > 0) {
      overall = 'issues';
    } else {
      overall = 'healthy';
    }

    // Generate suggestions
    const suggestions: string[] = [];

    if (failCount > 0) {
      suggestions.push('🚨 Critical issues detected - authentication will not work');
      suggestions.push('🔧 Fix all failed checks before proceeding');
    }

    if (warnCount > 0) {
      suggestions.push('⚠️  Warning issues detected - may cause problems');
      suggestions.push('🛠️  Address warnings for optimal performance');
    }

    if (overall === 'healthy') {
      suggestions.push('✅ All checks passed - Firebase authentication ready');
      suggestions.push('🚀 Run: pnpm dev:web and test at http://localhost:3000/auth-sim');
    }

    return {
      overall,
      checks,
      suggestions,
    };
  }

  /**
   * Prints a detailed validation report
   */
  public printReport(report: ValidationReport): void {
    console.log('📊 Firebase Authentication Health Report');
    console.log('=======================================\n');

    // Overall status
    const statusEmoji = {
      healthy: '🟢',
      issues: '🟡',
      critical: '🔴',
    };

    console.log(`Overall Status: ${statusEmoji[report.overall]} ${report.overall.toUpperCase()}\n`);

    // Individual checks
    for (const check of report.checks) {
      const emoji = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
      console.log(`${emoji} ${check.name}: ${check.message}`);
      if (check.details) {
        console.log(`   💬 ${check.details}`);
      }
    }

    // Summary stats
    const passCount = report.checks.filter(c => c.status === 'pass').length;
    const warnCount = report.checks.filter(c => c.status === 'warn').length;
    const failCount = report.checks.filter(c => c.status === 'fail').length;

    console.log(`\n📈 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed\n`);

    // Suggestions
    if (report.suggestions.length > 0) {
      console.log('💡 Recommendations:');
      for (const suggestion of report.suggestions) {
        console.log(`   ${suggestion}`);
      }
    }

    console.log('\n🔗 Useful links:');
    console.log('   📚 Firebase Console: https://console.firebase.google.com');
    console.log('   🛠️  Config Engine: npx tsx scripts/firebase-config-engine.ts setup');
    console.log('   🧪 Auth Testing: http://localhost:3000/auth-sim (after dev server starts)');
  }
}

// CLI Interface
if (require.main === module) {
  async function main() {
    const validator = new FirebaseValidator();
    const report = await validator.validate();
    validator.printReport(report);

    // Exit with appropriate code
    process.exit(report.overall === 'critical' ? 1 : 0);
  }

  main().catch(console.error);
}

export { FirebaseValidator, HealthCheckResult, ValidationReport };
