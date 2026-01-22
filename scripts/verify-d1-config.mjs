#!/usr/bin/env node

/**
 * D1 Configuration Verification Script
 * Run this to verify your Cloudflare D1 is properly configured for Pages deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(name, condition, failMessage) {
  if (condition) {
    log(`✓ ${name}`, 'green');
    return true;
  } else {
    log(`✗ ${name}`, 'red');
    if (failMessage) log(`  → ${failMessage}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n🔍 EstateCare D1 Configuration Checker\n', 'cyan');

  const checks = [];

  // 1. Check wrangler.toml
  log('1. Checking wrangler.toml configuration...', 'blue');
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  const wranglerExists = fs.existsSync(wranglerPath);
  checks.push(check('wrangler.toml exists', wranglerExists, 'File not found'));

  if (wranglerExists) {
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    const hasD1Binding = wranglerContent.includes('database_name = "estatecare"');
    const hasBindingName = wranglerContent.includes('binding = "DB"');
    const hasDatabaseId = wranglerContent.includes('database_id =');

    checks.push(check('D1 database binding named "DB"', hasBindingName, 'Add: binding = "DB"'));
    checks.push(check('D1 database name "estatecare"', hasD1Binding, 'Add: database_name = "estatecare"'));
    checks.push(check('D1 database ID configured', hasDatabaseId, 'Add: database_id = "..."'));
  }

  log('\n2. Checking local environment...', 'blue');

  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    checks.push(check('Node.js installed', true, `Version: ${nodeVersion}`));
  } catch {
    checks.push(check('Node.js installed', false, 'Install Node.js >= 18.18.0'));
  }

  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    checks.push(check('npm installed', true, `Version: ${npmVersion}`));
  } catch {
    checks.push(check('npm installed', false, 'Install npm'));
  }

  // Check wrangler CLI
  let hasWrangler = false;
  try {
    execSync('npx wrangler --version', { encoding: 'utf8', stdio: 'pipe' });
    hasWrangler = true;
  } catch {
    //
  }
  checks.push(
    check(
      'Cloudflare Wrangler CLI available',
      hasWrangler,
      'Run: npm install -g @cloudflare/wrangler'
    )
  );

  // Check D1 database
  log('\n3. Checking Cloudflare D1 database...', 'blue');
  if (hasWrangler) {
    try {
      const output = execSync('npx wrangler d1 list', { encoding: 'utf8' });
      const hasEstatecare = output.includes('estatecare');
      checks.push(
        check(
          'D1 database "estatecare" exists',
          hasEstatecare,
          'Create with: npx wrangler d1 create estatecare'
        )
      );

      if (hasEstatecare) {
        try {
          const infoOutput = execSync('npx wrangler d1 info estatecare', { encoding: 'utf8' });
          const dbId = infoOutput.match(/Database ID: ([\w-]+)/);
          if (dbId) {
            log(`  Database ID: ${dbId[1]}`, 'cyan');
          }
        } catch {
          //
        }
      }
    } catch {
      checks.push(check('D1 database "estatecare" exists', false, 'Wrangler error - check your login'));
    }
  }

  // Check build artifacts
  log('\n4. Checking build artifacts...', 'blue');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJsonExists = fs.existsSync(packageJsonPath);
  checks.push(check('package.json exists', packageJsonExists));

  if (packageJsonExists) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasDevScript = packageJson.scripts && packageJson.scripts['build:pages'];
      const hasDeployScript = packageJson.scripts && packageJson.scripts.deploy;

      checks.push(check('npm run build:pages script exists', hasDevScript));
      checks.push(check('npm run deploy script exists', hasDeployScript));
    } catch {
      checks.push(check('package.json is valid JSON', false));
    }
  }

  // Check environment files
  log('\n5. Checking environment configuration...', 'blue');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envProdPath = path.join(process.cwd(), '.env.production');

  checks.push(check('.env.example exists', fs.existsSync(envExamplePath)));
  checks.push(check('.env.production exists', fs.existsSync(envProdPath)));

  if (fs.existsSync(envProdPath)) {
    const envProdContent = fs.readFileSync(envProdPath, 'utf8');
    const hasD1Mode = envProdContent.includes('NEXT_PUBLIC_USE_D1=true');
    checks.push(check('NEXT_PUBLIC_USE_D1=true in .env.production', hasD1Mode));
  }

  // Summary
  log('\n📊 Summary', 'cyan');
  const passed = checks.filter(c => c).length;
  const total = checks.length;
  const failed = total - passed;

  log(`${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');

  if (failed > 0) {
    log(
      `\n⚠️  ${failed} configuration issue(s) found. See recommendations above.`,
      'yellow'
    );

    log('\nNext steps:', 'blue');
    log(
      '1. Review the CLOUDFLARE_PAGES_DEPLOYMENT.md for detailed setup instructions',
      'reset'
    );
    log(
      '2. Follow the "Add D1 Binding in Cloudflare Dashboard" section',
      'reset'
    );
    log(
      '3. Run: npm run build:pages && npm run deploy',
      'reset'
    );
    process.exit(1);
  } else {
    log('\n✅ All checks passed! Your D1 configuration looks good.', 'green');
    log(
      '\nYou can now deploy with: npm run deploy',
      'cyan'
    );
    process.exit(0);
  }
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  process.exit(1);
});
