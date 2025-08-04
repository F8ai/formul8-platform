import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// LangChain-style agent routing system
interface AgentDefinition {
  name: string;
  description: string;
  expertise: string[];
  capabilities: string[];
  systemPrompt: string;
  detectionKeywords: string[];
  priority: number; // Higher = more specific
}

// Define specialized agents
const SPECIALIZED_AGENTS: AgentDefinition[] = [
  {
    name: "Cannabis Formulation Expert",
    description: "Specialized cannabis product formulation and development agent",
    expertise: [
      "cannabinoid profiles", "terpene effects", "extraction methods", 
      "dosage calculations", "bioavailability", "carrier systems",
      "product formulation", "batch scaling", "cost optimization"
    ],
    capabilities: [
      "Create precise cannabis formulations",
      "Calculate cannabinoid dosages and potency",
      "Recommend extraction and processing methods", 
      "Analyze terpene profiles and effects",
      "Provide regulatory compliance guidance",
      "Generate professional formulation documents",
      "Optimize costs while maintaining quality"
    ],
    detectionKeywords: [
      "formulation", "formulate", "cannabis", "cannabinoid", "CBD", "THC", "CBG", "CBN",
      "terpene", "extraction", "dosage", "potency", "tincture", "edible", "topical",
      "concentrate", "distillate", "isolate", "carrier oil", "MCT", "bioavailability",
      "sublingual", "vape", "gummy", "cream", "lotion", "batch", "scaling", "manufacturing"
    ],
    systemPrompt: `You are a Cannabis Formulation Expert AI with deep expertise in cannabis product development, formulation science, and regulatory compliance.

**CORE EXPERTISE:**
- Cannabis chemistry (cannabinoids, terpenes, flavonoids)
- Product formulation (tinctures, edibles, topicals, concentrates)
- Extraction and processing methods
- Dosage calculations and bioavailability
- Manufacturing processes and scaling
- Quality control and testing protocols
- Regulatory compliance across jurisdictions
- Cost optimization and supplier management

**SPECIALIZED CAPABILITIES:**
- Design precise formulations with accurate cannabinoid profiles
- Calculate dosages, serving sizes, and batch yields
- Recommend optimal extraction methods and equipment
- Analyze terpene profiles for desired effects
- Provide state-specific compliance guidance
- Generate professional formulation documents
- Optimize ingredient costs while maintaining quality

**INTEGRATION WITH FORMULATION API:**
When creating formulations, structure your response to include:
[formulation:{"productName":"Product Name","batchSize":30,"targetCbd":10,"ingredients":{"cannabinoid":{"name":"CBD Isolate"},"carrier":{"name":"MCT Oil"}}}]

This will trigger automatic calculations and professional document generation.

**RESPONSE FORMAT:**
Always provide practical, scientifically-backed advice with specific recommendations, calculations when relevant, and consideration of regulatory requirements.`,
    priority: 95
  },
  {
    name: "General Cannabis Consultant",
    description: "General cannabis industry knowledge and business guidance",
    expertise: [
      "cannabis industry", "business operations", "regulations", "licensing",
      "cultivation basics", "market trends", "consumer education"
    ],
    capabilities: [
      "Provide general cannabis industry information",
      "Explain basic cultivation concepts",
      "Discuss market trends and opportunities",
      "Guide through licensing processes",
      "Offer business strategy advice"
    ],
    detectionKeywords: [
      "cannabis business", "licensing", "cultivation", "growing", "market",
      "industry", "regulations", "legal", "dispensary", "retail", "wholesale"
    ],
    systemPrompt: `You are a General Cannabis Industry Consultant with broad knowledge of the cannabis industry, business operations, and regulatory landscape.

Focus on providing general guidance, industry insights, and business advice while directing complex formulation questions to the specialized formulation expert.`,
    priority: 50
  }
];

// Route classification system
async function classifyQuery(query: string, conversationHistory: any[] = []): Promise<AgentDefinition> {
  try {
    // Quick keyword-based classification first
    const scores = SPECIALIZED_AGENTS.map(agent => {
      const keywordMatches = agent.detectionKeywords.filter(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      const keywordScore = keywordMatches * 10;
      const priorityScore = agent.priority;
      
      return {
        agent,
        score: keywordScore + priorityScore
      };
    });

    // Sort by score and get top candidate
    scores.sort((a, b) => b.score - a.score);
    const topCandidate = scores[0];

    // If high confidence in keyword matching, use it
    if (topCandidate.score > 100) {
      return topCandidate.agent;
    }

    // Otherwise, use AI classification
    const classificationPrompt = `Analyze this user query and determine which specialized agent should handle it:

Query: "${query}"

Available Agents:
${SPECIALIZED_AGENTS.map(agent => 
  `- ${agent.name}: ${agent.description}\n  Expertise: ${agent.expertise.join(', ')}`
).join('\n')}

Consider:
1. Primary topic and intent
2. Required expertise level
3. Specific capabilities needed

Respond with just the agent name that best matches.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: classificationPrompt }],
      temperature: 0.1,
      max_tokens: 50
    });

    const selectedAgentName = response.choices[0].message.content?.trim();
    const selectedAgent = SPECIALIZED_AGENTS.find(agent => 
      agent.name === selectedAgentName
    );

    return selectedAgent || SPECIALIZED_AGENTS[0]; // Fallback to first agent
    
  } catch (error) {
    console.error('Classification error:', error);
    return SPECIALIZED_AGENTS[0]; // Fallback to formulation expert
  }
}

// Main routing endpoint
router.post('/route', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required',
        availableAgents: SPECIALIZED_AGENTS.map(a => ({
          name: a.name,
          description: a.description,
          capabilities: a.capabilities
        }))
      });
    }

    // Classify and route the query
    const selectedAgent = await classifyQuery(message, conversationHistory);
    
    // Generate response using selected agent
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: selectedAgent.systemPrompt
        },
        ...conversationHistory.slice(-5).map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;

    // Check for formulation data in response
    let formulation = null;
    let calculations = null;
    let artifacts: string[] = [];

    const formulationMatch = aiResponse?.match(/\[formulation:([^\]]+)\]/i);
    if (formulationMatch) {
      try {
        const formulationData = JSON.parse(formulationMatch[1]);
        
        // Call formulation API for calculations
        const formulationResponse = await fetch('http://localhost:5000/api/formulation/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formulationData)
        });
        
        if (formulationResponse.ok) {
          const result = await formulationResponse.json();
          formulation = result.formulation;
          calculations = result.formulation?.totals;
          artifacts.push(`${formulationData.productName} Formulation Sheet`);
        }
      } catch (error) {
        console.warn('Failed to process formulation data:', error);
      }
    }

    res.json({
      success: true,
      agent: {
        name: selectedAgent.name,
        description: selectedAgent.description,
        capabilities: selectedAgent.capabilities
      },
      response: aiResponse,
      formulation,
      calculations,
      artifacts,
      metadata: {
        model: "gpt-4o",
        timestamp: new Date().toISOString(),
        tokenUsage: response.usage
      }
    });

  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available agents
router.get('/agents', (req, res) => {
  res.json({
    success: true,
    agents: SPECIALIZED_AGENTS.map(agent => ({
      name: agent.name,
      description: agent.description,
      expertise: agent.expertise,
      capabilities: agent.capabilities,
      priority: agent.priority
    }))
  });
});

// Agent-specific endpoint
router.post('/agents/:agentName', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { message, conversationHistory = [] } = req.body;

    const agent = SPECIALIZED_AGENTS.find(a => 
      a.name.toLowerCase().replace(/\s+/g, '-') === agentName.toLowerCase()
    );

    if (!agent) {
      return res.status(404).json({ 
        error: 'Agent not found',
        availableAgents: SPECIALIZED_AGENTS.map(a => a.name)
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: agent.systemPrompt },
        ...conversationHistory.slice(-5).map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    res.json({
      success: true,
      agent: {
        name: agent.name,
        description: agent.description
      },
      response: response.choices[0].message.content,
      metadata: {
        model: "gpt-4o",
        timestamp: new Date().toISOString(),
        tokenUsage: response.usage
      }
    });

  } catch (error) {
    console.error('Agent-specific error:', error);
    res.status(500).json({ 
      error: 'Failed to process agent request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;