import Header from '@/components/layout/header';
import Footer from '@/components/landing/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto glassmorphic">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  This is the Cookie Policy page. Content for this section will be added soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
