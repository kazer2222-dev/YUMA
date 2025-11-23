'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Loader2, 
  Sparkles, 
  Lightbulb, 
  Wand2, 
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface AISuggestionProps {
  spaceSlug: string;
  onSuggestionAccepted?: (suggestion: any) => void;
}

export function AISuggestions({ spaceSlug, onSuggestionAccepted }: AISuggestionProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'task_suggestion',
          context: {
            spaceId: spaceSlug,
            projectType: 'task-management'
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions.tasks || []);
      } else {
        setError(data.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      setError('Failed to fetch AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = (suggestion: any) => {
    onSuggestionAccepted?.(suggestion);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const rejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Task Suggestions</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>
        <CardDescription>
          AI-powered task suggestions based on your project context
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Generate" to get AI-powered task suggestions</p>
          </div>
        )}

        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium">{suggestion.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {suggestion.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                  >
                    {suggestion.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ~{suggestion.estimatedHours}h
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => acceptSuggestion(suggestion)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectSuggestion(suggestion.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

