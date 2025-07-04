import Header from '@/components/layout/header';
import Hero from '@/components/landing/hero';
import Tools from '@/components/landing/tools';
import Differentiator from '@/components/landing/differentiator';
import FeedbackWall from '@/components/landing/feedback-wall';
import SurveyCTA from '@/components/landing/survey-cta';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <Tools />
        <Differentiator />
        <FeedbackWall />
        <SurveyCTA />
      </main>
      <Footer />
    </div>
  );
}
