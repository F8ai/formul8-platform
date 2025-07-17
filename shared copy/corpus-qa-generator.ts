import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

interface CorpusDocument {
  id: string;
  title: string;
  domain: string; // compliance, formulation, marketing, etc.
  content: string;
  source: string;
  url?: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}

interface GeneratedQA {
  question: string;
  answer: string;
  source: string;
  domain: string;
  section: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category: string;
  confidence: number;
  tags: string[];
}

interface QAGenerationOptions {
  maxQuestions: number;
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'mixed';
  categories?: string[];
  domains?: string[];
  includeTags?: string[];
}

interface AgentCorpusConfig {
  domain: string;
  sources: {
    name: string;
    urls: string[];
    type: 'web' | 'api' | 'file';
    parser?: 'html' | 'pdf' | 'json' | 'xml';
  }[];
  categories: string[];
  questionTypes: string[];
  specialPrompts?: Record<string, string>;
}

export class BaseCorpusQAGenerator {
  private openai: OpenAI;
  private corpusPath: string;
  private agentConfig: AgentCorpusConfig;

  constructor(agentConfig: AgentCorpusConfig) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for QA generation');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.agentConfig = agentConfig;
    this.corpusPath = path.join(process.cwd(), 'data', 'corpus', agentConfig.domain);
  }

  async downloadCorpus(): Promise<CorpusDocument[]> {
    const documents: CorpusDocument[] = [];
    
    console.log(`📚 Downloading corpus for ${this.agentConfig.domain} agent...`);
    
    for (const source of this.agentConfig.sources) {
      try {
        console.log(`Fetching from ${source.name}...`);
        
        for (const url of source.urls) {
          try {
            const content = await this.fetchContent(url, source.type, source.parser);
            
            documents.push({
              id: `${this.agentConfig.domain}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: source.name,
              domain: this.agentConfig.domain,
              content,
              source: source.name,
              url,
              lastUpdated: new Date().toISOString(),
              metadata: {
                type: source.type,
                parser: source.parser
              }
            });
          } catch (error) {
            console.warn(`Failed to fetch ${url} from ${source.name}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error);
      }
    }

    await this.saveCorpus(documents);
    console.log(`✅ Downloaded ${documents.length} documents for ${this.agentConfig.domain}`);
    
    return documents;
  }

  private async fetchContent(url: string, type: string, parser?: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Formul8Bot/1.0)',
          'Accept': 'text/html,application/json,application/xml,*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const rawContent = await response.text();
      return this.parseContent(rawContent, parser || 'html');
    } catch (error) {
      throw new Error(`Failed to fetch content: ${error.message}`);
    }
  }

  private parseContent(content: string, parser: string): string {
    switch (parser) {
      case 'html':
        return content
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 50000); // Limit content size
      
      case 'json':
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return content;
        }
      
      case 'xml':
        return content
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      
      default:
        return content.substring(0, 50000);
    }
  }

  private async saveCorpus(documents: CorpusDocument[]): Promise<void> {
    try {
      await fs.mkdir(this.corpusPath, { recursive: true });
      
      for (const doc of documents) {
        const filePath = path.join(this.corpusPath, `${doc.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(doc, null, 2));
      }
      
      // Save corpus index
      const indexPath = path.join(this.corpusPath, 'index.json');
      await fs.writeFile(indexPath, JSON.stringify({
        domain: this.agentConfig.domain,
        totalDocuments: documents.length,
        lastUpdated: new Date().toISOString(),
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          source: doc.source,
          lastUpdated: doc.lastUpdated
        }))
      }, null, 2));
      
    } catch (error) {
      console.error('Error saving corpus:', error);
    }
  }

  async loadStoredCorpus(): Promise<CorpusDocument[]> {
    try {
      const files = await fs.readdir(this.corpusPath);
      const documents: CorpusDocument[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json') && file !== 'index.json') {
          const filePath = path.join(this.corpusPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          documents.push(JSON.parse(content));
        }
      }
      
      return documents;
    } catch (error) {
      console.warn(`No stored corpus found for ${this.agentConfig.domain}, will need to download`);
      return [];
    }
  }

  async generateQuestionsFromCorpus(
    documents: CorpusDocument[], 
    options: QAGenerationOptions
  ): Promise<GeneratedQA[]> {
    const generatedQAs: GeneratedQA[] = [];
    const questionsPerDocument = Math.ceil(options.maxQuestions / documents.length);
    
    console.log(`🧠 Generating ${options.maxQuestions} questions from ${documents.length} documents...`);
    
    for (const document of documents.slice(0, Math.ceil(options.maxQuestions / questionsPerDocument))) {
      try {
        console.log(`Processing: ${document.title}...`);
        
        const documentQAs = await this.generateQAsFromDocument(document, questionsPerDocument, options);
        generatedQAs.push(...documentQAs);
        
        if (generatedQAs.length >= options.maxQuestions) {
          break;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error generating QAs for ${document.id}:`, error);
      }
    }
    
    return generatedQAs.slice(0, options.maxQuestions);
  }

  private async generateQAsFromDocument(
    document: CorpusDocument, 
    count: number,
    options: QAGenerationOptions
  ): Promise<GeneratedQA[]> {
    const chunks = this.splitContentIntoChunks(document.content, 3000);
    const qas: GeneratedQA[] = [];
    
    for (const chunk of chunks.slice(0, Math.ceil(count / chunks.length))) {
      try {
        const prompt = this.buildAgentSpecificPrompt(chunk, document, options);
        
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: this.getAgentSystemPrompt()
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
              source: document.title,
              domain: this.agentConfig.domain,
              section: qa.section || 'General',
              difficulty: qa.difficulty || options.difficulty === 'mixed' ? this.randomDifficulty() : options.difficulty,
              category: qa.category || this.agentConfig.categories[0],
              confidence: qa.confidence || 0.8,
              tags: qa.tags || []
            });
          }
        }
      } catch (error) {
        console.error('Error generating QA from chunk:', error);
      }
    }
    
    return qas;
  }

  private getAgentSystemPrompt(): string {
    const domainPrompts = {
      compliance: "You are an expert cannabis compliance specialist. Generate accurate, detailed questions and answers based on regulatory content. Focus on practical compliance scenarios that cannabis operators would face.",
      
      formulation: "You are an expert cannabis formulation scientist. Generate technical questions about product development, extraction methods, molecular analysis, and chemical properties. Include RDKit and chemistry concepts.",
      
      marketing: "You are an expert cannabis marketing specialist. Generate questions about compliant marketing strategies, platform-specific advertising rules, brand development, and customer engagement in the cannabis industry.",
      
      operations: "You are an expert cannabis operations manager. Generate questions about facility management, inventory control, production workflows, quality assurance, and operational efficiency.",
      
      sourcing: "You are an expert cannabis sourcing specialist. Generate questions about supply chain management, vendor relationships, cost optimization, and procurement strategies.",
      
      patent: "You are an expert cannabis IP and patent specialist. Generate questions about intellectual property protection, patent research, trademark law, and cannabis-specific IP considerations.",
      
      science: "You are an expert cannabis researcher. Generate questions about scientific research, evidence analysis, study methodology, and cannabis science literature using PubMed and research databases.",
      
      spectra: "You are an expert cannabis testing specialist. Generate questions about spectral analysis, COA interpretation, GCMS data, quality control testing, and analytical chemistry.",
      
      "customer-success": "You are an expert cannabis customer success manager. Generate questions about customer support strategies, retention programs, feedback management, and client relationship building."
    };
    
    return domainPrompts[this.agentConfig.domain] || "You are a cannabis industry expert. Generate accurate, detailed questions and answers based on the provided content.";
  }

  private buildAgentSpecificPrompt(
    content: string, 
    document: CorpusDocument, 
    options: QAGenerationOptions
  ): string {
    const categories = options.categories || this.agentConfig.categories;
    const specialPrompt = this.agentConfig.specialPrompts?.[document.source] || '';
    
    return `
Based on the following ${this.agentConfig.domain} content, generate 3-5 high-quality question-answer pairs.

CONTENT SOURCE: ${document.source}
DOMAIN: ${this.agentConfig.domain}

CONTENT:
${content}

${specialPrompt}

REQUIREMENTS:
- Focus on ${this.agentConfig.domain}-specific scenarios and best practices
- Include practical applications and real-world examples
- Cover multiple aspects: ${categories.join(', ')}
- Difficulty level: ${options.difficulty}
- Question types: ${this.agentConfig.questionTypes.join(', ')}

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "What are the key requirements for [specific ${this.agentConfig.domain} topic]?",
      "answer": "Detailed answer with specific requirements, procedures, and best practices",
      "section": "Relevant Section Name",
      "category": "${categories[0]}",
      "difficulty": "${options.difficulty === 'mixed' ? 'intermediate' : options.difficulty}",
      "confidence": 0.9,
      "tags": ["tag1", "tag2"]
    }
  ]
}

Generate questions that test:
1. Core ${this.agentConfig.domain} knowledge and concepts
2. Practical application and implementation
3. Best practices and industry standards
4. Problem-solving and decision-making
5. Regulatory and compliance aspects (if applicable)
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
    const weights = [0.3, 0.5, 0.2]; // 30% basic, 50% intermediate, 20% advanced
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return difficulties[i];
      }
    }
    
    return 'intermediate';
  }

  async saveGeneratedQAs(qas: GeneratedQA[], filename?: string): Promise<string> {
    const outputPath = path.join(process.cwd(), 'data', 'generated-qa', this.agentConfig.domain);
    await fs.mkdir(outputPath, { recursive: true });
    
    const outputFile = filename || `${this.agentConfig.domain}-qa-${Date.now()}.json`;
    const filePath = path.join(outputPath, outputFile);
    
    const qaData = {
      metadata: {
        domain: this.agentConfig.domain,
        generated: new Date().toISOString(),
        totalQuestions: qas.length,
        sources: [...new Set(qas.map(qa => qa.source))],
        categories: [...new Set(qas.map(qa => qa.category))],
        difficulties: [...new Set(qas.map(qa => qa.difficulty))],
        averageConfidence: qas.reduce((sum, qa) => sum + qa.confidence, 0) / qas.length,
        tags: [...new Set(qas.flatMap(qa => qa.tags))]
      },
      questions: qas
    };
    
    await fs.writeFile(filePath, JSON.stringify(qaData, null, 2));
    
    console.log(`💾 Generated Q&A saved to: ${filePath}`);
    return filePath;
  }

  async generateCorpusBaseline(maxQuestions: number = 100): Promise<{ filePath: string; stats: any }> {
    console.log(`🚀 Starting corpus-based Q&A generation for ${this.agentConfig.domain}...`);
    
    // Try to load existing corpus, download if not available
    let documents = await this.loadStoredCorpus();
    
    if (documents.length === 0) {
      console.log('No existing corpus found, downloading fresh content...');
      documents = await this.downloadCorpus();
    }
    
    if (documents.length === 0) {
      throw new Error('No corpus documents available. Check internet connection and source URLs.');
    }
    
    // Generate questions
    const qas = await this.generateQuestionsFromCorpus(documents, {
      maxQuestions,
      difficulty: 'mixed',
      categories: this.agentConfig.categories
    });
    
    // Save results
    const filePath = await this.saveGeneratedQAs(qas, `${this.agentConfig.domain}-baseline-corpus.json`);
    
    const stats = {
      domain: this.agentConfig.domain,
      totalDocuments: documents.length,
      totalQuestions: qas.length,
      sourcesCovered: [...new Set(qas.map(qa => qa.source))],
      categoriesCovered: [...new Set(qas.map(qa => qa.category))],
      difficultyDistribution: {
        basic: qas.filter(qa => qa.difficulty === 'basic').length,
        intermediate: qas.filter(qa => qa.difficulty === 'intermediate').length,
        advanced: qas.filter(qa => qa.difficulty === 'advanced').length
      },
      averageConfidence: qas.reduce((sum, qa) => sum + qa.confidence, 0) / qas.length,
      uniqueTags: [...new Set(qas.flatMap(qa => qa.tags))]
    };
    
    return { filePath, stats };
  }
}

// Agent-specific configurations
export const AGENT_CORPUS_CONFIGS: Record<string, AgentCorpusConfig> = {
  compliance: {
    domain: 'compliance',
    sources: [
      {
        name: 'California Cannabis Control Commission',
        urls: [
          'https://cannabis.ca.gov/laws-regulations/',
          'https://www.cdtfa.ca.gov/industry/cannabis.htm'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Colorado Cannabis Regulations',
        urls: [
          'https://sbg.colorado.gov/med-enforcement',
          'https://sbg.colorado.gov/retail-marijuana'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Washington State Cannabis Regulations',
        urls: [
          'https://lcb.wa.gov/marijuana/laws-and-rules'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'New York Cannabis Regulations',
        urls: [
          'https://cannabis.ny.gov/regulations'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Licensing', 'Manufacturing', 'Testing', 'Packaging', 'Distribution', 'Retail', 'Security', 'Taxation', 'Advertising', 'Record Keeping'],
    questionTypes: ['regulatory requirements', 'compliance procedures', 'penalties', 'application processes', 'operational guidelines'],
    specialPrompts: {
      'California Cannabis Control Commission': 'Focus on California-specific requirements, Prop 64 implications, and state tax obligations.',
      'Colorado Cannabis Regulations': 'Emphasize Colorado\'s mature regulatory framework, tracking requirements, and local jurisdiction variations.'
    }
  },
  
  formulation: {
    domain: 'formulation',
    sources: [
      {
        name: 'PubChem Cannabis Compounds',
        urls: [
          'https://pubchem.ncbi.nlm.nih.gov/compound/2978',
          'https://pubchem.ncbi.nlm.nih.gov/compound/5280863'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Cannabis Chemistry Research',
        urls: [
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6326553/'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Molecular Analysis', 'Extraction Methods', 'Product Development', 'Chemical Properties', 'Stability Testing', 'Formulation Design'],
    questionTypes: ['molecular structure', 'extraction techniques', 'formulation challenges', 'stability analysis', 'potency calculations'],
    specialPrompts: {
      'PubChem Cannabis Compounds': 'Include SMILES notation, molecular weights, and chemical properties in questions.'
    }
  },
  
  marketing: {
    domain: 'marketing',
    sources: [
      {
        name: 'Cannabis Marketing Compliance Guide',
        urls: [
          'https://www.cannabisbusinesstimes.com/article/marketing-compliance/',
          'https://www.leafly.com/news/industry/cannabis-marketing-social-media-advertising'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Cannabis Industry Reports',
        urls: [
          'https://www.newcannabisventures.com/cannabis-industry-reports/',
          'https://mjbizdaily.com/research-reports/'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Platform Compliance', 'Brand Strategy', 'Content Marketing', 'Customer Acquisition', 'Advertising Restrictions', 'Social Media'],
    questionTypes: ['platform restrictions', 'compliant messaging', 'brand positioning', 'customer engagement', 'creative strategies'],
    specialPrompts: {
      'Cannabis Marketing Compliance Guide': 'Focus on platform-specific rules for Facebook, Instagram, Google Ads, and cannabis-specific platforms.'
    }
  },

  operations: {
    domain: 'operations',
    sources: [
      {
        name: 'Cannabis Business Operations Manual',
        urls: [
          'https://www.cannabisbusinesstimes.com/sections/operations/',
          'https://www.cannabis.ca.gov/licensees/manufacturing/'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'GMP Guidelines for Cannabis',
        urls: [
          'https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/current-good-manufacturing-practices-cgmps-food-and-dietary-supplements',
          'https://www.iso.org/standard/45324.html'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Facility Management', 'Production Planning', 'Quality Control', 'Inventory Management', 'Equipment Maintenance', 'Safety Protocols'],
    questionTypes: ['operational procedures', 'efficiency optimization', 'quality assurance', 'facility design', 'workflow management'],
    specialPrompts: {
      'Cannabis Business Operations Manual': 'Focus on cannabis-specific operational challenges, workflows, and best practices.'
    }
  },

  sourcing: {
    domain: 'sourcing',
    sources: [
      {
        name: 'Cannabis Supply Chain Management',
        urls: [
          'https://www.cannabisbusinesstimes.com/sections/supply-chain/',
          'https://mjbizdaily.com/chart-cannabis-supply-chain-participants/'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Cannabis Equipment Vendors',
        urls: [
          'https://www.mjbizdaily.com/cannabis-business-directory/',
          'https://www.cannabisbusinesstimes.com/buyer-guides/'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Vendor Management', 'Cost Optimization', 'Quality Assessment', 'Contract Negotiation', 'Risk Management', 'Sustainability'],
    questionTypes: ['vendor evaluation', 'cost analysis', 'procurement strategies', 'supply chain optimization', 'risk assessment'],
    specialPrompts: {
      'Cannabis Supply Chain Management': 'Focus on cannabis-specific sourcing challenges, vendor relationships, and cost optimization strategies.'
    }
  },

  patent: {
    domain: 'patent',
    sources: [
      {
        name: 'USPTO Cannabis Patent Database',
        urls: [
          'https://patents.uspto.gov/web/patents/patog/week52/TOC.htm',
          'https://appft.uspto.gov/netahtml/PTO/search-adv.html'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Cannabis IP Law Resources',
        urls: [
          'https://www.cannabis.ca.gov/licensees/intellectual-property/',
          'https://www.americanbar.org/groups/intellectual_property_law/publications/landslide/2019-20/january-february/cannabis-intellectual-property/'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Patent Research', 'Trademark Protection', 'Freedom to Operate', 'IP Strategy', 'Prior Art Analysis', 'Patent Prosecution'],
    questionTypes: ['patent landscape analysis', 'IP protection strategies', 'freedom to operate', 'prior art searches', 'trademark clearance'],
    specialPrompts: {
      'USPTO Cannabis Patent Database': 'Focus on cannabis-specific patent classifications, claim analysis, and IP protection strategies.'
    }
  },

  science: {
    domain: 'science',
    sources: [
      {
        name: 'PubMed Cannabis Research',
        urls: [
          'https://pubmed.ncbi.nlm.nih.gov/?term=cannabis',
          'https://pubmed.ncbi.nlm.nih.gov/?term=cannabinoid'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Cannabis Research Journals',
        urls: [
          'https://www.liebertpub.com/loi/can',
          'https://www.frontiersin.org/journals/plant-science/sections/plant-metabolism-and-chemodiversity'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Research Methods', 'Study Design', 'Evidence Analysis', 'Literature Review', 'Data Interpretation', 'Clinical Studies'],
    questionTypes: ['research methodology', 'study evaluation', 'evidence synthesis', 'statistical analysis', 'literature search'],
    specialPrompts: {
      'PubMed Cannabis Research': 'Focus on peer-reviewed cannabis research, study methodology, and evidence-based conclusions.'
    }
  },

  spectra: {
    domain: 'spectra',
    sources: [
      {
        name: 'Cannabis Testing Standards',
        urls: [
          'https://www.aoac.org/official-methods-of-analysis/cannabis/',
          'https://www.astm.org/products-services/standards-and-publications/standards/cannabis-standards.html'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Analytical Chemistry Resources',
        urls: [
          'https://pubs.acs.org/journal/ancham',
          'https://www.chromedia.org/chromedia/'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Spectral Analysis', 'COA Interpretation', 'Method Validation', 'Quality Control', 'Analytical Chemistry', 'Instrumentation'],
    questionTypes: ['spectral interpretation', 'method development', 'quality control procedures', 'analytical troubleshooting', 'instrument operation'],
    specialPrompts: {
      'Cannabis Testing Standards': 'Focus on cannabis-specific analytical methods, COA requirements, and testing protocols.'
    }
  },

  'customer-success': {
    domain: 'customer-success',
    sources: [
      {
        name: 'Customer Success Best Practices',
        urls: [
          'https://www.customersuccessassociation.com/library/',
          'https://blog.hubspot.com/service/what-does-a-customer-success-manager-do'
        ],
        type: 'web',
        parser: 'html'
      },
      {
        name: 'Cannabis Customer Engagement',
        urls: [
          'https://www.cannabisbusinesstimes.com/sections/retail/',
          'https://mjbizdaily.com/chart-cannabis-consumer-behavior-trends/'
        ],
        type: 'web',
        parser: 'html'
      }
    ],
    categories: ['Customer Retention', 'Support Strategies', 'Feedback Management', 'Relationship Building', 'Success Metrics', 'Training Programs'],
    questionTypes: ['retention strategies', 'support procedures', 'feedback analysis', 'relationship management', 'success measurement'],
    specialPrompts: {
      'Cannabis Customer Engagement': 'Focus on cannabis industry customer behavior, retention strategies, and compliance considerations.'
    }
  }
};

export function createCorpusQAGenerator(agentDomain: string): BaseCorpusQAGenerator {
  const config = AGENT_CORPUS_CONFIGS[agentDomain];
  if (!config) {
    throw new Error(`No corpus configuration found for agent domain: ${agentDomain}`);
  }
  return new BaseCorpusQAGenerator(config);
}