const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Helper to write data back to the React app
const portfolioJsonPath = path.join(__dirname, '..', 'portfolio-web', 'src', 'data', 'portfolio.json');

async function syncNotionData(token, pageId) {
  console.log('🔄 Connecting to Notion API...');
  
  if (!token || !pageId) {
    throw new Error('Missing NOTION_TOKEN or NOTION_PAGE_ID. Run "notion-connect configure" first.');
  }

  const notion = new Client({ auth: token });

  try {
    // 1. Fetch Page metadata
    console.log('📖 Fetching Notion page metadata...');
    const pageMetadata = await notion.pages.retrieve({ page_id: pageId });
    
    // 2. Fetch Child blocks of the page
    console.log('📂 Fetching page content blocks...');
    const blocksResponse = await notion.blocks.children.list({ block_id: pageId });
    const blocks = blocksResponse.results;

    console.log(`Found ${blocks.length} blocks. Reconstructing portfolio data...`);

    // Load existing data to merge properties
    let currentData = {};
    if (fs.existsSync(portfolioJsonPath)) {
      currentData = JSON.parse(fs.readFileSync(portfolioJsonPath, 'utf-8'));
    }

    // Set up placeholders
    let summary = '';
    let skills = { photography: [], videography: [], technical: [], software: [] };
    let experience = [];
    let gear = [];
    let contact = currentData.contact || { email: '', phone: '', location: '' };

    let currentSection = '';

    for (const block of blocks) {
      const type = block.type;
      
      // Get block text (works for paragraphs, headings, lists, etc.)
      let textContent = '';
      if (block[type]?.rich_text) {
        textContent = block[type].rich_text.map(t => t.plain_text).join('').trim();
      }

      const cleanText = textContent.toLowerCase().trim();

      // Section Dividers detection (headings or paragraphs ending with colon or matching keywords)
      if (
        type.startsWith('heading_') ||
        (type === 'paragraph' && (textContent.endsWith(':') || textContent.endsWith(' :') || 
         ['professional experience', 'software', 'technical + post-production', 'project highlights', 'contact', 'education'].includes(cleanText)))
      ) {
        const titleText = cleanText.replace(/:/g, '').trim();
        
        if (titleText.includes('summary') || titleText.includes('biography') || titleText.includes('about')) {
          currentSection = 'summary';
        } else if (titleText === 'core skills') {
          currentSection = 'skills';
        } else if (titleText === 'technical + post-production') {
          currentSection = 'technical';
        } else if (titleText === 'software') {
          currentSection = 'software';
        } else if (titleText === 'professional experience') {
          currentSection = 'experience';
        } else if (titleText === 'equipment') {
          currentSection = 'gear';
        } else if (titleText === 'contact') {
          currentSection = 'contact';
        } else {
          currentSection = '';
        }
        continue;
      }

      // Skip block if it's empty and not a structural block
      if (!textContent && type !== 'table' && type !== 'table_row') continue;

      // Handle Section Parsing
      if (currentSection === 'summary') {
        summary += (summary ? ' ' : '') + textContent;
      } 
      else if (currentSection === 'skills' && type === 'table') {
        // Fetch table rows recursively
        console.log('📊 Parsing Core Skills Table...');
        try {
          const rowsResponse = await notion.blocks.children.list({ block_id: block.id });
          const rows = rowsResponse.results;
          
          let parsedSkills = [];
          for (const row of rows) {
            if (row.type === 'table_row' && row.table_row?.cells) {
              // Extract text from cells
              const rowCells = row.table_row.cells.map(cell => 
                cell.map(t => t.plain_text).join('').trim()
              );
              parsedSkills.push(...rowCells);
            }
          }
          // Split core skills into photography and videography for layout
          const half = Math.ceil(parsedSkills.length / 2);
          skills.photography = parsedSkills.slice(0, half).filter(Boolean);
          skills.videography = parsedSkills.slice(half).filter(Boolean);
        } catch (e) {
          console.warn('⚠️ Could not parse Table rows:', e.message);
        }
      } 
      else if (currentSection === 'technical' && type === 'bulleted_list_item') {
        skills.technical.push(textContent);
      } 
      else if (currentSection === 'software' && type === 'bulleted_list_item') {
        skills.software.push(textContent);
      } 
      else if (currentSection === 'experience') {
        // Detect a new Experience entry (e.g. contains "—" separating role & company)
        if (type === 'paragraph' && (textContent.includes('—') || textContent.includes('-'))) {
          const divider = textContent.includes('—') ? '—' : '-';
          const [role, comp] = textContent.split(divider);
          
          // Clean up parentheses from company
          const cleanCompany = comp ? comp.replace(/[()]/g, '').trim() : '';

          experience.push({
            role: role.trim(),
            company: cleanCompany,
            period: 'Active',
            responsibilities: [],
            highlights: []
          });
        }
        else if (type === 'paragraph' && textContent.startsWith('[') && experience.length > 0) {
          // Set period for last added experience
          experience[experience.length - 1].period = textContent.replace(/[\[\]]/g, '').trim();
        }
        else if (type === 'paragraph' && experience.length > 0) {
          // Treat general paragraph headings (like "Key responsibilities" or "International Assignment") as subheadings inside responsibilities
          experience[experience.length - 1].responsibilities.push(`**${textContent}**`);
        }
        else if (type === 'bulleted_list_item' && experience.length > 0) {
          experience[experience.length - 1].responsibilities.push(textContent);
        }
      } 
      else if (currentSection === 'gear') {
        if (type === 'bulleted_list_item') {
          // Parse gear details
          gear.push({
            name: textContent,
            type: textContent.includes('FX3') || textContent.includes('5D') ? 'Professional Camera' : 'Production Equipment',
            description: 'Professional video/photography gear asset.'
          });
        }
      } 
      else if (currentSection === 'contact' && type === 'paragraph') {
        if (cleanText.includes('email:')) {
          contact.email = textContent.split(':')[1]?.trim() || contact.email;
        } else if (cleanText.includes('mobile:') || cleanText.includes('phone:')) {
          contact.phone = textContent.split(':')[1]?.trim() || contact.phone;
        }
      }
    }

    // Merge skills and fall back to current values if any section is empty
    const finalSkills = {
      photography: skills.photography.length > 0 ? skills.photography : currentData.skills?.photography || [],
      videography: skills.videography.length > 0 ? skills.videography : currentData.skills?.videography || [],
      technical: skills.technical.length > 0 ? skills.technical : currentData.skills?.technical || [],
      software: skills.software.length > 0 ? skills.software : currentData.skills?.software || []
    };

    const updatedPortfolio = {
      ...currentData,
      summary: summary.trim() || currentData.summary,
      skills: finalSkills,
      experience: experience.length > 0 ? experience : currentData.experience,
      gear: gear.length > 0 ? gear : currentData.gear,
      contact: contact
    };

    // Save back to portfolio-web data
    fs.writeFileSync(portfolioJsonPath, JSON.stringify(updatedPortfolio, null, 2), 'utf-8');
    console.log('✅ Sync completed successfully!');
    console.log(`Updated file at: ${portfolioJsonPath}`);
    return updatedPortfolio;

  } catch (error) {
    console.error('❌ Error during Notion Synchronization:', error.message);
    throw error;
  }
}

module.exports = { syncNotionData };
