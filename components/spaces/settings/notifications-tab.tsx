'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell, Plus, X, Users, User, Shield, Eye } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Recipient {
    id: string;
    recipientType: string;
    recipientId: string | null;
}

interface NotificationEvent {
    id: string;
    eventType: string;
    enabled: boolean;
    label: string;
    description: string;
    recipients: Recipient[];
}

interface NotificationScheme {
    id: string;
    name: string;
    description: string | null;
    events: NotificationEvent[];
}

interface NotificationsTabProps {
    spaceSlug: string;
}

const RECIPIENT_TYPE_ICONS: Record<string, typeof Users> = {
    SPACE_ADMIN: Shield,
    ROLE: Users,
    USER: User,
    ASSIGNEE: User,
    REPORTER: User,
    WATCHER: Eye,
};

const RECIPIENT_TYPE_LABELS: Record<string, string> = {
    SPACE_ADMIN: 'Space Admins',
    ROLE: 'Role',
    USER: 'User',
    ASSIGNEE: 'Assignee',
    REPORTER: 'Reporter',
    WATCHER: 'Watchers',
};

export function NotificationsTab({ spaceSlug }: NotificationsTabProps) {
    const [scheme, setScheme] = useState<NotificationScheme | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [recipientOptions, setRecipientOptions] = useState<{
        roles: Array<{ id: string; name: string }>;
        users: Array<{ id: string; name: string | null; email: string }>;
    }>({ roles: [], users: [] });
    const [addingRecipient, setAddingRecipient] = useState<string | null>(null);
    const [newRecipientType, setNewRecipientType] = useState<string>('');
    const [newRecipientId, setNewRecipientId] = useState<string>('');
    const { success, error: showError } = useToastHelpers();

    useEffect(() => {
        fetchScheme();
        fetchRecipientOptions();
    }, [spaceSlug]);

    const fetchScheme = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/spaces/${spaceSlug}/notifications/scheme`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setScheme(data.scheme);
            }
        } catch (err) {
            showError('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipientOptions = async () => {
        try {
            const response = await fetch(`/api/spaces/${spaceSlug}/notifications/events`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setRecipientOptions({
                    roles: data.roles || [],
                    users: data.users || [],
                });
            }
        } catch (err) {
            console.error('Failed to load recipient options:', err);
        }
    };

    const handleToggleEvent = async (eventId: string, enabled: boolean) => {
        try {
            setUpdating(eventId);
            const response = await fetch(`/api/spaces/${spaceSlug}/notifications/events`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ eventId, action: 'toggle', enabled }),
            });
            const data = await response.json();
            if (data.success) {
                setScheme(prev => prev ? {
                    ...prev,
                    events: prev.events.map(e => e.id === eventId ? { ...e, enabled } : e)
                } : null);
                success(`Notification ${enabled ? 'enabled' : 'disabled'}`);
            }
        } catch (err) {
            showError('Failed to update notification');
        } finally {
            setUpdating(null);
        }
    };

    const handleAddRecipient = async (eventId: string) => {
        if (!newRecipientType) return;

        try {
            setUpdating(eventId);
            const response = await fetch(`/api/spaces/${spaceSlug}/notifications/events`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    eventId,
                    action: 'addRecipient',
                    recipientType: newRecipientType,
                    recipientId: newRecipientId || null,
                }),
            });
            const data = await response.json();
            if (data.success) {
                await fetchScheme();
                success('Recipient added');
                setAddingRecipient(null);
                setNewRecipientType('');
                setNewRecipientId('');
            }
        } catch (err) {
            showError('Failed to add recipient');
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveRecipient = async (eventId: string, recipientId: string) => {
        try {
            setUpdating(eventId);
            const response = await fetch(`/api/spaces/${spaceSlug}/notifications/events`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    eventId,
                    action: 'removeRecipient',
                    recipientId,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setScheme(prev => prev ? {
                    ...prev,
                    events: prev.events.map(e => e.id === eventId ? {
                        ...e,
                        recipients: e.recipients.filter(r => r.id !== recipientId)
                    } : e)
                } : null);
                success('Recipient removed');
            }
        } catch (err) {
            showError('Failed to remove recipient');
        } finally {
            setUpdating(null);
        }
    };

    const getRecipientLabel = (recipient: Recipient) => {
        if (recipient.recipientType === 'ROLE' && recipient.recipientId) {
            const role = recipientOptions.roles.find(r => r.id === recipient.recipientId);
            return role ? `Role: ${role.name}` : 'Role';
        }
        if (recipient.recipientType === 'USER' && recipient.recipientId) {
            const user = recipientOptions.users.find(u => u.id === recipient.recipientId);
            return user ? `User: ${user.name || user.email}` : 'User';
        }
        return RECIPIENT_TYPE_LABELS[recipient.recipientType] || recipient.recipientType;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!scheme) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Failed to load notification settings
            </div>
        );
    }

    // Group events by category
    const testEvents = scheme.events.filter(e =>
        ['TEST_PRIORITIZED', 'TEST_CREATED', 'BUG_REPORTED'].includes(e.eventType)
    );
    const userEvents = scheme.events.filter(e =>
        ['USER_ADDED', 'USER_REMOVED', 'ROLE_CHANGED', 'GROUP_MEMBER_ADDED', 'GROUP_MEMBER_REMOVED'].includes(e.eventType)
    );
    const taskEvents = scheme.events.filter(e =>
        ['TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_COMMENTED'].includes(e.eventType)
    );

    const renderEventCard = (event: NotificationEvent) => {
        const Icon = RECIPIENT_TYPE_ICONS[event.eventType] || Bell;
        const isUpdating = updating === event.id;

        return (
            <Card key={event.id} className={`${!event.enabled ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <CardTitle className="text-base">{event.label}</CardTitle>
                                <CardDescription className="text-sm">
                                    {event.description}
                                </CardDescription>
                            </div>
                        </div>
                        <Switch
                            checked={event.enabled}
                            onCheckedChange={(checked) => handleToggleEvent(event.id, checked)}
                            disabled={isUpdating}
                        />
                    </div>
                </CardHeader>
                {event.enabled && (
                    <CardContent className="pt-0">
                        <div className="text-sm text-muted-foreground mb-2">Notify:</div>
                        <div className="flex flex-wrap gap-2">
                            {event.recipients.map(recipient => {
                                const RecipientIcon = RECIPIENT_TYPE_ICONS[recipient.recipientType] || User;
                                return (
                                    <Badge
                                        key={recipient.id}
                                        variant="secondary"
                                        className="flex items-center gap-1 pr-1"
                                    >
                                        <RecipientIcon className="w-3 h-3" />
                                        <span>{getRecipientLabel(recipient)}</span>
                                        <button
                                            onClick={() => handleRemoveRecipient(event.id, recipient.id)}
                                            className="ml-1 hover:bg-muted rounded p-0.5"
                                            disabled={isUpdating}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                );
                            })}

                            {addingRecipient === event.id ? (
                                <div className="flex items-center gap-2">
                                    <Select value={newRecipientType} onValueChange={setNewRecipientType}>
                                        <SelectTrigger className="h-7 w-32">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SPACE_ADMIN">Space Admins</SelectItem>
                                            <SelectItem value="ASSIGNEE">Assignee</SelectItem>
                                            <SelectItem value="REPORTER">Reporter</SelectItem>
                                            <SelectItem value="WATCHER">Watchers</SelectItem>
                                            <SelectItem value="ROLE">Specific Role</SelectItem>
                                            <SelectItem value="USER">Specific User</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {newRecipientType === 'ROLE' && (
                                        <Select value={newRecipientId} onValueChange={setNewRecipientId}>
                                            <SelectTrigger className="h-7 w-32">
                                                <SelectValue placeholder="Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {recipientOptions.roles.map(role => (
                                                    <SelectItem key={role.id} value={role.id}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {newRecipientType === 'USER' && (
                                        <Select value={newRecipientId} onValueChange={setNewRecipientId}>
                                            <SelectTrigger className="h-7 w-40">
                                                <SelectValue placeholder="User" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {recipientOptions.users.map(user => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.name || user.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2"
                                        onClick={() => handleAddRecipient(event.id)}
                                        disabled={!newRecipientType || isUpdating}
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2"
                                        onClick={() => {
                                            setAddingRecipient(null);
                                            setNewRecipientType('');
                                            setNewRecipientId('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => setAddingRecipient(event.id)}
                                    disabled={isUpdating}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                </Button>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            {/* Test/Regression Events */}
            {testEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Test & Regression</h3>
                    <div className="space-y-3">
                        {testEvents.map(renderEventCard)}
                    </div>
                </div>
            )}

            {/* User Management Events */}
            {userEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">User Management</h3>
                    <div className="space-y-3">
                        {userEvents.map(renderEventCard)}
                    </div>
                </div>
            )}

            {/* Task Events */}
            {taskEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Tasks</h3>
                    <div className="space-y-3">
                        {taskEvents.map(renderEventCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
