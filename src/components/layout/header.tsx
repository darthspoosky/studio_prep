'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserNav } from './user-nav';
import { Button } from '../ui/button';

const Header = () => {
  const { user, loading } = useAuth();

  return (
    <header className="absolute top-0 left-0 w-full z-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="font-headline text-2xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent"
        >
          PrepTalk
        </Link>

        <div className="flex items-center">
          {loading ? null : user ? (
            <UserNav />
          ) : (
            <div className="space-x-2">
              <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
