import { Badge } from "@/components/ui/badge";

interface MetricBadgeProps {
  label: string;
  value: number | string;
  type: 'accuracy' | 'confidence' | 'baseline' | 'tests' | 'status';
  className?: string;
}

export function MetricBadge({ label, value, type, className = "" }: MetricBadgeProps) {
  const getColorClass = (type: string, value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    switch (type) {
      case 'accuracy':
        if (numValue >= 90) return 'bg-green-500 hover:bg-green-600 text-white';
        if (numValue >= 75) return 'bg-green-400 hover:bg-green-500 text-white';
        if (numValue >= 60) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
        return 'bg-red-500 hover:bg-red-600 text-white';
      
      case 'confidence':
      case 'baseline':
        if (numValue >= 85) return 'bg-green-500 hover:bg-green-600 text-white';
        if (numValue >= 70) return 'bg-green-400 hover:bg-green-500 text-white';
        if (numValue >= 60) return 'bg-yellow-500 hover:bg-yellow-600 text-white';
        return 'bg-red-500 hover:bg-red-600 text-white';
      
      case 'tests':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      
      case 'status':
        return 'bg-green-500 hover:bg-green-600 text-white';
      
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const formatValue = (value: number | string, type: string) => {
    if (type === 'tests') return value;
    if (typeof value === 'number') {
      return type === 'accuracy' || type === 'confidence' || type === 'baseline' 
        ? `${value.toFixed(1)}%` 
        : value;
    }
    return value;
  };

  return (
    <Badge 
      className={`${getColorClass(type, value)} ${className}`}
      variant="default"
    >
      {label}: {formatValue(value, type)}
    </Badge>
  );
}