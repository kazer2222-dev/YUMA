'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loading } from '@/components/loading';
import { useToastHelpers } from '@/components/toast';
import { Brain, Sparkles, Zap, FileText, CheckCircle, Loader2, Send, Image as ImageIcon } from 'lucide-react';

interface AIAssistantProps {
  spaceId?: string;
  context?: 'task' | 'space' | 'global';
}

export function AIAssistant({ spaceId, context = 'global' }: AIAssistantProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'suggest' | 'generate'>('chat');
  const { success, error: showError } = useToastHelpers();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          spaceId,
          context,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response, 
          timestamp: new Date() 
        }]);
      } else {
        showError('AI Error', data.message || 'Failed to get AI response');
      }
    } catch (err) {
      showError('Network Error', 'Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setInput(action);
    // Auto-send quick actions
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-notion-purple" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get help with tasks, generate content, and get suggestions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={mode === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('chat')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Chat
              </Button>
              <Button
                variant={mode === 'suggest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('suggest')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Suggest
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Actions */}
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Suggest tasks for my current project')}
              >
                <FileText className="h-3 w-3 mr-2" />
                Suggest Tasks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Help me prioritize my tasks')}
              >
                <CheckCircle className="h-3 w-3 mr-2" />
                Prioritize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Generate a project roadmap')}
              >
                <Sparkles className="h-3 w-3 mr-2" />
                Roadmap
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI assistant</p>
                <p className="text-sm mt-2">Ask questions, get suggestions, or generate content</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-notion-blue text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              className="min-h-[60px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-[60px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// AI Auto-suggestions component
export function AIAutoSuggestions({ taskId, spaceId }: { taskId?: string; spaceId?: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task_suggestion',
          context: { taskId, spaceId },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading size="sm" text="Generating suggestions..." />;
  }

  return (
    <div className="space-y-2">
      {suggestions.length > 0 && (
        <>
          <p className="text-sm font-medium text-muted-foreground">AI Suggestions:</p>
          {suggestions.map((suggestion, idx) => (
            <Card key={idx} className="notion-card-hover cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    {suggestion.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ~{suggestion.estimatedHours}h
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
      <Button variant="outline" size="sm" onClick={fetchSuggestions} className="w-full">
        <Sparkles className="h-4 w-4 mr-2" />
        Get AI Suggestions
      </Button>
    </div>
  );
}
















