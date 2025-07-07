'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // State for form fields
  const [displayName, setDisplayName] = useState('');
  const [examPreference, setExamPreference] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
        setDisplayName(user.displayName || '');
        setAvatarPreview(user.photoURL || null);
    }
  }, [user, loading, router]);

  const getInitials = (email: string | null) => {
    const name = user?.displayName || email;
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024) { // 1MB limit
            toast({
                variant: 'destructive',
                title: 'Image too large',
                description: 'Please select an image smaller than 1MB.',
            });
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
        let photoURL = user.photoURL;
        let profileUpdated = false;

        // 1. Upload new avatar if it exists
        if (avatarFile) {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, avatarFile);
            photoURL = await getDownloadURL(storageRef);
            profileUpdated = true;
        }

        // 2. Check if display name has changed
        if (displayName !== (user.displayName || '')) {
            profileUpdated = true;
        }

        // 3. Update profile if anything changed
        if (profileUpdated) {
            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL,
            });
            toast({
                title: 'Profile updated!',
                description: 'Your changes have been saved successfully.',
            });
        } else {
             toast({
                title: 'No changes detected.',
                description: 'Your profile information is already up to date.',
            });
        }
    } catch (error: any) {
        console.error('Profile update error:', error);
        toast({
            variant: 'destructive',
            title: 'Update failed',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (loading || !user) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Link>
        <div className="max-w-2xl mx-auto">
          <Card className="glassmorphic shadow-2xl shadow-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Your Profile</CardTitle>
              <CardDescription>Manage your account settings and personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || ''} />
                        <AvatarFallback className="text-3xl">
                            {getInitials(user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Change Avatar</Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={user.email || ''} disabled />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="exam-preference">Primary Exam Preference</Label>
                        <Input id="exam-preference" placeholder="e.g., UPSC Civil Services" value={examPreference} onChange={(e) => setExamPreference(e.target.value)} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
