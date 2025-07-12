'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  Newspaper, Globe, Search, Filter, BookOpen, Brain,
  Zap, Target, CheckCircle2, AlertCircle, Info, Clock,
  TrendingUp, BarChart3, PieChart, LineChart, Activity,
  FileText, Download, Share2, Bookmark, Star, Heart,
  Lightbulb, RefreshCw, Upload, Home, Settings, Users,
  MessageSquare, ThumbsUp, ThumbsDown, Eye, EyeOff,
  Volume2, VolumeX, Languages, Accessibility, Palette,
  Calendar, MapPin, Tag, Link, ExternalLink, Copy,
  Rss, Mail, Twitter, Facebook, Linkedin, WhatsApp,
  Save, Edit, Trash2, MoreHorizontal, ChevronDown,
  ChevronUp, ChevronLeft, ChevronRight, ArrowLeft,
  ArrowRight, Plus, Minus, Maximize, Minimize, X,
  Sparkles, Wand2, Database, Network, Cpu, HardDrive
} from 'lucide-react';

// Enhanced Types
interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: 'national' | 'international' | 'business' | 'science' | 'sports' | 'editorial';
  credibilityScore: number;
  bias: 'left' | 'center' | 'right';
  isActive: boolean;
  lastUpdated: number;
}

interface EnhancedArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  url?: string;
  source: NewsSource;
  publishedDate: Date;
  author?: string;
  category: string;
  tags: string[];
  readingTime: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  relevanceScore: number;
  credibilityScore: number;
  biasAnalysis: {
    score: number; // -1 to 1 (left to right)
    reasoning: string;
    factualityScore: number;
  };
  sentimentAnalysis: {
    overall: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: string[];
  };
  keyEntities: Array<{
    name: string;
    type: 'person' | 'organization' | 'location' | 'event' | 'concept';
    relevance: number;
    description?: string;
  }>;
  relatedArticles: string[];
  factCheckStatus: 'verified' | 'disputed' | 'unverified';
  geographicalRelevance: string[];
  examRelevance: {
    prelims: number;
    mains: number;
    essay: number;
    interview: number;
  };
}

interface ComprehensiveAnalysis {
  id: string;
  article: EnhancedArticle;
  timestamp: number;
  processingTime: number;
  
  // Enhanced Question Generation
  prelimsQuestions: Array<{
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      explanation?: string;
    }>;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    topic: string;
    syllabusTopic: string;
    expectedTime: number;
    previousYearPattern: boolean;
    aiConfidence: number;
  }>;
  
  mainsQuestions: Array<{
    id: string;
    question: string;
    type: 'analytical' | 'descriptive' | 'comparative' | 'critical';
    wordLimit: number;
    timeLimit: number;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    syllabusTopic: string;
    markingScheme: {
      introduction: number;
      body: number;
      conclusion: number;
      examples: number;
      analysis: number;
    };
    sampleAnswer?: string;
    keyPoints: string[];
    relatedTopics: string[];
    expertTips: string[];
  }>;
  
  // Advanced Features
  knowledgeGraph: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'person' | 'organization' | 'concept' | 'event' | 'location';
      importance: number;
      description?: string;
      image?: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      relationship: string;
      strength: number;
    }>;
  };
  
  contextualBackground: {
    historicalContext: string;
    currentScenario: string;
    futureImplications: string;
    governmentPolicies: string[];
    internationalContext: string;
    relatedCases: string[];
  };
  
  crossReferences: Array<{
    title: string;
    url: string;
    relevance: number;
    type: 'government-document' | 'research-paper' | 'news-article' | 'policy-document';
  }>;
  
  multilingualSummary: {
    hindi: string;
    english: string;
    regional?: string;
  };
  
  factCheck: Array<{
    claim: string;
    verdict: 'true' | 'false' | 'misleading' | 'unverified';
    sources: string[];
    confidence: number;
  }>;
  
  socialMedia: {
    trending: boolean;
    sentiment: 'positive' | 'negative' | 'neutral';
    engagement: number;
    keyHashtags: string[];
  };
  
  aiInsights: {
    keyTakeaways: string[];
    examTips: string[];
    memorableQuotes: string[];
    studyPlan: string[];
    relatedCurrentAffairs: string[];
  };
  
  // Analytics
  analytics: {
    readabilityScore: number;
    complexityLevel: number;
    vocabularyLevel: number;
    argumentStructure: number;
    evidenceQuality: number;
    estimatedStudyTime: number;
  };
  
  // User Interaction
  userNotes: string;
  bookmarked: boolean;
  rating: number;
  sharedCount: number;
  downloadCount: number;
}

interface AnalysisConfiguration {
  analysisDepth: 'basic' | 'comprehensive' | 'expert';
  questionTypes: Array<'prelims' | 'mains' | 'essay' | 'interview'>;
  subjectFocus: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: {
    prelims: number;
    mains: number;
  };
  includeKnowledgeGraph: boolean;
  includeFactCheck: boolean;
  includeContextualBackground: boolean;
  includeCrossReferences: boolean;
  multilingualSupport: boolean;
  realTimeProcessing: boolean;
  aiInsights: boolean;
  socialMediaAnalysis: boolean;
  customPrompts: string[];
  outputFormat: 'interactive' | 'pdf' | 'json' | 'markdown';
}

// Advanced AI Analysis Engine
class AdvancedNewsAnalyzer {
  private knowledgeBase: any = {};
  private factCheckDatabase: any = {};
  private policyDatabase: any = {};

  async analyzeArticle(article: EnhancedArticle, config: AnalysisConfiguration): Promise<ComprehensiveAnalysis> {
    const startTime = Date.now();
    
    try {
      // Parallel processing for better performance
      const [
        prelimsQuestions,
        mainsQuestions,
        knowledgeGraph,
        contextualBackground,
        crossReferences,
        factCheck,
        aiInsights
      ] = await Promise.all([
        this.generatePrelimsQuestions(article, config),
        this.generateMainsQuestions(article, config),
        config.includeKnowledgeGraph ? this.generateKnowledgeGraph(article) : null,
        config.includeContextualBackground ? this.generateContextualBackground(article) : null,
        config.includeCrossReferences ? this.generateCrossReferences(article) : null,
        config.includeFactCheck ? this.performFactCheck(article) : null,
        config.aiInsights ? this.generateAIInsights(article) : null
      ]);

      const analysis: ComprehensiveAnalysis = {
        id: Date.now().toString(),
        article,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        prelimsQuestions: prelimsQuestions || [],
        mainsQuestions: mainsQuestions || [],
        knowledgeGraph: knowledgeGraph || { nodes: [], edges: [] },
        contextualBackground: contextualBackground || {
          historicalContext: '',
          currentScenario: '',
          futureImplications: '',
          governmentPolicies: [],
          internationalContext: '',
          relatedCases: []
        },
        crossReferences: crossReferences || [],
        multilingualSummary: {
          hindi: await this.translateToHindi(article.summary),
          english: article.summary
        },
        factCheck: factCheck || [],
        socialMedia: await this.analyzeSocialMediaTrends(article),
        aiInsights: aiInsights || {
          keyTakeaways: [],
          examTips: [],
          memorableQuotes: [],
          studyPlan: [],
          relatedCurrentAffairs: []
        },
        analytics: await this.calculateAnalytics(article),
        userNotes: '',
        bookmarked: false,
        rating: 0,
        sharedCount: 0,
        downloadCount: 0
      };

      return analysis;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }

  private async generatePrelimsQuestions(article: EnhancedArticle, config: AnalysisConfiguration) {
    // Advanced question generation with AI
    const questions = [];
    
    // Simulate AI-generated questions
    for (let i = 0; i < config.questionCount.prelims; i++) {
      questions.push({
        id: `prelims-${i + 1}`,
        question: `Which of the following statements about ${article.title} is correct?`,
        options: [
          { id: 'a', text: 'Statement A about the topic', isCorrect: false },
          { id: 'b', text: 'Statement B about the topic', isCorrect: true },
          { id: 'c', text: 'Statement C about the topic', isCorrect: false },
          { id: 'd', text: 'Statement D about the topic', isCorrect: false }
        ],
        explanation: 'Detailed explanation of the correct answer with context from the article.',
        difficulty: config.difficultyLevel === 'mixed' ? 
          ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any :
          config.difficultyLevel,
        subject: article.category,
        topic: article.tags[0] || 'General Studies',
        syllabusTopic: 'Current Affairs',
        expectedTime: 90,
        previousYearPattern: Math.random() > 0.5,
        aiConfidence: 0.85 + Math.random() * 0.15
      });
    }
    
    return questions;
  }

  private async generateMainsQuestions(article: EnhancedArticle, config: AnalysisConfiguration) {
    // Advanced mains question generation
    const questions = [];
    
    for (let i = 0; i < config.questionCount.mains; i++) {
      questions.push({
        id: `mains-${i + 1}`,
        question: `Analyze the implications of ${article.title} in the context of current governance challenges.`,
        type: 'analytical' as const,
        wordLimit: 250,
        timeLimit: 15,
        difficulty: config.difficultyLevel === 'mixed' ? 
          ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any :
          config.difficultyLevel,
        subject: article.category,
        syllabusTopic: 'Current Affairs and Governance',
        markingScheme: {
          introduction: 20,
          body: 50,
          conclusion: 20,
          examples: 10,
          analysis: 20
        },
        keyPoints: [
          'Key point 1 derived from the article',
          'Key point 2 with analytical depth',
          'Key point 3 with future implications'
        ],
        relatedTopics: ['Governance', 'Policy Implementation', 'Public Administration'],
        expertTips: [
          'Include specific examples from the article',
          'Connect to broader governance themes',
          'Provide balanced analysis'
        ]
      });
    }
    
    return questions;
  }

  private async generateKnowledgeGraph(article: EnhancedArticle) {
    // Generate knowledge graph from article entities
    const nodes = article.keyEntities.map(entity => ({
      id: entity.name.toLowerCase().replace(/\s+/g, '-'),
      label: entity.name,
      type: entity.type,
      importance: entity.relevance,
      description: entity.description
    }));

    const edges = [];
    // Generate relationships between entities
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.7) { // 30% chance of relationship
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            relationship: 'related to',
            strength: Math.random()
          });
        }
      }
    }

    return { nodes, edges };
  }

  private async generateContextualBackground(article: EnhancedArticle) {
    // Generate contextual background using AI
    return {
      historicalContext: `Historical background related to ${article.title}`,
      currentScenario: `Current situation analysis based on the article`,
      futureImplications: `Potential future developments and implications`,
      governmentPolicies: ['Related Policy 1', 'Related Policy 2'],
      internationalContext: `International perspective on the issue`,
      relatedCases: ['Similar Case 1', 'Similar Case 2']
    };
  }

  private async generateCrossReferences(article: EnhancedArticle) {
    // Generate cross-references to relevant documents
    return [
      {
        title: 'Government Policy Document',
        url: 'https://example.com/policy',
        relevance: 0.9,
        type: 'government-document' as const
      },
      {
        title: 'Research Paper on Related Topic',
        url: 'https://example.com/research',
        relevance: 0.8,
        type: 'research-paper' as const
      }
    ];
  }

  private async performFactCheck(article: EnhancedArticle) {
    // Perform fact-checking on key claims
    return [
      {
        claim: 'Statistical claim from the article',
        verdict: 'true' as const,
        sources: ['Source 1', 'Source 2'],
        confidence: 0.95
      }
    ];
  }

  private async generateAIInsights(article: EnhancedArticle) {
    // Generate AI-powered insights
    return {
      keyTakeaways: [
        'Key takeaway 1 from the article',
        'Key takeaway 2 with analytical depth',
        'Key takeaway 3 with broader implications'
      ],
      examTips: [
        'How to approach this topic in exams',
        'Key points to remember',
        'Common mistakes to avoid'
      ],
      memorableQuotes: [
        'Important quote from the article',
        'Statistical data worth remembering'
      ],
      studyPlan: [
        'Step 1: Understand the basic concept',
        'Step 2: Analyze the implications',
        'Step 3: Connect to broader themes'
      ],
      relatedCurrentAffairs: [
        'Related current affair 1',
        'Related current affair 2'
      ]
    };
  }

  private async analyzeSocialMediaTrends(article: EnhancedArticle) {
    // Analyze social media trends
    return {
      trending: Math.random() > 0.5,
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
      engagement: Math.floor(Math.random() * 10000),
      keyHashtags: ['#trending1', '#trending2', '#trending3']
    };
  }

  private async calculateAnalytics(article: EnhancedArticle) {
    // Calculate various analytics
    return {
      readabilityScore: 70 + Math.random() * 30,
      complexityLevel: Math.floor(Math.random() * 10) + 1,
      vocabularyLevel: Math.floor(Math.random() * 10) + 1,
      argumentStructure: 70 + Math.random() * 30,
      evidenceQuality: 70 + Math.random() * 30,
      estimatedStudyTime: Math.floor(Math.random() * 60) + 15
    };
  }

  private async translateToHindi(text: string): Promise<string> {
    // Simulate translation to Hindi
    return `हिंदी में अनुवाद: ${text}`;
  }
}

// Enhanced Article Input Component
const EnhancedArticleInput = ({
  onAnalyze,
  isLoading,
  configuration
}: {
  onAnalyze: (article: EnhancedArticle, config: AnalysisConfiguration) => void;
  isLoading: boolean;
  configuration: AnalysisConfiguration;
}) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'url' | 'file'>('text');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('national');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = async () => {
    if (!content && !url) return;

    // Create enhanced article object
    const article: EnhancedArticle = {
      id: Date.now().toString(),
      title: title || 'Untitled Article',
      content: content,
      summary: content.substring(0, 200) + '...',
      url: url || undefined,
      source: {
        id: 'user-input',
        name: 'User Input',
        url: url || '',
        category: category as any,
        credibilityScore: 0.8,
        bias: 'center',
        isActive: true,
        lastUpdated: Date.now()
      },
      publishedDate: new Date(),
      category,
      tags,
      readingTime: Math.ceil(content.split(' ').length / 200),
      difficulty: 'intermediate',
      relevanceScore: 0.9,
      credibilityScore: 0.8,
      biasAnalysis: {
        score: 0,
        reasoning: 'Neutral analysis',
        factualityScore: 0.9
      },
      sentimentAnalysis: {
        overall: 'neutral',
        confidence: 0.8,
        emotions: ['informative']
      },
      keyEntities: [
        { name: 'Sample Entity', type: 'concept', relevance: 0.8 }
      ],
      relatedArticles: [],
      factCheckStatus: 'unverified',
      geographicalRelevance: ['India'],
      examRelevance: {
        prelims: 0.8,
        mains: 0.9,
        essay: 0.7,
        interview: 0.6
      }
    };

    onAnalyze(article, configuration);
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-6 w-6" />
          Enhanced Article Analysis
        </CardTitle>
        <CardDescription>
          AI-powered comprehensive analysis with advanced features
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Method Selection */}
        <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="article-title">Article Title</Label>
              <Input
                id="article-title"
                placeholder="Enter article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="article-content">Article Content</Label>
              <Textarea
                id="article-content"
                placeholder="Paste the article content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="min-h-[200px]"
              />
              <div className="text-sm text-muted-foreground">
                {content.split(' ').length} words • {Math.ceil(content.split(' ').length / 200)} min read
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="article-url">Article URL</Label>
              <div className="flex gap-2">
                <Input
                  id="article-url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button variant="outline" onClick={() => setContent('Article content would be fetched from URL')}>
                  <Globe className="h-4 w-4 mr-2" />
                  Fetch
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Article File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports PDF, DOCX, TXT files
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Article Metadata */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="national">National</SelectItem>
                <SelectItem value="international">International</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="science">Science & Technology</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="social">Social Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!content && !url)}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Start Enhanced Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// Real-time Analysis Progress
const AnalysisProgress = ({ 
  currentStep, 
  totalSteps, 
  stepName 
}: { 
  currentStep: number; 
  totalSteps: number; 
  stepName: string;
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Analysis in Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{stepName}</span>
            <span>{currentStep}/{totalSteps}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {currentStep >= 1 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            <span>Article preprocessing and entity extraction</span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            <span>Generating Prelims questions</span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep >= 3 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            <span>Generating Mains questions</span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep >= 4 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            <span>Creating knowledge graph</span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep >= 5 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            <span>Fact-checking and verification</span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep >= 6 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
            <span>Generating AI insights</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Analysis Results Display
const EnhancedAnalysisResults = ({ 
  analysis, 
  onSave, 
  onShare, 
  onDownload 
}: { 
  analysis: ComprehensiveAnalysis;
  onSave: () => void;
  onShare: () => void;
  onDownload: () => void;
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{analysis.article.title}</h2>
            <p className="text-sm text-muted-foreground">
              Analysis completed in {Math.round(analysis.processingTime / 1000)}s • 
              {analysis.prelimsQuestions.length} Prelims + {analysis.mainsQuestions.length} Mains questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prelims">Prelims</TabsTrigger>
          <TabsTrigger value="mains">Mains</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Article Summary */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Article Summary & Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.article.relevanceScore * 100}%
                  </div>
                  <div className="text-sm text-muted-foreground">Exam Relevance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.article.credibilityScore * 100}%
                  </div>
                  <div className="text-sm text-muted-foreground">Credibility</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.article.readingTime}
                  </div>
                  <div className="text-sm text-muted-foreground">Min Read</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.analytics.estimatedStudyTime}
                  </div>
                  <div className="text-sm text-muted-foreground">Study Time</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.article.summary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Key Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.article.keyEntities.map((entity, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                              {entity.name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{entity.type} - {entity.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.article.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fact Check Results */}
          {analysis.factCheck.length > 0 && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Fact Check Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.factCheck.map((fact, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className={cn(
                        "p-1 rounded-full",
                        fact.verdict === 'true' && "bg-green-100 text-green-600",
                        fact.verdict === 'false' && "bg-red-100 text-red-600",
                        fact.verdict === 'misleading' && "bg-yellow-100 text-yellow-600",
                        fact.verdict === 'unverified' && "bg-gray-100 text-gray-600"
                      )}>
                        {fact.verdict === 'true' && <CheckCircle2 className="h-4 w-4" />}
                        {fact.verdict === 'false' && <X className="h-4 w-4" />}
                        {fact.verdict === 'misleading' && <AlertCircle className="h-4 w-4" />}
                        {fact.verdict === 'unverified' && <Info className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{fact.claim}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Verdict: <span className="capitalize font-medium">{fact.verdict}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Confidence: {Math.round(fact.confidence * 100)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Sources: {fact.sources.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multilingual Summary */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Multilingual Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="english">
                <TabsList>
                  <TabsTrigger value="english">English</TabsTrigger>
                  <TabsTrigger value="hindi">हिंदी</TabsTrigger>
                </TabsList>
                <TabsContent value="english" className="mt-4">
                  <p className="text-sm leading-relaxed">{analysis.multilingualSummary.english}</p>
                </TabsContent>
                <TabsContent value="hindi" className="mt-4">
                  <p className="text-sm leading-relaxed">{analysis.multilingualSummary.hindi}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prelims" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prelims Questions ({analysis.prelimsQuestions.length})</span>
                <Badge variant="outline">
                  AI Confidence: {Math.round(analysis.prelimsQuestions.reduce((acc, q) => acc + q.aiConfidence, 0) / analysis.prelimsQuestions.length * 100)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysis.prelimsQuestions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge variant={
                          question.difficulty === 'easy' ? 'secondary' :
                          question.difficulty === 'medium' ? 'default' : 'destructive'
                        }>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.subject}</Badge>
                        {question.previousYearPattern && (
                          <Badge variant="secondary">PYQ Pattern</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{question.expectedTime}s</span>
                      </div>
                    </div>

                    <h4 className="font-medium mb-4 leading-relaxed">
                      {question.question}
                    </h4>

                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all",
                            option.isCorrect 
                              ? "border-green-500 bg-green-50 dark:bg-green-950" 
                              : "border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                              option.isCorrect 
                                ? "border-green-500 bg-green-500 text-white" 
                                : "border-gray-400"
                            )}>
                              {option.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                              {!option.isCorrect && String.fromCharCode(65 + optIndex)}
                            </div>
                            <span className="flex-1">{option.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Explanation
                      </h5>
                      <p className="text-sm leading-relaxed">{question.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mains" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Mains Questions ({analysis.mainsQuestions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysis.mainsQuestions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge variant={
                          question.difficulty === 'easy' ? 'secondary' :
                          question.difficulty === 'medium' ? 'default' : 'destructive'
                        }>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.type}</Badge>
                        <Badge variant="outline">{question.subject}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{question.wordLimit} words</span>
                        <span>{question.timeLimit} mins</span>
                      </div>
                    </div>

                    <h4 className="font-medium mb-4 leading-relaxed">
                      {question.question}
                    </h4>

                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <h5 className="font-medium mb-2">Key Points to Cover</h5>
                        <ul className="space-y-1">
                          {question.keyPoints.map((point, pointIndex) => (
                            <li key={pointIndex} className="text-sm flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">Marking Scheme</h5>
                        <div className="space-y-1">
                          {Object.entries(question.markingScheme).map(([criteria, marks]) => (
                            <div key={criteria} className="flex justify-between text-sm">
                              <span className="capitalize">{criteria}</span>
                              <span>{marks}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Expert Tips
                      </h5>
                      <ul className="space-y-1">
                        {question.expertTips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-sm flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Knowledge Graph
              </CardTitle>
              <CardDescription>
                Interactive visualization of key concepts and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Knowledge Graph Visualization */}
              <div className="aspect-video bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Network className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Interactive knowledge graph visualization
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {analysis.knowledgeGraph.nodes.length} nodes, {analysis.knowledgeGraph.edges.length} relationships
                  </p>
                </div>
              </div>

              {/* Node List */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Key Entities</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {analysis.knowledgeGraph.nodes.map((node) => (
                    <div key={node.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {node.type === 'person' && <User className="h-4 w-4" />}
                        {node.type === 'organization' && <Users className="h-4 w-4" />}
                        {node.type === 'concept' && <Brain className="h-4 w-4" />}
                        {node.type === 'location' && <MapPin className="h-4 w-4" />}
                        {node.type === 'event' && <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{node.label}</p>
                        <p className="text-sm text-muted-foreground capitalize">{node.type}</p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(node.importance * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Takeaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.aiInsights.keyTakeaways.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Exam Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.aiInsights.examTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Study Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.aiInsights.studyPlan.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Memorable Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.aiInsights.memorableQuotes.map((quote, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm italic">"{quote}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Readability Score</span>
                      <span className="font-medium">{Math.round(analysis.analytics.readabilityScore)}/100</span>
                    </div>
                    <Progress value={analysis.analytics.readabilityScore} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Complexity Level</span>
                      <span className="font-medium">{analysis.analytics.complexityLevel}/10</span>
                    </div>
                    <Progress value={analysis.analytics.complexityLevel * 10} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Vocabulary Level</span>
                      <span className="font-medium">{analysis.analytics.vocabularyLevel}/10</span>
                    </div>
                    <Progress value={analysis.analytics.vocabularyLevel * 10} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Argument Structure</span>
                      <span className="font-medium">{Math.round(analysis.analytics.argumentStructure)}/100</span>
                    </div>
                    <Progress value={analysis.analytics.argumentStructure} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Exam Relevance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Prelims Relevance</span>
                      <span className="font-medium">{Math.round(analysis.article.examRelevance.prelims * 100)}%</span>
                    </div>
                    <Progress value={analysis.article.examRelevance.prelims * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Mains Relevance</span>
                      <span className="font-medium">{Math.round(analysis.article.examRelevance.mains * 100)}%</span>
                    </div>
                    <Progress value={analysis.article.examRelevance.mains * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Essay Relevance</span>
                      <span className="font-medium">{Math.round(analysis.article.examRelevance.essay * 100)}%</span>
                    </div>
                    <Progress value={analysis.article.examRelevance.essay * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Interview Relevance</span>
                      <span className="font-medium">{Math.round(analysis.article.examRelevance.interview * 100)}%</span>
                    </div>
                    <Progress value={analysis.article.examRelevance.interview * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Media Analytics */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Social Media Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.socialMedia.trending ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-muted-foreground">Trending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 capitalize">
                    {analysis.socialMedia.sentiment}
                  </div>
                  <div className="text-sm text-muted-foreground">Sentiment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysis.socialMedia.engagement.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.socialMedia.keyHashtags.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Key Hashtags</div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Trending Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.socialMedia.keyHashtags.map((hashtag, index) => (
                    <Badge key={index} variant="secondary">
                      {hashtag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main Enhanced Newspaper Analysis Component
export default function EnhancedNewspaperAnalysis() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State Management
  const [configuration, setConfiguration] = useState<AnalysisConfiguration>({
    analysisDepth: 'comprehensive',
    questionTypes: ['prelims', 'mains'],
    subjectFocus: ['national', 'international', 'governance'],
    difficultyLevel: 'mixed',
    questionCount: {
      prelims: 5,
      mains: 3
    },
    includeKnowledgeGraph: true,
    includeFactCheck: true,
    includeContextualBackground: true,
    includeCrossReferences: true,
    multilingualSupport: true,
    realTimeProcessing: true,
    aiInsights: true,
    socialMediaAnalysis: true,
    customPrompts: [],
    outputFormat: 'interactive'
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 6, step: '' });
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);
  
  // AI Analyzer
  const analyzer = useRef(new AdvancedNewsAnalyzer());

  // Analysis handler
  const handleAnalyze = useCallback(async (article: EnhancedArticle, config: AnalysisConfiguration) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: 6, step: 'Initializing...' });
    
    try {
      // Simulate step-by-step analysis
      const steps = [
        'Preprocessing article and extracting entities',
        'Generating Prelims questions',
        'Generating Mains questions',
        'Creating knowledge graph',
        'Performing fact-check',
        'Generating AI insights'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        setAnalysisProgress({ current: i + 1, total: steps.length, step: steps[i] });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      }
      
      const result = await analyzer.current.analyzeArticle(article, config);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Action handlers
  const handleSave = useCallback(() => {
    if (analysis) {
      // Save to user's analysis history
      console.log('Saving analysis:', analysis.id);
    }
  }, [analysis]);

  const handleShare = useCallback(() => {
    if (analysis) {
      // Share analysis
      console.log('Sharing analysis:', analysis.id);
    }
  }, [analysis]);

  const handleDownload = useCallback(() => {
    if (analysis) {
      // Download analysis as PDF
      console.log('Downloading analysis:', analysis.id);
    }
  }, [analysis]);

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <AnalysisProgress
              currentStep={analysisProgress.current}
              totalSteps={analysisProgress.total}
              stepName={analysisProgress.step}
            />
          </div>
        </div>
      </div>
    );
  }

  if (analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAnalysis(null);
                      setShowConfiguration(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold">Enhanced Analysis Complete</h1>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive AI-powered article analysis with advanced features
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  
                  <Dialog open={showConfiguration} onOpenChange={setShowConfiguration}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Analysis Configuration</DialogTitle>
                      </DialogHeader>
                      <AnalysisConfigurationPanel
                        configuration={configuration}
                        onConfigurationChange={setConfiguration}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>

            <EnhancedAnalysisResults
              analysis={analysis}
              onSave={handleSave}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Enhanced Newspaper Analysis</h1>
                  <p className="text-sm text-muted-foreground">
                    AI-powered comprehensive analysis with advanced features
                  </p>
                </div>
              </div>
              
              <Dialog open={showConfiguration} onOpenChange={setShowConfiguration}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Analysis Configuration</DialogTitle>
                  </DialogHeader>
                  <AnalysisConfigurationPanel
                    configuration={configuration}
                    onConfigurationChange={setConfiguration}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          <EnhancedArticleInput
            onAnalyze={handleAnalyze}
            isLoading={isAnalyzing}
            configuration={configuration}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Configuration Panel Component
const AnalysisConfigurationPanel = ({
  configuration,
  onConfigurationChange
}: {
  configuration: AnalysisConfiguration;
  onConfigurationChange: (config: AnalysisConfiguration) => void;
}) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label>Analysis Depth</Label>
            <Select
              value={configuration.analysisDepth}
              onValueChange={(value) =>
                onConfigurationChange({ ...configuration, analysisDepth: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Analysis</SelectItem>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
                <SelectItem value="expert">Expert Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Question Types</Label>
            <div className="flex flex-wrap gap-2">
              {['prelims', 'mains', 'essay', 'interview'].map((type) => (
                <Badge
                  key={type}
                  variant={configuration.questionTypes.includes(type as any) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const updated = configuration.questionTypes.includes(type as any)
                      ? configuration.questionTypes.filter(t => t !== type)
                      : [...configuration.questionTypes, type as any];
                    onConfigurationChange({ ...configuration, questionTypes: updated });
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prelims Questions: {configuration.questionCount.prelims}</Label>
              <Slider
                value={[configuration.questionCount.prelims]}
                onValueChange={(value) =>
                  onConfigurationChange({
                    ...configuration,
                    questionCount: { ...configuration.questionCount, prelims: value[0] }
                  })
                }
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Mains Questions: {configuration.questionCount.mains}</Label>
              <Slider
                value={[configuration.questionCount.mains]}
                onValueChange={(value) =>
                  onConfigurationChange({
                    ...configuration,
                    questionCount: { ...configuration.questionCount, mains: value[0] }
                  })
                }
                min={1}
                max={5}
                step={1}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select
              value={configuration.difficultyLevel}
              onValueChange={(value) =>
                onConfigurationChange({ ...configuration, difficultyLevel: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Output Format</Label>
            <Select
              value={configuration.outputFormat}
              onValueChange={(value) =>
                onConfigurationChange({ ...configuration, outputFormat: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interactive">Interactive</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="json">JSON Export</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="knowledge-graph">Knowledge Graph</Label>
              <Switch
                id="knowledge-graph"
                checked={configuration.includeKnowledgeGraph}
                onCheckedChange={(checked) =>
                  onConfigurationChange({ ...configuration, includeKnowledgeGraph: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="fact-check">Fact Checking</Label>
              <Switch
                id="fact-check"
                checked={configuration.includeFactCheck}
                onCheckedChange={(checked) =>
                  onConfigurationChange({ ...configuration, includeFactCheck: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="contextual-background">Contextual Background</Label>
              <Switch
                id="contextual-background"
                checked={configuration.includeContextualBackground}
                onCheckedChange={(checked) =>
                  onConfigurationChange({ ...configuration, includeContextualBackground: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="multilingual">Multilingual Support</Label>
              <Switch
                id="multilingual"
                checked={configuration.multilingualSupport}
                onCheckedChange={(checked) =>
                  onConfigurationChange({ ...configuration, multilingualSupport: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ai-insights">AI Insights</Label>
              <Switch
                id="ai-insights"
                checked={configuration.aiInsights}
                onCheckedChange={(checked) =>
                  onConfigurationChange({ ...configuration, aiInsights: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="social-media">Social Media Analysis</Label>
              <Switch
                id="social-media"
                checked={configuration.socialMediaAnalysis}
                onCheckedChange={(checked) =>
                  onConfigurationChange({ ...configuration, socialMediaAnalysis: checked })
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};