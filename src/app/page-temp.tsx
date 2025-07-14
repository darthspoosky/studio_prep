import Header from '@/components/layout/header';
import Hero from '@/components/landing/hero';
import ToolsShowcase from '@/components/landing/tools-showcase';
import FeedbackWall from '@/components/landing/feedback-wall';
import Differentiator from '@/components/landing/differentiator';
import Footer from '@/components/landing/footer';

export default function Home() {
  // Use mock data instead of Firebase call
  const globalUsage = {
    dailyQuiz: 2,
    newspaperAnalysis: 29
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <ToolsShowcase globalUsage={globalUsage} />
        <FeedbackWall />
        <Differentiator />
      </main>
      <Footer />
    </div>
  );
}