'use client';

import { useEffect, useState } from 'react';
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

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email[0].toUpperCase();
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    // Simulate API call while feature is in development
    setTimeout(() => {
        toast({
            title: 'Coming Soon!',
            description: 'Profile saving functionality is under development.',
        });
        setIsSaving(false);
    }, 1000);
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
                        <AvatarImage data-ai-hint="person" src="https://placehold.co/80x80.png" />
                        <AvatarFallback className="text-3xl">
                            {getInitials(user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <Button variant="outline">Change Avatar (Soon)</Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="Your Name" defaultValue={user.displayName || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={user.email || ''} disabled />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="exam-preference">Primary Exam Preference</Label>
                        <Input id="exam-preference" placeholder="e.g., UPSC Civil Services" />
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
