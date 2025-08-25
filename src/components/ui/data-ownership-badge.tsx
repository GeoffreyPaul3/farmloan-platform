import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
