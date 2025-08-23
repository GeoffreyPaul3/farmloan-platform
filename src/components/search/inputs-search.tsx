import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface InputsSearchProps {
  onSearchChange: (filters: SearchFilters) => void;
  categories?: string[];
  seasons?: Array<{ id: string; name: string }>;
  farmerGroups?: Array<{ id: string; name: string }>;
}

export interface SearchFilters {
  searchTerm: string;
  category: string;
  season: string;
  farmerGroup: string;
}

export function InputsSearch({ 
  onSearchChange, 
  categories = [], 
  seasons = [], 
  farmerGroups = [] 
}: InputsSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: 'all',
    season: 'all',
    farmerGroup: 'all'
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearchChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: '',
      category: 'all',
      season: 'all',
      farmerGroup: 'all'
    };
    setFilters(clearedFilters);
    onSearchChange(clearedFilters);
  };

  const hasActiveFilters = filters.searchTerm || 
    filters.category !== 'all' || 
    filters.season !== 'all' || 
    filters.farmerGroup !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search items, farmers, clubs..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange('searchTerm', '')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Season</label>
          <Select value={filters.season} onValueChange={(value) => handleFilterChange('season', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All seasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Farmer Group</label>
          <Select value={filters.farmerGroup} onValueChange={(value) => handleFilterChange('farmerGroup', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {farmerGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Search: {filters.searchTerm}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('searchTerm', '')}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Category: {filters.category}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('category', 'all')}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.season !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Season: {seasons.find(s => s.id === filters.season)?.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('season', 'all')}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.farmerGroup !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Group: {farmerGroups.find(g => g.id === filters.farmerGroup)?.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('farmerGroup', 'all')}
                className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-6 px-2"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
