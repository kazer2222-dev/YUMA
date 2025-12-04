import { PrismaClient } from '@prisma/client';
import { RegressionService } from '../lib/services/regression-service';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Regression Feature Verification...');

    try {
        // 1. Setup: Create a Space
        console.log('Creating test space...');
        const spaceSlug = `verify-regress-${Date.now()}`;
        const space = await prisma.space.create({
            data: {
                name: 'Regression Verification Space',
                slug: spaceSlug,
                ticker: 'REG',
                timezone: 'UTC',
            },
        });
        console.log(`Space created: ${space.name} (${space.id})`);

        // 2. Setup: Create a Test
        console.log('Creating a test case...');
        const test = await prisma.test.create({
            data: {
                spaceId: space.id,
                name: 'Verify Payment Processing',
                module: 'Payments',
                score: 0,
            },
        });
        console.log(`Test created: ${test.name} (${test.id})`);

        // 3. Setup: Create a Bug in the same module
        console.log('Creating a fixed bug in Payments module...');
        const bug = await prisma.bug.create({
            data: {
                spaceId: space.id,
                summary: 'Payment failure on checkout',
                description: 'Critical payment issue',
                affectedModule: 'Payments',
                status: 'FIXED',
                aiRiskScore: 80, // High risk
            },
        });
        console.log(`Bug created: ${bug.summary} (${bug.id})`);

        // 4. Execution: Calculate Priority
        console.log('Calculating priority...');
        const score = await RegressionService.calculatePriority(test.id);
        console.log(`Calculated Score: ${score}`);

        // 5. Verification
        // Expected: 
        // Recent Bug Factor: 1 bug * 20 = 20
        // Staleness: 100 (never executed)
        // AI Risk: 80
        // Score = (0.5 * 20) + (0.3 * 100) + (0.2 * 80) = 10 + 30 + 16 = 56

        if (score >= 50) {
            console.log('SUCCESS: Priority score is elevated as expected.');
        } else {
            console.error('FAILURE: Priority score is lower than expected.');
        }

        // 6. Update Test with new score
        await prisma.test.update({
            where: { id: test.id },
            data: { score },
        });
        console.log('Test score updated in database.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
