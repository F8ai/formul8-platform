import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

interface RegulationDocument {
  id: string;
  title: string;
  state: string;
  content: string;
  url: string;
  lastUpdated: string;
  section?: string;
}

interface GeneratedQA {
  question: string;
  answer: string;
  source: string;
  state: string;
  section: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category: string;
  confidence: number;
}

interface QAGenerationOptions {
  maxQuestions: number;
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'mixed';
  categories?: string[];
  states?: string[];
}

export class CorpusQAGenerator {
  private openai: OpenAI;
  private regulationsPath: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for QA generation');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.regulationsPath = path.join(process.cwd(), 'data', 'regulations');
  }

  async downloadRegulations(states?: string[]): Promise<RegulationDocument[]> {
    const targetStates = states || [
      'CA', 'CO', 'WA', 'OR', 'NV', 'AZ', 'MA', 'IL', 'NY', 'NJ', 
      'CT', 'MI', 'FL', 'PA', 'OH', 'MN', 'MD', 'DC', 'VT', 'ME'
    ];

    const regulations: RegulationDocument[] = [];
    
    // State-specific regulation URLs and patterns
    const regulationSources = {
      'CA': {
        urls: [
          'https://www.cdtfa.ca.gov/industry/cannabis.htm',
          'https://cannabis.ca.gov/laws-regulations/'
        ],
        title: 'California Cannabis Regulations'
      },
      'CO': {
        urls: [
          'https://sbg.colorado.gov/med-enforcement',
          'https://sbg.colorado.gov/retail-marijuana'
        ],
        title: 'Colorado Cannabis Regulations'
      },
      'WA': {
        urls: [
          'https://lcb.wa.gov/marijuana/laws-and-rules'
        ],
        title: 'Washington Cannabis Regulations'
      },
      'NY': {
        urls: [
          'https://cannabis.ny.gov/regulations'
        ],
        title: 'New York Cannabis Regulations'
      }
    };

    for (const state of targetStates) {
      try {
        if (regulationSources[state]) {
          console.log(`Downloading regulations for ${state}...`);
          
          for (const url of regulationSources[state].urls) {
            try {
              const content = await this.fetchRegulationContent(url);
              
              regulations.push({
                id: `${state}-${Date.now()}`,
                title: regulationSources[state].title,
                state,
                content,
                url,
                lastUpdated: new Date().toISOString()
              });
            } catch (error) {
              console.warn(`Failed to fetch ${url} for ${state}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${state}:`, error);
      }
    }

    // Save regulations to local storage
    await this.saveRegulations(regulations);
    
    return regulations;
  }

  private async fetchRegulationContent(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Formul8Bot/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extract text content from HTML (basic implementation)
      const textContent = html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return textContent.substring(0, 50000); // Limit content size
    } catch (error) {
      throw new Error(`Failed to fetch regulation content: ${error.message}`);
    }
  }

  private async saveRegulations(regulations: RegulationDocument[]): Promise<void> {
    try {
      await fs.mkdir(this.regulationsPath, { recursive: true });
      
      for (const regulation of regulations) {
        const filePath = path.join(this.regulationsPath, `${regulation.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(regulation, null, 2));
      }
      
      console.log(`Saved ${regulations.length} regulation documents`);
    } catch (error) {
      console.error('Error saving regulations:', error);
    }
  }

  async loadStoredRegulations(): Promise<RegulationDocument[]> {
    try {
      const files = await fs.readdir(this.regulationsPath);
      const regulations: RegulationDocument[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.regulationsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          regulations.push(JSON.parse(content));
        }
      }
      
      return regulations;
    } catch (error) {
      console.warn('No stored regulations found, will need to download');
      return [];
    }
  }

  async generateQuestionsFromCorpus(
    regulations: RegulationDocument[], 
    options: QAGenerationOptions
  ): Promise<GeneratedQA[]> {
    const generatedQAs: GeneratedQA[] = [];
    const questionsPerDocument = Math.ceil(options.maxQuestions / regulations.length);
    
    for (const regulation of regulations.slice(0, Math.ceil(options.maxQuestions / questionsPerDocument))) {
      try {
        console.log(`Generating questions for ${regulation.state} regulations...`);
        
        const documentQAs = await this.generateQAsFromDocument(regulation, questionsPerDocument, options);
        generatedQAs.push(...documentQAs);
        
        if (generatedQAs.length >= options.maxQuestions) {
          break;
        }
      } catch (error) {
        console.error(`Error generating QAs for ${regulation.id}:`, error);
      }
    }
    
    return generatedQAs.slice(0, options.maxQuestions);
  }

  private async generateQAsFromDocument(
    regulation: RegulationDocument, 
    count: number,
    options: QAGenerationOptions
  ): Promise<GeneratedQA[]> {
    // Split content into chunks for processing
    const chunks = this.splitContentIntoChunks(regulation.content, 3000);
    const qas: GeneratedQA[] = [];
    
    for (const chunk of chunks.slice(0, Math.ceil(count / chunks.length))) {
      try {
        const prompt = this.buildQAGenerationPrompt(chunk, regulation, options);
        
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert cannabis compliance specialist. Generate accurate, detailed questions and answers based on the provided regulatory content. Focus on practical compliance scenarios that cannabis operators would face."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        if (result.questions && Array.isArray(result.questions)) {
          for (const qa of result.questions) {
            qas.push({
              question: qa.question,
              answer: qa.answer,
              source: regulation.title,
              state: regulation.state,
              section: qa.section || 'General',
              difficulty: qa.difficulty || options.difficulty === 'mixed' ? this.randomDifficulty() : options.difficulty,
              category: qa.category || 'Compliance',
              confidence: qa.confidence || 0.8
            });
          }
        }
      } catch (error) {
        console.error('Error generating QA from chunk:', error);
      }
    }
    
    return qas;
  }

  private buildQAGenerationPrompt(
    content: string, 
    regulation: RegulationDocument, 
    options: QAGenerationOptions
  ): string {
    const categories = options.categories || [
      'Licensing', 'Manufacturing', 'Testing', 'Packaging', 'Distribution', 
      'Retail', 'Security', 'Taxation', 'Advertising', 'Record Keeping'
    ];
    
    return `
Based on the following ${regulation.state} cannabis regulation content, generate 3-5 high-quality question-answer pairs.

REGULATION CONTENT:
${content}

REQUIREMENTS:
- Focus on practical compliance scenarios
- Include specific regulatory requirements and deadlines
- Cover multiple aspects: ${categories.join(', ')}
- Difficulty level: ${options.difficulty}
- State: ${regulation.state}

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "What are the packaging requirements for cannabis products in ${regulation.state}?",
      "answer": "Detailed answer with specific requirements, deadlines, and citations",
      "section": "Packaging & Labeling",
      "category": "Packaging",
      "difficulty": "intermediate",
      "confidence": 0.9
    }
  ]
}

Generate questions that test:
1. Specific regulatory requirements
2. Compliance deadlines and procedures
3. Penalties and consequences
4. Application processes
5. Operational requirements
`;
  }

  private splitContentIntoChunks(content: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private randomDifficulty(): 'basic' | 'intermediate' | 'advanced' {
    const difficulties = ['basic', 'intermediate', 'advanced'] as const;
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  async saveGeneratedQAs(qas: GeneratedQA[], filename?: string): Promise<string> {
    const outputPath = path.join(process.cwd(), 'data', 'generated-qa');
    await fs.mkdir(outputPath, { recursive: true });
    
    const outputFile = filename || `cannabis-qa-${Date.now()}.json`;
    const filePath = path.join(outputPath, outputFile);
    
    await fs.writeFile(filePath, JSON.stringify({
      metadata: {
        generated: new Date().toISOString(),
        totalQuestions: qas.length,
        states: [...new Set(qas.map(qa => qa.state))],
        categories: [...new Set(qas.map(qa => qa.category))],
        difficulties: [...new Set(qas.map(qa => qa.difficulty))]
      },
      questions: qas
    }, null, 2));
    
    console.log(`Generated Q&A saved to: ${filePath}`);
    return filePath;
  }

  async generateCorpusBaseline(
    states?: string[], 
    maxQuestions: number = 100
  ): Promise<{ filePath: string; stats: any }> {
    console.log('Starting corpus-based Q&A generation...');
    
    // Download fresh regulations
    const regulations = await this.downloadRegulations(states);
    
    if (regulations.length === 0) {
      throw new Error('No regulations downloaded. Check internet connection and API access.');
    }
    
    // Generate questions
    const qas = await this.generateQuestionsFromCorpus(regulations, {
      maxQuestions,
      difficulty: 'mixed',
      categories: ['Licensing', 'Manufacturing', 'Testing', 'Packaging', 'Distribution', 'Retail']
    });
    
    // Save results
    const filePath = await this.saveGeneratedQAs(qas, 'cannabis-baseline-corpus.json');
    
    const stats = {
      totalRegulations: regulations.length,
      totalQuestions: qas.length,
      statesCovered: [...new Set(qas.map(qa => qa.state))],
      categoriesCovered: [...new Set(qas.map(qa => qa.category))],
      difficultyDistribution: {
        basic: qas.filter(qa => qa.difficulty === 'basic').length,
        intermediate: qas.filter(qa => qa.difficulty === 'intermediate').length,
        advanced: qas.filter(qa => qa.difficulty === 'advanced').length
      },
      averageConfidence: qas.reduce((sum, qa) => sum + qa.confidence, 0) / qas.length
    };
    
    return { filePath, stats };
  }
}

export const corpusQAGenerator = new CorpusQAGenerator();