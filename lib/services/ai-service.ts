import { prisma } from '@/lib/prisma';

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

interface BugAnalysisResult {
    riskScore: number;
    affectedModule?: string;
}

export class AIService {
    /**
     * Analyzes a bug's summary and description to determine risk score and affected module.
     */
    static async analyzeBugRisk(summary: string, description: string | null): Promise<BugAnalysisResult> {
        if (!GROK_API_KEY) {
            console.warn('GROK_API_KEY not found, using fallback heuristic.');
            return this.heuristicAnalysis(summary, description);
        }

        try {
            const prompt = `
        Analyze the following bug report and provide a risk score (0-100) and the affected module.
        Risk score should be based on severity, potential impact on core features (like Payments, Auth), and complexity.
        
        Bug Summary: ${summary}
        Bug Description: ${description || 'No description provided.'}
        
        Return ONLY a JSON object in this format:
        {
          "riskScore": number,
          "affectedModule": "string (e.g., Payments, Auth, UI, Reports)"
        }
      `;

            const response = await fetch(GROK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are a QA expert assistant." },
                        { role: "user", content: prompt }
                    ],
                    model: "grok-beta",
                    stream: false,
                    temperature: 0
                })
            });

            if (!response.ok) {
                throw new Error(`Grok API error: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Extract JSON from code block if present
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : content;

            const result = JSON.parse(jsonString);

            return {
                riskScore: Math.min(100, Math.max(0, result.riskScore || 50)),
                affectedModule: result.affectedModule || 'Unknown'
            };

        } catch (error) {
            console.error('AI Analysis failed:', error);
            return this.heuristicAnalysis(summary, description);
        }
    }

    /**
     * Fallback heuristic analysis when API is unavailable.
     */
    private static heuristicAnalysis(summary: string, description: string | null): BugAnalysisResult {
        const text = `${summary} ${description || ''}`.toLowerCase();
        let score = 50;
        let module = 'General';

        // Keyword based scoring
        if (text.includes('crash') || text.includes('critical') || text.includes('blocker')) score += 30;
        if (text.includes('payment') || text.includes('billing')) {
            score += 20;
            module = 'Payments';
        }
        if (text.includes('login') || text.includes('auth')) {
            score += 20;
            module = 'Auth';
        }
        if (text.includes('ui') || text.includes('css') || text.includes('style')) {
            score -= 10;
            module = 'UI';
        }

        return {
            riskScore: Math.min(100, Math.max(0, score)),
            affectedModule: module
        };
    }
}
