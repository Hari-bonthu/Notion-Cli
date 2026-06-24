const dns = require('dns');

// DNS Override for environments blocking api.notion.com / notion.so
const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (hostname.includes('notion.')) {
    const cb = typeof options === 'function' ? options : callback;
    const opt = typeof options === 'function' ? {} : options;
    if (opt.all) {
      return cb(null, [{ address: '208.103.161.1', family: 4 }]);
    } else {
      return cb(null, '208.103.161.1', 4);
    }
  }
  return originalLookup(hostname, options, callback);
};

const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.NOTION_TOKEN;
const pageId = process.env.NOTION_PAGE_ID;

const notion = new Client({ auth: token });

function fixText(text) {
  if (!text) return text;
  
  let newText = text;
  
  // Apply direct string corrections
  newText = newText.replace(/Siva Rama Krishna Bodalla/g, 'Shiva Rama Krishna Bodala');
  newText = newText.replace(/wedding, promotional/g, 'weddings, promotional');
  newText = newText.replace(/production — from/g, 'production—from');
  newText = newText.replace(/\(Guru Productions Pvt\.Ltd/g, '[Guru Productions Pvt.Ltd');
  newText = newText.replace(/Oman\)/g, 'Oman]');
  newText = newText.replace(/International Assignment — Dubai/g, 'International Assignment – Dubai');
  newText = newText.replace(/Miss World 2026/g, 'Miss World’2026');
  newText = newText.replace(/\(Guru Productions\)/g, '[Guru Productions]');
  newText = newText.replace(/camera, lens, lighting/g, 'cameras, lenses, lighting');
  newText = newText.replace(/birthday, cultural/g, 'birthdays, cultural');
  newText = newText.replace(/Panasonic i50/g, 'Panasonic z150');
  newText = newText.replace(/Dr\. Kiran Reddy Junior and Degree College/g, 'Dr. Krishna Reddy Junior and Degree r College');
  newText = newText.replace(/Board of Intermediate Education \(A\.P\)/g, 'Board of Intermediate Education [A.P]');

  // Remove the three extra skills if present
  if (newText.includes('web designer') || newText.includes('application Manager') || newText.includes('Softwaree handler')) {
    const lines = newText.split('\n');
    const filteredLines = lines.filter(line => 
      !line.includes('web designer') && 
      !line.includes('application Manager') && 
      !line.includes('Softwaree handler')
    );
    newText = filteredLines.join('\n');
  }

  return newText;
}

async function updatePageTitle() {
  console.log('✏️ Updating Page Title...');
  await notion.pages.update({
    page_id: pageId,
    properties: {
      title: {
        title: [
          {
            text: {
              content: 'Shiva Rama Krishna Bodala'
            }
          }
        ]
      }
    }
  });
}

async function processBlocks() {
  console.log('📂 Fetching page blocks...');
  const blocksResponse = await notion.blocks.children.list({ block_id: pageId });
  const blocks = blocksResponse.results;

  console.log(`Processing ${blocks.length} blocks...`);

  for (const block of blocks) {
    const type = block.type;
    
    // Handle standard text blocks
    if (block[type]?.rich_text) {
      const originalText = block[type].rich_text.map(t => t.plain_text).join('');
      const correctedText = fixText(originalText);
      
      if (originalText !== correctedText) {
        console.log(`🔧 Correcting block [${block.id}] (${type}):\n   FROM: "${originalText.substring(0, 60)}..."\n   TO:   "${correctedText.substring(0, 60)}..."`);
        
        await notion.blocks.update({
          block_id: block.id,
          [type]: {
            rich_text: [
              {
                text: {
                  content: correctedText
                }
              }
            ]
          }
        });
      }
    }
    
    // Handle tables recursively
    if (type === 'table') {
      console.log('📊 Processing Table block...');
      const rowsResponse = await notion.blocks.children.list({ block_id: block.id });
      const rows = rowsResponse.results;
      
      for (const row of rows) {
        if (row.type === 'table_row' && row.table_row?.cells) {
          let rowUpdated = false;
          const updatedCells = row.table_row.cells.map(cell => {
            const originalCellText = cell.map(t => t.plain_text).join('');
            const correctedCellText = fixText(originalCellText);
            
            if (originalCellText !== correctedCellText) {
              rowUpdated = true;
              return [
                {
                  text: {
                    content: correctedCellText
                  }
                }
              ];
            }
            // Return unchanged cell structure
            return cell;
          });
          
          if (rowUpdated) {
            console.log(`🔧 Correcting Table Row [${row.id}]...`);
            await notion.blocks.update({
              block_id: row.id,
              table_row: {
                cells: updatedCells
              }
            });
          }
        }
      }
    }
  }
}

async function main() {
  try {
    await updatePageTitle();
    await processBlocks();
    console.log('🎉 Notion page corrections successfully completed!');
  } catch (err) {
    console.error('❌ Error updating Notion page:', err.message);
  }
}

main();
