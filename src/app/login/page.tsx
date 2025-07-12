'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Eye, EyeOff, Mail, Lock, Github, Chrome, ArrowRight, Sparkles, Bot, FileQuestion, Mic, PenLine, Users, Book, Zap, Target, TrendingUp, Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


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
        animationDuration: `${6 + delay * 2}s` // Vary duration
      }}
    >
      <Icon className="w-6 h-6 text-white/30" />
    </div>
  );
};


// Zod Schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(activeTab === 'login' ? loginSchema : signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const { handleSubmit, control, trigger, reset } = form;

  React.useEffect(() => {
    reset({
        email: '',
        password: '',
        confirmPassword: ''
    });
    trigger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  const onSubmit = async (data: any) => {
    setIsLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: 'Firebase not configured.' });
        setIsLoading(false);
        return;
    }

    if (activeTab === 'login') {
      try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: 'Logged in successfully!', description: "Redirecting to your dashboard..." });
        router.push('/dashboard');
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
      } finally {
        setIsLoading(false);
      }
    } else { // signup
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: 'Account created!', description: "Redirecting to your dashboard..." });
        router.push('/dashboard');
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Sign Up Failed', description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
  };


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
      
      {/* Left Side - Hero Section */}
      <div className="hidden md:flex flex-1 items-center justify-center p-8 relative">
        <div className="max-w-md text-center space-y-8">
          {/* Logo */}
          <div className="space-y-4">
            <div className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent animate-pulse">
                PrepTalk
              </h1>
              <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mx-auto mt-2 animate-shimmer"></div>
            </div>
            
            <p className="text-lg text-white/70 leading-relaxed">
              Your AI-powered companion for <span className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text font-semibold">UPSC preparation</span>
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/60">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-sm">AI-powered mock interviews</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Daily newspaper analysis</span>
            </div>
            <div className="flex items-center gap-3 text-white/60">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Personalized study plans</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-xs text-white/50">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">95%</div>
              <div className="text-xs text-white/50">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">4.9</div>
              <div className="text-xs text-white/50">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                    {activeTab === 'login' ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-white/60">
                    {activeTab === 'login' ? "Sign in to continue your UPSC journey" : "Join PrepTalk and start preparing smarter"}
                </p>
              </div>

              {/* Tab switcher */}
              <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'register'
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Social login buttons */}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <Chrome className="w-5 h-5" />
                  Continue with Google
                </button>
                <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 text-white font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <span className="text-white/40 text-sm">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>

              {/* Login Form */}
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={control}
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
                        <FormMessage className="text-pink-400" id={field.name + '-error'} role="alert" />
                        </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80 text-sm font-medium">Password</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your password"
                                />
                                <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage className="text-pink-400" id={field.name + '-error'} role="alert" />
                      </FormItem>
                    )}
                  />
                  
                  {activeTab === 'register' && (
                    <FormField
                        control={control}
                        name="confirmPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white/80 text-sm font-medium">Confirm Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <input
                                    {...field}
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                                    placeholder="Confirm your password"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-pink-400" id={field.name + '-error'} role="alert" />
                        </FormItem>
                        )}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/50" />
                      <span className="text-white/60 text-sm">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 ${
                      isLoading
                        ? 'bg-gradient-to-r from-purple-500/50 to-cyan-500/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin"/>
                        Processing...
                      </>
                    ) : (
                      <>
                        {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </Form>
              
              {/* Footer */}
              <div className="text-center">
                <p className="text-white/60 text-sm">
                  {activeTab === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                    className="text-purple-400 hover:text-purple-300 font-medium ml-1 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded"
                    aria-label={`Switch to ${activeTab === 'login' ? 'sign up' : 'sign in'} form`}
                  >
                    {activeTab === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
