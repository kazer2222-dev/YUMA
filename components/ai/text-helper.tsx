'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Sparkles, Languages, CheckCircle, ArrowLeftRight } from 'lucide-react';

interface TextHelperProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'input' | 'textarea';
}

export function TextHelper({ value, onChange, placeholder, className, type = 'input' }: TextHelperProps) {
  const [action, setAction] = useState<'correct' | 'improve' | 'translate'>('correct');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [loading, setLoading] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleAction = async () => {
    if (!value.trim() || loading) return;

    setLoading(true);
    setOriginalText(value);

    try {
      const response = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: value,
          action,
          targetLanguage: action === 'translate' ? targetLanguage : undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        onChange(data.result);
        setPopoverOpen(false);
      } else {
        alert(data.message || 'Failed to process text');
      }
    } catch (error) {
      console.error('Text processing error:', error);
      alert('Failed to process text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = () => {
    if (originalText) {
      onChange(originalText);
      setOriginalText('');
      setPopoverOpen(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          {type === 'textarea' ? (
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="min-h-[80px]"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          )}
        </div>
        {value.trim() && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Sparkles className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Text Helper</span>
                  {originalText && (
                    <Button
                      onClick={handleRevert}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      Revert
                    </Button>
                  )}
                </div>
                
                <Select value={action} onValueChange={(v: any) => setAction(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="correct">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Correct
                      </div>
                    </SelectItem>
                    <SelectItem value="improve">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Improve
                      </div>
                    </SelectItem>
                    <SelectItem value="translate">
                      <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        Translate
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {action === 'translate' && (
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Russian">Russian</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  onClick={handleAction}
                  disabled={loading || !value.trim()}
                  size="sm"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Apply {action === 'correct' ? 'Correction' : action === 'improve' ? 'Improvement' : 'Translation'}
                    </>
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

