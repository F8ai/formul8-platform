# Submodule Port Configuration Updates

## Overview
This document summarizes the updates made to all Formul8 submodules to use the correct port configuration when running independently.

## Updated Submodules

### 1. **metabolomics-data** ✅
- **Port**: 3000 (Metabolomics Dashboard)
- **Files Updated**:
  - `dashboard/app.py` - Updated to use port 3000
  - `shared/port_config.py` - Central port configuration
  - `scripts/check_ports.py` - Port monitoring script
  - `docker-compose.yml` - Docker services with port mapping
- **Status**: ✅ Configured and running

### 2. **metabolomics-agent** ✅
- **Port**: 2005 (Metabolomics Agent)
- **Files Updated**:
  - `agent.py` - Main entry point with port configuration
  - `agent_config.yaml` - Agent configuration
  - `shared/port_config.py` - Port configuration
  - `base-agent/server.py` - Updated to use port 2000
  - `requirements.txt` - Updated dependencies
- **Status**: ✅ Configured, needs Flask installation

### 3. **base-agent** ✅
- **Port**: 2000 (Base Agent Template)
- **Files Updated**:
  - `base_agent.py` - Main entry point with port configuration
  - `shared/port_config.py` - Port configuration
  - `requirements.txt` - Added Flask and dependencies
- **Status**: ✅ Configured, needs Flask installation

## Port Assignments

| Submodule | Component | Port | Description | Status |
|-----------|-----------|------|-------------|--------|
| metabolomics-data | Dashboard | 3000 | Metabolic networks | ✅ Running |
| metabolomics-agent | Agent | 2005 | Gene interpretation | ✅ Configured |
| base-agent | Agent | 2000 | Agent template | ✅ Configured |

## Implementation Details

### Port Configuration System
- **Shared Configuration**: All submodules use `shared/port_config.py`
- **Environment Variables**: Support for `COMPONENT_PORT` variables
- **Fallback System**: Default ports if env vars not set
- **Health Checks**: `/health` endpoints for monitoring

### Agent Architecture
- **Base Agent**: Template for all agents with common functionality
- **Metabolomics Agent**: Specialized for gene interpretation and metabolic analysis
- **Flask APIs**: RESTful endpoints for agent interaction
- **Tool System**: Extensible tool framework for agent capabilities

### Startup Management
- **Agent Manager**: `start_agents.py` for managing multiple agents
- **Port Monitoring**: `check_ports.py` for status checking
- **Docker Support**: Complete containerization with port mapping

## Usage Examples

### Start Individual Agents
```bash
# Start base agent
cd base-agent && python3 base_agent.py

# Start metabolomics agent
cd metabolomics-agent && python3 agent.py

# Start metabolomics dashboard
cd metabolomics-data/dashboard && python3 app.py
```

### Start Multiple Agents
```bash
# Start specific agents
python3 start_agents.py --agents base_agent metabolomics_agent

# Start all agents
python3 start_agents.py --all

# List available agents
python3 start_agents.py --list
```

### Check Port Status
```bash
# Check all ports
cd metabolomics-data && python3 scripts/check_ports.py

# Check specific port
lsof -i :2005
```

## Dependencies

### Base Agent Requirements
```
flask>=2.3.0
requests>=2.31.0
pyyaml>=6.0
```

### Metabolomics Agent Requirements
```
flask>=2.3.0
requests>=2.31.0
pyyaml>=6.0
langchain>=0.1.0
langchain-community>=0.0.10
openai>=1.0.0
networkx>=3.0
pandas>=2.0.0
```

## API Endpoints

### Base Agent (Port 2000)
- `GET /` - Main page with agent info
- `GET /health` - Health check
- `POST /api/query` - Process queries
- `GET /api/stats` - Agent statistics
- `GET /api/tools` - Available tools

### Metabolomics Agent (Port 2005)
- `GET /health` - Health check
- `POST /api/query` - Process queries
- `POST /api/analyze_genome` - Genome analysis
- `POST /api/analyze_network` - Network analysis
- `POST /api/annotate_genes` - Gene annotation
- `GET /api/stats` - Agent statistics

### Metabolomics Dashboard (Port 3000)
- `GET /` - Main dashboard
- `GET /api/network/<species>` - Network data
- `GET /api/metrics/<species>` - Network metrics
- `GET /api/plantcyc/<species>` - PlantCyc data
- `GET /api/plantcyc/goals` - PlantCyc goals

## Next Steps

### Immediate Actions
1. **Install Dependencies**: Run `pip install -r requirements.txt` in each agent directory
2. **Test Agents**: Start agents individually to verify functionality
3. **Test Integration**: Verify agents can communicate with each other
4. **Update Other Agents**: Apply same pattern to remaining agents

### Future Enhancements
1. **Service Discovery**: Implement agent discovery and registration
2. **Load Balancing**: Add load balancers for high availability
3. **Monitoring**: Add comprehensive monitoring and alerting
4. **Authentication**: Add authentication and authorization

## Benefits Achieved

✅ **Independent Operation**: Each submodule can run independently with correct ports  
✅ **No Conflicts**: Unique port assignments prevent conflicts  
✅ **Scalable Architecture**: Easy to add new agents and dashboards  
✅ **Centralized Configuration**: Shared port configuration across all components  
✅ **Monitoring Ready**: Built-in health checks and status reporting  
✅ **Docker Ready**: Complete containerization support  
✅ **Environment Flexible**: Support for environment variables  

All submodules are now configured to use the correct ports when running independently! 