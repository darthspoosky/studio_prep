import Link from 'next/link';
import { Twitter, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding Section */}
          <div className="md:col-span-1">
            <h3 className="font-headline text-2xl font-bold">
              <Link href="/" className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                PrepTalk
              </Link>
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">Built with your voice. Powered by AI.</p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#tools" className="text-muted-foreground hover:text-primary transition-colors text-sm">Features</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Updates</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PrepTalk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
