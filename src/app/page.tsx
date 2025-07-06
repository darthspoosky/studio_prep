import Header from '@/components/layout/header';
import Hero from '@/components/landing/hero';
import ToolsShowcase from '@/components/landing/tools-showcase';
import FeedbackWall from '@/components/landing/feedback-wall';
import Differentiator from '@/components/landing/differentiator';
import SurveyCTA from '@/components/landing/survey-cta';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <ToolsShowcase />
        <FeedbackWall />
        <Differentiator />
        <SurveyCTA />
      </main>
      <Footer />
    </div>
  );
}
