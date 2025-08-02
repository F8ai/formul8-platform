import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield,
  Beaker,
  Calculator,
  FlaskConical,
  AlertTriangle,
  FileText,
  Scale,
  DollarSign,
  MessageSquareText,
  Users,
  ShoppingCart,
  UserCheck
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-formul8-bg-dark">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo - Formul8.ai Molecular Style Logo */}
          <div className="mb-16">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <svg viewBox="0 0 80 80" className="w-full h-full">
                {/* Molecular structure inspired by the logo */}
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#19E6CC" />
                    <stop offset="50%" stopColor="#1AB7E6" />
                    <stop offset="100%" stopColor="#4A90E2" />
                  </linearGradient>
                </defs>
                {/* Molecular nodes */}
                <circle cx="40" cy="20" r="8" fill="url(#logoGradient)" />
                <circle cx="25" cy="45" r="6" fill="url(#logoGradient)" />
                <circle cx="55" cy="45" r="6" fill="url(#logoGradient)" />
                <circle cx="40" cy="60" r="5" fill="url(#logoGradient)" />
                {/* Molecular bonds */}
                <line x1="40" y1="28" x2="31" y2="39" stroke="url(#logoGradient)" strokeWidth="2" />
                <line x1="40" y1="28" x2="49" y2="39" stroke="url(#logoGradient)" strokeWidth="2" />
                <line x1="31" y1="51" x2="43" y2="55" stroke="url(#logoGradient)" strokeWidth="2" />
                <line x1="49" y1="51" x2="43" y2="55" stroke="url(#logoGradient)" strokeWidth="2" />
              </svg>
            </div>
            <div className="text-formul8-white text-3xl font-bold tracking-widest mb-2" style={{fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace'}}>
              FORMUL8.AI
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
            <span className="text-formul8-white">Your AI powered </span>
            <span className="bg-formul8-gradient-text bg-clip-text text-transparent">
              Cannabis OS.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-formul8-gray mb-12 max-w-3xl mx-auto leading-relaxed">
            Formul8.ai puts a PhD formulator, extraction wizard, processing engineer, SOP writer,
            compliance strategist, sourcing agent, analytical chemist, and marketer at your 
            fingertips—launch and process products 10× faster.
          </p>

          {/* CTA Button */}
          <Button 
            size="lg"
            onClick={() => window.location.href = '/'}
            className="bg-formul8-button-green hover:bg-formul8-green text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Try the Formul8 Preview - Click Here
          </Button>
        </div>
      </section>

      {/* Features Grid - All 12 Features from Homepage */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Row 1 */}
            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-success/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-formul8-success" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">State Compliance Engine</h3>
                <p className="text-formul8-gray text-sm">Expert Regulatory Assistance for all 50 states</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-primary/20 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-formul8-primary" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">QC Calculator Suite</h3>
                <p className="text-formul8-gray text-sm">Formulation, Yield, & More calculations</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-tertiary/20 flex items-center justify-center mb-4">
                  <FlaskConical className="w-6 h-6 text-formul8-tertiary" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Extraction Optimizer</h3>
                <p className="text-formul8-gray text-sm">Maximize cannabinoid recovery</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-info/20 flex items-center justify-center mb-4">
                  <Beaker className="w-6 h-6 text-formul8-info" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Formulation Designer</h3>
                <p className="text-formul8-gray text-sm">Rapid product iteration</p>
              </CardContent>
            </Card>

            {/* Row 2 */}
            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-warning/20 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-formul8-warning" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Stability Predictor</h3>
                <p className="text-formul8-gray text-sm">Shelf-life & aging models</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-teal/20 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-formul8-teal" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">GMP SOP Library</h3>
                <p className="text-formul8-gray text-sm">Auto-generated workflows</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-success/20 flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-formul8-success" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Margin Calculator</h3>
                <p className="text-formul8-gray text-sm">Live COGS tracking</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-error/20 flex items-center justify-center mb-4">
                  <ShoppingCart className="w-6 h-6 text-formul8-error" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Sourcing Marketplace</h3>
                <p className="text-formul8-gray text-sm">Get ingredients, equipment, and services in an instant</p>
              </CardContent>
            </Card>

            {/* Row 3 */}
            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-secondary/20 flex items-center justify-center mb-4">
                  <MessageSquareText className="w-6 h-6 text-formul8-secondary" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Compliant Copy</h3>
                <p className="text-formul8-gray text-sm">Regulatory checked marketing</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-warning/20 flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-formul8-warning" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Audit Trail Export</h3>
                <p className="text-formul8-gray text-sm">One-click compliance records</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-tertiary/20 flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-formul8-tertiary" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">User generated SOPs</h3>
                <p className="text-formul8-gray text-sm">SOPs from industry leaders</p>
              </CardContent>
            </Card>

            <Card className="bg-formul8-bg-card border-formul8-border p-6 hover:border-formul8-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-formul8-blue/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-formul8-blue" />
                </div>
                <h3 className="text-formul8-white font-semibold mb-2">Expert Chat</h3>
                <p className="text-formul8-gray text-sm">Multi-agent assistance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}