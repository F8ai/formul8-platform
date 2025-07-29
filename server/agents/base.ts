import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface AgentResponse {
  agent: string;
  response: string;
  confidence: number;
  sources?: string[];
  metadata?: Record<string, any>;
  requiresHumanVerification?: boolean;
  mode: AgentMode;
  performanceMetrics?: {
    responseTime: number;
    tokenUsage: number;
    ragHits?: number;
    kbHits?: number;
  };
}

export interface VerificationResult {
  consensusReached: boolean;
  finalConfidence: number;
  discrepancies?: string[];
  recommendation: string;
}

export type AgentMode = 'voiceflow' | 'raw' | 'prompt' | 'prompt_rag' | 'prompt_rag_kb';

export interface AgentModeConfig {
  mode: AgentMode;
  name: string;
  description: string;
  systemPrompt?: string;
  voiceflowAgentId?: string;
  ragEnabled: boolean;
  kbEnabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  active: boolean;
}

export interface BaselinePerformance {
  mode: AgentMode;
  accuracy: number;
  confidence: number;
  responseTime: number;
  totalQueries: number;
  successfulQueries: number;
  lastUpdated: Date;
}

export abstract class BaseAgent {
  protected agentType: string;
  protected systemPrompt: string;
  protected modes: Map<AgentMode, AgentModeConfig> = new Map();
  protected baselinePerformance: Map<AgentMode, BaselinePerformance> = new Map();

  constructor(agentType: string, systemPrompt: string) {
    this.agentType = agentType;
    this.systemPrompt = systemPrompt;
    this.initializeModes();
  }

  protected initializeModes(): void {
    // Initialize default modes for each agent
    this.modes.set('raw', {
      mode: 'raw',
      name: 'Raw Mode',
      description: 'No system prompt, direct model response',
      ragEnabled: false,
      kbEnabled: false,
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
      active: true
    });

    this.modes.set('prompt', {
      mode: 'prompt',
      name: 'Prompt Mode',
      description: 'Uses system prompt only',
      systemPrompt: this.systemPrompt,
      ragEnabled: false,
      kbEnabled: false,
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
      active: true
    });

    this.modes.set('prompt_rag', {
      mode: 'prompt_rag',
      name: 'Prompt + RAG',
      description: 'Uses system prompt with RAG retrieval',
      systemPrompt: this.systemPrompt,
      ragEnabled: true,
      kbEnabled: false,
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
      active: true
    });

    this.modes.set('prompt_rag_kb', {
      mode: 'prompt_rag_kb',
      name: 'Prompt + RAG + KB',
      description: 'Uses system prompt with RAG and knowledge base',
      systemPrompt: this.systemPrompt,
      ragEnabled: true,
      kbEnabled: true,
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
      active: true
    });
  }

  // Set VoiceFlow mode configuration
  setVoiceFlowMode(voiceflowAgentId: string, config?: Partial<AgentModeConfig>): void {
    this.modes.set('voiceflow', {
      mode: 'voiceflow',
      name: 'VoiceFlow Mode',
      description: 'Uses VoiceFlow agent configuration',
      voiceflowAgentId,
      ragEnabled: false,
      kbEnabled: false,
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
      active: true,
      ...config
    });
  }

  // Get available modes
  getAvailableModes(): AgentModeConfig[] {
    return Array.from(this.modes.values()).filter(mode => mode.active);
  }

  // Get mode configuration
  getModeConfig(mode: AgentMode): AgentModeConfig | null {
    return this.modes.get(mode) || null;
  }

  // Update mode configuration
  updateModeConfig(mode: AgentMode, updates: Partial<AgentModeConfig>): void {
    const existing = this.modes.get(mode);
    if (existing) {
      this.modes.set(mode, { ...existing, ...updates });
    }
  }

  // Get baseline performance for a mode
  getBaselinePerformance(mode: AgentMode): BaselinePerformance | null {
    return this.baselinePerformance.get(mode) || null;
  }

  // Update baseline performance
  updateBaselinePerformance(mode: AgentMode, metrics: Partial<BaselinePerformance>): void {
    const existing = this.baselinePerformance.get(mode) || {
      mode,
      accuracy: 0,
      confidence: 0,
      responseTime: 0,
      totalQueries: 0,
      successfulQueries: 0,
      lastUpdated: new Date()
    };
    
    this.baselinePerformance.set(mode, { ...existing, ...metrics, lastUpdated: new Date() });
  }

  abstract processQuery(query: string, context?: Record<string, any>, mode?: AgentMode): Promise<AgentResponse>;

  protected async callOpenAI(prompt: string, mode: AgentMode = 'prompt', useJson = true): Promise<any> {
    const modeConfig = this.getModeConfig(mode);
    if (!modeConfig) {
      throw new Error(`Mode ${mode} not configured for agent ${this.agentType}`);
    }

    try {
      const messages = [];
      
      // Add system prompt if available
      if (modeConfig.systemPrompt && mode !== 'raw') {
        messages.push({ role: "system" as const, content: modeConfig.systemPrompt });
      }
      
      messages.push({ role: "user" as const, content: prompt });

      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: modeConfig.model,
        messages,
        ...(useJson && { response_format: { type: "json_object" as const } }),
        temperature: modeConfig.temperature,
        max_tokens: modeConfig.maxTokens,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const content = response.choices[0].message.content;
      const result = useJson ? JSON.parse(content || "{}") : content;

      // Add performance metrics
      if (typeof result === 'object') {
        result.performanceMetrics = {
          responseTime,
          tokenUsage: response.usage?.total_tokens || 0,
          ragHits: 0, // Will be updated by RAG implementation
          kbHits: 0   // Will be updated by KB implementation
        };
      }

      return result;
    } catch (error) {
      console.error(`Error in ${this.agentType} agent (${mode} mode):`, error);
      throw new Error(`Failed to process query with ${this.agentType} agent in ${mode} mode`);
    }
  }

  protected calculateConfidence(response: any): number {
    // Base confidence calculation - can be overridden by specific agents
    if (response.confidence) return Math.min(100, Math.max(0, response.confidence));
    
    // Simple heuristic based on response completeness
    const hasResponse = response.response && response.response.length > 10;
    const hasSources = response.sources && response.sources.length > 0;
    
    if (hasResponse && hasSources) return 85;
    if (hasResponse) return 70;
    return 50;
  }

  async verifyAgainstAgent(
    primaryResponse: AgentResponse, 
    verifyingAgent: BaseAgent, 
    originalQuery: string
  ): Promise<VerificationResult> {
    const verificationPrompt = `
      Verify the following response from a ${primaryResponse.agent} agent for the query: "${originalQuery}"
      
      Response to verify: ${primaryResponse.response}
      Confidence claimed: ${primaryResponse.confidence}%
      Mode used: ${primaryResponse.mode}
      
      As a ${verifyingAgent.agentType} expert, do you agree with this response? 
      Respond with JSON containing:
      {
        "agrees": boolean,
        "confidence": number (0-100),
        "discrepancies": string[] (list any issues found),
        "notes": "string (explanation of your assessment)"
      }
    `;

    try {
      const verification = await verifyingAgent.callOpenAI(verificationPrompt, 'prompt', true);
      
      const consensusReached = verification.agrees && 
        Math.abs(verification.confidence - primaryResponse.confidence) < 20;
      
      const finalConfidence = consensusReached 
        ? Math.min(primaryResponse.confidence, verification.confidence)
        : Math.max(0, Math.min(primaryResponse.confidence, verification.confidence) - 15);

      return {
        consensusReached,
        finalConfidence,
        discrepancies: verification.discrepancies || [],
        recommendation: consensusReached 
          ? "Response verified by cross-agent validation"
          : "Response requires human verification due to agent disagreement"
      };
    } catch (error) {
      console.error("Error in agent verification:", error);
      return {
        consensusReached: false,
        finalConfidence: Math.max(0, primaryResponse.confidence - 30),
        discrepancies: ["Verification process failed"],
        recommendation: "Human verification required due to technical issues"
      };
    }
  }

  // VoiceFlow integration method
  protected async callVoiceFlow(query: string, voiceflowAgentId: string): Promise<any> {
    // This would integrate with VoiceFlow API
    // For now, return a placeholder response
    return {
      response: `VoiceFlow response for ${this.agentType} agent`,
      confidence: 75,
      sources: [],
      mode: 'voiceflow' as AgentMode
    };
  }

  // RAG integration method
  protected async retrieveRAG(query: string): Promise<{ content: string; sources: string[] }> {
    // This would integrate with RAG system
    // For now, return placeholder
    return {
      content: `RAG content for query: ${query}`,
      sources: ['rag_source_1', 'rag_source_2']
    };
  }

  // Knowledge Base integration method
  protected async retrieveKB(query: string): Promise<{ content: string; sources: string[] }> {
    // This would integrate with Knowledge Base system
    // For now, return placeholder
    return {
      content: `KB content for query: ${query}`,
      sources: ['kb_source_1', 'kb_source_2']
    };
  }
}
