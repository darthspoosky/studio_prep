
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserProfile, updateUserProfile } from '@/services/profileService';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [examPreference, setExamPreference] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [initialState, setInitialState] = useState({ displayName: '', examPreference: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
        setDisplayName(user.displayName || '');
        setAvatarPreview(user.photoURL || null);
        
        getUserProfile(user.uid).then(profile => {
          const loadedExamPref = profile?.examPreference || '';
          setExamPreference(loadedExamPref);
          setInitialState({ displayName: user.displayName || '', examPreference: loadedExamPref });
        });
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
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: 'destructive',
                title: 'Image too large',
                description: 'Please select an image smaller than 2MB.',
            });
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    const hasTextChanged = displayName !== initialState.displayName || examPreference !== initialState.examPreference;
    const hasAvatarChanged = !!avatarFile;

    if (!hasTextChanged && !hasAvatarChanged) {
        toast({ title: 'No changes to save.' });
        return;
    }

    setIsSaving(true);

    // --- Handle Text Changes Immediately ---
    if (hasTextChanged) {
        try {
            const textUpdatePromises: Promise<any>[] = [];
            if (displayName !== initialState.displayName) {
                textUpdatePromises.push(updateProfile(user, { displayName }));
            }
            if (examPreference !== initialState.examPreference) {
                textUpdatePromises.push(updateUserProfile(user.uid, { examPreference }));
            }
            await Promise.all(textUpdatePromises);
            
            setInitialState({ displayName, examPreference });
            toast({ title: 'Profile details saved.' });
        } catch (error: any) {
            console.error('Profile text update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update failed',
                description: error.message || 'Could not save text-based details.',
            });
        }
    }

    // --- Handle Avatar Upload in the "Background" ---
    if (hasAvatarChanged && avatarFile) {
        setIsUploading(true);
        toast({ title: 'Uploading new avatar...', description: 'This may take a moment. You can continue using the app.' });
        
        const currentAvatarFile = avatarFile;
        setAvatarFile(null);

        (async () => {
            try {
                if (!storage) {
                    toast({
                        variant: 'destructive',
                        title: 'Storage Error',
                        description: 'Firebase storage is not initialized.',
                    });
                    setIsUploading(false);
                    return;
                }
                
                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, currentAvatarFile);
                const photoURL = await getDownloadURL(storageRef);
                
                await updateProfile(user, { photoURL });
                
                toast({ title: 'Avatar updated successfully!' });
            } catch (error: any) {
                 console.error('Avatar upload error:', error);
                 toast({
                    variant: 'destructive',
                    title: 'Avatar upload failed',
                    description: error.message || 'An unexpected error occurred.',
                });
            } finally {
                setIsUploading(false);
            }
        })();
    }

    setIsSaving(false);
  };

  if (loading || !user) {
    return null;
  }

  const isSavingChanges = isSaving;

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
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSavingChanges || isUploading}>
                            {isUploading ? <Loader2 className="animate-spin" /> : null}
                            {isUploading ? 'Uploading...' : 'Change Avatar'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. 2MB max.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSavingChanges} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={user.email || ''} disabled />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="exam-preference">Primary Exam Preference</Label>
                        <Select value={examPreference} onValueChange={setExamPreference} disabled={isSavingChanges}>
                            <SelectTrigger id="exam-preference">
                                <SelectValue placeholder="Select your primary exam" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UPSC Civil Services">UPSC Civil Services</SelectItem>
                                <SelectItem value="State PSC">State PSC</SelectItem>
                                <SelectItem value="RBI Grade B">RBI Grade B</SelectItem>
                                <SelectItem value="CAT / MBA Entrance">CAT / MBA Entrance</SelectItem>
                                <SelectItem value="Bank PO / Clerk">Bank PO / Clerk</SelectItem>
                                <SelectItem value="Other Competitive Exams">Other Competitive Exams</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSavingChanges}>
                    {isSavingChanges && <Loader2 className="animate-spin" />}
                    {isSavingChanges ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
