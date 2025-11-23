'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Loader2, 
  Wand2, 
  Download,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface MockupGeneratorProps {
  spaceSlug: string;
  onMockupGenerated?: (mockup: any) => void;
}

export function MockupGenerator({ spaceSlug, onMockupGenerated }: MockupGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [mockupType, setMockupType] = useState('wireframe');
  const [generatedMockup, setGeneratedMockup] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateMockup = async () => {
    if (!prompt.trim()) {
      setError('Please provide a description for the mockup');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/ai/mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          type: mockupType,
          context: {
            spaceId: spaceSlug,
            projectType: 'task-management'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedMockup(data.mockup);
        onMockupGenerated?.(data.mockup);
      } else {
        setError(data.message || 'Failed to generate mockup');
      }
    } catch (err) {
      setError('Failed to generate mockup');
    } finally {
      setLoading(false);
    }
  };

  const downloadMockup = () => {
    if (generatedMockup?.url) {
      window.open(generatedMockup.url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          <CardTitle>UI Mockup Generator</CardTitle>
        </div>
        <CardDescription>
          Generate UI mockups and wireframes based on your requirements
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mockup-type">Mockup Type</Label>
            <div className="flex gap-2">
              {['wireframe', 'high-fidelity', 'prototype'].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={mockupType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMockupType(type)}
                  className="capitalize"
                >
                  {type.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mockup-prompt">Description</Label>
            <Textarea
              id="mockup-prompt"
              placeholder="Describe the UI mockup you want to generate. For example: 'A dashboard page with task cards, a sidebar navigation, and a header with user profile'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            onClick={generateMockup}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Mockup
              </>
            )}
          </Button>
        </div>

        {generatedMockup && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Generated Mockup</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadMockup}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/50">
              {generatedMockup.url ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-background border rounded-md flex items-center justify-center overflow-hidden">
                    <img
                      src={generatedMockup.url}
                      alt={generatedMockup.description || 'Generated mockup'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {generatedMockup.description && (
                    <p className="text-sm text-muted-foreground">
                      {generatedMockup.description}
                    </p>
                  )}
                  {generatedMockup.type && (
                    <Badge variant="outline" className="text-xs">
                      {generatedMockup.type}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Mockup generated successfully</p>
                  {generatedMockup.description && (
                    <p className="text-sm mt-2">{generatedMockup.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!generatedMockup && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter a description and click "Generate Mockup" to create a UI mockup</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}














