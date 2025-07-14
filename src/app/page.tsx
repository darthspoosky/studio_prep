import Header from '@/components/layout/header';
import Hero from '@/components/landing/hero';
import ToolsShowcase from '@/components/landing/tools-showcase';
import FeedbackWall from '@/components/landing/feedback-wall';
import Differentiator from '@/components/landing/differentiator';
import Footer from '@/components/landing/footer';
import { getGlobalUsage } from '@/services/usageService';
import { isFirestoreInitialized } from '@/lib/firebase';

export default async function Home() {
  // Get global usage with fallback to mock data if Firebase isn't available
  let globalUsage;
  
  try {
    if (isFirestoreInitialized()) {
      globalUsage = await getGlobalUsage();
    } else {
      // Fallback to realistic mock data if Firebase isn't initialized
      console.log('Firebase not initialized, using mock data');
      globalUsage = {
        dailyQuiz: 156,
        newspaperAnalysis: 342,
        mockInterview: 89,
        writingPractice: 67
      };
    }
  } catch (error) {
    console.error('Error fetching global usage:', error);
    // Fallback to mock data on error
    globalUsage = {
      dailyQuiz: 156,
      newspaperAnalysis: 342,
      mockInterview: 89,
      writingPractice: 67
    };
  }

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
