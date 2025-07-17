# Agent Repository Guide

## Individual Agent Architecture

Each agent in Formul8 is designed as an independent, modular component that can be developed, tested, and maintained separately. Here's how you can work with each agent individually:

## Agent File Structure

```
server/agents/
├── base.ts                    # Abstract base class for all agents
├── compliance.ts              # Compliance & regulatory guidance
├── formulation.ts             # Product development & chemistry
├── patent.ts                  # IP research & patent analysis
├── operations.ts              # Equipment & process optimization
├── sourcing.ts                # Vendor & procurement guidance
├── marketing.ts               # Compliant marketing & brand strategy
├── spectra.ts                 # CoA analysis & chromatography data
├── customer-success.ts        # Customer support & business intelligence
├── agent-manager.ts           # Agent configuration & management
└── langgraph-orchestrator.ts  # Multi-agent coordination
```

## Working with Individual Agents

### 1. Agent Development

Each agent file contains:
- **Class Definition**: Extends BaseAgent with specialized logic
- **System Prompt**: Cannabis industry-specific expertise and response format
- **Process Query Method**: Handles individual queries with context
- **Response Structure**: Structured JSON with confidence scoring

Example agent structure:
```typescript
export class ComplianceAgent extends BaseAgent {
  constructor() {
    super('compliance', `[Specialized system prompt]`);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    // Agent-specific processing logic
  }
}
```

### 2. Individual Agent Testing

You can test each agent in isolation:

**Direct API Testing:**
```bash
# Test specific agent
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What are THC limits for edibles in California?",
    "agentType": "compliance",
    "context": {"jurisdiction": "California", "productType": "edibles"}
  }'
```

**Frontend Testing:**
- Visit `/agents` to see all agents
- Click individual agent cards to go to `/agent/[agent-id]`
- Use the testing interface to send queries with context

### 3. Agent Customization

Each agent can be customized independently:

**System Prompt Modification:**
- Edit the constructor's system prompt for different expertise areas
- Add industry-specific knowledge or response formatting
- Modify confidence calculation logic

**Context Handling:**
- Add custom context fields for your use case
- Implement business-specific validation logic
- Integrate with external APIs or databases

**Response Processing:**
- Customize the response structure
- Add metadata fields for your application
- Implement custom confidence scoring

### 4. Agent Configuration

Using the Agent Manager system:

```typescript
// Add tools to specific agents
await agentManager.addToolToAgent('compliance', {
  id: 'regulation-api',
  name: 'Regulation Database API',
  type: 'api',
  config: {
    endpoint: 'https://api.regulations.gov',
    method: 'GET'
  }
});

// Update agent performance targets
await agentManager.updateAgent('compliance', {
  performanceTargets: {
    accuracyTarget: 95,
    responseTimeTarget: 2000,
    confidenceTarget: 85
  }
});
```

## Agent Specializations

### Compliance Agent (`server/agents/compliance.ts`)
- **Focus**: Regulatory guidance, SOP validation, compliance risk assessment
- **Context Fields**: jurisdiction, businessType, productType
- **Capabilities**: Multi-jurisdiction regulations, packaging requirements, testing compliance

### Formulation Agent (`server/agents/formulation.ts`)
- **Focus**: Product development, cannabinoid profiles, chemistry guidance
- **Context Fields**: productType, targetPotency, desiredEffect
- **Capabilities**: Recipe development, terpene blending, extraction methods

### Patent Agent (`server/agents/patent.ts`)
- **Focus**: IP research, freedom to operate analysis, patent searches
- **Context Fields**: innovationType, geography, technology
- **Capabilities**: Patent landscape analysis, trademark searches, IP infringement

### Operations Agent (`server/agents/operations.ts`)
- **Focus**: Equipment management, yield calculations, process optimization
- **Context Fields**: facilitySize, processingVolume, operationType
- **Capabilities**: Equipment sizing, process flow design, efficiency optimization

### Sourcing Agent (`server/agents/sourcing.ts`)
- **Focus**: Vendor recommendations, equipment sourcing, procurement guidance
- **Context Fields**: budget, equipment, timeline
- **Capabilities**: Vendor qualification, price analysis, procurement best practices

### Marketing Agent (`server/agents/marketing.ts`)
- **Focus**: Compliant marketing content, brand strategy, market analysis
- **Context Fields**: targetAudience, marketSegment, channels
- **Capabilities**: Compliant advertising, brand positioning, consumer education

### Spectra Agent (`server/agents/spectra.ts`)
- **Focus**: CoA analysis, chromatography data processing, testing compliance
- **Context Fields**: testType, jurisdiction, productType
- **Capabilities**: GCMS/HPLC analysis, cannabinoid profiling, contamination detection

### Customer Success Agent (`server/agents/customer-success.ts`)
- **Focus**: Customer support, sales enablement, business intelligence
- **Context Fields**: businessModel, customerSegment, challengeType
- **Capabilities**: Customer retention, sales optimization, support best practices

## Development Workflow

### 1. Local Development
```bash
# Start the development server
npm run dev

# The agent will be automatically loaded and available at:
# - API: http://localhost:5000/api/query
# - Frontend: http://localhost:5000/agents
```

### 2. Agent Modification
1. Edit the agent file in `server/agents/[agent-name].ts`
2. Modify system prompt, processing logic, or response structure
3. Test using the frontend interface or direct API calls
4. Changes are automatically reloaded in development

### 3. Adding New Capabilities
1. **Extend System Prompt**: Add new expertise areas
2. **Add Context Fields**: Support new input parameters
3. **Integrate External APIs**: Add tool configurations
4. **Custom Validation**: Implement business logic

### 4. Testing & Validation
- Use the benchmark suite in `server/testing/benchmark-suite.ts`
- Add custom test cases for your modifications
- Monitor performance metrics through the agent dashboard
- Validate responses using the cross-verification system

## Integration Examples

### Custom Business Logic
```typescript
// Add business-specific validation
async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
  // Pre-processing: validate business context
  if (context?.businessType === 'medical' && !context?.medicalLicense) {
    return {
      agent: this.agentType,
      response: "Medical cannabis operations require valid licensing information",
      confidence: 0,
      requiresHumanVerification: true
    };
  }

  // Standard processing
  const result = await this.callOpenAI(prompt, true);
  
  // Post-processing: add business metadata
  return {
    ...result,
    metadata: {
      ...result.metadata,
      businessValidation: 'passed',
      complianceLevel: this.calculateComplianceLevel(result)
    }
  };
}
```

### External API Integration
```typescript
// Integration with external compliance database
const complianceCheck = await fetch(`https://api.compliance-db.com/check`, {
  method: 'POST',
  headers: { 'Authorization': process.env.COMPLIANCE_API_KEY },
  body: JSON.stringify({ jurisdiction: context.jurisdiction, query })
});
```

## Best Practices

1. **Maintain Independence**: Each agent should work standalone
2. **Structured Responses**: Always return consistent JSON format
3. **Context Validation**: Validate input context for business rules
4. **Error Handling**: Implement robust error handling and fallbacks
5. **Performance Monitoring**: Track confidence scores and response times
6. **Documentation**: Document any customizations or business logic

## Deployment

Individual agents can be:
- **Tested Independently**: Using the agent detail pages
- **Deployed Separately**: Through the agent management system
- **Monitored Individually**: Via performance metrics dashboard
- **Updated Incrementally**: Without affecting other agents

This modular approach allows for flexible development, testing, and deployment of cannabis industry-specific AI capabilities.