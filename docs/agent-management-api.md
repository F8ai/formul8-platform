# Agent and Benchmark Management API Documentation

## Overview

The Formul8 platform provides comprehensive backend management for AI agents and benchmarks. This API allows you to define agents, configure tools, create custom benchmarks, and monitor detailed performance metrics in real-time.

## Agent Management APIs

### Agent Configuration

#### GET `/api/agents/management`
Get all agent configurations
```json
Response: [
  {
    "id": "agent_1234567890_abc123",
    "name": "Compliance Agent",
    "type": "compliance",
    "systemPrompt": "You are a cannabis compliance expert...",
    "model": "gpt-4o",
    "temperature": 0.3,
    "maxTokens": 2000,
    "tools": [...],
    "capabilities": ["regulatory-guidance", "sop-verification"],
    "restrictions": ["no-legal-advice"],
    "performanceTargets": {
      "accuracyTarget": 95,
      "responseTimeTarget": 30000,
      "confidenceTarget": 85
    },
    "verificationRules": {
      "requiresCrossVerification": true,
      "verifyingAgents": ["marketing"],
      "humanVerificationThreshold": 50
    },
    "active": true,
    "createdAt": "2025-01-11T18:00:00Z",
    "updatedAt": "2025-01-11T18:00:00Z"
  }
]
```

#### POST `/api/agents/management`
Create a new agent configuration
```json
Request Body: {
  "name": "Custom Formulation Agent",
  "type": "formulation",
  "systemPrompt": "You are an expert in cannabis formulation...",
  "model": "gpt-4o",
  "temperature": 0.2,
  "capabilities": ["cannabinoid-optimization", "terpene-profiling"],
  "restrictions": ["no-medical-claims"],
  "performanceTargets": {
    "accuracyTarget": 95,
    "responseTimeTarget": 35000,
    "confidenceTarget": 85
  },
  "verificationRules": {
    "requiresCrossVerification": true,
    "verifyingAgents": ["compliance", "patent"],
    "humanVerificationThreshold": 60
  }
}
```

#### PUT `/api/agents/management/:agentId`
Update an existing agent configuration
```json
Request Body: {
  "temperature": 0.4,
  "performanceTargets": {
    "accuracyTarget": 97,
    "responseTimeTarget": 25000
  }
}
```

#### DELETE `/api/agents/management/:agentId`
Delete an agent configuration

### Agent Performance Dashboard

#### GET `/api/agents/management/dashboard`
Get comprehensive performance overview
```json
Response: {
  "overview": {
    "totalAgents": 6,
    "activeAgents": 5,
    "totalQueries": 1250,
    "averageResponseTime": 28500,
    "overallSuccessRate": 94.2
  },
  "agentRankings": [
    {
      "agentId": "agent_1234567890_abc123",
      "name": "Compliance Agent",
      "performanceScore": 96.5,
      "successRate": 97.8,
      "averageResponseTime": 24000
    }
  ],
  "alertsAndIssues": [
    {
      "agentId": "agent_1234567890_def456",
      "type": "timeout",
      "message": "Response time (35000ms) exceeds target (30000ms)",
      "severity": "high"
    }
  ]
}
```

#### GET `/api/agents/management/:agentId/metrics`
Get detailed metrics for a specific agent
```json
Query Parameters:
- timeframe: "hour" | "day" | "week" | "month"

Response: {
  "agentId": "agent_1234567890_abc123",
  "timeframe": "day",
  "totalQueries": 45,
  "successfulResponses": 43,
  "averageResponseTime": 26500,
  "averageConfidence": 87.3,
  "averageAccuracy": 94.1,
  "toolUsage": {
    "regulatory-database": 25,
    "compliance-checker": 18
  },
  "errorRate": 4.4,
  "humanVerificationRate": 11.1,
  "crossVerificationSuccess": 89.5,
  "performanceScore": 94.2,
  "trends": {
    "responseTime": [25000, 27000, 26500, ...],
    "confidence": [86.2, 88.1, 87.3, ...],
    "accuracy": [93.5, 94.8, 94.1, ...],
    "errorRate": [0, 1, 0, ...]
  },
  "topQueries": [
    {
      "query": "California packaging requirements",
      "count": 8,
      "avgConfidence": 92.5
    }
  ],
  "lastUpdated": "2025-01-11T18:30:00Z"
}
```

## Tool Management APIs

### Agent Tools Configuration

#### POST `/api/agents/management/:agentId/tools`
Add a tool to an agent
```json
Request Body: {
  "id": "regulatory-database",
  "name": "Cannabis Regulatory Database",
  "description": "Real-time access to state cannabis regulations",
  "type": "api",
  "config": {
    "endpoint": "https://api.cannabis-regs.com/v1/lookup",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer ${API_KEY}",
      "Content-Type": "application/json"
    },
    "parameters": {
      "jurisdiction": "string",
      "category": "string"
    }
  },
  "enabled": true
}
```

#### PUT `/api/agents/management/:agentId/tools/:toolId`
Update a tool configuration
```json
Request Body: {
  "enabled": false,
  "config": {
    "endpoint": "https://api.cannabis-regs.com/v2/lookup"
  }
}
```

#### DELETE `/api/agents/management/:agentId/tools/:toolId`
Remove a tool from an agent

#### POST `/api/agents/management/:agentId/tools/:toolId/execute`
Execute a tool with parameters
```json
Request Body: {
  "parameters": {
    "jurisdiction": "california",
    "category": "packaging"
  }
}

Response: {
  "result": {
    "regulations": [...],
    "lastUpdated": "2025-01-11T12:00:00Z",
    "sources": ["California Code of Regulations Title 16"]
  }
}
```

## Benchmark Management APIs

### Benchmark Definitions

#### GET `/api/benchmarks/management`
Get all benchmark definitions
```json
Query Parameters:
- category: "accuracy" | "performance" | "safety" | "compliance" | "quality" | "custom"
- agentType: "compliance" | "patent" | "operations" | "formulation" | "sourcing" | "marketing"

Response: [
  {
    "id": "benchmark_1234567890_xyz789",
    "name": "Compliance Agent Core Tests",
    "description": "Essential compliance verification tests",
    "category": "compliance",
    "agentTypes": ["compliance"],
    "testCases": [...],
    "scoring": {
      "weights": {
        "accuracy": 0.4,
        "responseTime": 0.2,
        "confidence": 0.2,
        "safety": 0.1,
        "compliance": 0.1
      },
      "passingScore": 75,
      "perfectScore": 95,
      "penalties": {
        "timeoutPenalty": 20,
        "errorPenalty": 30,
        "safetyViolationPenalty": 50
      }
    },
    "schedule": {
      "frequency": "daily",
      "enabled": true,
      "lastRun": "2025-01-11T06:00:00Z",
      "nextRun": "2025-01-12T06:00:00Z"
    },
    "active": true,
    "createdBy": "user_123",
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-11T14:00:00Z"
  }
]
```

#### POST `/api/benchmarks/management`
Create a new benchmark
```json
Request Body: {
  "name": "Custom Safety Benchmark",
  "description": "Safety-focused testing for cannabis operations",
  "category": "safety",
  "agentTypes": ["operations", "formulation"],
  "scoring": {
    "weights": {
      "accuracy": 0.3,
      "responseTime": 0.1,
      "confidence": 0.2,
      "safety": 0.3,
      "compliance": 0.1
    },
    "passingScore": 80,
    "perfectScore": 98,
    "penalties": {
      "timeoutPenalty": 15,
      "errorPenalty": 25,
      "safetyViolationPenalty": 75
    }
  },
  "schedule": {
    "frequency": "weekly",
    "enabled": true
  },
  "active": true
}
```

### Test Case Management

#### POST `/api/benchmarks/management/:benchmarkId/tests`
Add a test case to a benchmark
```json
Request Body: {
  "name": "Extraction Safety Protocol",
  "query": "What safety protocols are required for butane hash oil extraction?",
  "expectedConfidence": {
    "min": 90,
    "max": 100
  },
  "expectedResponseTime": 30000,
  "weight": 9,
  "tags": ["safety", "extraction", "butane"],
  "expectedOutput": {
    "type": "contains",
    "value": "ventilation"
  },
  "validator": {
    "type": "javascript",
    "code": "return response.includes('safety') && response.includes('ventilation') && !response.includes('indoor');"
  }
}
```

#### PUT `/api/benchmarks/management/:benchmarkId/tests/:testCaseId`
Update a test case
```json
Request Body: {
  "expectedResponseTime": 25000,
  "weight": 10
}
```

### Benchmark Execution

#### POST `/api/benchmarks/management/:benchmarkId/run/:agentId`
Run a specific benchmark for an agent
```json
Response: {
  "message": "Benchmark execution started",
  "status": "running"
}
```

#### POST `/api/benchmarks/management/run-all/:agentId`
Run all applicable benchmarks for an agent
```json
Response: {
  "message": "All benchmarks execution started",
  "status": "running"
}
```

### Analytics and Reporting

#### GET `/api/benchmarks/management/:benchmarkId/analytics/:agentId`
Get detailed benchmark analytics
```json
Query Parameters:
- timeframe: "day" | "week" | "month" | "quarter"

Response: {
  "benchmarkId": "benchmark_1234567890_xyz789",
  "agentId": "agent_1234567890_abc123",
  "timeframe": "week",
  "trendData": {
    "dates": ["2025-01-05", "2025-01-06", "2025-01-07", ...],
    "scores": [87.5, 89.2, 91.1, ...],
    "accuracy": [85.0, 87.5, 89.0, ...],
    "responseTime": [28000, 26500, 25000, ...],
    "confidence": [86.2, 88.1, 90.5, ...]
  },
  "performance": {
    "averageScore": 89.3,
    "bestScore": 94.7,
    "worstScore": 81.2,
    "improvement": 8.7,
    "consistencyScore": 92.4
  },
  "regressions": [
    {
      "testCaseId": "test_123",
      "testName": "Multi-jurisdiction Query",
      "previousScore": 92.0,
      "currentScore": 85.5,
      "degradation": 6.5
    }
  ],
  "improvements": [
    {
      "testCaseId": "test_456",
      "testName": "Safety Protocol Check",
      "previousScore": 78.0,
      "currentScore": 88.5,
      "improvement": 10.5
    }
  ]
}
```

#### GET `/api/benchmarks/management/summary`
Get overall benchmark summary
```json
Response: {
  "totalBenchmarks": 12,
  "activeBenchmarks": 10,
  "totalTestCases": 156,
  "recentResults": [
    {
      "benchmarkName": "Compliance Agent Core Tests",
      "agentName": "Compliance Agent",
      "score": 94.2,
      "passed": true,
      "runAt": "2025-01-11T18:00:00Z"
    }
  ],
  "performanceOverview": {
    "averageScore": 89.7,
    "passRate": 87.3,
    "totalRuns": 342
  }
}
```

## Tool Types and Configurations

### API Tools
```json
{
  "type": "api",
  "config": {
    "endpoint": "https://api.example.com/endpoint",
    "method": "GET|POST|PUT|DELETE",
    "headers": {
      "Authorization": "Bearer token",
      "Content-Type": "application/json"
    },
    "parameters": {
      "param1": "value",
      "param2": "${dynamic_value}"
    }
  }
}
```

### Database Tools
```json
{
  "type": "database",
  "config": {
    "query": "SELECT * FROM regulations WHERE jurisdiction = ?",
    "parameters": ["jurisdiction"]
  }
}
```

### Calculation Tools
```json
{
  "type": "calculation",
  "config": {
    "formula": "yield = area * density * efficiency",
    "parameters": ["area", "density", "efficiency"],
    "outputUnit": "grams"
  }
}
```

### External Service Tools
```json
{
  "type": "external",
  "config": {
    "service": "third-party-api",
    "endpoint": "https://external-service.com/api",
    "authentication": "api_key"
  }
}
```

## Validator Types

### JavaScript Validators
```javascript
// Custom validation logic
return response.includes('required_term') && 
       confidence > 80 && 
       !response.includes('prohibited_term');
```

### AI Judge Validators
```json
{
  "type": "ai_judge",
  "prompt": "Evaluate if this response correctly addresses cannabis safety protocols. Rate 1-100."
}
```

### External API Validators
```json
{
  "type": "external_api",
  "endpoint": "https://validator-service.com/validate",
  "parameters": {
    "response": "${response}",
    "criteria": "safety_compliance"
  }
}
```

## Performance Monitoring

### Real-time Metrics
- Response time tracking (sub-second granularity)
- Confidence score distribution
- Error rate monitoring with automated alerts
- Tool usage analytics
- Cross-verification success rates

### Alerting System
- Performance degradation alerts
- Error rate threshold breaches
- Response time SLA violations
- Benchmark failure notifications
- Tool failure alerts

### Export Capabilities
- CSV export for all metrics
- JSON export for programmatic access
- Performance reports with visualizations
- Historical trend analysis
- Comparative agent performance reports

## Security and Access Control

All endpoints require authentication via the `isAuthenticated` middleware. Users can only:
- View and manage agents they have created
- Run benchmarks on agents they have access to
- Access metrics for authorized agents
- Configure tools within their permission scope

Rate limiting and usage quotas apply to prevent abuse of computational resources.