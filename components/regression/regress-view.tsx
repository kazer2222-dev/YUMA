'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TestList } from './test-list';
import { RefreshCw, Plus, BrainCircuit, HelpCircle } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegressionPlan } from './regression-plan';

export function RegressView() {
    const params = useParams();
    const spaceSlug = params.slug as string;
    const { success, error: toastError } = useToastHelpers();

    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrioritizing, setIsPrioritizing] = useState(false);
    const [newTestName, setNewTestName] = useState('');
    const [newTestModule, setNewTestModule] = useState('');

    const fetchTests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/spaces/${spaceSlug}/regression/tests`);
            const data = await res.json();
            if (data.success) {
                setTests(data.tests);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
            toastError('Error', 'Failed to fetch tests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (spaceSlug) {
            fetchTests();
        }
    }, [spaceSlug]);

    const handlePrioritize = async () => {
        setIsPrioritizing(true);
        try {
            const res = await fetch(`/api/spaces/${spaceSlug}/regression/prioritize`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                success('Success', 'Tests prioritized successfully');
                fetchTests();
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toastError('Error', error.message || 'Failed to prioritize');
        } finally {
            setIsPrioritizing(false);
        }
    };

    const handleCreateTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTestName) return;

        try {
            const res = await fetch(`/api/spaces/${spaceSlug}/regression/tests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTestName, module: newTestModule }),
            });
            const data = await res.json();
            if (data.success) {
                setNewTestName('');
                setNewTestModule('');
                fetchTests();
                success('Success', 'Test created');
            }
        } catch (error) {
            console.error('Failed to create test:', error);
            toastError('Error', 'Failed to create test');
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Regression Testing</h2>
                    <p className="text-muted-foreground">
                        Prioritize and manage your regression test suite.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handlePrioritize} disabled={isPrioritizing}>
                        {isPrioritizing ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <BrainCircuit className="mr-2 h-4 w-4" />
                        )}
                        Prioritize with AI
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="suite" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="suite">Test Suite</TabsTrigger>
                    <TabsTrigger value="plan">Regression Plan</TabsTrigger>
                </TabsList>

                <TabsContent value="suite" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Test Suite</CardTitle>
                                <CardDescription>
                                    Tests ordered by priority score.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TestList tests={tests} isLoading={isLoading} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Add Test</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateTest} className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium">Name</label>
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">The descriptive name of the regression test case.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            value={newTestName}
                                            onChange={(e) => setNewTestName(e.target.value)}
                                            placeholder="e.g. Verify Login"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium">Module</label>
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs">The functional area (e.g., Auth, Payments). Used to link tests to bugs for risk analysis.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            value={newTestModule}
                                            onChange={(e) => setNewTestModule(e.target.value)}
                                            placeholder="e.g. Auth"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={!newTestName}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Test
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="plan">
                    <RegressionPlan tests={tests} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
