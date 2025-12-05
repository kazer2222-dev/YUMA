'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Users,
    Shield,
    Eye,
    Pencil,
    Plus,
    X,
    Search,
    Loader2,
    Info,
    UserCircle,
    UserCog,
    FolderCog,
    Crown,
    Check,
} from 'lucide-react';
import type {
    TemplateAccessRule,
    TemplateAccessConfig,
    AccessEntity,
    TemplatePermission,
} from './template-types';

interface TemplateAccessSectionProps {
    spaceSlug: string;
    templateId?: string;
    restrictAccess: boolean;
    accessRules: TemplateAccessRule[];
    onRestrictAccessChange: (restrict: boolean) => void;
    onAccessRulesChange: (rules: TemplateAccessRule[]) => void;
    disabled?: boolean;
}

// Permission configuration UI
interface PermissionSelectorProps {
    permission: TemplatePermission;
    label: string;
    description: string;
    icon: React.ReactNode;
    rules: TemplateAccessRule[];
    onRulesChange: (rules: TemplateAccessRule[]) => void;
    spaceSlug: string;
    disabled?: boolean;
}

function PermissionSelector({
    permission,
    label,
    description,
    icon,
    rules,
    onRulesChange,
    spaceSlug,
    disabled,
}: PermissionSelectorProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AccessEntity[]>([]);
    const [searching, setSearching] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!searchOpen) return;

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.set('search', searchQuery);
                params.set('limit', '20');

                const response = await fetch(
                    `/api/spaces/${spaceSlug}/templates/entities?${params}`,
                    { credentials: 'include' }
                );
                const data = await response.json();
                if (data.success) {
                    setSearchResults(data.entities || []);
                }
            } catch (error) {
                console.error('Error searching entities:', error);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchOpen, spaceSlug]);

    const handleAddEntity = (entity: AccessEntity) => {
        // Check if already exists
        const exists = rules.some(
            (r) => r.entityType === entity.type && r.entityId === entity.id
        );
        if (exists) return;

        const newRule: TemplateAccessRule = {
            permission,
            entityType: entity.type,
            entityId: entity.id,
            entityName: entity.name,
            entityEmail: entity.email,
        };

        onRulesChange([...rules, newRule]);
        setSearchOpen(false);
        setSearchQuery('');
    };

    const handleRemoveRule = (index: number) => {
        const newRules = [...rules];
        newRules.splice(index, 1);
        onRulesChange(newRules);
    };

    const getEntityIcon = (type: string, entityId?: string | null) => {
        if (type === 'SPECIAL') {
            switch (entityId) {
                case 'ALL_MEMBERS':
                    return <Users className="h-4 w-4" />;
                case 'SPACE_ADMINS':
                    return <Crown className="h-4 w-4" />;
                case 'CREATOR':
                case 'ASSIGNEE':
                    return <UserCircle className="h-4 w-4" />;
                default:
                    return <Shield className="h-4 w-4" />;
            }
        }
        switch (type) {
            case 'USER':
                return <UserCircle className="h-4 w-4" />;
            case 'ROLE':
                return <UserCog className="h-4 w-4" />;
            case 'GROUP':
                return <FolderCog className="h-4 w-4" />;
            default:
                return <Shield className="h-4 w-4" />;
        }
    };

    const getEntityBadgeColor = (type: string, entityId?: string | null) => {
        if (type === 'SPECIAL') {
            switch (entityId) {
                case 'ALL_MEMBERS':
                    return 'bg-green-500/10 text-green-500 border-green-500/20';
                case 'SPACE_ADMINS':
                    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                default:
                    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            }
        }
        switch (type) {
            case 'USER':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'ROLE':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'GROUP':
                return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    // Filter out already selected entities from search results
    const filteredResults = searchResults.filter(
        (entity) =>
            !rules.some(
                (r) => r.entityType === entity.type && r.entityId === entity.id
            )
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">{icon}</span>
                <div className="flex-1">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
                </div>
            </div>

            {/* Selected entities */}
            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {rules.length === 0 && (
                    <span className="text-sm text-[var(--muted-foreground)] italic">
                        No access rules defined
                    </span>
                )}
                {rules.map((rule, index) => (
                    <Badge
                        key={`${rule.entityType}-${rule.entityId}-${index}`}
                        variant="outline"
                        className={`flex items-center gap-1.5 pr-1 ${getEntityBadgeColor(
                            rule.entityType,
                            rule.entityId
                        )}`}
                    >
                        {getEntityIcon(rule.entityType, rule.entityId)}
                        <span>{rule.entityName || rule.entityId}</span>
                        {!disabled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-transparent"
                                onClick={() => handleRemoveRule(index)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </Badge>
                ))}
            </div>

            {/* Add entity popover */}
            {!disabled && (
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                            <Plus className="h-4 w-4 mr-2" />
                            Add user, role, or group
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Search users, roles, groups..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                            <CommandList>
                                {searching ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                                    </div>
                                ) : filteredResults.length === 0 ? (
                                    <CommandEmpty>No results found</CommandEmpty>
                                ) : (
                                    <>
                                        <CommandGroup heading="Special">
                                            {filteredResults
                                                .filter((e) => e.type === 'SPECIAL')
                                                .map((entity) => (
                                                    <CommandItem
                                                        key={`${entity.type}-${entity.id}`}
                                                        onSelect={() => handleAddEntity(entity)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        {getEntityIcon(entity.type, entity.id)}
                                                        <div className="flex-1">
                                                            <div className="font-medium">{entity.name}</div>
                                                            {entity.description && (
                                                                <div className="text-xs text-[var(--muted-foreground)]">
                                                                    {entity.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                        {filteredResults.filter((e) => e.type === 'USER').length > 0 && (
                                            <CommandGroup heading="Users">
                                                {filteredResults
                                                    .filter((e) => e.type === 'USER')
                                                    .map((entity) => (
                                                        <CommandItem
                                                            key={`${entity.type}-${entity.id}`}
                                                            onSelect={() => handleAddEntity(entity)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {getEntityIcon(entity.type, entity.id)}
                                                            <div className="flex-1">
                                                                <div className="font-medium">{entity.name}</div>
                                                                {entity.email && (
                                                                    <div className="text-xs text-[var(--muted-foreground)]">
                                                                        {entity.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        )}
                                        {filteredResults.filter((e) => e.type === 'ROLE').length > 0 && (
                                            <CommandGroup heading="Roles">
                                                {filteredResults
                                                    .filter((e) => e.type === 'ROLE')
                                                    .map((entity) => (
                                                        <CommandItem
                                                            key={`${entity.type}-${entity.id}`}
                                                            onSelect={() => handleAddEntity(entity)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {getEntityIcon(entity.type, entity.id)}
                                                            <div className="flex-1">
                                                                <div className="font-medium">{entity.name}</div>
                                                                {entity.memberCount !== undefined && (
                                                                    <div className="text-xs text-[var(--muted-foreground)]">
                                                                        {entity.memberCount} members
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        )}
                                        {filteredResults.filter((e) => e.type === 'GROUP').length > 0 && (
                                            <CommandGroup heading="Groups">
                                                {filteredResults
                                                    .filter((e) => e.type === 'GROUP')
                                                    .map((entity) => (
                                                        <CommandItem
                                                            key={`${entity.type}-${entity.id}`}
                                                            onSelect={() => handleAddEntity(entity)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            {getEntityIcon(entity.type, entity.id)}
                                                            <div className="flex-1">
                                                                <div className="font-medium">{entity.name}</div>
                                                                {entity.memberCount !== undefined && (
                                                                    <div className="text-xs text-[var(--muted-foreground)]">
                                                                        {entity.memberCount} members
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        )}
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}

export function TemplateAccessSection({
    spaceSlug,
    templateId,
    restrictAccess,
    accessRules,
    onRestrictAccessChange,
    onAccessRulesChange,
    disabled,
}: TemplateAccessSectionProps) {
    // Group rules by permission type
    const createRules = useMemo(
        () => accessRules.filter((r) => r.permission === 'CREATE'),
        [accessRules]
    );
    const editRules = useMemo(
        () => accessRules.filter((r) => r.permission === 'EDIT'),
        [accessRules]
    );
    const viewRules = useMemo(
        () => accessRules.filter((r) => r.permission === 'VIEW'),
        [accessRules]
    );

    const handleCreateRulesChange = useCallback(
        (rules: TemplateAccessRule[]) => {
            const otherRules = accessRules.filter((r) => r.permission !== 'CREATE');
            onAccessRulesChange([...otherRules, ...rules]);
        },
        [accessRules, onAccessRulesChange]
    );

    const handleEditRulesChange = useCallback(
        (rules: TemplateAccessRule[]) => {
            const otherRules = accessRules.filter((r) => r.permission !== 'EDIT');
            onAccessRulesChange([...otherRules, ...rules]);
        },
        [accessRules, onAccessRulesChange]
    );

    const handleViewRulesChange = useCallback(
        (rules: TemplateAccessRule[]) => {
            const otherRules = accessRules.filter((r) => r.permission !== 'VIEW');
            onAccessRulesChange([...otherRules, ...rules]);
        },
        [accessRules, onAccessRulesChange]
    );

    return (
        <div className="space-y-6">
            {/* Opt-in checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30">
                <Checkbox
                    id="restrict-access"
                    checked={restrictAccess}
                    onCheckedChange={(checked) => onRestrictAccessChange(!!checked)}
                    disabled={disabled}
                    className="mt-0.5"
                />
                <div className="flex-1">
                    <Label
                        htmlFor="restrict-access"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Limit access to this template
                    </Label>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        When enabled, only specified users, roles, or groups can interact with
                        tasks created from this template. When disabled, all space members have
                        full access.
                    </p>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-[var(--muted-foreground)] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[300px]">
                            <p>
                                Selecting this limits template use to specified roles. Use this for
                                sensitive templates that should only be accessible to certain team
                                members.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Permission fields */}
            {restrictAccess && (
                <div className="space-y-6 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            Configure who can create, edit, and view tasks from this template.
                            Space administrators always have full access.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6">
                        {/* Create permission */}
                        <PermissionSelector
                            permission="CREATE"
                            label="Who can create tasks from this template"
                            description="Users, roles, or groups that can create new tasks using this template"
                            icon={<Plus className="h-4 w-4" />}
                            rules={createRules}
                            onRulesChange={handleCreateRulesChange}
                            spaceSlug={spaceSlug}
                            disabled={disabled}
                        />

                        {/* Edit permission */}
                        <PermissionSelector
                            permission="EDIT"
                            label="Who can edit tasks created from this template"
                            description="Users, roles, or groups that can modify tasks created from this template"
                            icon={<Pencil className="h-4 w-4" />}
                            rules={editRules}
                            onRulesChange={handleEditRulesChange}
                            spaceSlug={spaceSlug}
                            disabled={disabled}
                        />

                        {/* View permission */}
                        <PermissionSelector
                            permission="VIEW"
                            label="Who can view tasks created from this template"
                            description="Users, roles, or groups that can see tasks created from this template"
                            icon={<Eye className="h-4 w-4" />}
                            rules={viewRules}
                            onRulesChange={handleViewRulesChange}
                            spaceSlug={spaceSlug}
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
