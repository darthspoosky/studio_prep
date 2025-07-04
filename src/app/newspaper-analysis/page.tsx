import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';

export default function NewspaperAnalysisPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold">Newspaper Analysis</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Analyze news articles to improve your comprehension and critical thinking skills.</p>
        </div>
        <div className="mt-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
            <p className="text-muted-foreground">Newspaper Analysis Tool Coming Soon!</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
