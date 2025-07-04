import { Rocket, Mail } from 'lucide-react';

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm4 0c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm-8.5-5.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm9 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="font-headline text-2xl font-bold text-white">PrepTalk</h3>
            <p className="text-sm text-gray-400">Built with your voice. Powered by AI.</p>
          </div>
          <nav className="flex space-x-6">
            <a href="#" className="flex items-center space-x-2 hover:text-white transition-colors">
              <Rocket className="w-4 h-4" />
              <span>Roadmap</span>
            </a>
            <a href="#" className="flex items-center space-x-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </a>
            <a href="#" className="flex items-center space-x-2 hover:text-white transition-colors">
              <DiscordIcon className="w-5 h-5" />
              <span>Discord</span>
            </a>
          </nav>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PrepTalk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
