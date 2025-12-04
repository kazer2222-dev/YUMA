import { prisma } from '@/lib/prisma';

export class RegressionService {
    /**
     * Calculates priority score for a test.
     * Score = (0.5 * Recent_Bug_Factor) + (0.3 * Staleness_Factor) + (0.2 * AI_Risk_Score)
     */
    static async calculatePriority(testId: string): Promise<number> {
        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: { lastExecutedRelease: true }
        });

        if (!test) throw new Error('Test not found');

        // 1. Recent Bug Factor (0-100)
        // Find bugs in the test's module fixed in recent releases
        const recentBugs = await prisma.bug.findMany({
            where: {
                affectedModule: test.module,
                status: 'FIXED',
                updatedAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        });

        const recentBugFactor = Math.min(100, recentBugs.length * 20); // 20 points per bug, cap at 100

        // 2. Staleness Factor (0-100)
        // Based on how many releases have passed since last execution
        // Assuming we can count releases or just use time
        let stalenessFactor = 0;
        if (test.lastExecutedRelease) {
            // Ideally we count releases between lastExecuted and current. 
            // For now, let's use time difference as a proxy if release order isn't easily queryable
            const daysSinceLastRun = Math.floor((Date.now() - test.lastExecutedRelease.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            stalenessFactor = Math.min(100, daysSinceLastRun * 5); // 5 points per day
        } else {
            stalenessFactor = 100; // Never executed
        }

        // 3. AI Risk Score (0-100)
        // Average AI risk score of recent bugs in this module
        let aiRiskScore = 0;
        if (recentBugs.length > 0) {
            const totalRisk = recentBugs.reduce((sum, bug) => sum + bug.aiRiskScore, 0);
            aiRiskScore = totalRisk / recentBugs.length;
        }

        // Weighted Formula
        const score = (0.5 * recentBugFactor) + (0.3 * stalenessFactor) + (0.2 * aiRiskScore);

        return parseFloat(score.toFixed(2));
    }

    /**
     * Prioritizes all tests in a space.
     */
    static async prioritizeTests(spaceId: string): Promise<void> {
        const tests = await prisma.test.findMany({
            where: { spaceId }
        });

        for (const test of tests) {
            const newScore = await this.calculatePriority(test.id);
            await prisma.test.update({
                where: { id: test.id },
                data: { score: newScore }
            });
        }
    }
}
