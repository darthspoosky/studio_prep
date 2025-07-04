import Header from '@/components/layout/header';
import Hero from '@/components/landing/hero';
import Explore from '@/components/landing/explore';
import Tools from '@/components/landing/tools';
import FeedbackWall from '@/components/landing/feedback-wall';
import SurveyCTA from '@/components/landing/survey-cta';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <Explore />
        <section id="tools">
          <Tools />
        </section>
        <FeedbackWall />
        <SurveyCTA />
      </main>
      <Footer />
    </div>
  );
}
