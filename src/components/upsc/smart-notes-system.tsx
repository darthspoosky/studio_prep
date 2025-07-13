'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Filter, BookOpen, Tag, Calendar, Clock, Brain,
  Star, TrendingUp, AlertCircle, Download, Share, Archive,
  StickyNote, FileText, Lightbulb, Target, Bookmark,
  ChevronDown, ChevronRight, MoreVertical, Edit, Trash2
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Interfaces matching our backend framework
interface SmartNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'concept' | 'fact' | 'summary' | 'question' | 'insight' | 'revision' | 'strategy';
  source: {
    type: 'manual' | 'article' | 'book' | 'video' | 'lecture' | 'practice';
    url?: string;
    title?: string;
    author?: string;
    date?: Date;
  };
  tags: {
    syllabusTags: string[];
    conceptTags: string[];
    customTags: string[];
    autoTags: string[];
  };
  metadata: {
    difficulty: number;
    importance: number;
    confidence: number;
    lastReviewed: Date | null;
    reviewCount: number;
    masteryLevel: number;
  };
  connections: {
    relatedNotes: string[];
    relatedTopics: string[];
    crossReferences: string[];
  };
  revisionData: {
    nextReview: Date;
    interval: number;
    easeFactor: number;
    consecutiveCorrect: number;
  };
  aiAnalysis: {
    keyPoints: string[];
    misconceptions: string[];
    examRelevance: number;
    memorabilityScore: number;
    suggestedConnections: string[];
  };
  created: Date;
  updated: Date;
}

interface NotesCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  notes: string[];
  filters: {
    topics: string[];
    tags: string[];
    difficulty: [number, number];
    importance: [number, number];
    dateRange: [Date, Date];
  };
  organization: {
    sortBy: 'created' | 'updated' | 'importance' | 'difficulty' | 'relevance';
    groupBy: 'topic' | 'subject' | 'type' | 'date' | 'none';
    layout: 'list' | 'card' | 'mind_map' | 'timeline';
  };
}

interface SmartNotesSystemProps {
  userId: string;
  className?: string;
}

export function SmartNotesSystem({ userId, className }: SmartNotesSystemProps) {
  const [notes, setNotes] = useState<SmartNote[]>([]);
  const [collections, setCollections] = useState<NotesCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    subject: 'all',
    difficulty: 'all',
    importance: 'all'
  });
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'importance' | 'relevance'>('updated');
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'compact'>('card');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SmartNote | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const glassmorphicStyles = {
    card: "relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg",
    container: "relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
  };

  // Mock data
  useEffect(() => {
    const mockNotes: SmartNote[] = [
      {
        id: '1',
        userId,
        title: 'Constitutional Amendments Process',
        content: 'Article 368 provides the procedure for constitutional amendments. There are three types of amendments: simple majority, special majority, and special majority + state ratification.',
        type: 'concept',
        source: {
          type: 'manual',
          title: 'Constitution Study',
          date: new Date('2024-01-15')
        },
        tags: {
          syllabusTags: ['gs2_polity_constitution'],
          conceptTags: ['constitutional law', 'amendments'],
          customTags: ['important', 'exam-critical'],
          autoTags: ['polity', 'constitution']
        },
        metadata: {
          difficulty: 7,
          importance: 9,
          confidence: 8,
          lastReviewed: new Date('2024-01-10'),
          reviewCount: 3,
          masteryLevel: 75
        },
        connections: {
          relatedNotes: ['2', '3'],
          relatedTopics: ['fundamental rights', 'dpsp'],
          crossReferences: ['Article 13', 'Kesavananda Bharati']
        },
        revisionData: {
          nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          interval: 7,
          easeFactor: 2.5,
          consecutiveCorrect: 2
        },
        aiAnalysis: {
          keyPoints: ['Three types of amendments', 'Article 368', 'Parliamentary procedure'],
          misconceptions: ['All amendments need state ratification'],
          examRelevance: 95,
          memorabilityScore: 80,
          suggestedConnections: ['Basic Structure Doctrine', 'Judicial Review']
        },
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-15')
      },
      {
        id: '2',
        userId,
        title: 'Fundamental Rights vs DPSPs',
        content: 'Fundamental Rights are justiciable and enforceable by courts, while Directive Principles are non-justiciable guidelines for policy making. However, both are fundamental to governance.',
        type: 'concept',
        source: {
          type: 'book',
          title: 'Indian Polity by Laxmikanth',
          author: 'M. Laxmikanth'
        },
        tags: {
          syllabusTags: ['gs2_polity_fundamental_rights', 'gs2_polity_dpsp'],
          conceptTags: ['fundamental rights', 'dpsp', 'constitution'],
          customTags: ['comparison', 'high-priority'],
          autoTags: ['polity', 'rights']
        },
        metadata: {
          difficulty: 6,
          importance: 8,
          confidence: 9,
          lastReviewed: new Date('2024-01-12'),
          reviewCount: 4,
          masteryLevel: 85
        },
        connections: {
          relatedNotes: ['1', '3'],
          relatedTopics: ['constitution', 'governance'],
          crossReferences: ['Part III', 'Part IV']
        },
        revisionData: {
          nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          interval: 14,
          easeFactor: 2.8,
          consecutiveCorrect: 3
        },
        aiAnalysis: {
          keyPoints: ['Justiciable vs Non-justiciable', 'Part III vs Part IV', 'Complementary nature'],
          misconceptions: ['DPSPs are completely unenforceable'],
          examRelevance: 90,
          memorabilityScore: 85,
          suggestedConnections: ['Minerva Mills Case', 'State Policy']
        },
        created: new Date('2024-01-02'),
        updated: new Date('2024-01-12')
      },
      {
        id: '3',
        userId,
        title: 'Economic Survey 2024 Key Points',
        content: 'GDP growth projected at 6.5-7%, inflation concerns, focus on green economy, digital transformation initiatives, and employment generation strategies.',
        type: 'summary',
        source: {
          type: 'article',
          title: 'Economic Survey 2024',
          url: 'https://example.com/economic-survey-2024'
        },
        tags: {
          syllabusTags: ['gs3_economy_economic_survey'],
          conceptTags: ['gdp', 'inflation', 'economic policy'],
          customTags: ['current-affairs', '2024'],
          autoTags: ['economics', 'survey']
        },
        metadata: {
          difficulty: 5,
          importance: 9,
          confidence: 7,
          lastReviewed: null,
          reviewCount: 0,
          masteryLevel: 60
        },
        connections: {
          relatedNotes: [],
          relatedTopics: ['budget', 'monetary policy'],
          crossReferences: ['RBI Policy', 'Budget 2024']
        },
        revisionData: {
          nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          interval: 1,
          easeFactor: 2.5,
          consecutiveCorrect: 0
        },
        aiAnalysis: {
          keyPoints: ['GDP growth targets', 'Inflation management', 'Green economy focus'],
          misconceptions: [],
          examRelevance: 85,
          memorabilityScore: 70,
          suggestedConnections: ['Budget Analysis', 'Monetary Policy']
        },
        created: new Date('2024-01-14'),
        updated: new Date('2024-01-14')
      }
    ];

    setNotes(mockNotes);
    setLoading(false);
  }, [userId]);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.conceptTags.some(tag => tag.toLowerCase().includes(query)) ||
          note.tags.customTags.some(tag => tag.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Type filter
      if (selectedFilters.type !== 'all' && note.type !== selectedFilters.type) {
        return false;
      }

      // Subject filter (simplified)
      if (selectedFilters.subject !== 'all') {
        const hasSubject = note.tags.syllabusTags.some(tag => 
          tag.includes(selectedFilters.subject)
        );
        if (!hasSubject) return false;
      }

      return true;
    });

    // Sort notes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        case 'updated':
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
        case 'importance':
          return b.metadata.importance - a.metadata.importance;
        case 'relevance':
          return b.aiAnalysis.examRelevance - a.aiAnalysis.examRelevance;
        default:
          return 0;
      }
    });

    return filtered;
  }, [notes, searchQuery, selectedFilters, sortBy]);

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const getTypeIcon = (type: SmartNote['type']) => {
    switch (type) {
      case 'concept': return <Brain className="h-4 w-4" />;
      case 'fact': return <FileText className="h-4 w-4" />;
      case 'summary': return <StickyNote className="h-4 w-4" />;
      case 'question': return <Target className="h-4 w-4" />;
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      case 'revision': return <BookOpen className="h-4 w-4" />;
      case 'strategy': return <TrendingUp className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SmartNote['type']) => {
    switch (type) {
      case 'concept': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fact': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'summary': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'question': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'insight': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'revision': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'strategy': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const renderNoteCard = (note: SmartNote, index: number) => {
    const isExpanded = expandedNotes.has(note.id);
    
    return (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`${glassmorphicStyles.card} group hover:shadow-xl transition-all duration-300`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getTypeColor(note.type)} border text-xs px-2 py-1`}>
                  {getTypeIcon(note.type)}
                  <span className="ml-1 capitalize">{note.type}</span>
                </Badge>
                <Badge variant="outline" className="bg-white/10 border-white/20 text-xs">
                  {note.metadata.importance}/10
                </Badge>
                {note.revisionData.nextReview < new Date() && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Due
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                {note.title}
              </h3>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Note
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content Preview */}
          <div className="mb-3">
            <p className={`text-foreground/80 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {note.content}
            </p>
            {note.content.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNoteExpansion(note.id)}
                className="mt-1 p-0 h-auto text-blue-400 hover:text-blue-300"
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Show more
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mb-3"
              >
                {/* AI Analysis */}
                {note.aiAnalysis.keyPoints.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Key Points
                    </h4>
                    <ul className="space-y-1">
                      {note.aiAnalysis.keyPoints.map((point, i) => (
                        <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Connected Notes */}
                {note.connections.relatedNotes.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Bookmark className="h-4 w-4" />
                      Related Notes
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {note.connections.relatedNotes.map((relatedId, i) => {
                        const relatedNote = notes.find(n => n.id === relatedId);
                        return relatedNote ? (
                          <Badge key={i} variant="outline" className="bg-white/10 border-white/20 text-xs">
                            {relatedNote.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tags */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {note.tags.conceptTags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-xs">
                  {tag}
                </Badge>
              ))}
              {note.tags.conceptTags.length > 3 && (
                <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">
                  +{note.tags.conceptTags.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Progress and Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">Mastery Level</span>
              <span className="font-medium">{note.metadata.masteryLevel}%</span>
            </div>
            <Progress value={note.metadata.masteryLevel} className="h-1" />
            
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <div className="flex items-center gap-4">
                <span>Difficulty: {note.metadata.difficulty}/10</span>
                <span>Exam Relevance: {note.aiAnalysis.examRelevance}%</span>
              </div>
              <span>
                {new Date(note.updated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`${glassmorphicStyles.container} p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={glassmorphicStyles.container}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <StickyNote className="h-6 w-6 text-purple-400" />
                Smart Notes System
              </h2>
              <p className="text-foreground/70 mt-1">
                Organize your study notes with AI-powered insights and spaced repetition
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/20">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Enter note title..." className="bg-white/10 border-white/20" />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select defaultValue="concept">
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concept">Concept</SelectItem>
                        <SelectItem value="fact">Fact</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="insight">Insight</SelectItem>
                        <SelectItem value="revision">Revision</SelectItem>
                        <SelectItem value="strategy">Strategy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea 
                      id="content" 
                      placeholder="Enter your note content..." 
                      className="bg-white/10 border-white/20 min-h-[120px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button>Create Note</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-purple-400">{notes.length}</div>
              <div className="text-sm text-foreground/70">Total Notes</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-green-400">
                {notes.filter(n => n.revisionData.nextReview > new Date()).length}
              </div>
              <div className="text-sm text-foreground/70">Up to Date</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-amber-400">
                {notes.filter(n => n.revisionData.nextReview <= new Date()).length}
              </div>
              <div className="text-sm text-foreground/70">Due for Review</div>
            </div>
            <div className={`${glassmorphicStyles.card} p-4 text-center`}>
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(notes.reduce((acc, n) => acc + n.metadata.masteryLevel, 0) / notes.length)}%
              </div>
              <div className="text-sm text-foreground/70">Avg Mastery</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={glassmorphicStyles.card}
      >
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedFilters.type} onValueChange={(value) => 
                setSelectedFilters(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger className="w-32 bg-white/10 border-white/20">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="concept">Concept</SelectItem>
                  <SelectItem value="fact">Fact</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="insight">Insight</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                  <SelectItem value="strategy">Strategy</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedFilters.subject} onValueChange={(value) => 
                setSelectedFilters(prev => ({ ...prev, subject: value }))
              }>
                <SelectTrigger className="w-32 bg-white/10 border-white/20">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="polity">Polity</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                  <SelectItem value="created">Recently Created</SelectItem>
                  <SelectItem value="importance">Importance</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note, index) => renderNoteCard(note, index))}
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${glassmorphicStyles.card} text-center py-12`}
        >
          <StickyNote className="h-12 w-12 mx-auto text-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-foreground/60 mb-4">
            {searchQuery || Object.values(selectedFilters).some(f => f !== 'all') 
              ? 'Try adjusting your search or filters'
              : 'Create your first note to get started'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </motion.div>
      )}
    </div>
  );
}