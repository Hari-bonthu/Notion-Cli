#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { syncNotionData } = require('./notion-client');

// Load environment variables from local .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

program
  .name('notion-connect')
  .description('A sleek CLI tool to sync your portfolio website data from Notion')
  .version('1.0.0');

program
  .command('configure')
  .description('Configure Notion API Token and Page ID credentials')
  .option('-t, --token <token>', 'Notion Integration API token (e.g. secret_...)')
  .option('-p, --page <pageId>', 'Notion Page ID containing the portfolio content')
  .action((options) => {
    let token = options.token || process.env.NOTION_TOKEN;
    let pageId = options.page || process.env.NOTION_PAGE_ID;

    if (!options.token && !options.page) {
      console.log('📝 Configuring notion-connect...');
      console.log('Please provide options to save configuration:');
      console.log('  node index.js configure --token <api_token> --page <page_id>');
      return;
    }

    let envContent = '';
    if (token) envContent += `NOTION_TOKEN=${token}\n`;
    if (pageId) envContent += `NOTION_PAGE_ID=${pageId}\n`;

    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ Configuration saved successfully to .env!');
    console.log(`Token: ${token ? '••••••••' + token.slice(-5) : 'Not configured'}`);
    console.log(`Page ID: ${pageId || 'Not configured'}`);
  });

program
  .command('status')
  .description('View current Notion connection settings and status')
  .action(() => {
    const token = process.env.NOTION_TOKEN;
    const pageId = process.env.NOTION_PAGE_ID;

    console.log('🔍 Checking connection status...');
    console.log(`Environment config: ${fs.existsSync(envPath) ? 'Found' : 'Not found'}`);
    console.log(`Notion Token: ${token ? 'Configured (secret_*****)' : 'Missing'}`);
    console.log(`Notion Page ID: ${pageId ? pageId : 'Missing'}`);

    if (token && pageId) {
      console.log('\nReady for sync! Run: node index.js sync');
    } else {
      console.log('\nTo configure, run: node index.js configure --token YOUR_TOKEN --page YOUR_PAGE_ID');
    }
  });

program
  .command('sync')
  .description('Sync Notion page blocks and update React portfolio-web JSON database')
  .action(async () => {
    const token = process.env.NOTION_TOKEN;
    const pageId = process.env.NOTION_PAGE_ID;

    if (!token || !pageId) {
      console.error('❌ Error: Credentials not found.');
      console.log('Configure first using: node index.js configure --token YOUR_TOKEN --page YOUR_PAGE_ID');
      process.exit(1);
    }

    try {
      await syncNotionData(token, pageId);
    } catch (err) {
      console.error('❌ Synchronization failed.');
      process.exit(1);
    }
  });

program.parse(process.argv);
