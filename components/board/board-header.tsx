import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, SlidersHorizontal, Plus, Settings } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface BoardHeaderProps {
    boardName: string;
    spaceTicker: string;
    onSearch: (query: string) => void;
    onFilterChange: (filters: any) => void;
    onNewTask: () => void;
    onSettings: () => void;
}

export function BoardHeader({
    boardName,
    spaceTicker,
    onSearch,
    onFilterChange,
    onNewTask,
    onSettings,
}: BoardHeaderProps) {
    return (
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{boardName}</h1>
                    <span className="text-[var(--muted-foreground)] text-sm">({spaceTicker})</span>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative max-w-md w-full hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 h-9 bg-[var(--background)] border-[var(--border)] focus:ring-[var(--primary)]/20"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 bg-[var(--background)] hover:bg-[var(--muted)] gap-2">
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filter</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>High</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked>Medium</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked>Low</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={onNewTask} size="sm" className="h-9 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-sm shadow-[var(--primary)]/20">
                        <Plus className="mr-2 h-4 w-4" />
                        New Task
                    </Button>

                    <Button variant="ghost" size="icon" onClick={onSettings} className="h-9 w-9 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
