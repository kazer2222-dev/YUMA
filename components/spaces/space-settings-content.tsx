'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Shield, Key, FileText, ArrowLeft, UsersRound, Bell } from 'lucide-react';
import { PeopleTab } from './settings/people-tab';
import { GroupsTab } from './settings/groups-tab';
import { RolesTab } from './settings/roles-tab';
import { PermissionsTab } from './settings/permissions-tab';
import { AuditLogTab } from './settings/audit-log-tab';
import { NotificationsTab } from './settings/notifications-tab';
import { InviteDialog } from './invite-dialog';

interface SpaceSettingsContentProps {
    spaceSlug: string;
    spaceName: string;
    onBack?: () => void;
    standalone?: boolean;
}

export function SpaceSettingsContent({
    spaceSlug,
    spaceName,
    onBack,
    standalone = false,
}: SpaceSettingsContentProps) {
    const [activeTab, setActiveTab] = useState<string>('people');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    return (
        <div className={standalone ? 'flex flex-col h-full' : 'flex flex-col h-full'}>
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
            >
                {/* Header with Back button and Tabs on same row */}
                <div className="flex items-center gap-6 border-b">
                    {onBack && (
                        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    )}
                    <TabsList className="h-auto bg-transparent p-0 space-x-6">
                        <TabsTrigger
                            value="people"
                            className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <Users className="w-4 h-4" />
                            <span>People</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="groups"
                            className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <UsersRound className="w-4 h-4" />
                            <span>Groups</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="roles"
                            className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <Shield className="w-4 h-4" />
                            <span>Roles</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="permissions"
                            className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <Key className="w-4 h-4" />
                            <span>Permissions</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="audit"
                            className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Audit Log</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="notifications"
                            className="flex items-center gap-2 pb-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            <Bell className="w-4 h-4" />
                            <span>Notifications</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-auto pt-6">
                    <TabsContent value="people" className="mt-0 h-full">
                        <PeopleTab spaceSlug={spaceSlug} onInvite={() => setInviteDialogOpen(true)} />
                    </TabsContent>

                    <TabsContent value="groups" className="mt-0 h-full">
                        <GroupsTab spaceSlug={spaceSlug} />
                    </TabsContent>

                    <TabsContent value="roles" className="mt-0 h-full">
                        <RolesTab spaceSlug={spaceSlug} />
                    </TabsContent>

                    <TabsContent value="permissions" className="mt-0 h-full">
                        <PermissionsTab spaceSlug={spaceSlug} />
                    </TabsContent>

                    <TabsContent value="audit" className="mt-0 h-full">
                        <AuditLogTab spaceSlug={spaceSlug} />
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-0 h-full">
                        <NotificationsTab spaceSlug={spaceSlug} />
                    </TabsContent>
                </div>
            </Tabs>

            <InviteDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                spaceSlug={spaceSlug}
                onSuccess={() => {
                    // Refresh people tab if active
                    if (activeTab === 'people') {
                        // The PeopleTab component will handle its own refresh
                    }
                }}
            />
        </div>
    );
}
