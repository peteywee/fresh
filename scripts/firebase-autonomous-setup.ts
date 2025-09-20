#!/usr/bin/env tsx
/**
 * Autonomous Firebase Configuration Generator
 *
 * Zero-config Firebase setup tool that:
 * - Detects project structure automatically
 * - Reads Firebase configuration from firebase.json
 * - Generates .env.local files for client and server
 * - Creates service account configs
 * - Sets up complete authentication system
 *
 * Usage after firebase init:
 *   npx tsx scripts/firebase-autonomous-setup.ts
 *   npx tsx scripts/firebase-autonomous-setup.ts --project-id my-project
 *   npx tsx scripts/firebase-autonomous-setup.ts --interactive
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { createInterface } from 'readline';

interface FirebaseProject {
  projectId: string;
  storageBucket?: string;
  locationId?: string;
}

interface FirebaseConfig {
  projects?: Record<string, string>;
  targets?: Record<string, any>;
  hosting?: any[];
  functions?: any;
}

interface ProjectStructure {
  root: string;
  webApps: string[];
  apiServices: string[];
  hasFirebaseJson: boolean;
  hasPackageJson: boolean;
  projectType: 'nextjs' | 'react' | 'node' | 'mixed' | 'unknown';
}

interface GeneratedConfig {
  clientConfig: Record<string, string>;
  serverConfig: Record<string, string>;
  sessionConfig: Record<string, string>;
}

class AutonomousFirebaseSetup {
  private rootPath: string;
  private projectStructure: ProjectStructure;
  private firebaseProject: FirebaseProject | null = null;
  private interactive: boolean;

  constructor(rootPath: string = process.cwd(), interactive: boolean = false) {
    this.rootPath = resolve(rootPath);
    this.interactive = interactive;
    this.projectStructure = this.detectProjectStructure();
  }

  /**
   * Automatically detects project structure and framework type
   */
  private detectProjectStructure(): ProjectStructure {
    const structure: ProjectStructure = {
      root: this.rootPath,
      webApps: [],
      apiServices: [],
      hasFirebaseJson: existsSync(join(this.rootPath, 'firebase.json')),
      hasPackageJson: existsSync(join(this.rootPath, 'package.json')),
      projectType: 'unknown',
    };

    // Detect common web app locations
    const webAppPaths = [
      'apps/web',
      'packages/web',
      'web',
      'frontend',
      'client',
      'src',
      '.', // root level
    ];

    for (const path of webAppPaths) {
      const fullPath = join(this.rootPath, path);
      if (this.isWebApp(fullPath)) {
        structure.webApps.push(path);
      }
    }

    // Detect API service locations
    const apiPaths = [
      'apps/api',
      'services/api',
      'packages/api',
      'api',
      'backend',
      'server',
      'functions',
    ];

    for (const path of apiPaths) {
      const fullPath = join(this.rootPath, path);
      if (this.isApiService(fullPath)) {
        structure.apiServices.push(path);
      }
    }

    // Determine project type
    if (structure.webApps.length > 0 && structure.apiServices.length > 0) {
      structure.projectType = 'mixed';
    } else if (structure.webApps.length > 0) {
      structure.projectType = this.detectWebFramework(join(this.rootPath, structure.webApps[0]));
    } else if (structure.apiServices.length > 0) {
      structure.projectType = 'node';
    }

    return structure;
  }

  /**
   * Checks if a directory contains a web application
   */
  private isWebApp(path: string): boolean {
    if (!existsSync(path)) return false;

    const indicators = [
      'next.config.js',
      'next.config.mjs',
      'next.config.ts',
      'vite.config.js',
      'vite.config.ts',
      'package.json', // Check for React/Vue/Angular
    ];

    return (
      indicators.some(file => existsSync(join(path, file))) ||
      existsSync(join(path, 'app')) || // Next.js app dir
      existsSync(join(path, 'pages')) || // Next.js pages dir
      existsSync(join(path, 'src', 'pages')) || // CRA/Vite
      (existsSync(join(path, 'package.json')) && this.hasWebDependencies(path))
    );
  }

  /**
   * Checks if a directory contains an API service
   */
  private isApiService(path: string): boolean {
    if (!existsSync(path)) return false;

    const indicators = [
      'server.js',
      'server.ts',
      'index.js',
      'index.ts',
      'app.js',
      'app.ts',
      'main.js',
      'main.ts',
    ];

    return (
      indicators.some(file => existsSync(join(path, file))) ||
      existsSync(join(path, 'src', 'index.ts')) ||
      (existsSync(join(path, 'package.json')) && this.hasServerDependencies(path))
    );
  }

  /**
   * Detects web framework type
   */
  private detectWebFramework(webPath: string): 'nextjs' | 'react' | 'unknown' {
    if (
      existsSync(join(webPath, 'next.config.js')) ||
      existsSync(join(webPath, 'next.config.mjs')) ||
      existsSync(join(webPath, 'next.config.ts'))
    ) {
      return 'nextjs';
    }

    if (this.hasWebDependencies(webPath)) {
      return 'react';
    }

    return 'unknown';
  }

  /**
   * Checks if package.json has web dependencies
   */
  private hasWebDependencies(path: string): boolean {
    const packageJsonPath = join(path, 'package.json');
    if (!existsSync(packageJsonPath)) return false;

    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      return ['next', 'react', 'vue', '@angular/core', 'vite'].some(dep => deps[dep]);
    } catch {
      return false;
    }
  }

  /**
   * Checks if package.json has server dependencies
   */
  private hasServerDependencies(path: string): boolean {
    const packageJsonPath = join(path, 'package.json');
    if (!existsSync(packageJsonPath)) return false;

    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      return ['express', 'fastify', 'koa', 'hapi', 'firebase-functions', 'firebase-admin'].some(
        dep => deps[dep]
      );
    } catch {
      return false;
    }
  }

  /**
   * Reads Firebase project configuration from firebase.json and .firebaserc
   */
  private async detectFirebaseProject(): Promise<FirebaseProject | null> {
    // Try .firebaserc first (most reliable)
    const firebaseRcPath = join(this.rootPath, '.firebaserc');
    if (existsSync(firebaseRcPath)) {
      try {
        const firebaseRc = JSON.parse(readFileSync(firebaseRcPath, 'utf-8'));
        if (firebaseRc.projects?.default) {
          return {
            projectId: firebaseRc.projects.default,
          };
        }
      } catch (error) {
        console.warn('⚠️  Failed to parse .firebaserc:', error);
      }
    }

    // Try firebase.json
    const firebaseJsonPath = join(this.rootPath, 'firebase.json');
    if (existsSync(firebaseJsonPath)) {
      try {
        const firebaseJson: FirebaseConfig = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'));

        // Firebase.json doesn't usually contain project ID, but check anyway
        if (firebaseJson.projects) {
          const projectId = Object.values(firebaseJson.projects)[0];
          if (typeof projectId === 'string') {
            return { projectId };
          }
        }
      } catch (error) {
        console.warn('⚠️  Failed to parse firebase.json:', error);
      }
    }

    // Try Firebase CLI if available
    try {
      const result = execSync('firebase use', {
        cwd: this.rootPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const match = result.match(/Active project: (.+) \\((.+)\\)/);
      if (match) {
        return { projectId: match[2] };
      }
    } catch {
      // Firebase CLI not available or not logged in
    }

    return null;
  }

  /**
   * Interactive prompt for project ID if not detected
   */
  private async promptForProjectId(): Promise<string> {
    if (!this.interactive) {
      throw new Error(
        'Firebase project not detected. Use --project-id flag or --interactive mode.'
      );
    }

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => {
      rl.question('Enter your Firebase project ID: ', projectId => {
        rl.close();
        resolve(projectId.trim());
      });
    });
  }

  /**
   * Fetches Firebase web app configuration from Firebase
   */
  private async fetchFirebaseWebConfig(projectId: string): Promise<Record<string, string>> {
    try {
      // Try to get config from Firebase CLI
      const result = execSync(`firebase apps:list --project ${projectId}`, {
        cwd: this.rootPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Parse the result to get web app ID
      const webAppMatch = result.match(/│\\s+([a-zA-Z0-9:]+)\\s+│\\s+Web\\s+│/);
      if (webAppMatch) {
        const appId = webAppMatch[1];

        const configResult = execSync(
          `firebase apps:sdkconfig web ${appId} --project ${projectId}`,
          {
            cwd: this.rootPath,
            encoding: 'utf-8',
            stdio: 'pipe',
          }
        );

        // Extract config from the output
        const configMatch = configResult.match(/const firebaseConfig = ({[\\s\\S]+?});/);
        if (configMatch) {
          const configStr = configMatch[1];
          // Convert to object (simplified parsing)
          const config = this.parseFirebaseConfigString(configStr);
          return this.convertToEnvFormat(config);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not fetch config from Firebase CLI, using defaults');
    }

    // Fallback to generating config based on project ID
    return this.generateDefaultWebConfig(projectId);
  }

  /**
   * Parses Firebase config string to object
   */
  private parseFirebaseConfigString(configStr: string): Record<string, string> {
    // Simple regex-based parsing (in production, use a proper JS parser)
    const config: Record<string, string> = {};

    const pairs = configStr.match(/([a-zA-Z]+):\\s*["']([^"']+)["']/g);
    if (pairs) {
      for (const pair of pairs) {
        const match = pair.match(/([a-zA-Z]+):\\s*["']([^"']+)["']/);
        if (match) {
          config[match[1]] = match[2];
        }
      }
    }

    return config;
  }

  /**
   * Converts Firebase config to environment variable format
   */
  private convertToEnvFormat(config: Record<string, string>): Record<string, string> {
    return {
      NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey || '',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain || '',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.projectId || '',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.storageBucket || '',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId || '',
      NEXT_PUBLIC_FIREBASE_APP_ID: config.appId || '',
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: config.measurementId || '',
    };
  }

  /**
   * Generates default Firebase web config based on project ID
   */
  private generateDefaultWebConfig(projectId: string): Record<string, string> {
    return {
      NEXT_PUBLIC_FIREBASE_API_KEY: `[REQUIRED] Get from Firebase Console → Project Settings → General → Your apps`,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${projectId}.appspot.com`,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: `[REQUIRED] Get from Firebase Console`,
      NEXT_PUBLIC_FIREBASE_APP_ID: `[REQUIRED] Get from Firebase Console`,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: `[OPTIONAL] Google Analytics measurement ID`,
    };
  }

  /**
   * Generates server-side Firebase Admin SDK configuration
   */
  private generateServerConfig(projectId: string): Record<string, string> {
    return {
      FIREBASE_PROJECT_ID: projectId,
      FIREBASE_CLIENT_EMAIL: `[REQUIRED] Get from service account JSON: firebase-adminsdk-xxx@${projectId}.iam.gserviceaccount.com`,
      FIREBASE_PRIVATE_KEY: `[REQUIRED] Get from service account JSON: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n`,
    };
  }

  /**
   * Generates session configuration
   */
  private generateSessionConfig(): Record<string, string> {
    return {
      SESSION_COOKIE_NAME: '__session',
      SESSION_COOKIE_DAYS: '5',
    };
  }

  /**
   * Creates .env.local file with generated configuration
   */
  private createEnvFile(
    targetPath: string,
    config: GeneratedConfig,
    type: 'client' | 'server' | 'full'
  ): void {
    const envPath = join(targetPath, '.env.local');

    // Create backup if exists
    if (existsSync(envPath)) {
      const backupPath = `${envPath}.backup.${Date.now()}`;
      execSync(`cp "${envPath}" "${backupPath}"`);
      console.log(`📋 Backed up existing .env.local to ${backupPath}`);
    }

    let content = '';

    if (type === 'client' || type === 'full') {
      content += '# Firebase Client SDK Configuration (Public)\n';
      Object.entries(config.clientConfig).forEach(([key, value]) => {
        content += `${key}="${value}"\\n`;
      });
      content += '\\n';
    }

    if (type === 'server' || type === 'full') {
      content += '# Firebase Admin SDK Configuration (Server-side)\n';
      Object.entries(config.serverConfig).forEach(([key, value]) => {
        content += `${key}="${value}"\\n`;
      });
      content += '\\n';
    }

    if (type === 'full') {
      content += '# Session Configuration\n';
      Object.entries(config.sessionConfig).forEach(([key, value]) => {
        content += `${key}="${value}"\\n`;
      });
    }

    // Ensure directory exists
    mkdirSync(dirname(envPath), { recursive: true });

    writeFileSync(envPath, content);
    console.log(`✅ Created .env.local at ${envPath}`);
  }

  /**
   * Creates service account setup instructions
   */
  private createServiceAccountInstructions(): void {
    const secretsDir = join(this.rootPath, 'secrets');
    const readmePath = join(secretsDir, 'README-SETUP.md');

    if (!existsSync(secretsDir)) {
      mkdirSync(secretsDir, { recursive: true });
    }

    const instructions = `# Firebase Service Account Setup

## Required: Download Service Account Key

1. **Visit Firebase Console**: https://console.firebase.google.com
2. **Select your project**: ${this.firebaseProject?.projectId || '[YOUR-PROJECT-ID]'}
3. **Navigate to**: Project Settings → Service Accounts
4. **Click**: "Generate new private key"
5. **Save as**: \`firebase-admin.json\` in this directory

## File Location
Save the downloaded JSON file here:
\`\`\`
${secretsDir}/firebase-admin.json
\`\`\`

## After Adding Service Account
Run the configuration update:
\`\`\`bash
npx tsx scripts/firebase-autonomous-setup.ts --update
\`\`\`

## Security Note
- Never commit \`firebase-admin.json\` to git
- The \`secrets/\` directory should be in your \`.gitignore\`
- Use environment variables in production
`;

    writeFileSync(readmePath, instructions);
    console.log(`📝 Created service account setup instructions at ${readmePath}`);
  }

  /**
   * Updates existing .env.local files with service account data
   */
  private async updateWithServiceAccount(): Promise<void> {
    const serviceAccountPath = join(this.rootPath, 'secrets', 'firebase-admin.json');

    if (!existsSync(serviceAccountPath)) {
      console.warn(
        '⚠️  Service account file not found. Please add secrets/firebase-admin.json first.'
      );
      return;
    }

    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

      // Update all .env.local files
      for (const webApp of this.projectStructure.webApps) {
        const envPath = join(this.rootPath, webApp, '.env.local');
        if (existsSync(envPath)) {
          await this.updateEnvFileWithServiceAccount(envPath, serviceAccount);
        }
      }

      console.log('✅ Updated .env.local files with service account data');
    } catch (error) {
      console.error('❌ Failed to update with service account:', error);
    }
  }

  /**
   * Updates a specific .env.local file with service account data
   */
  private async updateEnvFileWithServiceAccount(
    envPath: string,
    serviceAccount: any
  ): Promise<void> {
    const content = readFileSync(envPath, 'utf-8');
    let updatedContent = content;

    // Replace placeholders with actual values
    updatedContent = updatedContent.replace(
      /FIREBASE_CLIENT_EMAIL="\\[REQUIRED\\][^"]*"/,
      `FIREBASE_CLIENT_EMAIL="${serviceAccount.client_email}"`
    );

    updatedContent = updatedContent.replace(
      /FIREBASE_PRIVATE_KEY="\\[REQUIRED\\][^"]*"/,
      `FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\\n/g, '\\\\n')}"`
    );

    if (content !== updatedContent) {
      // Create backup
      const backupPath = `${envPath}.backup.${Date.now()}`;
      writeFileSync(backupPath, content);

      writeFileSync(envPath, updatedContent);
      console.log(`✅ Updated ${envPath} with service account data`);
    }
  }

  /**
   * Main setup execution
   */
  public async setup(options: { projectId?: string; update?: boolean } = {}): Promise<void> {
    try {
      console.log('🚀 Autonomous Firebase Configuration Setup');
      console.log('==========================================\\n');

      console.log('🔍 Detecting project structure...');
      console.log(`   Root: ${this.rootPath}`);
      console.log(`   Type: ${this.projectStructure.projectType}`);
      console.log(
        `   Web apps: ${this.projectStructure.webApps.length > 0 ? this.projectStructure.webApps.join(', ') : 'none'}`
      );
      console.log(
        `   API services: ${this.projectStructure.apiServices.length > 0 ? this.projectStructure.apiServices.join(', ') : 'none'}`
      );
      console.log(`   Has firebase.json: ${this.projectStructure.hasFirebaseJson ? '✅' : '❌'}`);

      if (options.update) {
        await this.updateWithServiceAccount();
        return;
      }

      console.log('\\n🔥 Detecting Firebase project...');
      this.firebaseProject = await this.detectFirebaseProject();

      if (!this.firebaseProject) {
        if (options.projectId) {
          this.firebaseProject = { projectId: options.projectId };
        } else {
          const projectId = await this.promptForProjectId();
          this.firebaseProject = { projectId };
        }
      }

      console.log(`   Project ID: ${this.firebaseProject.projectId}`);

      console.log('\\n⚙️  Generating configurations...');
      const clientConfig = await this.fetchFirebaseWebConfig(this.firebaseProject.projectId);
      const serverConfig = this.generateServerConfig(this.firebaseProject.projectId);
      const sessionConfig = this.generateSessionConfig();

      const generatedConfig: GeneratedConfig = {
        clientConfig,
        serverConfig,
        sessionConfig,
      };

      console.log('\\n📝 Creating .env.local files...');

      // Create .env.local for each web app
      for (const webApp of this.projectStructure.webApps) {
        const webAppPath = join(this.rootPath, webApp);
        this.createEnvFile(webAppPath, generatedConfig, 'full');
      }

      // Create .env.local for each API service (server config only)
      for (const apiService of this.projectStructure.apiServices) {
        const apiPath = join(this.rootPath, apiService);
        this.createEnvFile(apiPath, generatedConfig, 'server');
      }

      // If no specific apps found, create in root
      if (
        this.projectStructure.webApps.length === 0 &&
        this.projectStructure.apiServices.length === 0
      ) {
        this.createEnvFile(this.rootPath, generatedConfig, 'full');
      }

      // Create service account setup instructions
      this.createServiceAccountInstructions();

      console.log('\\n🎉 Autonomous setup completed!');
      console.log('\\n📋 Next steps:');
      console.log('   1. Add your service account key: secrets/firebase-admin.json');
      console.log(
        '   2. Update API key and app ID in .env.local files (see [REQUIRED] placeholders)'
      );
      console.log('   3. Run: npx tsx scripts/firebase-autonomous-setup.ts --update');
      console.log('   4. Start development: pnpm dev');
      console.log('\\n🔗 Get required values from:');
      console.log(
        `   Firebase Console: https://console.firebase.google.com/project/${this.firebaseProject.projectId}/settings/general`
      );
    } catch (error) {
      console.error(
        '\\n❌ Autonomous setup failed:',
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    projectId: args.includes('--project-id') ? args[args.indexOf('--project-id') + 1] : undefined,
    interactive: args.includes('--interactive'),
    update: args.includes('--update'),
  };

  if (args.includes('--help')) {
    console.log(`
🚀 Autonomous Firebase Configuration Setup

Automatically detects your project structure and generates all necessary 
Firebase configuration files without requiring any pre-existing setup.

USAGE:
  npx tsx scripts/firebase-autonomous-setup.ts [options]

OPTIONS:
  --project-id <id>    Specify Firebase project ID manually
  --interactive        Enable interactive prompts for missing info
  --update            Update existing .env.local files with service account data
  --help              Show this help message

EXAMPLES:
  # Auto-detect everything
  npx tsx scripts/firebase-autonomous-setup.ts
  
  # Specify project ID
  npx tsx scripts/firebase-autonomous-setup.ts --project-id my-firebase-project
  
  # Interactive mode
  npx tsx scripts/firebase-autonomous-setup.ts --interactive
  
  # Update with service account after adding secrets/firebase-admin.json
  npx tsx scripts/firebase-autonomous-setup.ts --update

WORKFLOW:
  1. Run 'firebase init' to initialize Firebase in your project
  2. Run this script to generate all .env.local files
  3. Add your service account JSON to secrets/firebase-admin.json
  4. Run with --update to complete the configuration
  5. Start development!

WHAT IT DETECTS:
  ✅ Next.js, React, Vue, Angular web apps
  ✅ Express, Fastify, Node.js API services  
  ✅ Monorepo structures (apps/, packages/, etc.)
  ✅ Firebase project ID from .firebaserc or firebase.json
  ✅ Existing .env.local files (creates backups)

WHAT IT GENERATES:
  ✅ .env.local files with Firebase client & server config
  ✅ Service account setup instructions
  ✅ Session management configuration
  ✅ Project-specific environment variables
    `);
    process.exit(0);
  }

  const setup = new AutonomousFirebaseSetup(process.cwd(), options.interactive);
  setup.setup(options).catch(console.error);
}

export { AutonomousFirebaseSetup };
