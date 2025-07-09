'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, Sparkles, Bot, FileQuestion, Mic, PenLine, Users, Book, Zap, Target, TrendingUp, Award, Loader2 } from 'lucide-react';


// Floating Icon Component
const FloatingIcon = ({ icon: Icon, className = "", delay = 0 }) => {
  return (
    <div
      className={cn(
        `absolute pointer-events-none opacity-20 animate-float`,
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${6 + delay * 2}s`
      }}
    >
      <Icon className="w-6 h-6 text-white/30" />
    </div>
  );
};

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
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
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'Password reset email sent!',
        description: 'Please check your inbox to reset your password.',
      });
      setEmailSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: 'Request failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const floatingIcons = [
    { icon: Bot, top: '10%', left: '10%', delay: 0 },
    { icon: FileQuestion, top: '20%', right: '15%', delay: 1 },
    { icon: Mic, top: '70%', left: '5%', delay: 2 },
    { icon: PenLine, top: '15%', left: '50%', delay: 3 },
    { icon: Users, bottom: '20%', right: '10%', delay: 4 },
    { icon: Book, bottom: '60%', left: '15%', delay: 5 },
    { icon: Zap, top: '60%', right: '5%', delay: 1.5 },
    { icon: Target, top: '40%', left: '20%', delay: 2.5 },
    { icon: TrendingUp, bottom: '40%', right: '25%', delay: 3.5 },
    { icon: Award, top: '80%', right: '40%', delay: 4.5 },
    { icon: Sparkles, top: '30%', right: '30%', delay: 0.5 }
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Floating Icons Background */}
      {floatingIcons.map((item, index) => (
         <FloatingIcon
          key={index}
          icon={item.icon}
          className={`${item.top ? `top-[${item.top}]` : ''} ${item.bottom ? `bottom-[${item.bottom}]` : ''} ${item.left ? `left-[${item.left}]` : ''} ${item.right ? `right-[${item.right}]` : ''}`}
          delay={item.delay}
        />
      ))}

      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 animate-pulse"></div>
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Glassmorphic Container */}
          <div className="relative">
            {/* Glassmorphic background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"></div>
            
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-sm animate-pulse"></div>
            
            {/* Main content */}
            <div className="relative p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
                <p className="text-white/60">
                    {emailSent
                    ? "An email has been sent. You can close this page."
                    : "Enter your email and we'll send a reset link."}
                </p>
              </div>

              {emailSent ? (
                <div className="text-center text-green-400 p-4 bg-green-500/10 rounded-xl">
                    <p>Password reset link sent successfully!</p>
                </div>
              ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-white/80 text-sm font-medium">Email</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <input
                                    {...field}
                                    type="email"
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                                    placeholder="Enter your email"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-pink-400" />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    </form>
                </Form>
              )}
              
              <div className="text-center">
                <p className="text-white/60 text-sm">
                  Remember your password?
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium ml-1 transition-colors">
                     Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
