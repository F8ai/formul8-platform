import { BaseAgent, type AgentResponse } from '../shared/base.js';

export class SpectraAgent extends BaseAgent {
  constructor() {
    super("spectra", `
You are the Spectra Agent, a specialized AI system for analyzing Certificate of Analysis (CoA) documents and chromatography data in the cannabis industry. You are an expert in:

1. CoA Document Processing:
   - Parsing and validating cannabis testing certificates
   - Extracting cannabinoid profiles, terpene data, contaminant results
   - Cross-referencing against regulatory compliance thresholds
   - Identifying discrepancies or quality issues

2. Chromatography Analysis (GCMS/HPLC):
   - Interpreting gas chromatography-mass spectrometry (GCMS) results
   - Analyzing high-performance liquid chromatography (HPLC) data
   - Peak identification and quantification validation
   - Method validation and accuracy assessment

3. Quality Control:
   - Batch consistency analysis across multiple CoAs
   - Contamination detection (pesticides, heavy metals, residual solvents, microbials)
   - Potency verification and stability trends
   - Testing method comparison and validation

4. Regulatory Compliance:
   - State-specific testing requirements validation
   - Pass/fail determination based on jurisdiction limits
   - Required testing panel verification
   - Label claim validation against CoA data

5. Data Interpretation:
   - Statistical analysis of testing results
   - Trend identification across batches or time periods
   - Outlier detection and investigation recommendations
   - Quality improvement suggestions

Always provide:
- Clear interpretation of analytical results
- Compliance status with specific regulations
- Actionable recommendations for quality improvement
- Confidence scores for your analysis
- Sources or reasoning for conclusions

Respond in JSON format with: response, confidence, sources, metadata, and requiresHumanVerification fields.
    `);
  }

  async processQuery(query: string, context?: Record<string, any>): Promise<AgentResponse> {
    const analysisPrompt = `
As the Spectra Agent specializing in Certificate of Analysis (CoA) processing and chromatography data analysis, please analyze this cannabis industry query:

Query: "${query}"

Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}

Based on your expertise in:
- CoA document processing and validation
- GCMS/HPLC chromatography analysis
- Cannabis testing regulatory compliance
- Quality control and batch analysis
- Analytical method validation

Provide a comprehensive response that includes:
1. Direct answer to the query
2. Relevant analytical considerations
3. Compliance implications if applicable
4. Quality control recommendations
5. Any data interpretation guidance needed

Consider factors like:
- State-specific testing requirements
- Method validation protocols
- Contamination limits and detection
- Cannabinoid/terpene profile analysis
- Statistical significance of results
- Laboratory accreditation standards

Respond with JSON containing:
{
  "response": "detailed analysis and recommendations",
  "confidence": confidence_score_0_to_100,
  "sources": ["relevant_analytical_methods", "regulatory_references"],
  "metadata": {
    "analysisType": "coa_processing|chromatography|compliance|quality_control",
    "regulatoryImplications": "description_of_compliance_considerations",
    "recommendedActions": ["specific_actionable_steps"],
    "dataQualityScore": score_if_analyzing_actual_data,
    "requiresLabVerification": boolean_if_lab_testing_needed
  },
  "requiresHumanVerification": boolean_for_complex_regulatory_or_safety_issues
}`;

    try {
      const result = await this.callOpenAI(analysisPrompt, true);
      
      // Validate and enhance the response
      const confidence = this.calculateConfidence(result);
      const enhancedResult = {
        ...result,
        confidence,
        agent: 'spectra',
        sources: result.sources || ['Internal CoA processing protocols', 'Chromatography analysis standards'],
        metadata: {
          ...result.metadata,
          analysisType: result.metadata?.analysisType || 'general',
          processingTimestamp: new Date().toISOString(),
        }
      };

      // Flag for human verification if dealing with regulatory compliance or safety issues
      if (query.toLowerCase().includes('contamination') || 
          query.toLowerCase().includes('fail') || 
          query.toLowerCase().includes('exceed') ||
          confidence < 75) {
        enhancedResult.requiresHumanVerification = true;
      }

      return enhancedResult;

    } catch (error) {
      console.error("Error in Spectra agent:", error);
      return {
        agent: 'spectra',
        response: "I encountered an error processing your CoA/analytical chemistry query. Please try rephrasing your question or contact support for complex analytical interpretations.",
        confidence: 0,
        sources: [],
        metadata: { error: error.message },
        requiresHumanVerification: true,
      };
    }
  }

  protected calculateConfidence(response: any): number {
    let confidence = super.calculateConfidence(response);
    
    // Boost confidence for analytical data processing
    if (response.metadata?.dataQualityScore) {
      confidence = Math.min(100, confidence + response.metadata.dataQualityScore * 0.2);
    }
    
    // Reduce confidence for complex regulatory interpretations
    if (response.metadata?.regulatoryImplications && 
        response.metadata.regulatoryImplications.length > 100) {
      confidence = Math.max(50, confidence - 10);
    }
    
    // High confidence for standard CoA processing tasks
    if (response.metadata?.analysisType === 'coa_processing' && 
        response.response.length > 200) {
      confidence = Math.min(100, confidence + 10);
    }
    
    return confidence;
  }
}