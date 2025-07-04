import React from 'react';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="absolute top-0 left-0 w-full z-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <Link href="/" className="font-headline text-2xl font-bold text-foreground transition-colors hover:text-primary">
          PrepTalk
        </Link>
      </div>
    </header>
  );
};

export default Header;
