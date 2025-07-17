import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Bot, 
  Users, 
  GitBranch, 
  MessageSquare, 
  Settings, 
  Activity,
  User,
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  FileText,
  Beaker,
  FlaskConical
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false); // Don't collapse on mobile, use overlay instead
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    {
      category: "Dashboard",
      items: [
        { href: "/", icon: Home, label: "Overview", active: location === "/" },
        { href: "/dashboard", icon: BarChart3, label: "Analytics", active: location === "/dashboard" },
        { href: "/use", icon: FlaskConical, label: "Use Cases", active: location.startsWith("/use") },
        { href: "/roadmap", icon: FileText, label: "Roadmap", active: location === "/roadmap" },
        { href: "/mvp", icon: Calendar, label: "MVP Plan", active: location === "/mvp" },
        { href: "/design", icon: Settings, label: "Design Plan", active: location === "/design" },
        { href: "/profile", icon: User, label: "Profile", active: location === "/profile" },
      ]
    },
    {
      category: "AI Agents",
      items: [
        { href: "/agents", icon: Bot, label: "All Agents", active: location === "/agents" },
        { href: "/agent/compliance", icon: Bot, label: "🛡️ Compliance", badge: "Active", active: location.startsWith("/agent/compliance") },
        { href: "/agent/patent", icon: Bot, label: "⚖️ Patent/Trademark", active: location.startsWith("/agent/patent") },
        { href: "/agent/operations", icon: Bot, label: "⚙️ Operations", active: location.startsWith("/agent/operations") },
        { href: "/agent/formulation", icon: Bot, label: "🧪 Formulation", active: location.startsWith("/agent/formulation") },
        { href: "/agent/sourcing", icon: Bot, label: "🛒 Sourcing", active: location.startsWith("/agent/sourcing") },
        { href: "/agent/marketing", icon: Bot, label: "📢 Marketing", active: location.startsWith("/agent/marketing") },
        { href: "/agent/science", icon: Bot, label: "🔬 Science", active: location.startsWith("/agent/science") },
        { href: "/agent/spectra", icon: Bot, label: "📊 Spectra", badge: "Dev", active: location.startsWith("/agent/spectra") },
        { href: "/agent/customer", icon: Bot, label: "🤝 Customer Success", active: location.startsWith("/agent/customer") },
      ]
    },

    {
      category: "Documents",
      items: [
        { href: "/artifacts", icon: FileText, label: "📄 Artifacts", badge: "New", active: location === "/artifacts" },
      ]
    },
    {
      category: "Development",
      items: [
        { href: "/agents-dashboard", icon: Activity, label: "Agent Dashboard", active: location === "/agents-dashboard" },
        { href: "/langgraph", icon: GitBranch, label: "LangGraph", active: location === "/langgraph" },
        { href: "/development-agent", icon: Bot, label: "Dev Agent", active: location === "/development-agent" },
        { href: "/real-metrics", icon: BarChart3, label: "Real Metrics", active: location === "/real-metrics" },
        { href: "/corpus-qa", icon: Database, label: "Corpus Q&A", active: location === "/corpus-qa" },
      ]
    },
    {
      category: "System",
      items: [
        { href: "/baselines", icon: Database, label: "Baseline Management", active: location === "/baselines" },
      ]
    }
  ];

  const sidebarContent = (
    <>
      {/* Logo and Brand */}
      <div className={`${isMobile ? 'p-4' : isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-200`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-formul8-green rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">F8</span>
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-formul8-dark truncate">Formul8</h1>
              <p className="text-xs text-formul8-gray truncate">AI Cannabis Consultant</p>
            </div>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto p-1 h-8 w-8"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {navigationItems.map((section) => (
            <div key={section.category}>
              {(!isCollapsed || isMobile) && (
                <h3 className="px-3 text-xs font-medium text-formul8-gray uppercase tracking-wider mb-2">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && setIsMobileOpen(false)}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.active
                          ? 'text-formul8-blue bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`${isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'} h-4 w-4 flex-shrink-0`} />
                      {(!isCollapsed || isMobile) && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badge === 'Active' ? 'default' : 'secondary'}
                              className="ml-auto text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {user && (
        <div className={`${isMobile ? 'p-4' : isCollapsed ? 'p-3' : 'p-6'} border-t border-gray-200`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-sm border"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200 flex flex-col transition-all duration-200 ${className}`}>
      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-6 z-10 bg-white shadow-sm border rounded-full p-1 h-6 w-6"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {sidebarContent}
    </div>
  );
}