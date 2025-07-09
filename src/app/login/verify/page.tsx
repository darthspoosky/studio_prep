'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/header';

export default function VerifyLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<'verifying' | 'promptForEmail' | 'error'>('verifying');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('An unknown error occurred.');

    useEffect(() => {
        const handleSignIn = async (emailToVerify: string | null) => {
            if (!auth) {
                setErrorMsg('Firebase not configured.');
                setStatus('error');
                return;
            }

            if (!isSignInWithEmailLink(auth, window.location.href)) {
                setErrorMsg('This is not a valid sign-in link. It may have expired.');
                setStatus('error');
                return;
            }

            if (!emailToVerify) {
                setStatus('promptForEmail');
                return;
            }

            setIsLoading(true);
            try {
                await signInWithEmailLink(auth, emailToVerify, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                toast({ title: "Successfully signed in!" });
                router.push('/dashboard');
            } catch (error: any) {
                console.error('Email link sign in error:', error);
                setErrorMsg('The sign-in link is invalid or has expired. Please try again.');
                setStatus('error');
                setIsLoading(false);
            }
        };
        
        const emailFromStorage = window.localStorage.getItem('emailForSignIn');
        handleSignIn(emailFromStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('verifying');
        // Re-run the sign-in logic with the provided email
        const handleSignInWithProvidedEmail = async (emailToVerify: string) => {
            if (!auth) {
                setErrorMsg('Firebase not configured.');
                setStatus('error');
                return;
            }
            setIsLoading(true);
            try {
                await signInWithEmailLink(auth, emailToVerify, window.location.href);
                window.localStorage.removeItem('emailForSignIn'); // Clean up just in case
                toast({ title: "Successfully signed in!" });
                router.push('/dashboard');
            } catch (error: any) {
                console.error('Email link sign in error:', error);
                setErrorMsg('The sign-in link is invalid or has expired. Please try again.');
                setStatus('error');
                setIsLoading(false);
            }
        };
        handleSignInWithProvidedEmail(email);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-32">
                <Card className="w-full max-w-md glassmorphic">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">
                            {status === 'verifying' && 'Completing Sign In...'}
                            {status === 'promptForEmail' && 'Confirm Your Email'}
                            {status === 'error' && 'Sign-in Failed'}
                        </CardTitle>
                        <CardDescription>
                            {status === 'promptForEmail' && 'For your security, please re-enter your email to continue.'}
                            {status === 'error' && errorMsg}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {status === 'verifying' && (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            </div>
                        )}
                        {status === 'promptForEmail' && (
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                     {isLoading && <Loader2 className="animate-spin" />}
                                    Confirm and Sign In
                                </Button>
                            </form>
                        )}
                        {status === 'error' && (
                            <Button onClick={() => router.push('/login')} className="w-full">
                                Back to Login
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
