'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock } from 'lucide-react';
import YearGrid from '../components/past-year/YearGrid';
import SyllabusBrowser from '../components/past-year/SyllabusBrowser';

export default function PastYearPage() {
  const [activeTab, setActiveTab] = useState<string>('by-year');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Past Year Question Bank</h1>
        <p className="text-gray-600 mb-8">
          Practice with authentic UPSC previous year questions organized by year and syllabus section.
        </p>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="by-year" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" /> Browse by Year
              </TabsTrigger>
              <TabsTrigger value="by-syllabus" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" /> Browse by Syllabus
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="by-year" className="mt-0">
              <YearGrid />
            </TabsContent>
            
            <TabsContent value="by-syllabus" className="mt-0">
              <SyllabusBrowser />
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Study Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Focus on understanding the logic behind each answer rather than just memorizing.</li>
            <li>Review your incorrect answers to identify knowledge gaps.</li>
            <li>Practice regularly with questions from different years to identify patterns.</li>
            <li>Pay special attention to recurring topics across multiple years.</li>
            <li>Track your progress over time to see improvement in your weak areas.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
