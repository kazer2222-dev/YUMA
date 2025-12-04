'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Test {
    id: string;
    name: string;
    module: string | null;
    score: number;
    lastExecutedRelease?: {
        version: string;
    };
}

interface RegressionPlanProps {
    tests: Test[];
}

export function RegressionPlan({ tests }: RegressionPlanProps) {
    // Filter high priority tests (Score >= 50)
    const highPriorityTests = tests.filter(t => t.score >= 50);
    const mediumPriorityTests = tests.filter(t => t.score >= 30 && t.score < 50);

    // For the plan, we select all High Priority + Top 5 Medium Priority
    const selectedTests = [
        ...highPriorityTests,
        ...mediumPriorityTests.slice(0, 5)
    ].sort((a, b) => b.score - a.score);

    const totalTimeEstimate = selectedTests.length * 15; // Assume 15 mins per test

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Selected Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{selectedTests.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {highPriorityTests.length} Critical, {selectedTests.length - highPriorityTests.length} Medium
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Est. Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~{Math.ceil(totalTimeEstimate / 60)}h {totalTimeEstimate % 60}m</div>
                        <p className="text-xs text-muted-foreground">
                            Based on 15m avg per test
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Coverage Focus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Array.from(new Set(selectedTests.map(t => t.module).filter(Boolean))).length} Modules
                        </div>
                        <p className="text-xs text-muted-foreground">
                            High risk areas targeted
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Generated Test Plan</CardTitle>
                            <CardDescription>
                                AI-optimized test plan focusing on high-risk areas.
                            </CardDescription>
                        </div>
                        <Button>
                            <Play className="mr-2 h-4 w-4" />
                            Start Execution
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {selectedTests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No high priority tests found. Run prioritization to generate a plan.
                            </div>
                        ) : (
                            selectedTests.map((test) => (
                                <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {test.score >= 80 ? (
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                        ) : (
                                            <CheckCircle2 className="h-5 w-5 text-yellow-500" />
                                        )}
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {test.name}
                                                {test.module && <Badge variant="secondary" className="text-xs">{test.module}</Badge>}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Score: {test.score.toFixed(1)} • Last run: {test.lastExecutedRelease?.version || 'Never'}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Details</Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
