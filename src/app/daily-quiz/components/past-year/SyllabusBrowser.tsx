import React, { useEffect, useState } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PastYearQuestionService from '@/services/pastYearQuestionService';

type SyllabusSection = {
  id: string;
  name: string;
  parentId?: string;
  children?: SyllabusSection[];
};

export default function SyllabusBrowser() {
  const [sections, setSections] = useState<SyllabusSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadSyllabusSections() {
      try {
        setLoading(true);
        const fetchedSections = await PastYearQuestionService.getAvailableSyllabusSections();
        setSections(fetchedSections);
        setError(null);
      } catch (err) {
        setError('Failed to load syllabus sections. Please try again.');
        console.error('Error loading syllabus sections:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSyllabusSections();
  }, []);

  const handleSectionSelect = (sectionId: string) => {
    router.push(`/daily-quiz/past-year/section/${sectionId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <div className="pl-4 space-y-2">
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <BookOpen className="mr-2" size={24} />
        Browse by Syllabus Section
      </h2>
      <Accordion type="multiple" className="w-full">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-md">
              <div className="flex justify-between items-center w-full pr-4">
                <span className="font-medium">{section.name}</span>
                <Badge variant="outline" className="ml-2">
                  {section.children?.length || 0} topics
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-4 space-y-2 py-2">
                {section.children?.map((child) => (
                  <div 
                    key={child.id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    onClick={() => handleSectionSelect(child.id)}
                  >
                    <span className="text-sm flex-1">{child.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSectionSelect(child.id);
                      }}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                ))}
                
                {/* View all questions in this main section */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => handleSectionSelect(section.id)}
                >
                  View all {section.name} questions
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
