# Formul8 Agent Submodules

This directory contains Git submodules for all Formul8 agents. Each agent is maintained in its own repository under the [F8ai organization](https://github.com/F8ai).

## Available Agents

- **compliance-agent** - Regulatory intelligence and legal automation
- **customer-success-agent** - Customer success and support automation
- **formulation-agent** - RDKit molecular analysis and formulation optimization
- **marketing-agent** - N8N workflows and marketing intelligence
- **metabolomics-agent** - Metabolomics data analysis and gene interpretation
- **operations-agent** - Operations and process automation
- **patent-agent** - Patent research and analysis
- **science-agent** - PubMed integration and evidence analysis
- **sourcing-agent** - Supply chain and sourcing optimization
- **spectra-agent** - Spectral analysis and interpretation

## Working with Submodules

### Initial Setup

If you're cloning this repository for the first time, use:

```bash
git clone --recurse-submodules https://github.com/F8ai/formul8-platform.git
```

Or if you've already cloned it:

```bash
git submodule update --init --recursive
```

### Updating Submodules

To update all submodules to their latest versions:

```bash
git submodule update --remote
```

To update a specific submodule:

```bash
git submodule update --remote agents/compliance-agent
```

### Making Changes

When working on an agent:

1. Navigate to the agent directory: `cd agents/compliance-agent`
2. Make your changes
3. Commit and push from within the agent directory
4. Return to the main repository and commit the submodule update

### Adding a New Agent

To add a new agent as a submodule:

```bash
git submodule add https://github.com/F8ai/new-agent.git agents/new-agent
```

### Removing an Agent

To remove an agent submodule:

```bash
git submodule deinit agents/agent-name
git rm agents/agent-name
git commit -m "Remove agent-name submodule"
```

## Repository URLs

- https://github.com/F8ai/compliance-agent
- https://github.com/F8ai/customer-success-agent
- https://github.com/F8ai/formulation-agent
- https://github.com/F8ai/marketing-agent
- https://github.com/F8ai/metabolomics-agent
- https://github.com/F8ai/operations-agent
- https://github.com/F8ai/patent-agent
- https://github.com/F8ai/science-agent
- https://github.com/F8ai/sourcing-agent
- https://github.com/F8ai/spectra-agent

## Development Workflow

1. Each agent can be developed independently in its own repository
2. Changes are integrated into the main platform through submodule updates
3. The main platform can specify exact versions of each agent for stability
4. CI/CD pipelines can be set up to test the integration of all agents

## Troubleshooting

If you encounter issues with submodules:

1. Check submodule status: `git submodule status`
2. Reinitialize submodules: `git submodule update --init --recursive`
3. Reset submodules: `git submodule foreach git reset --hard`
4. Clean and reinstall: `git submodule foreach git clean -fdx` 