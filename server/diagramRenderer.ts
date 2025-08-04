import { getCachedDiagram, setCachedDiagram } from './diagramCache';

// Note: Mermaid is client-side only, so we'll use Kroki for server-side rendering of all diagrams

// Enhanced diagram type detection
function detectDiagramType(content: string): string | null {
  const cleanContent = content.trim().toLowerCase();
  
  // Enhanced Mermaid detection
  if (cleanContent.includes('graph td') || cleanContent.includes('graph lr') || 
      cleanContent.includes('sequencediagram') || cleanContent.includes('gantt') ||
      cleanContent.includes('pie title') || cleanContent.includes('journey') ||
      cleanContent.includes('classdiagram') || cleanContent.includes('statediagram') ||
      cleanContent.includes('gitgraph') || cleanContent.includes('flowchart td') ||
      cleanContent.includes('flowchart lr') || cleanContent.includes('mindmap') ||
      cleanContent.includes('timeline') || cleanContent.includes('quadrantchart')) {
    return 'mermaid';
  } else if (cleanContent.includes('@startuml') && cleanContent.includes('@enduml')) {
    return 'plantuml';
  } else if (cleanContent.includes('digraph') || cleanContent.includes('graph {')) {
    return 'graphviz';
  } else if (cleanContent.includes('blockdiag') || cleanContent.includes('seqdiag') || 
             cleanContent.includes('actdiag') || cleanContent.includes('nwdiag')) {
    return cleanContent.split(' ')[0]; // blockdiag, seqdiag, etc.
  } else if (cleanContent.includes('ditaa')) {
    return 'ditaa';
  } else if (cleanContent.includes('svgbob')) {
    return 'svgbob';
  } else if (cleanContent.includes('erd') || 
             (cleanContent.includes('[') && cleanContent.includes(']') && 
              (cleanContent.includes('1--*') || cleanContent.includes('*--1') || 
               cleanContent.includes('1--1') || cleanContent.includes('*--*')))) {
    return 'erd';
  } else if (cleanContent.includes('nomnoml')) {
    return 'nomnoml';
  } else if (cleanContent.includes('workspace ')) {
    return 'structurizr';
  }
  
  return null;
}

// Render diagram with caching
export async function renderDiagram(content: string, forceRecompute = false): Promise<{
  svg: string;
  type: string;
  cached: boolean;
} | null> {
  // Clean the content
  const cleanContent = content.trim()
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
  
  // Detect diagram type
  const diagramType = detectDiagramType(cleanContent);
  if (!diagramType) {
    return null;
  }
  
  // Check cache first (unless forced recompute)
  if (!forceRecompute) {
    const cachedSvg = await getCachedDiagram(cleanContent, diagramType);
    if (cachedSvg) {
      return {
        svg: cachedSvg,
        type: diagramType,
        cached: true
      };
    }
  }
  
  try {
    let diagramSvg = '';
    
    // Use Kroki.io for all diagram types including Mermaid (server-side rendering)
    const krokiResponse = await fetch(`https://kroki.io/${diagramType}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: cleanContent
    });
    
    if (!krokiResponse.ok) {
      throw new Error(`Kroki returned ${krokiResponse.status}: ${krokiResponse.statusText}`);
    }
    
    diagramSvg = await krokiResponse.text();
    
    // Cache the result
    await setCachedDiagram(cleanContent, diagramType, diagramSvg);
    
    return {
      svg: diagramSvg,
      type: diagramType,
      cached: false
    };
  } catch (error) {
    console.error(`Failed to render ${diagramType} diagram:`, error);
    throw error;
  }
}

// Precompute diagrams from document content
export async function precomputeDocumentDiagrams(content: string): Promise<{
  originalContent: string;
  processedContent: string;
  diagramCount: number;
  cacheHits: number;
}> {
  let processedContent = content;
  let diagramCount = 0;
  let cacheHits = 0;
  
  // Find all code blocks that might contain diagrams
  const codeBlockRegex = /```([^\n]*)\n([\s\S]*?)```/g;
  const matches = Array.from(content.matchAll(codeBlockRegex));
  
  for (const match of matches) {
    const [fullMatch, language, codeContent] = match;
    
    // Try to render as diagram
    try {
      const result = await renderDiagram(codeContent);
      if (result) {
        diagramCount++;
        if (result.cached) {
          cacheHits++;
        }
        
        // Replace code block with rendered diagram HTML
        const diagramHtml = `
<div class="my-6 p-4 bg-formul8-bg-dark border border-formul8-border rounded-lg">
  <div class="text-xs text-formul8-text-gray mb-3 flex items-center">
    <span class="bg-formul8-bg-light px-2 py-1 rounded">${result.type} Diagram${result.cached ? ' (Cached)' : ''}</span>
  </div>
  <div class="diagram-container flex justify-center overflow-x-auto">${result.svg}</div>
</div>`;
        
        processedContent = processedContent.replace(fullMatch, diagramHtml);
      }
    } catch (error) {
      console.warn(`Failed to precompute diagram:`, error);
      // Keep original code block if rendering fails
    }
  }
  
  return {
    originalContent: content,
    processedContent,
    diagramCount,
    cacheHits
  };
}