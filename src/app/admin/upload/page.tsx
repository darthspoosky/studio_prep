
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, Image, Book, Newspaper, Users, BarChart3, AlertCircle, CheckCircle, X, Wand2 } from 'lucide-react';
import { type Question } from '@/types/quiz';
import { uploadBulkPastYearQuestions, uploadContentByType } from '@/services/adminService';

// In a real app, this should come from a secure source like custom claims
const ADMIN_UID = 'qjDA9FVi48QidKnbYjMEkdFf3QP2';

// Content types for admin upload
type ContentType = 'questions' | 'pdf-to-quiz' | 'books' | 'images' | 'news' | 'syllabus' | 'users' | 'analytics';

// Upload status tracking
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  success: boolean;
  count?: number;
  errors?: string[];
  message?: string;
  data?: any;
} 

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
  const [activeTab, setActiveTab] = useState<ContentType>('questions');
  const [jsonInput, setJsonInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfToQuizConfig, setPdfToQuizConfig] = useState({ examType: 'prelims', questionCount: 10 });
  const [extractedQuestions, setExtractedQuestions] = useState<Question[] | null>(null);


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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileInput(file);
      if (activeTab === 'pdf-to-quiz') {
        setExtractedQuestions(null); // Reset extracted questions if a new file is chosen
      }
    }
  };

  const handleJsonUpload = async () => {
    if (activeTab !== 'questions') return;
    
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

    setUploadStatus('uploading');
    try {
      const count = await uploadBulkPastYearQuestions(questions);
      const result: UploadResult = {
        success: true,
        count,
        message: `${count} questions uploaded successfully`
      };
      setUploadResults(prev => [...prev, result]);
      setUploadStatus('success');
      toast({
        title: 'Upload Successful',
        description: `${count} questions have been successfully added to the database.`,
      });
      setJsonInput('');
    } catch (error: any) {
      const result: UploadResult = {
        success: false,
        errors: [error.message || 'Upload failed']
      };
      setUploadResults(prev => [...prev, result]);
      setUploadStatus('error');
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload questions to the database.',
      });
    }
  };

  const handlePdfToQuizConversion = async () => {
    if (!fileInput) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a PDF file to convert.' });
      return;
    }
    
    setUploadStatus('uploading');
    setExtractedQuestions(null);
    
    const formData = new FormData();
    formData.append('file', fileInput);
    formData.append('examType', pdfToQuizConfig.examType);
    formData.append('questionCount', pdfToQuizConfig.questionCount.toString());
    
    try {
      const response = await fetch('/api/pdf-to-quiz', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert PDF.');
      }
      
      const result = await response.json();
      setExtractedQuestions(result.questions);
      toast({ title: 'Conversion Successful', description: `${result.questions.length} questions extracted from the PDF.` });
      setUploadStatus('success');
    } catch (error: any) {
      console.error('PDF to Quiz conversion error:', error);
      toast({ variant: 'destructive', title: 'Conversion Failed', description: error.message });
      setUploadStatus('error');
    }
  };

  const validateFormData = () => {
    const errors: string[] = [];
    
    switch (activeTab) {
      case 'books':
        if (!formData.title) errors.push('Title is required');
        if (!formData.author) errors.push('Author is required');
        if (!formData.subject) errors.push('Subject is required');
        if (!formData.category) errors.push('Category is required');
        if (!fileInput) errors.push('File is required');
        break;
      case 'images':
        if (!formData.imageCategory) errors.push('Category is required');
        if (!formData.imageSubject) errors.push('Subject is required');
        if (!fileInput) errors.push('File is required');
        break;
      case 'news':
        if (!formData.newsSource) errors.push('Source is required');
        if (!formData.newsCategory) errors.push('Category is required');
        if (!formData.newsRelevance) errors.push('Relevance is required');
        if (!jsonInput) errors.push('Article content is required');
        break;
      case 'syllabus':
        if (!formData.syllabusType) errors.push('Syllabus type is required');
        if (!jsonInput) errors.push('Syllabus data is required');
        break;
      case 'users':
        if (!formData.userOperation) errors.push('Operation is required');
        break;
      case 'analytics':
        if (!formData.analyticsType) errors.push('Analytics type is required');
        break;
    }
    
    return errors;
  };

  const handleContentUpload = async () => {
    if (activeTab === 'questions') {
      await handleJsonUpload();
      return;
    }

    // Validate form data before upload
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: validationErrors.join(', '),
      });
      return;
    }

    setUploadStatus('uploading');
    try {
      // Clean form data to remove empty strings and undefined values
      const cleanFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
      );
      
      // Upload content using the appropriate service
      const result = await handleUploadByType(activeTab, { 
        fileInput, 
        jsonInput: jsonInput.trim() || undefined, 
        formData: cleanFormData 
      });
      setUploadResults(prev => [...prev, result]);
      setUploadStatus('success');
      toast({
        title: 'Upload Successful',
        description: result.message || 'Content uploaded successfully',
      });
      resetForm();
    } catch (error: any) {
      const result: UploadResult = {
        success: false,
        errors: [error.message || 'Upload failed']
      };
      setUploadResults(prev => [...prev, result]);
      setUploadStatus('error');
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload content.',
      });
    }
  };

  const resetForm = () => {
    setJsonInput('');
    setFileInput(null);
    setFormData({});
    setUploadStatus('idle');
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  // Use the actual upload service for different content types
  const handleUploadByType = async (contentType: ContentType, data: any): Promise<UploadResult> => {
    const result = await uploadContentByType(contentType, data);
    return {
      success: result.success,
      message: result.message,
      count: result.count,
      errors: result.success ? undefined : [result.message || 'Upload failed']
    };
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-headline text-4xl mb-2">Admin Content Management</h1>
            <p className="text-muted-foreground text-lg">Upload and manage all datasets for the PrepTalk platform</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="pdf-to-quiz" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                PDF to Quiz
              </TabsTrigger>
              <TabsTrigger value="books" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                Books
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                News
              </TabsTrigger>
              <TabsTrigger value="syllabus" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Syllabus
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Upload Results Display */}
            {uploadResults.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Upload Results</CardTitle>
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uploadResults.map((result, index) => (
                      <Alert key={index} variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                          {result.message}
                          {result.count && ` (${result.count} items)`}
                          {result.errors && (
                            <div className="mt-2">
                              {result.errors.map((error, i) => (
                                <div key={i} className="text-sm text-red-600">• {error}</div>
                              ))}
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past Year Questions Upload */}
            <TabsContent value="questions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Past Year Questions Upload
                  </CardTitle>
                  <CardDescription>
                    Upload UPSC previous year questions in JSON format or via Excel/CSV files.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Method 1: JSON Upload</h3>
                      <div className="space-y-2">
                        <Label htmlFor="json-input">Questions JSON</Label>
                        <Textarea
                          id="json-input"
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          placeholder="Paste your JSON array here..."
                          className="h-32 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Method 2: File Upload</h3>
                      <div className="space-y-2">
                        <Label htmlFor="file-input">Upload Excel/CSV File</Label>
                        <Input
                          id="file-input"
                          type="file"
                          accept=".xlsx,.xls,.csv,.json"
                          onChange={handleFileUpload}
                        />
                        {fileInput && (
                          <Badge variant="secondary">{fileInput.name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Example JSON Structure:</h3>
                    <pre className="p-4 bg-muted text-muted-foreground rounded-md text-xs overflow-x-auto">
                      <code>{exampleJson.trim()}</code>
                    </pre>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || (!jsonInput && !fileInput)}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Questions'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* PDF to Quiz Converter */}
            <TabsContent value="pdf-to-quiz">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    AI-Powered PDF to Quiz Converter
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF of a past paper or study material, and let AI extract the questions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pdf-file-input">Upload PDF File</Label>
                      <Input
                        id="pdf-file-input"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                      />
                      {fileInput && (
                        <Badge variant="secondary" className="mt-2">{fileInput.name}</Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pdf-exam-type">Exam Type</Label>
                       <Select value={pdfToQuizConfig.examType} onValueChange={(value) => setPdfToQuizConfig(prev => ({ ...prev, examType: value }))}>
                          <SelectTrigger id="pdf-exam-type">
                              <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="prelims">Prelims (MCQ)</SelectItem>
                              <SelectItem value="mains">Mains (Descriptive)</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {extractedQuestions && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-2">Extracted Questions ({extractedQuestions.length})</h3>
                      <div className="p-4 bg-muted rounded-md max-h-60 overflow-y-auto text-sm space-y-2">
                        {extractedQuestions.map((q, i) => (
                           <div key={i} className="p-2 border-b">
                             <p className="font-medium">{i+1}. {q.question}</p>
                             <p className="text-xs text-muted-foreground pl-4">Correct Answer: {q.options.find(o => o.correct)?.text}</p>
                           </div>
                        ))}
                      </div>
                      <Button className="mt-4" onClick={() => {
                        setJsonInput(JSON.stringify(extractedQuestions, null, 2));
                        setActiveTab('questions');
                        toast({ title: 'Questions Loaded', description: 'Extracted questions have been moved to the JSON uploader tab for review.' });
                      }}>
                        Review & Upload Extracted Questions
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handlePdfToQuizConversion} 
                    disabled={uploadStatus === 'uploading' || !fileInput}
                  >
                    {uploadStatus === 'uploading' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting PDF...
                      </>
                    ) : 'Convert to Quiz'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Study Materials Upload */}
            <TabsContent value="books" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Study Materials Upload
                  </CardTitle>
                  <CardDescription>
                    Upload books, PDFs, NCERT textbooks, and other study materials.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="book-file">Upload File</Label>
                        <Input
                          id="book-file"
                          type="file"
                          accept=".pdf,.epub,.doc,.docx"
                          onChange={handleFileUpload}
                        />
                      </div>
                      <div>
                        <Label htmlFor="book-title">Title</Label>
                        <Input
                          id="book-title"
                          value={formData.title || ''}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Enter book title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="book-author">Author</Label>
                        <Input
                          id="book-author"
                          value={formData.author || ''}
                          onChange={(e) => setFormData({...formData, author: e.target.value})}
                          placeholder="Enter author name"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="book-subject">Subject</Label>
                        <Select value={formData.subject || ''} onValueChange={(value) => setFormData({...formData, subject: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="history">History</SelectItem>
                            <SelectItem value="polity">Polity</SelectItem>
                            <SelectItem value="geography">Geography</SelectItem>
                            <SelectItem value="economics">Economics</SelectItem>
                            <SelectItem value="environment">Environment</SelectItem>
                            <SelectItem value="science">Science & Technology</SelectItem>
                            <SelectItem value="current-affairs">Current Affairs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="book-category">Category</Label>
                        <Select value={formData.category || ''} onValueChange={(value) => setFormData({...formData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ncert">NCERT</SelectItem>
                            <SelectItem value="reference">Reference Book</SelectItem>
                            <SelectItem value="previous-year">Previous Year Analysis</SelectItem>
                            <SelectItem value="current-affairs">Current Affairs</SelectItem>
                            <SelectItem value="magazine">Magazine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="book-description">Description</Label>
                        <Textarea
                          id="book-description"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Enter book description"
                          className="h-20"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || !fileInput || !formData.title}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Study Material'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Media Assets Upload */}
            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Media Assets Upload
                  </CardTitle>
                  <CardDescription>
                    Upload images, maps, diagrams, and other visual content for questions and study materials.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="image-file">Upload Images</Label>
                        <Input
                          id="image-file"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                        />
                      </div>
                      <div>
                        <Label htmlFor="image-category">Category</Label>
                        <Select value={formData.imageCategory || ''} onValueChange={(value) => setFormData({...formData, imageCategory: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maps">Maps</SelectItem>
                            <SelectItem value="diagrams">Diagrams</SelectItem>
                            <SelectItem value="charts">Charts & Graphs</SelectItem>
                            <SelectItem value="historical">Historical Images</SelectItem>
                            <SelectItem value="infographics">Infographics</SelectItem>
                            <SelectItem value="monuments">Monuments</SelectItem>
                            <SelectItem value="personalities">Personalities</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="image-subject">Subject</Label>
                        <Select value={formData.imageSubject || ''} onValueChange={(value) => setFormData({...formData, imageSubject: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="geography">Geography</SelectItem>
                            <SelectItem value="history">History</SelectItem>
                            <SelectItem value="polity">Polity</SelectItem>
                            <SelectItem value="economics">Economics</SelectItem>
                            <SelectItem value="science">Science & Technology</SelectItem>
                            <SelectItem value="environment">Environment</SelectItem>
                            <SelectItem value="art-culture">Art & Culture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="image-tags">Tags (comma separated)</Label>
                        <Input
                          id="image-tags"
                          value={formData.imageTags || ''}
                          onChange={(e) => setFormData({...formData, imageTags: e.target.value})}
                          placeholder="Enter tags separated by commas"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || !fileInput}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Images'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Current Affairs Upload */}
            <TabsContent value="news" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Current Affairs Upload
                  </CardTitle>
                  <CardDescription>
                    Upload daily news articles, editorials, and current affairs content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="news-source">Source</Label>
                        <Select value={formData.newsSource || ''} onValueChange={(value) => setFormData({...formData, newsSource: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="the-hindu">The Hindu</SelectItem>
                            <SelectItem value="indian-express">Indian Express</SelectItem>
                            <SelectItem value="economic-times">Economic Times</SelectItem>
                            <SelectItem value="business-standard">Business Standard</SelectItem>
                            <SelectItem value="pib">PIB</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="news-url">Article URL</Label>
                        <Input
                          id="news-url"
                          value={formData.newsUrl || ''}
                          onChange={(e) => setFormData({...formData, newsUrl: e.target.value})}
                          placeholder="Enter article URL"
                        />
                      </div>
                      <div>
                        <Label htmlFor="news-date">Date</Label>
                        <Input
                          id="news-date"
                          type="date"
                          value={formData.newsDate || ''}
                          onChange={(e) => setFormData({...formData, newsDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="news-category">Category</Label>
                        <Select value={formData.newsCategory || ''} onValueChange={(value) => setFormData({...formData, newsCategory: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="international">International</SelectItem>
                            <SelectItem value="economy">Economy</SelectItem>
                            <SelectItem value="polity">Polity</SelectItem>
                            <SelectItem value="environment">Environment</SelectItem>
                            <SelectItem value="science-tech">Science & Technology</SelectItem>
                            <SelectItem value="sports">Sports</SelectItem>
                            <SelectItem value="culture">Culture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="news-relevance">UPSC Relevance</Label>
                        <Select value={formData.newsRelevance || ''} onValueChange={(value) => setFormData({...formData, newsRelevance: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relevance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="news-content">Article Content</Label>
                    <Textarea
                      id="news-content"
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Paste article content here..."
                      className="h-40"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || !jsonInput || !formData.newsSource}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Article'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Syllabus Management */}
            <TabsContent value="syllabus" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Syllabus Management
                  </CardTitle>
                  <CardDescription>
                    Upload and manage UPSC syllabus, topic mappings, and curriculum structure.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="syllabus-type">Syllabus Type</Label>
                      <Select value={formData.syllabusType || ''} onValueChange={(value) => setFormData({...formData, syllabusType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select syllabus type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prelims">Prelims</SelectItem>
                          <SelectItem value="mains">Mains</SelectItem>
                          <SelectItem value="optional">Optional Subjects</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="syllabus-data">Syllabus Data (JSON)</Label>
                      <Textarea
                        id="syllabus-data"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste syllabus JSON structure here..."
                        className="h-40 font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || !jsonInput || !formData.syllabusType}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Syllabus'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* User Management */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts, roles, and bulk operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user-operation">Operation</Label>
                        <Select value={formData.userOperation || ''} onValueChange={(value) => setFormData({...formData, userOperation: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bulk-import">Bulk Import Users</SelectItem>
                            <SelectItem value="role-assignment">Role Assignment</SelectItem>
                            <SelectItem value="export-data">Export User Data</SelectItem>
                            <SelectItem value="reset-passwords">Reset Passwords</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="user-file">Upload File</Label>
                        <Input
                          id="user-file"
                          type="file"
                          accept=".csv,.xlsx,.json"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user-role">Default Role</Label>
                        <Select value={formData.userRole || ''} onValueChange={(value) => setFormData({...formData, userRole: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="premium">Premium Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="user-batch">Batch/Group</Label>
                        <Input
                          id="user-batch"
                          value={formData.userBatch || ''}
                          onChange={(e) => setFormData({...formData, userBatch: e.target.value})}
                          placeholder="Enter batch or group name"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || !formData.userOperation}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Processing...' : 'Execute Operation'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Analytics & Reports */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics & Reports
                  </CardTitle>
                  <CardDescription>
                    Import analytics data, generate reports, and manage performance metrics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="analytics-type">Analytics Type</Label>
                        <Select value={formData.analyticsType || ''} onValueChange={(value) => setFormData({...formData, analyticsType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user-performance">User Performance</SelectItem>
                            <SelectItem value="question-difficulty">Question Difficulty</SelectItem>
                            <SelectItem value="topic-analysis">Topic Analysis</SelectItem>
                            <SelectItem value="usage-stats">Usage Statistics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="analytics-file">Upload Data File</Label>
                        <Input
                          id="analytics-file"
                          type="file"
                          accept=".csv,.xlsx,.json"
                          onChange={handleFileUpload}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="date-range">Date Range</Label>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={formData.startDate || ''}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                          />
                          <Input
                            type="date"
                            value={formData.endDate || ''}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="analytics-description">Description</Label>
                        <Textarea
                          id="analytics-description"
                          value={formData.analyticsDescription || ''}
                          onChange={(e) => setFormData({...formData, analyticsDescription: e.target.value})}
                          placeholder="Enter description for this analytics data"
                          className="h-20"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleContentUpload} 
                    disabled={uploadStatus === 'uploading' || !formData.analyticsType}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploadStatus === 'uploading' ? 'Processing...' : 'Import Analytics'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
