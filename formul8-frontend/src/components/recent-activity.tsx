import { useQuery } from "@tanstack/react-query";

export default function RecentActivity() {
  const { data: queries, isLoading } = useQuery({
    queryKey: ["/api/queries"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getAgentIcon = (agentType: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      compliance: { icon: "fas fa-shield-alt", color: "bg-formul8-green" },
      patent: { icon: "fas fa-copyright", color: "bg-formul8-blue" },
      operations: { icon: "fas fa-cogs", color: "bg-purple-500" },
      formulation: { icon: "fas fa-flask", color: "bg-orange-500" },
      sourcing: { icon: "fas fa-shopping-cart", color: "bg-yellow-600" },
      marketing: { icon: "fas fa-bullhorn", color: "bg-pink-500" },
    };
    return icons[agentType] || { icon: "fas fa-question", color: "bg-gray-500" };
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string; icon: string }> = {
      completed: { text: "Verified", class: "bg-green-100 text-green-800", icon: "fas fa-check" },
      processing: { text: "Processing", class: "bg-blue-100 text-blue-800", icon: "fas fa-spinner fa-spin" },
      pending: { text: "Pending Verification", class: "bg-yellow-100 text-yellow-800", icon: "fas fa-clock" },
      failed: { text: "Failed", class: "bg-red-100 text-red-800", icon: "fas fa-times" },
      needs_human: { text: "Needs Review", class: "bg-orange-100 text-orange-800", icon: "fas fa-user" },
    };
    return badges[status] || badges.pending;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-formul8-dark">Recent Queries</h3>
        <button className="text-formul8-blue hover:text-blue-600 text-sm font-medium">View All</button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({length: 3}).map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))
        ) : queries && queries.length > 0 ? (
          queries.slice(0, 5).map((query: any) => {
            const agentData = getAgentIcon(query.agentType);
            const statusData = getStatusBadge(query.status);
            
            return (
              <div key={query.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className={`w-8 h-8 ${agentData.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <i className={`${agentData.icon} text-white text-xs`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-formul8-dark truncate">
                    {query.content.length > 50 ? `${query.content.substring(0, 50)}...` : query.content}
                  </p>
                  <p className="text-xs text-formul8-gray">
                    {query.agentType.charAt(0).toUpperCase() + query.agentType.slice(1)} Agent • {formatTimeAgo(query.createdAt)}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusData.class}`}>
                      <i className={`${statusData.icon} mr-1`} style={{fontSize: '8px'}}></i>
                      {statusData.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
            <p className="text-formul8-gray">No queries yet</p>
            <p className="text-sm text-formul8-gray">Submit your first query to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
