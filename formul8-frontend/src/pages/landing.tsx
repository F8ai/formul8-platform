import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
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
              onClick={() => window.location.href = '/design'}
              className="border-formul8-primary text-formul8-primary hover:bg-formul8-primary hover:text-white text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">View Design</span>
              <span className="sm:hidden">Design</span>
            </Button>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/api/login'}
              className="formul8-button-secondary text-xs sm:text-sm px-2 sm:px-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold formul8-text-gradient mb-4 sm:mb-6">
            AI-Powered Cannabis Operations Platform
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-formul8-text-secondary mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Leverage multi-agent AI orchestration with proprietary datasets and expert system logic. 
            Our Agent-to-Agent Verification layer ensures production-ready answers for cannabis operators 
            across cultivation, processing, manufacturing, and retail.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="formul8-button-primary px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started with Formul8
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.location.href = '/agents'}
              className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-2 border-formul8-primary text-formul8-primary hover:bg-formul8-primary hover:text-white transition-all duration-300"
            >
              Explore Agent Backend
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-formul8-text-primary mb-12">
            Specialized AI Agents for Every Cannabis Operation
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="formul8-card border-2 hover:border-formul8-primary hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-formul8-primary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-white text-xl"></i>
                </div>
                <CardTitle className="text-formul8-text-primary">Compliance Agent</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Up-to-date regulatory guidance across jurisdictions, SOP verification, and compliance risk alerts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="formul8-card border-2 hover:border-formul8-info hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-formul8-info rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-copyright text-white text-xl"></i>
                </div>
                <CardTitle className="text-formul8-text-primary">Patent/Trademark Agent</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Freedom-to-operate searches, IP risk assessment, and infringement guidance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="formul8-card border-2 hover:border-formul8-tertiary hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-formul8-tertiary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-cogs text-white text-xl"></i>
                </div>
                <CardTitle className="text-formul8-text-primary">Operations & Equipment</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Yield calculations, equipment troubleshooting, and operational optimization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="formul8-card border-2 hover:border-formul8-warning hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-formul8-warning rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-flask text-white text-xl"></i>
                </div>
                <CardTitle className="text-formul8-text-primary">Formulation Agent</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Chemistry-backed formulation recommendations, ratios, and product development.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="formul8-card border-2 hover:border-formul8-secondary hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-formul8-secondary rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shopping-cart text-white text-xl"></i>
                </div>
                <CardTitle className="text-formul8-text-primary">Sourcing Agent</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Equipment and material sourcing with vendor recommendations and quality scoring.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="formul8-card border-2 hover:border-formul8-success hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-formul8-success rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-bullhorn text-white text-xl"></i>
                </div>
                <CardTitle className="text-formul8-text-primary">Marketing Agent</CardTitle>
                <CardDescription className="text-formul8-text-secondary">
                  Compliant marketing content creation and market feasibility analysis.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Verification Section */}
      <section className="px-6 py-16 bg-formul8-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-formul8-text-primary mb-8">
            Agent-to-Agent Verification System
          </h2>
          <p className="text-lg text-formul8-text-secondary mb-8 leading-relaxed">
            Our unique verification layer has multiple specialized agents interact, validate each other's outputs, 
            and generate refined, consensus-based answers. This minimizes hallucinations and ensures 
            production-ready responses for critical business decisions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="formul8-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-formul8-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <CardTitle className="text-formul8-text-primary">Generate</CardTitle>
                <CardDescription className="text-formul8-text-secondary">Primary agent processes your query with expert knowledge</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="formul8-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-formul8-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <CardTitle className="text-formul8-text-primary">Verify</CardTitle>
                <CardDescription className="text-formul8-text-secondary">Secondary agents cross-validate the response for accuracy</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="formul8-card">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-formul8-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <CardTitle className="text-formul8-text-primary">Consensus</CardTitle>
                <CardDescription className="text-formul8-text-secondary">Refined answer delivered with confidence scoring</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-formul8-surface-dark text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-formul8-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F8</span>
            </div>
            <span className="text-xl font-bold">Formul8</span>
          </div>
          <p className="text-formul8-text-muted">
            Transforming cannabis operations with AI-powered expertise
          </p>
        </div>
      </footer>
    </div>
  );
}
