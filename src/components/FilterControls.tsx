import { useState } from 'react';
import { Search, Filter, SortAsc, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Priority } from '@/types/task';

interface FilterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  priorityFilter: Priority | 'all';
  onPriorityFilterChange: (value: Priority | 'all') => void;
  sortBy: 'priority' | 'category' | 'deadline';
  onSortChange: (value: 'priority' | 'category' | 'deadline') => void;
  onExport: () => void;
  onShare: () => void;
  totalTasks: number;
  completedTasks: number;
}

export const FilterControls = ({
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  sortBy,
  onSortChange,
  onExport,
  onShare,
  totalTasks,
  completedTasks
}: FilterControlsProps) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="p-4 space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          Total: {totalTasks}
        </Badge>
        <Badge variant="secondary">
          Completed: {completedTasks}
        </Badge>
        <Badge variant="secondary">
          Remaining: {totalTasks - completedTasks}
        </Badge>
        <Badge className="gradient-primary text-white">
          {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% Complete
        </Badge>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border animate-fade-in">
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-priority-high rounded-full"></div>
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-priority-medium rounded-full"></div>
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-priority-low rounded-full"></div>
                    Low Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">
                  <div className="flex items-center gap-2">
                    <SortAsc className="w-4 h-4" />
                    Priority
                  </div>
                </SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:flex sm:items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchChange('');
                onPriorityFilterChange('all');
                onSortChange('priority');
              }}
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};