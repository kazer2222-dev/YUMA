'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { NotionLayout } from '@/components/layout/notion-layout';
import { User, Trash2, Upload, Loader2, Bell, Globe, Save } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface Space {
  id: string;
  name: string;
  description?: string;
  slug: string;
  ticker: string;
  memberCount: number;
  taskCount: number;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Form state
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<string>('');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, spacesRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/spaces', { credentials: 'include' })
        ]);

        const userData = await userRes.json();
        const spacesData = await spacesRes.json();

        if (userData.success) {
          const userInfo = userData.user;
          setUser(userInfo);
          setProfileName(userInfo.name || '');
          setProfileAvatar(userInfo.avatar || '');
        } else {
          router.push('/auth');
          return;
        }

        if (spacesData.success) {
          setSpaces(spacesData.spaces || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch profile data:', err);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotifications = localStorage.getItem('yuma_notifications_enabled');
      const savedLanguage = localStorage.getItem('yuma_language');
      
      if (savedNotifications !== null) {
        setNotifications(savedNotifications === 'true');
      }
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('yuma_remembered_user');
          localStorage.removeItem('yuma_notifications_enabled');
          localStorage.removeItem('yuma_language');
        }
        router.push('/auth');
      } else {
        setError('Failed to logout');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to logout');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      // Convert to base64 for now (in production, upload to a storage service)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfileAvatar(base64String);
        
        // Save to database
        await saveProfile({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error processing avatar:', err);
      setError('Failed to process image');
    }
  };

  const saveProfile = async (updates?: { avatar?: string }) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: profileName,
          avatar: updates?.avatar || profileAvatar,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile updated successfully');
        setUser(data.user);
        if (data.user.name) setProfileName(data.user.name);
        if (data.user.avatar) setProfileAvatar(data.user.avatar);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await saveProfile();
  };

  const handleNotificationsChange = (checked: boolean) => {
    setNotifications(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yuma_notifications_enabled', checked.toString());
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yuma_language', value);
    }
    // Trigger a reload or update UI language
    // In a real app, you'd use a translation library like i18next
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        // Clear all local data
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        // Redirect to auth page
        router.push('/auth');
      } else {
        setError(data.message || 'Failed to delete account');
        setDeleteDialogOpen(false);
      }
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const userInitial = (user.name || user.email)?.charAt(0)?.toUpperCase() || 'A';

  return (
    <NotionLayout
      spaces={spaces || []}
      user={user}
      onLogout={handleLogout}
      onCreateSpace={async () => {
        const res = await fetch('/api/spaces', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setSpaces(data.spaces || []);
        }
      }}
      pageTitle="Profile"
      pageSubtitle="Manage your account settings"
      breadcrumbs={[{ name: 'Profile' }]}
      onRefreshSpaces={async () => {
        const res = await fetch('/api/spaces', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setSpaces(data.spaces || []);
        }
      }}
      actions={[]}
    >
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
            <p className="font-medium">Success</p>
            <p className="text-sm mt-1">{success}</p>
          </div>
        )}

        {/* Profile Image Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Image
            </CardTitle>
            <CardDescription>
              Upload a profile image to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileAvatar} alt={user.name || user.email} />
                <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Name Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Name</CardTitle>
            <CardDescription>
              Change your display name
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about tasks and updates
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={handleNotificationsChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>
              Choose your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Delete Account Section */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers. All your spaces,
                    tasks, and other information will be lost forever.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </NotionLayout>
  );
}



