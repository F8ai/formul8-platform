import { Badge } from "@/components/ui/badge";

interface CostDisplayProps {
  cost: number;
  tokens?: number;
  variant?: "default" | "secondary" | "destructive" | "outline";
  showTokens?: boolean;
}

export function CostDisplay({ cost, tokens, variant = "secondary", showTokens = true }: CostDisplayProps) {
  const formatCost = (cost: number): string => {
    if (cost === 0) return "FREE";
    if (cost < 0.001) return `$${(cost * 1000).toFixed(3)}‰`; // Show in per-mille for very small costs
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens < 1000) return tokens.toString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
    return `${(tokens / 1000000).toFixed(1)}M`;
  };

  const costText = formatCost(cost);
  const tokenText = tokens ? formatTokens(tokens) : "";

  return (
    <Badge variant={cost === 0 ? "default" : variant} className="text-xs">
      {costText}
      {showTokens && tokens && tokens > 0 && (
        <span className="ml-1 opacity-75">
          ({tokenText} tokens)
        </span>
      )}
    </Badge>
  );
}

interface TokenBreakdownProps {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model?: string;
}

export function TokenBreakdown({ 
  inputTokens, 
  outputTokens, 
  totalTokens, 
  estimatedCost,
  model 
}: TokenBreakdownProps) {
  const formatTokens = (tokens: number): string => {
    if (tokens < 1000) return tokens.toString();
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
    return `${(tokens / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
      <div className="flex justify-between">
        <span>Input tokens:</span>
        <span>{formatTokens(inputTokens)}</span>
      </div>
      <div className="flex justify-between">
        <span>Output tokens:</span>
        <span>{formatTokens(outputTokens)}</span>
      </div>
      <div className="flex justify-between font-medium">
        <span>Total tokens:</span>
        <span>{formatTokens(totalTokens)}</span>
      </div>
      <div className="flex justify-between font-medium">
        <span>Estimated cost:</span>
        <CostDisplay cost={estimatedCost} showTokens={false} />
      </div>
      {model && (
        <div className="flex justify-between text-xs opacity-75">
          <span>Model:</span>
          <span>{model}</span>
        </div>
      )}
    </div>
  );
}