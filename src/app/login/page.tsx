'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendSignInLinkToEmail } from 'firebase/auth';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { auth } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const passwordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const emailLinkSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailLinkForm = useForm<z.infer<typeof emailLinkSchema>>({
    resolver: zodResolver(emailLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase not configured',
            description: 'Please check your environment variables.',
        });
        setIsLoading(false);
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Logged in successfully!',
        description: "You're now being redirected to the dashboard.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onEmailLinkSubmit(values: z.infer<typeof emailLinkSchema>) {
    setIsLoading(true);
    setLinkSent(false);

    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase not configured',
            description: 'Please check your environment variables.',
        });
        setIsLoading(false);
        return;
    }

    const actionCodeSettings = {
        url: `${window.location.origin}/login/verify`,
        handleCodeInApp: true,
    };

    try {
        await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', values.email);
        setLinkSent(true);
        toast({
            title: 'Sign-in link sent!',
            description: 'Please check your email for the link.',
        });
    } catch (error: any) {
        console.error('Email link error:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to send link',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-32">
            <Card className="w-full max-w-md glassmorphic">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
                    <CardDescription>Sign in with your password or a magic link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="password" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="password">Password</TabsTrigger>
                            <TabsTrigger value="link">Magic Link</TabsTrigger>
                        </TabsList>
                        <TabsContent value="password" className="pt-4">
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                                    <FormField
                                        control={passwordForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="you@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>Password</FormLabel>
                                                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                                        Forgot Password?
                                                    </Link>
                                                </div>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••••" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="animate-spin" />}
                                        Log In
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                        <TabsContent value="link" className="pt-4">
                            {linkSent ? (
                                <div className="text-center p-4 bg-primary/10 rounded-md">
                                    <p className="font-medium text-primary">Link Sent!</p>
                                    <p className="text-muted-foreground text-sm mt-1">Please check your email inbox to complete your sign-in.</p>
                                </div>
                            ) : (
                                <Form {...emailLinkForm}>
                                    <form onSubmit={emailLinkForm.handleSubmit(onEmailLinkSubmit)} className="space-y-6">
                                        <FormField
                                            control={emailLinkForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="you@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading && <Loader2 className="animate-spin" />}
                                            Send Sign-in Link
                                        </Button>
                                    </form>
                                </Form>
                            )}
                        </TabsContent>
                    </Tabs>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-semibold text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  );
}
