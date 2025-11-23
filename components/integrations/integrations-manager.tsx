'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import { 
  Loader2, 
  Slack, 
  Cloud, 
  Github, 
  Zap,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  settings?: any;
}

interface IntegrationsManagerProps {
  spaceSlug?: string;
}

export function IntegrationsManager({ spaceSlug }: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get task notifications and updates in your Slack channels',
      icon: <Slack className="h-5 w-5" />,
      status: 'disconnected',
      lastSync: undefined
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Attach files from Google Drive to tasks and projects',
      icon: <Cloud className="h-5 w-5" />,
      status: 'disconnected',
      lastSync: undefined
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Link commits and pull requests to tasks',
      icon: <Github className="h-5 w-5" />,
      status: 'disconnected',
      lastSync: undefined
    }
  ]);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const connectIntegration = async (integrationId: string) => {
    try {
      setLoading(integrationId);
      setError('');

      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId,
          spaceSlug
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIntegrations(prev => 
          prev.map(integration => 
            integration.id === integrationId 
              ? { 
                  ...integration, 
                  status: 'connected',
                  lastSync: new Date().toISOString(),
                  settings: data.settings
                }
              : integration
          )
        );
      } else {
        setError(data.message || 'Failed to connect integration');
      }
    } catch (err) {
      setError('Failed to connect integration');
    } finally {
      setLoading(null);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      setLoading(integrationId);
      setError('');

      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId,
          spaceSlug
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIntegrations(prev => 
          prev.map(integration => 
            integration.id === integrationId 
              ? { 
                  ...integration, 
                  status: 'disconnected',
                  lastSync: undefined,
                  settings: undefined
                }
              : integration
          )
        );
      } else {
        setError(data.message || 'Failed to disconnect integration');
      }
    } catch (err) {
      setError('Failed to disconnect integration');
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <XCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Integrations
          </h2>
          <p className="text-muted-foreground">
            {spaceSlug ? 'Connect third-party services for this space' : 'Connect third-party services'}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {integration.icon}
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 ${getStatusColor(integration.status)}`}>
                    {getStatusIcon(integration.status)}
                    <span className="text-xs font-medium capitalize">
                      {integration.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {integration.lastSync && (
                <p className="text-xs text-muted-foreground mb-4">
                  Last sync: {new Date(integration.lastSync).toLocaleString()}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectIntegration(integration.id)}
                      disabled={loading === integration.id}
                    >
                      {loading === integration.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Disconnect'
                      )}
                    </Button>
                  )}
                  
                  {integration.status === 'disconnected' && (
                    <Button
                      onClick={() => connectIntegration(integration.id)}
                      disabled={loading === integration.id}
                    >
                      {loading === integration.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
                
                {integration.status === 'connected' && (
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Settings</CardTitle>
          <CardDescription>
            Configure how integrations work with your tasks and projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto-sync tasks</h4>
              <p className="text-sm text-muted-foreground">
                Automatically sync task updates to connected services
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Send notifications to integrated services
              </p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">File attachments</h4>
              <p className="text-sm text-muted-foreground">
                Allow file attachments from integrated services
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
