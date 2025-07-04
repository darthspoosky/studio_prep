import React from 'react';

const Differentiator = () => {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Built with your voice.
          <br />
          Powered by AI.
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
          We're not just another prep tool. We listen to our community and leverage cutting-edge AI to build the features you actually need to succeed.
        </p>
      </div>
    </section>
  );
};

export default Differentiator;
