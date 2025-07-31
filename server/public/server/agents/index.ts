// export { scienceAgent } from "./science/science-agent";
export { complianceAgent } from "./compliance/compliance-agent";
export { formulationAgent } from "./formulation/formulation-agent";
export { marketingAgent } from "./marketing/marketing-agent";
export { operationsAgent } from "./operations/operations-agent";
export { patentAgent } from "./patent/patent-agent";
export { sourcingAgent } from "./sourcing/sourcing-agent";
export { spectraAgent } from "./spectra/spectra-agent";
// export { customerSuccessAgent } from "./customer-success/customer-success-agent";

export const ALL_AGENTS = {
  science: "scienceAgent",
  compliance: "complianceAgent", 
  formulation: "formulationAgent",
  marketing: "marketingAgent",
  operations: "operationsAgent",
  patent: "patentAgent",
  sourcing: "sourcingAgent",
  spectra: "spectraAgent",
  "customer-success": "customerSuccessAgent"
} as const;
