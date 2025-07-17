# GitHub Projects Integration Guide

## Overview

Formul8 uses GitHub Projects to enable agents to self-manage improvements and coordinate across the platform. Each component has its own project board for focused development.

## Project Structure

### 1. Individual Agent Projects (8 boards)
Each agent has its own project board for self-improvement:
- **Compliance Agent Improvement Board**
- **Marketing Agent Improvement Board** 
- **Formulation Agent Improvement Board**
- **Operations Agent Improvement Board**
- **Sourcing Agent Improvement Board**
- **Patent Agent Improvement Board**
- **Spectra Agent Improvement Board**
- **Customer Success Agent Improvement Board**

### 2. Orchestration Project
**Formul8 Agent Orchestration Board** - Coordinates multi-agent workflows:
- Cross-agent collaboration requests
- Multi-agent consensus issues
- Platform-wide improvements
- Agent ecosystem monitoring

### 3. Master Overview Project
**Formul8 Agent Platform Overview** - Executive visibility:
- High-level platform health
- Cross-project insights
- Strategic initiatives
- Performance dashboards

## Agent Self-Improvement Workflow

### 1. Performance Analysis
Agents automatically analyze their performance and create improvement tasks:

```typescript
// Agent analyzes its performance data
await agent.analyzeAndSuggestImprovements({
  averageResponseTime: 12000,
  averageConfidence: 75,
  successRate: 85,
  commonFailures: ['timeout errors', 'context parsing'],
  userFeedback: []
});
```

### 2. Task Creation
Agents create structured improvement tasks:

```typescript
await agent.createImprovementTask({
  title: 'Optimize response time',
  description: 'Current average response time is 12s. Target: <10s',
  type: 'performance',
  priority: 'high',
  estimatedEffort: 'medium'
});
```

### 3. Progress Tracking
Agents update their task progress:

```typescript
await agent.updateTaskProgress(issueNumber, {
  status: 'in-progress',
  notes: 'Implemented caching mechanism, testing performance impact',
  blockers: ['Need OpenAI API rate limit increase']
});
```

## Cross-Agent Collaboration

### Requesting Collaboration
Agents can request help from other agents:

```typescript
await complianceAgent.requestCollaboration('marketing', {
  title: 'Review advertising compliance',
  description: 'Need marketing agent to validate ad content against regulations',
  reason: 'Cross-verification required for high-risk content',
  priority: 'high'
});
```

### Orchestrator Reporting
Agents report important findings to the orchestrator:

```typescript
await agent.reportToOrchestrator({
  type: 'issue',
  title: 'Consensus failure in cross-agent verification',
  description: 'Multiple agents disagreeing on compliance assessment',
  priority: 'critical',
  requiresAction: true
});
```

## Project Board Configuration

### Custom Fields
Each project board includes these fields:
- **Priority**: Low, Medium, High, Critical
- **Type**: Performance, Accuracy, Feature, Bug
- **Effort**: Small (<1 day), Medium (1-3 days), Large (>3 days)
- **Agent**: Which agent owns the task
- **Status**: Backlog, In Progress, Testing, Done

### Labels
Standardized labels for issue management:
- `agent-improvement` - Self-improvement tasks
- `cross-agent-collaboration` - Multi-agent tasks
- `orchestration-report` - Reports to orchestrator
- `type-[performance|accuracy|feature|bug]` - Task type
- `priority-[low|medium|high|critical]` - Priority level
- `effort-[small|medium|large]` - Estimated effort
- `status-[backlog|in-progress|testing|completed]` - Current status

## Environment Variables

Set these for GitHub integration:

```bash
# GitHub API access
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
export GITHUB_OWNER="your-organization"

# Agent-specific repo (changes per agent)
export GITHUB_REPO="formul8-compliance-agent"

# Project IDs (obtained after setup)
export GITHUB_PROJECT_ID="PVT_xxxxxxxxx"
export ORCHESTRATION_PROJECT_ID="PVT_xxxxxxxxx"
```

## Automation Features

### GitHub Actions
Automatic project board updates based on:
- New issues with `agent-improvement` label → Add to agent's project
- Status update comments → Move cards between columns
- Cross-agent collaboration requests → Notify target agent
- Orchestration reports → Add to orchestration project

### Issue Templates
Standardized templates for:
- Agent improvement tasks
- Cross-agent collaboration requests
- Orchestration reports
- Bug reports and feature requests

## Monitoring and Analytics

### Agent Performance Metrics
Track across all projects:
- Task completion rate
- Average time to resolution
- Improvement impact on performance
- Cross-agent collaboration frequency

### Orchestration Insights
Monitor platform health:
- Multi-agent consensus success rate
- Cross-agent collaboration efficiency
- Platform-wide improvement trends
- Agent ecosystem balance

## Best Practices

### For Individual Agents
1. **Regular Performance Analysis**: Run weekly self-assessments
2. **Clear Task Descriptions**: Include specific success criteria
3. **Progress Updates**: Comment on tasks with meaningful updates
4. **Collaboration Requests**: Be specific about what help is needed

### For Orchestrator
1. **Monitor Cross-Agent Issues**: Watch for consensus failures
2. **Coordinate Improvements**: Ensure agents don't duplicate efforts
3. **Escalate Blockers**: Help resolve inter-agent conflicts
4. **Performance Oversight**: Track platform-wide metrics

### For Development Teams
1. **Review Agent Improvements**: Regularly check agent-generated tasks
2. **Validate Implementations**: Ensure agent improvements are effective
3. **Guide Strategic Direction**: Set priorities for agent development
4. **Monitor Resource Usage**: Track computational and API costs

## Getting Started

1. **Run Setup Scripts**:
   ```bash
   ./scripts/setup-github-repos.sh your-org
   ./scripts/setup-agent-projects.sh your-org
   ```

2. **Configure Environment Variables**: Set GitHub tokens and project IDs

3. **Customize Project Boards**: Add custom fields and views

4. **Test Agent Integration**: Verify agents can create and update issues

5. **Monitor Activity**: Watch for automated agent improvements

This GitHub Projects integration enables true agent autonomy while maintaining coordination and oversight across the entire Formul8 platform.