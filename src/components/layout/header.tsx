import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="absolute top-0 left-0 w-full z-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <Link
          href="/"
          className="font-headline text-2xl font-bold animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent"
        >
          PrepTalk
        </Link>
      </div>
    </header>
  );
};

export default Header;
