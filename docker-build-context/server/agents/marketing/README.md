# Marketing Agent

Cannabis marketing compliance, campaign optimization, and market intelligence agent.

## Features

- Platform-specific advertising rules (Google, Facebook, Instagram, TikTok)
- Creative workarounds for restrictive platforms
- Market size estimation via micro campaigns
- CPC analysis and budget optimization
- Alternative advertising strategies (wellness, lifestyle angles)
- Content moderation and policy navigation

## Files

- `agent.ts` - Main agent implementation
- `workflows/` - N8N workflow configurations
- `tests/` - Agent-specific test cases
- `docs/` - Documentation and examples

## Platform Strategies

### Restricted Platforms
- **Facebook/Instagram**: Focus on wellness, lifestyle, education. Avoid direct cannabis mentions.
- **Google Ads**: CBD wellness only. Use hemp, wellness, and natural health angles.

### Allowed Platforms
- **Weedmaps**: Direct cannabis advertising allowed. Full product showcasing.
- **Leafly**: Cannabis-specific platform. Education and product focus.

## Usage

```typescript
import { MarketingAgent } from './agent';

const agent = new MarketingAgent();
const response = await agent.processQuery(
  "What can I advertise on Facebook for my CBD wellness brand?",
  { platform: "facebook", productType: "CBD wellness" }
);
```