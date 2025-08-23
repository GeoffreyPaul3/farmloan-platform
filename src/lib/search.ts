import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  type: 'farmer' | 'loan' | 'equipment' | 'input' | 'club' | 'season';
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

export async function performGlobalSearch(searchTerm: string): Promise<SearchResult[]> {
  if (!searchTerm.trim()) return [];
  
  const results: SearchResult[] = [];
  const term = searchTerm.toLowerCase();

  try {
    // Search farmers
    const { data: farmers } = await supabase
      .from('farmers')
      .select('id, full_name, phone_number, farmer_groups(name)')
      .or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
      .limit(5);

    if (farmers) {
      farmers.forEach(farmer => {
        results.push({
          id: farmer.id,
          type: 'farmer',
          title: farmer.full_name,
          subtitle: farmer.phone_number || 'No phone',
          description: `Member of ${farmer.farmer_groups?.name || 'Unknown Club'}`,
          url: `/dashboard?tab=farmers&id=${farmer.id}`,
          metadata: farmer
        });
      });
    }

    // Search farmer groups (clubs)
    const { data: clubs } = await supabase
      .from('farmer_groups')
      .select('id, name, location')
      .or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .limit(5);

    if (clubs) {
      clubs.forEach(club => {
        results.push({
          id: club.id,
          type: 'club',
          title: club.name,
          subtitle: club.location || 'No location',
          description: 'Farmer Group/Club',
          url: `/clubs?id=${club.id}`,
          metadata: club
        });
      });
    }

    // Search loans
    const { data: loans } = await supabase
      .from('loans')
      .select(`
        id, 
        amount, 
        status, 
        farmer_groups(name),
        created_at
      `)
      .or(`farmer_groups.name.ilike.%${searchTerm}%`)
      .limit(5);

    if (loans) {
      loans.forEach(loan => {
        results.push({
          id: loan.id,
          type: 'loan',
          title: `Loan - MWK ${loan.amount?.toLocaleString()}`,
          subtitle: loan.farmer_groups?.name || 'Unknown Club',
          description: `Status: ${loan.status} | Created: ${new Date(loan.created_at).toLocaleDateString()}`,
          url: `/dashboard?tab=loans&id=${loan.id}`,
          metadata: loan
        });
      });
    }

    // Search equipment
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, name, category, status')
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .limit(5);

    if (equipment) {
      equipment.forEach(item => {
        results.push({
          id: item.id,
          type: 'equipment',
          title: item.name,
          subtitle: item.category,
          description: `Status: ${item.status}`,
          url: `/equipment?id=${item.id}`,
          metadata: item
        });
      });
    }

    // Search input items
    const { data: inputs } = await supabase
      .from('input_items')
      .select('id, name, category, unit')
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .limit(5);

    if (inputs) {
      inputs.forEach(input => {
        results.push({
          id: input.id,
          type: 'input',
          title: input.name,
          subtitle: input.category,
          description: `Unit: ${input.unit}`,
          url: `/inputs?tab=items&id=${input.id}`,
          metadata: input
        });
      });
    }

    // Search seasons
    const { data: seasons } = await supabase
      .from('seasons')
      .select('id, name, start_date, end_date')
      .or(`name.ilike.%${searchTerm}%`)
      .limit(5);

    if (seasons) {
      seasons.forEach(season => {
        results.push({
          id: season.id,
          type: 'season',
          title: season.name,
          subtitle: `${new Date(season.start_date).getFullYear()}`,
          description: `${new Date(season.start_date).toLocaleDateString()} - ${new Date(season.end_date).toLocaleDateString()}`,
          url: `/seasons?id=${season.id}`,
          metadata: season
        });
      });
    }

  } catch (error) {
    console.error('Search error:', error);
  }

  return results;
}

export function getSearchResultIcon(type: SearchResult['type']) {
  switch (type) {
    case 'farmer':
      return '👨‍🌾';
    case 'loan':
      return '💰';
    case 'equipment':
      return '🔧';
    case 'input':
      return '📦';
    case 'club':
      return '👥';
    case 'season':
      return '📅';
    default:
      return '🔍';
  }
}

export function getSearchResultColor(type: SearchResult['type']) {
  switch (type) {
    case 'farmer':
      return 'text-blue-600';
    case 'loan':
      return 'text-green-600';
    case 'equipment':
      return 'text-orange-600';
    case 'input':
      return 'text-purple-600';
    case 'club':
      return 'text-indigo-600';
    case 'season':
      return 'text-cyan-600';
    default:
      return 'text-gray-600';
  }
}
