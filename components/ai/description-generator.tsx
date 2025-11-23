'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

interface DescriptionGeneratorProps {
  title: string;
  context?: string;
  type?: 'task' | 'event';
  onGenerated: (description: string) => void;
}

export function DescriptionGenerator({ title, context, type = 'task', onGenerated }: DescriptionGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/ai/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          context,
          type,
        }),
      });

      const data = await response.json();

      if (data.success && data.description) {
        onGenerated(data.description);
      } else {
        alert(data.message || 'Failed to generate description');
      }
    } catch (error) {
      console.error('Description generation error:', error);
      alert('Failed to generate description. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGenerate}
      disabled={loading || !title.trim()}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </>
      )}
    </Button>
  );
}

