#!/usr/bin/env node

/**
 * Transform webpages into Google Docs for documentation sync
 * Usage: node webpage-to-google-doc.js <url> [title] [folder_id]
 */

import { google } from 'googleapis';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Google Service Account Configuration
const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "f8ai-465903",
  private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  client_id: "101655712299195998813",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
};

// F8 Cannabis Workspace folder ID
const F8_WORKSPACE_FOLDER = '1O-ugKSoWtmUsiDGwXRQa-4j1eWWTm9JE';

class WebpageToGoogleDoc {
  constructor() {
    this.auth = null;
    this.docs = null;
    this.drive = null;
  }

  async initialize() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: SERVICE_ACCOUNT,
        scopes: [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      const authClient = await this.auth.getClient();
      this.docs = google.docs({ version: 'v1', auth: authClient });
      this.drive = google.drive({ version: 'v3', auth: authClient });

      console.log('✅ Google APIs initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google APIs:', error.message);
      return false;
    }
  }

  async fetchWebpage(url) {
    try {
      console.log(`📥 Fetching webpage: ${url}`);
      
      // Handle localhost URLs by converting to actual content
      if (url.includes('localhost') || url.includes('127.0.0.1') || !url.startsWith('http')) {
        // For local development, we'll read the built files or make local requests
        if (url.startsWith('/')) {
          url = `http://localhost:5000${url}`;
        }
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; F8AI Documentation Bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`✅ Fetched ${html.length} characters`);
      return html;
    } catch (error) {
      console.error('❌ Failed to fetch webpage:', error.message);
      throw error;
    }
  }

  parseHtmlContent(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove script tags, style tags, and navigation elements
    const unwantedElements = document.querySelectorAll('script, style, nav, header, footer, .sidebar, .navigation');
    unwantedElements.forEach(el => el.remove());

    const content = {
      title: '',
      sections: []
    };

    // Extract title
    const titleElement = document.querySelector('h1, title');
    content.title = titleElement ? titleElement.textContent.trim() : 'Untitled Document';

    // Extract main content sections
    const mainContent = document.querySelector('main, .main-content, .container, body');
    if (mainContent) {
      this.extractSections(mainContent, content.sections);
    }

    return content;
  }

  extractSections(element, sections) {
    const children = Array.from(element.children);
    let currentSection = null;

    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        // Start new section
        currentSection = {
          title: child.textContent.trim(),
          level: parseInt(tagName.substring(1)),
          content: []
        };
        sections.push(currentSection);
      } else if (currentSection) {
        // Add content to current section
        this.extractElementContent(child, currentSection.content);
      } else {
        // Create default section for content before first heading
        if (!sections.length || sections[0].title !== 'Introduction') {
          sections.unshift({
            title: 'Introduction',
            level: 2,
            content: []
          });
          currentSection = sections[0];
        }
        this.extractElementContent(child, currentSection.content);
      }
    }
  }

  extractElementContent(element, content) {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'p':
        const text = element.textContent.trim();
        if (text) {
          content.push({ type: 'paragraph', text });
        }
        break;

      case 'ul':
      case 'ol':
        const listItems = Array.from(element.querySelectorAll('li')).map(li => li.textContent.trim());
        if (listItems.length) {
          content.push({ 
            type: 'list', 
            ordered: tagName === 'ol',
            items: listItems 
          });
        }
        break;

      case 'table':
        const tableData = this.extractTableData(element);
        if (tableData.rows.length) {
          content.push({ type: 'table', ...tableData });
        }
        break;

      case 'div':
        // Recursively process div contents
        const children = Array.from(element.children);
        children.forEach(child => this.extractElementContent(child, content));
        break;

      default:
        const text = element.textContent.trim();
        if (text && text.length > 10) {
          content.push({ type: 'paragraph', text });
        }
    }
  }

  extractTableData(table) {
    const rows = [];
    const tableRows = table.querySelectorAll('tr');

    tableRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent.trim());
      if (cells.length) {
        rows.push(cells);
      }
    });

    return { rows };
  }

  async createGoogleDoc(content, title = null, folderId = F8_WORKSPACE_FOLDER) {
    try {
      const docTitle = title || content.title || 'Webpage Export';
      console.log(`📝 Creating Google Doc: ${docTitle}`);

      // Create the document
      const doc = await this.docs.documents.create({
        requestBody: {
          title: docTitle
        }
      });

      const documentId = doc.data.documentId;
      console.log(`✅ Created document: ${documentId}`);

      // Move to specified folder
      if (folderId) {
        await this.drive.files.update({
          fileId: documentId,
          addParents: folderId,
          removeParents: 'root'
        });
        console.log(`📁 Moved to folder: ${folderId}`);
      }

      // Build document content
      const requests = this.buildDocumentRequests(content);

      if (requests.length > 0) {
        await this.docs.documents.batchUpdate({
          documentId,
          requestBody: { requests }
        });
        console.log(`✅ Added ${requests.length} content elements`);
      }

      const docUrl = `https://docs.google.com/document/d/${documentId}`;
      console.log(`🔗 Document URL: ${docUrl}`);

      return {
        documentId,
        url: docUrl,
        title: docTitle
      };
    } catch (error) {
      console.error('❌ Failed to create Google Doc:', error.message);
      throw error;
    }
  }

  buildDocumentRequests(content) {
    const requests = [];
    let index = 1; // Start after title

    // Add sections
    for (const section of content.sections) {
      // Add section heading
      requests.push({
        insertText: {
          location: { index },
          text: `\n${section.title}\n`
        }
      });

      // Style the heading
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: index + 1,
            endIndex: index + 1 + section.title.length
          },
          textStyle: {
            fontSize: { magnitude: section.level <= 2 ? 16 : 14, unit: 'PT' },
            bold: true
          },
          fields: 'fontSize,bold'
        }
      });

      index += section.title.length + 2;

      // Add section content
      for (const item of section.content) {
        switch (item.type) {
          case 'paragraph':
            requests.push({
              insertText: {
                location: { index },
                text: `${item.text}\n\n`
              }
            });
            index += item.text.length + 2;
            break;

          case 'list':
            for (const listItem of item.items) {
              requests.push({
                insertText: {
                  location: { index },
                  text: `${item.ordered ? '1. ' : '• '}${listItem}\n`
                }
              });
              index += listItem.length + 3;
            }
            requests.push({
              insertText: {
                location: { index },
                text: '\n'
              }
            });
            index += 1;
            break;

          case 'table':
            // Simple table representation
            for (const row of item.rows) {
              const rowText = row.join(' | ');
              requests.push({
                insertText: {
                  location: { index },
                  text: `${rowText}\n`
                }
              });
              index += rowText.length + 1;
            }
            requests.push({
              insertText: {
                location: { index },
                text: '\n'
              }
            });
            index += 1;
            break;
        }
      }
    }

    return requests;
  }

  async transformWebpage(url, title = null, folderId = null) {
    try {
      // Initialize Google APIs
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Google APIs');
      }

      // Fetch and parse webpage
      const html = await this.fetchWebpage(url);
      const content = this.parseHtmlContent(html);

      // Create Google Doc
      const result = await this.createGoogleDoc(content, title, folderId);

      return result;
    } catch (error) {
      console.error('❌ Transformation failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node webpage-to-google-doc.js <url> [title] [folder_id]

Examples:
  # Convert local plan page
  node webpage-to-google-doc.js http://localhost:5000/plan "Formul8 Development Plan"
  
  # Convert dashboard
  node webpage-to-google-doc.js http://localhost:5000/dashboard "Formul8 Dashboard"
  
  # Convert external webpage
  node webpage-to-google-doc.js https://example.com "Example Page" folder_id_here
    `);
    process.exit(1);
  }

  const [url, title, folderId] = args;

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.error('   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    process.exit(1);
  }

  try {
    const transformer = new WebpageToGoogleDoc();
    const result = await transformer.transformWebpage(url, title, folderId);
    
    console.log('\n🎉 Transformation completed successfully!');
    console.log(`📄 Document: ${result.title}`);
    console.log(`🔗 URL: ${result.url}`);
    console.log(`📋 Document ID: ${result.documentId}`);
    
  } catch (error) {
    console.error('\n💥 Transformation failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { WebpageToGoogleDoc };