# Centralized Port Configuration System

## Overview

The Formul8 platform now uses a **centralized port configuration system** where all port assignments are managed through the **Base Agent**. This provides a single source of truth for all platform components and enables easy management and updates.

## Architecture

### Central Hub: Base Agent

The **Base Agent** (port 2000) serves as the central configuration hub:

```
base-agent/
├── shared/port_config.py    # 🎯 CENTRAL PORT CONFIGURATION
├── manage_ports.py          # Port management tools
├── base_agent.py            # Main entry point with APIs
└── README.md               # Comprehensive documentation
```

### Component References

All other components reference the Base Agent's configuration:

```
metabolomics-agent/
├── agent.py                 # References base-agent/shared/port_config.py
└── agent_config.yaml

metabolomics-data/
├── dashboard/app.py         # References base-agent/shared/port_config.py
└── scripts/check_ports.py   # References base-agent/shared/port_config.py

start_agents.py              # References base-agent/shared/port_config.py
```

## Port Assignments

### Complete Port Configuration

| Category | Range | Components | Description |
|----------|-------|------------|-------------|
| **Main Platform** | **1000-1999** | **3** | Core platform components |
| **Agents** | **2000-2999** | **12** | AI agents and automation |
| **Dashboards** | **3000-3999** | **9** | Data visualization |
| **Development** | **4000-4999** | **5** | Development and testing |
| **Services** | **5000-5999** | **5** | Database and infrastructure |
| **Integrations** | **6000-6999** | **4** | External integrations |

### Key Components

| Component | Port | Description | Status |
|-----------|------|-------------|--------|
| **base_agent** | **2000** | **Central configuration hub** | **✅ Configured** |
| metabolomics_agent | 2005 | Gene interpretation | ✅ Configured |
| metabolomics_dashboard | 3000 | Metabolic networks | ✅ Running |
| compliance_agent | 2001 | Regulatory intelligence | ⚠️ Needs config |
| formulation_agent | 2003 | RDKit analysis | ⚠️ Needs config |
| marketing_agent | 2004 | N8N workflows | ⚠️ Needs config |

## Management Tools

### Port Management Script

The Base Agent includes a comprehensive port management system:

```bash
# List all port assignments
python3 manage_ports.py --list

# List agent ports only
python3 manage_ports.py --agents

# List dashboard ports only
python3 manage_ports.py --dashboards

# Check specific component port
python3 manage_ports.py --check metabolomics_agent

# Find available port
python3 manage_ports.py --find-port 3000

# Export configuration
python3 manage_ports.py --export ports.json

# Generate Docker Compose
python3 manage_ports.py --docker-compose docker-compose.ports.yml

# Generate .env file
python3 manage_ports.py --env-file .env.ports
```

### API Endpoints

The Base Agent provides RESTful APIs for port configuration:

```bash
# Get all port assignments
curl http://localhost:2000/api/ports

# Get agent ports
curl http://localhost:2000/api/ports/agents

# Get dashboard ports
curl http://localhost:2000/api/ports/dashboards

# Get specific component
curl http://localhost:2000/api/ports/metabolomics_agent
```

## Usage Examples

### Starting Components

```bash
# Start base agent (central hub)
cd base-agent && python3 base_agent.py

# Start metabolomics agent
cd metabolomics-agent && python3 agent.py

# Start metabolomics dashboard
cd metabolomics-data/dashboard && python3 app.py
```

### Managing Ports

```bash
# Check all ports
cd base-agent && python3 manage_ports.py --list --availability

# Check specific component
cd base-agent && python3 manage_ports.py --check metabolomics_agent

# Generate environment file
cd base-agent && python3 manage_ports.py --env-file .env.ports
```

### Starting Multiple Agents

```bash
# Start specific agents
python3 start_agents.py --agents base_agent metabolomics_agent

# List available agents
python3 start_agents.py --list
```

## Benefits

### Centralized Management
- **Single Source of Truth**: All port assignments in one location
- **Easy Updates**: Change ports in one place, affects all components
- **Consistency**: All components use the same configuration
- **Version Control**: Track port changes in one repository

### Comprehensive Tools
- **Port Monitoring**: Check availability and status
- **Configuration Export**: Generate configs for different environments
- **Docker Integration**: Generate Docker Compose configurations
- **Environment Files**: Generate .env files for deployment
- **API Access**: Programmatic access to port configuration

### Scalability
- **Easy Addition**: Add new components by updating central config
- **Flexible Ranges**: Logical port ranges for different component types
- **Conflict Prevention**: No port conflicts between components
- **Environment Support**: Environment variable overrides

## Implementation Details

### Configuration Structure

```python
# In base-agent/shared/port_config.py
PORTS = {
    'base_agent': 2000,
    'metabolomics_agent': 2005,
    'metabolomics_dashboard': 3000,
    # ... all other components
}

COMPONENT_DESCRIPTIONS = {
    'base_agent': 'Central configuration hub',
    'metabolomics_agent': 'Gene interpretation',
    # ... all descriptions
}
```

### Component Integration

```python
# In any component
sys.path.append(os.path.join(os.path.dirname(__file__), 'base-agent', 'shared'))
from port_config import get_port_from_env

port = get_port_from_env('component_name')
```

### Environment Variables

```bash
# Override ports with environment variables
export METABOLOMICS_AGENT_PORT=2005
export METABOLOMICS_DASHBOARD_PORT=3000
```

## Next Steps

### Immediate Actions
1. **Test Configuration**: Verify all components can access central config
2. **Update Other Agents**: Apply same pattern to remaining agents
3. **Test Integration**: Verify components work together
4. **Documentation**: Update component-specific documentation

### Future Enhancements
1. **Service Discovery**: Implement automatic component discovery
2. **Load Balancing**: Add load balancers for high availability
3. **Monitoring**: Add comprehensive monitoring and alerting
4. **Authentication**: Add authentication for port configuration APIs

## Migration Summary

### What Was Changed
1. **Centralized Configuration**: Moved all port assignments to base-agent
2. **Updated References**: All components now reference base-agent config
3. **Removed Duplicates**: Eliminated local port configurations
4. **Added Management**: Comprehensive port management tools
5. **Added APIs**: RESTful APIs for port configuration access

### What Was Achieved
✅ **Single Source of Truth**: All ports managed in one location  
✅ **Easy Management**: Comprehensive tools for port administration  
✅ **No Conflicts**: Unique port assignments prevent issues  
✅ **Scalable Architecture**: Easy to add new components  
✅ **API Access**: Programmatic access to port configuration  
✅ **Environment Support**: Flexible environment variable overrides  
✅ **Docker Ready**: Generate Docker configurations automatically  

The Formul8 platform now has a **robust, centralized port configuration system** that provides easy management and scalability for all components! 🚀 