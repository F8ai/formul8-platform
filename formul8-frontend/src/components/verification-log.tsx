import { useQuery } from "@tanstack/react-query";

export default function VerificationLog() {
  const { data: verifications, isLoading } = useQuery({
    queryKey: ["/api/verifications"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Mock verification events since we don't have full verification data structure yet
  const mockVerifications = [
    {
      id: 1,
      type: "success",
      message: "Cross-verification completed",
      detail: "Compliance ↔ Marketing agents consensus achieved",
      time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      type: "warning",
      message: "Discrepancy detected",
      detail: "Patent Agent flagged potential conflict",
      time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      type: "info",
      message: "Human verification requested",
      detail: "Complex formulation requires expert review",
      time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ];

  const getVerificationStyle = (type: string) => {
    const styles: Record<string, { bg: string; icon: string; iconBg: string }> = {
      success: { bg: "bg-green-50", icon: "fas fa-check", iconBg: "bg-green-500" },
      warning: { bg: "bg-yellow-50", icon: "fas fa-exclamation", iconBg: "bg-yellow-500" },
      info: { bg: "bg-blue-50", icon: "fas fa-sync", iconBg: "bg-formul8-blue" },
      error: { bg: "bg-red-50", icon: "fas fa-times", iconBg: "bg-red-500" },
    };
    return styles[type] || styles.info;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-formul8-dark">Agent Verification Log</h3>
        <button className="text-formul8-blue hover:text-blue-600 text-sm font-medium">Settings</button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : (
          mockVerifications.map((verification) => {
            const style = getVerificationStyle(verification.type);
            
            return (
              <div key={verification.id} className={`flex items-center space-x-3 p-3 rounded-lg ${style.bg}`}>
                <div className={`w-8 h-8 ${style.iconBg} rounded-full flex items-center justify-center`}>
                  <i className={`${style.icon} text-white text-xs`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-formul8-dark">{verification.message}</p>
                  <p className="text-xs text-formul8-gray">{verification.detail}</p>
                  <p className="text-xs text-formul8-gray">{formatTimeAgo(verification.time)}</p>
                </div>
              </div>
            );
          })
        )}
        
        {!isLoading && (!verifications || verifications.length === 0) && (
          <div className="text-center py-8">
            <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-4"></i>
            <p className="text-formul8-gray">No verification logs yet</p>
            <p className="text-sm text-formul8-gray">Agent verifications will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
