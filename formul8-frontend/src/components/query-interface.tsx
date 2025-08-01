import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function QueryInterface() {
  const [query, setQuery] = useState("");
  const [agentType, setAgentType] = useState("compliance");
  const [agentVerification, setAgentVerification] = useState(true);
  const [humanVerification, setHumanVerification] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/queries", data);
    },
    onSuccess: () => {
      toast({
        title: "Query Submitted",
        description: "Your query is being processed by the AI agents.",
      });
      setQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit query",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      content: query,
      agentType,
      requiresHumanVerification: humanVerification,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-formul8-dark mb-4">Ask the AI Agents</h3>
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-formul8-dark mb-2">
              Primary Agent
            </label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compliance">Compliance Agent</SelectItem>
                <SelectItem value="patent">Patent/Trademark Agent</SelectItem>
                <SelectItem value="operations">Operations & Equipment</SelectItem>
                <SelectItem value="formulation">Formulation Agent</SelectItem>
                <SelectItem value="sourcing">Sourcing Agent</SelectItem>
                <SelectItem value="marketing">Marketing Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Textarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[120px] resize-none" 
          placeholder="Ask about compliance requirements, formulations, sourcing, or any cannabis operation question..."
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agent-verification"
                checked={agentVerification}
                onCheckedChange={setAgentVerification}
              />
              <label htmlFor="agent-verification" className="text-sm text-formul8-gray">
                Agent-to-Agent Verification
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="human-verification"
                checked={humanVerification}
                onCheckedChange={setHumanVerification}
              />
              <label htmlFor="human-verification" className="text-sm text-formul8-gray">
                Human Verification
              </label>
            </div>
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-formul8-green hover:bg-formul8-light-green text-white"
          >
            {submitMutation.isPending ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fas fa-paper-plane mr-2"></i>
            )}
            Submit Query
          </Button>
        </div>
      </div>
    </div>
  );
}
