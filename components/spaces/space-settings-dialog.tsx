'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Key, FileText } from 'lucide-react';
import { PeopleTab } from './settings/people-tab';
import { GroupsTab } from './settings/groups-tab';
import { RolesTab } from './settings/roles-tab';
import { PermissionsTab } from './settings/permissions-tab';
import { AuditLogTab } from './settings/audit-log-tab';
import { InviteDialog } from './invite-dialog';

interface SpaceSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceSlug: string;
    spaceName: string;
}

export function SpaceSettingsDialog({
    open,
    onOpenChange,
    spaceSlug,
    spaceName,
}: SpaceSettingsDialogProps) {
    const [activeTab, setActiveTab] = useState<string>('people');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-2xl">
                            {spaceName} - Settings
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <div className="px-6 border-b">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="people" className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>People</span>
                                </TabsTrigger>
                                <TabsTrigger value="groups" className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>Groups</span>
                                </TabsTrigger>
                                <TabsTrigger value="roles" className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Roles</span>
                                </TabsTrigger>
                                <TabsTrigger value="permissions" className="flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    <span>Permissions</span>
                                </TabsTrigger>
                                <TabsTrigger value="audit" className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>Audit Log</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            <TabsContent value="people" className="mt-0">
                                <PeopleTab spaceSlug={spaceSlug} onInvite={() => setInviteDialogOpen(true)} />
                            </TabsContent>

                            <TabsContent value="groups" className="mt-0">
                                <GroupsTab spaceSlug={spaceSlug} />
                            </TabsContent>

                            <TabsContent value="roles" className="mt-0">
                                <RolesTab spaceSlug={spaceSlug} />
                            </TabsContent>

                            <TabsContent value="permissions" className="mt-0">
                                <PermissionsTab spaceSlug={spaceSlug} />
                            </TabsContent>

                            <TabsContent value="audit" className="mt-0">
                                <AuditLogTab spaceSlug={spaceSlug} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>

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
        </>
    );
}
