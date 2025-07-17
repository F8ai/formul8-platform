#!/usr/bin/env node

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

const org = "F8ai";
const agents = [
  "compliance-agent",
  "patent-agent", 
  "operations-agent",
  "formulation-agent",
  "sourcing-agent",
  "marketing-agent",
  "science-agent",
  "spectra-agent",
  "customer-success-agent"
];

async function fixDuplicatesAndAddComments() {
  console.log("🔧 Starting comprehensive duplicate cleanup and comment addition...");
  
  const summary = {
    totalDuplicatesClosed: 0,
    totalCommentsAdded: 0,
    processedAgents: 0,
    errors: []
  };

  for (const agent of agents) {
    console.log(`\n📋 Processing ${agent}...`);
    
    try {
      // Step 1: Get all issues for this agent
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: org,
        repo: agent,
        state: "all",
        per_page: 100
      });
      
      // Step 2: Find feature issues and group by title
      const featureIssues = issues.filter(issue => 
        issue.title.startsWith("Feature:")
      );
      
      console.log(`  Found ${featureIssues.length} feature issues`);
      
      const issueGroups = {};
      featureIssues.forEach(issue => {
        const title = issue.title;
        if (!issueGroups[title]) {
          issueGroups[title] = [];
        }
        issueGroups[title].push(issue);
      });
      
      // Step 3: Process duplicates
      for (const [title, issueList] of Object.entries(issueGroups)) {
        if (issueList.length > 1) {
          console.log(`  🔍 Processing ${issueList.length} duplicates for: ${title}`);
          
          // Sort by creation date (oldest first)
          issueList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          
          // Keep the first (oldest) one, close the rest
          const keepIssue = issueList[0];
          const duplicates = issueList.slice(1);
          
          console.log(`  ✅ Keeping issue #${keepIssue.number}`);
          
          // Close duplicates
          for (const duplicate of duplicates) {
            if (duplicate.state === "open") {
              console.log(`  🗑️  Closing duplicate #${duplicate.number}`);
              
              // Add comment explaining closure
              await octokit.rest.issues.createComment({
                owner: org,
                repo: agent,
                issue_number: duplicate.number,
                body: `🤖 **Duplicate Issue Cleanup**

This issue is a duplicate of #${keepIssue.number} and is being closed automatically.

The original issue #${keepIssue.number} remains open and active.

*This cleanup was performed by the Formul8 duplicate issue cleanup script.*`
              });
              
              // Close the duplicate
              await octokit.rest.issues.update({
                owner: org,
                repo: agent,
                issue_number: duplicate.number,
                state: "closed"
              });
              
              summary.totalDuplicatesClosed++;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Step 4: Add implementation comment to the kept issue
          try {
            // Check if implementation comment already exists
            const { data: comments } = await octokit.rest.issues.listComments({
              owner: org,
              repo: agent,
              issue_number: keepIssue.number
            });
            
            const hasImplementationComment = comments.some(comment => 
              comment.body && comment.body.includes('🔧 Detailed Implementation Approach')
            );
            
            if (!hasImplementationComment) {
              const implementationComment = generateImplementationComment(keepIssue.title, agent);
              
              await octokit.rest.issues.createComment({
                owner: org,
                repo: agent,
                issue_number: keepIssue.number,
                body: implementationComment
              });
              
              console.log(`  💬 Added implementation comment to #${keepIssue.number}`);
              summary.totalCommentsAdded++;
            } else {
              console.log(`  ✅ Implementation comment already exists for #${keepIssue.number}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`  ❌ Error adding comment to #${keepIssue.number}:`, error.message);
            summary.errors.push(`${agent}/#${keepIssue.number}: ${error.message}`);
          }
        }
      }
      
      summary.processedAgents++;
      console.log(`  ✅ ${agent} processing complete`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${agent}:`, error.message);
      summary.errors.push(`${agent}: ${error.message}`);
    }
    
    // Delay between agents
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n🎉 Comprehensive cleanup complete!");
  console.log(`📊 Summary:
  - Processed agents: ${summary.processedAgents}/${agents.length}
  - Duplicates closed: ${summary.totalDuplicatesClosed}
  - Comments added: ${summary.totalCommentsAdded}
  - Errors: ${summary.errors.length}`);
  
  if (summary.errors.length > 0) {
    console.log("\n❌ Errors encountered:");
    summary.errors.forEach(error => console.log(`  - ${error}`));
  }
}

function generateImplementationComment(featureTitle, agentName) {
  const featureName = featureTitle.replace('Feature: ', '');
  const agentType = agentName.replace('-agent', '');
  
  return `## 🔧 Detailed Implementation Approach

### Overview
Implement **${featureName}** for the ${agentType} agent with comprehensive cannabis industry considerations, regulatory compliance, and production-ready architecture.

### 📋 Implementation Steps

**1. Foundation Setup (Week 1-2)**

Set up core architecture and dependencies for ${featureName}

\`\`\`python
# Core agent setup with LangChain integration
from langchain.agents import initialize_agent, Tool
from langchain.memory import ConversationBufferWindowMemory
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS

class ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}Agent:
    def __init__(self):
        self.memory = ConversationBufferWindowMemory(k=10)
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = FAISS.load_local("./rag/vectorstore", self.embeddings)
        self.tools = self._initialize_tools()
        self.agent = initialize_agent(
            tools=self.tools,
            memory=self.memory,
            agent_type="conversational-react-description",
            verbose=True
        )
\`\`\`

**2. RAG Integration (Week 2-3)**

Implement Retrieval-Augmented Generation for domain-specific knowledge

\`\`\`python
def process_query(self, query: str, context: dict = None) -> dict:
    """Process user query with RAG-enhanced context"""
    # Retrieve relevant documents
    relevant_docs = self.vectorstore.similarity_search(query, k=5)
    
    # Enhance query with context
    enhanced_query = f"""
    Query: {query}
    
    Relevant Context:
    {chr(10).join([doc.page_content for doc in relevant_docs])}
    
    Cannabis Industry Considerations:
    - Regulatory compliance requirements
    - Industry-specific best practices
    - Risk mitigation strategies
    """
    
    return self.agent.run(enhanced_query)
\`\`\`

**3. Testing & Validation (Week 3-4)**

Comprehensive testing framework for ${featureName}

\`\`\`python
class TestSuite:
    def test_${featureName.toLowerCase().replace(/[^a-z0-9]/g, '_')}(self):
        """Test ${featureName} functionality"""
        test_cases = [
            # Basic functionality tests
            {"input": "basic test case", "expected": "pass"},
            # Edge case tests
            {"input": "edge case", "expected": "handled"},
            # Cannabis industry specific tests
            {"input": "compliance scenario", "expected": "compliant"}
        ]
        
        for test_case in test_cases:
            result = self.agent.process_query(test_case["input"])
            assert result["status"] == test_case["expected"]
\`\`\`

**4. Production Deployment (Week 4)**

Deploy to production with monitoring and logging

\`\`\`python
# Production configuration
PRODUCTION_CONFIG = {
    "rate_limits": {"requests_per_minute": 60},
    "monitoring": {"log_level": "INFO"},
    "security": {"require_auth": True},
    "performance": {"timeout": 30}
}
\`\`\`

### 🎯 Success Criteria
- **Accuracy**: ≥85% for domain-specific queries
- **Response Time**: <30 seconds for complex queries
- **Compliance**: 100% regulatory compliance verification
- **Integration**: Seamless integration with existing agent ecosystem
- **Documentation**: Complete API documentation and usage guides

### 📊 Testing Strategy
- **Unit Tests**: Core functionality validation
- **Integration Tests**: Cross-agent interaction testing
- **Performance Tests**: Load testing under realistic conditions
- **Compliance Tests**: Regulatory requirement verification
- **User Acceptance Tests**: Real-world scenario validation

### 🔗 Dependencies
- LangChain framework for agent orchestration
- OpenAI API for language model integration
- FAISS vectorstore for RAG implementation
- Cannabis industry regulatory databases
- Cross-agent communication protocols

### 📈 Performance Metrics
- **Baseline Quality**: Target 85% accuracy on domain questions
- **User Satisfaction**: >90% positive feedback
- **System Performance**: 99.9% uptime target
- **Cannabis Industry Compliance**: 100% regulatory adherence
- **Integration Success**: Seamless multi-agent workflows

### 🔄 Integration Points
- **Agent Memory System**: Conversation continuity across sessions
- **Cross-agent Verification**: Quality assurance through peer validation
- **Real-time Metrics**: Performance monitoring and alerting
- **Frontend Dashboard**: User-friendly interface integration
- **Cannabis Industry Standards**: Regulatory compliance verification

---
*Generated by Formul8 Implementation Planning System*
*Cannabis Industry Specialization: ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent*`;
}

// Run the comprehensive fix
fixDuplicatesAndAddComments().catch(console.error);