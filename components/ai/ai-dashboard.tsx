'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AISuggestions } from '../ai/ai-suggestions';
import { MockupGenerator } from '../ai/mockup-generator';
import { Sparkles, Lightbulb, Wand2, Brain } from 'lucide-react';

interface AIDashboardProps {
  spaceSlug?: string;
}

export function AIDashboard({ spaceSlug }: AIDashboardProps) {
  const [activeTab, setActiveTab] = useState('suggestions');

  const handleSuggestionAccepted = (suggestion: any) => {
    console.log('Suggestion accepted:', suggestion);
    // In a real implementation, this would create a task
  };

  const handleMockupGenerated = (mockup: any) => {
    console.log('Mockup generated:', mockup);
    // In a real implementation, this would save the mockup
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Assistant
          </h2>
          <p className="text-muted-foreground">
            {spaceSlug ? 'AI-powered features for this space' : 'AI-powered features across all spaces'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Smart Suggestions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get AI-powered task and workflow suggestions based on your project context.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Mockup Generation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate UI mockups and wireframes automatically based on your requirements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Auto-Optimization</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatically optimize workflows, priorities, and resource allocation.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Smart Suggestions
          </TabsTrigger>
          <TabsTrigger value="mockups" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Mockup Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-6">
          <AISuggestions 
            spaceSlug={spaceSlug || ''} 
            onSuggestionAccepted={handleSuggestionAccepted}
          />
        </TabsContent>

        <TabsContent value="mockups" className="space-y-6">
          <MockupGenerator 
            spaceSlug={spaceSlug || ''} 
            onMockupGenerated={handleMockupGenerated}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
















