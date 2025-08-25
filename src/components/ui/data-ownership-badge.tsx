import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Users, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataOwnership } from '@/hooks/use-data-ownership';

interface DataOwnershipBadgeProps {
  createdBy: string;
  createdByName?: string;
  createdAt?: string;
  isOwnData: boolean;
  className?: string;
  showDetails?: boolean;
}

export function DataOwnershipBadge({
  createdBy,
  createdByName,
  createdAt,
  isOwnData,
  className,
  showDetails = false
}: DataOwnershipBadgeProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={isOwnData ? "default" : "secondary"}
        className={cn(
          "flex items-center gap-1 text-xs",
          isOwnData 
            ? "bg-green-100 text-green-800 border-green-200" 
            : "bg-blue-100 text-blue-800 border-blue-200"
        )}
      >
        {isOwnData ? (
          <>
            <User className="h-3 w-3" />
            <span>You created this</span>
          </>
        ) : (
          <>
            <Users className="h-3 w-3" />
            <span>Created by {createdByName || 'Another user'}</span>
          </>
        )}
      </Badge>
      
      {showDetails && createdAt && (
        <span className="text-xs text-muted-foreground">
          on {formatDate(createdAt)}
        </span>
      )}
    </div>
  );
}

export function DataOwnershipInfo({
  createdBy,
  createdByName,
  createdAt,
  isOwnData,
  className
}: DataOwnershipBadgeProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <DataOwnershipBadge
          createdBy={createdBy}
          createdByName={createdByName}
          createdAt={createdAt}
          isOwnData={isOwnData}
        />
      </div>
      
      {createdAt && (
        <p className="text-xs text-muted-foreground">
          Created on {formatDate(createdAt)}
        </p>
      )}
      
      {!isOwnData && createdByName && (
        <p className="text-xs text-muted-foreground">
          Data owner: {createdByName}
        </p>
      )}
    </div>
  );
}

export function DataOwnershipCell({ 
  tableName, 
  recordId, 
  className 
}: { 
  tableName: string; 
  recordId: string; 
  className?: string; 
}) {
  const { ownershipInfo } = useDataOwnership(tableName, recordId);
  
  if (!ownershipInfo) {
    return <span className="text-muted-foreground text-xs">Loading...</span>;
  }
  
  return (
    <DataOwnershipBadge
      createdBy={ownershipInfo.createdBy}
      createdByName={ownershipInfo.createdByName}
      createdAt={ownershipInfo.createdAt}
      isOwnData={ownershipInfo.isOwnData}
      showDetails={false}
      className={className}
    />
  );
}

export function CanEditButton({ 
  tableName, 
  recordId, 
  onEdit,
  children = <Edit className="h-4 w-4" />
}: { 
  tableName: string; 
  recordId: string; 
  onEdit: () => void;
  children?: React.ReactNode;
}) {
  const { ownershipInfo } = useDataOwnership(tableName, recordId);
  
  if (!ownershipInfo?.canEdit) {
    return null;
  }
  
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onEdit}
    >
      {children}
    </Button>
  );
}
