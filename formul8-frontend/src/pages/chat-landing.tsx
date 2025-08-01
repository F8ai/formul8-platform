import FormulaChatInterface from "@/components/FormulaChatInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-formul8-surface to-white">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-formul8-border bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-formul8-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">F8</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-formul8-text-primary">Formul8</h1>
              <p className="text-xs text-formul8-text-secondary hidden sm:block">AI Cannabis Consultant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/agents'}
              className="border-formul8-primary text-formul8-primary hover:bg-formul8-primary hover:text-white text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">Agent Backend</span>
              <span className="sm:hidden">Agents</span>
            </Button>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="formul8-button-secondary text-xs sm:text-sm px-2 sm:px-4"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left Sidebar - Info Panel */}
        <div className="lg:w-80 p-4 lg:p-6 bg-formul8-surface border-r border-formul8-border overflow-y-auto">
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="border-2 border-formul8-primary/20">
              <CardHeader>
                <CardTitle className="text-formul8-text-primary text-lg">Your AI Cannabis OS</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Multi-agent AI system with expert verification for cannabis operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-formul8-text-secondary mb-4">
                  Chat with specialized agents for compliance, formulation, operations, sourcing, patents, marketing, testing, and customer success.
                </p>
                <div className="text-xs text-formul8-text-muted">
                  <strong>Agent-to-Agent Verification:</strong> Responses are cross-validated by multiple experts for accuracy and consensus.
                </div>
              </CardContent>
            </Card>

            {/* Specialized Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-formul8-text-primary text-base">Available Experts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-primary rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">Compliance Strategist</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-warning rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">Formulation Specialist</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-info rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">IP Attorney</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-tertiary rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">Operations Engineer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-secondary rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">Sourcing Agent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-success rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">Marketing Strategist</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-formul8-error rounded-full"></div>
                    <span className="text-xs text-formul8-text-secondary">Analytical Chemist</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-formul8-text-primary text-base">Value Proposition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-formul8-text-secondary">Formul8.ai</span>
                    <span className="text-sm font-semibold text-formul8-primary">$5k-$50k/yr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-formul8-text-secondary">Traditional Staff</span>
                    <span className="text-sm font-semibold text-formul8-text-muted">$500k+/yr</span>
                  </div>
                  <div className="pt-2 border-t border-formul8-border">
                    <p className="text-xs text-formul8-success font-medium">97% cost reduction</p>
                    <p className="text-xs text-formul8-success font-medium">10× faster go-to-market</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col">
          <FormulaChatInterface />
        </div>
      </div>
    </div>
  );
}