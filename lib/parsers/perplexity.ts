import type { Conversation } from '@/types/conversation';
import { JSDOM } from 'jsdom';
import axios from 'axios';


/**
 * Extracts a Perplexity share page into a structured Conversation.
 * @param html - Raw HTML content from the Perplexity share page
 * @returns Promise resolving to a structured Conversation object
 */


/**
 * Extracts a Perplexity page into a structured Conversation.
 */



export async function parsePerplexity(html: string): Promise<Conversation> {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // 1. Inline styles from <link rel="stylesheet">
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  let combinedStyles = '';

  for (const link of links) {
    const href = link.getAttribute('href');
    if (href?.includes('perplexity.ai')) {
      try {
        const css = (await axios.get(href)).data;
        combinedStyles += `<style>${css}</style>\n`;
      } catch {
        console.warn(`Failed to fetch: ${href}`);
      }
    }
    link.remove();
  }

  // 2. Select all questions and responses
  const questionElems = Array.from(
    document.querySelectorAll('h1.group\\/query, div.group\\/query')
  );
  const responseElems = Array.from(
    document.querySelectorAll('div.prose')
  );

  // 3. Match Q&A pairs based on order
  let chat = '<div class="conversation">\n' + combinedStyles;

  const pairCount = Math.min(questionElems.length, responseElems.length);
  for (let i = 0; i < pairCount; i++) {
    const questionHTML = questionElems[i].outerHTML;
    const responseHTML = responseElems[i].outerHTML;

    chat += `
      <div class="qa-pair">
        <div class="user-question">${questionHTML}</div>
        <div class="ai-response">${responseHTML}</div>
      </div>\n`;
  }

  chat += '</div>';

  return {
    model: 'Perplexity',
    content: chat,
    scrapedAt: new Date().toISOString(),
    sourceHtmlBytes: html.length,
  };
}

// export async function parsePerplexity(html: string): Promise<Conversation> {
//   return {
//     model: 'Perplexity',
//     content: html,
//     scrapedAt: new Date().toISOString(),
//     sourceHtmlBytes: html.length,
//   };
// }
