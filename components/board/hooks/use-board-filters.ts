import { useState, useEffect, useCallback } from 'react';

interface FiltersState {
  priorities: string[];
  tags: string[];
  showOverdue: boolean;
}

type GroupByOption = 'none' | 'assignee' | 'template' | 'priority';

export function useBoardFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState('AI is analyzing');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FiltersState>({
    priorities: [],
    tags: [],
    showOverdue: false,
  });
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);

  const handleSearch = useCallback(() => {
    setActiveSearchQuery(searchInput);
  }, [searchInput]);

  const handleAIFilter = useCallback(async () => {
    if (!searchInput.trim()) return;

    setIsGenerating(true);
    setGeneratingText('AI is analyzing');

    try {
      const response = await fetch('/api/ai/parse-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: searchInput,
          fields: [
            { key: 'summary', label: 'Summary' },
            { key: 'status', label: 'Status' },
            { key: 'assignee', label: 'Assignee' },
            { key: 'priority', label: 'Priority' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'tags', label: 'Tags' },
          ],
        }),
      });

      const data = await response.json();
      if (data.success && data.filters) {
        const newFilters = {
          priorities: [...filters.priorities],
          tags: [...filters.tags],
          showOverdue: filters.showOverdue,
        };
        data.filters.forEach((filter: any) => {
          if (filter.field === 'priority') {
            const priorityMap: Record<string, string> = {
              Highest: 'HIGHEST',
              High: 'HIGH',
              Normal: 'NORMAL',
              Low: 'LOW',
              Lowest: 'LOWEST',
            };
            const mappedPriority = priorityMap[filter.value] || filter.value.toUpperCase();
            if (!newFilters.priorities.includes(mappedPriority)) {
              newFilters.priorities.push(mappedPriority);
            }
          } else if (filter.field === 'tags') {
            if (!newFilters.tags.includes(filter.value)) {
              newFilters.tags.push(filter.value);
            }
          }
        });
        setFilters(newFilters);
        setActiveSearchQuery('');
        setSearchInput('');
      } else {
        setActiveSearchQuery(searchInput);
      }
    } catch (err) {
      console.error('AI filter error:', err);
      setActiveSearchQuery(searchInput);
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  }, [searchInput, filters]);

  useEffect(() => {
    if (!isGenerating) return;
    const texts = ['AI is analyzing', 'AI is analyzing.', 'AI is analyzing..', 'AI is analyzing...'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setGeneratingText(texts[index]);
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const activeFiltersCount = filters.priorities.length + filters.tags.length + (filters.showOverdue ? 1 : 0);

  return {
    searchInput,
    setSearchInput,
    activeSearchQuery,
    setActiveSearchQuery,
    isGenerating,
    generatingText,
    groupBy,
    setGroupBy,
    collapsedGroups,
    setCollapsedGroups,
    filters,
    setFilters,
    filterMenuOpen,
    setFilterMenuOpen,
    groupMenuOpen,
    setGroupMenuOpen,
    handleSearch,
    handleAIFilter,
    activeFiltersCount,
  };
}

