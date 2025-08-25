import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface DataOwnershipInfo {
  createdBy: string;
  createdByName?: string;
  createdAt?: string;
  isOwnData: boolean;
  canEdit: boolean;
}

export function useDataOwnership(tableName: string, recordId: string) {
  const { user } = useAuth();

  const { data: ownershipInfo, isLoading } = useQuery({
    queryKey: ['data-ownership', tableName, recordId],
    queryFn: async (): Promise<DataOwnershipInfo> => {
      if (!user || !recordId) {
        return {
          createdBy: '',
          createdByName: '',
          createdAt: '',
          isOwnData: false,
          canEdit: false
        };
      }

      // Get ownership info from the database function
      const { data, error } = await supabase
        .rpc('get_data_ownership_info', {
          table_name: tableName,
          record_id: recordId
        });

      if (error) {
        console.error('Error fetching ownership info:', error);
        return {
          createdBy: '',
          createdByName: '',
          createdAt: '',
          isOwnData: false,
          canEdit: false
        };
      }

      const ownership = data?.[0];
      if (!ownership) {
        return {
          createdBy: '',
          createdByName: '',
          createdAt: '',
          isOwnData: false,
          canEdit: false
        };
      }

      // Check if user is admin for edit permissions
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isAdmin = userProfile?.role === 'admin';
      const isOwnData = ownership.created_by === user.id;

      return {
        createdBy: ownership.created_by,
        createdByName: ownership.created_by_name,
        createdAt: ownership.created_at,
        isOwnData,
        canEdit: isAdmin // Only admins can edit
      };
    },
    enabled: !!user && !!recordId
  });

  return {
    ownershipInfo,
    isLoading
  };
}

export function useCanEdit(tableName: string, recordId: string) {
  const { ownershipInfo } = useDataOwnership(tableName, recordId);
  return ownershipInfo?.canEdit || false;
}

export function useIsOwnData(tableName: string, recordId: string) {
  const { ownershipInfo } = useDataOwnership(tableName, recordId);
  return ownershipInfo?.isOwnData || false;
}

// Utility function to get ownership info for any record
export async function getDataOwnershipInfo(tableName: string, recordId: string): Promise<DataOwnershipInfo | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_data_ownership_info', {
        table_name: tableName,
        record_id: recordId
      });

    if (error || !data?.[0]) {
      return null;
    }

    const ownership = data[0];
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';
    const isOwnData = ownership.created_by === user.id;

    return {
      createdBy: ownership.created_by,
      createdByName: ownership.created_by_name,
      createdAt: ownership.created_at,
      isOwnData,
      canEdit: isAdmin
    };
  } catch (error) {
    console.error('Error getting data ownership info:', error);
    return null;
  }
}

// Utility function to check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
