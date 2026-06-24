const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.NOTION_TOKEN;
const pageId = process.env.NOTION_PAGE_ID;

console.log('Token:', token ? 'Exists' : 'Missing');
console.log('Page ID:', pageId);

const notion = new Client({ auth: token });

async function main() {
  try {
    const blocksResponse = await notion.blocks.children.list({ block_id: pageId });
    const blocks = blocksResponse.results;
    
    console.log(`\n--- Fetched ${blocks.length} Blocks ---`);
    blocks.forEach((block, idx) => {
      const type = block.type;
      let text = '';
      if (block[type]?.rich_text) {
        text = block[type].rich_text.map(t => t.plain_text).join('');
      }
      console.log(`[Block ${idx+1}] Type: ${type} | Text: "${text}"`);
    });
  } catch (err) {
    console.error('Error fetching blocks:', err);
  }
}

main();
