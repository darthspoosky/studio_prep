
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type Question } from '@/types/quiz';
import { uploadBulkPastYearQuestions } from '@/services/adminService';

// In a real app, this should come from a secure source like custom claims
const ADMIN_UID = 'qjDA9FVi48QidKnbYjMEkdFf3QP2'; 

const exampleJson = `
[
  {
    "question": "Which of the following statements about the Indus Valley Civilization is correct?",
    "options": [
      { "id": "a", "text": "It was primarily a rural civilization." },
      { "id": "b", "text": "The use of iron was widespread." },
      { "id": "c", "text": "They had a well-planned urban layout." },
      { "id": "d", "text": "Horses were central to their society." }
    ],
    "correctOptionId": "c",
    "explanation": "The Indus Valley Civilization is renowned for its sophisticated urban planning, with cities like Harappa and Mohenjo-Daro featuring grid-like street patterns and advanced drainage systems.",
    "year": 2021,
    "subject": "History",
    "topic": "Ancient History",
    "difficulty": "easy",
    "metadata": {
      "syllabusSectionId": "gs-history-ancient"
    }
  }
]
`;

export default function AdminUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.uid !== ADMIN_UID) {
        toast({
          variant: 'destructive',
          title: 'Unauthorized',
          description: 'You do not have permission to access this page.',
        });
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router, toast]);

  const handleUpload = async () => {
    let questions: Question[];
    try {
      questions = JSON.parse(jsonInput);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Input must be a non-empty array of questions.');
      }
      // Basic validation of the first question object
      const firstQuestion = questions[0];
      if (!firstQuestion.question || !firstQuestion.options || !firstQuestion.correctOptionId || !firstQuestion.year) {
          throw new Error('Each question object is missing required fields.');
      }

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Invalid JSON format',
        description: error.message || 'Please check the format and try again.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const count = await uploadBulkPastYearQuestions(questions);
      toast({
        title: 'Upload Successful',
        description: `${count} questions have been successfully added to the database.`,
      });
      setJsonInput('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload questions to the database.',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  if (loading || !isAuthorized) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Admin Material Uploader</CardTitle>
              <CardDescription>
                Bulk upload Past Year Questions to Firestore. Paste a valid JSON array of question objects below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Example JSON Structure:</h3>
                <pre className="p-4 bg-muted text-muted-foreground rounded-md text-xs overflow-x-auto">
                  <code>{exampleJson.trim()}</code>
                </pre>
              </div>
              <div className="space-y-2">
                <label htmlFor="json-input" className="font-semibold">Questions JSON</label>
                <Textarea
                  id="json-input"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON array here..."
                  className="h-64 font-mono text-sm"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpload} disabled={isUploading || !jsonInput}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Uploading...' : 'Upload Questions'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
