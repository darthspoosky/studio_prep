/**
 * @fileOverview UPSC Syllabus Taxonomy - Comprehensive topic mapping for Mains and Prelims
 */

export interface SyllabusNode {
  id: string;
  name: string;
  code: string;
  level: 'paper' | 'subject' | 'unit' | 'topic' | 'subtopic';
  parent?: string;
  children: string[];
  keywords: string[];
  description: string;
  examType: 'prelims' | 'mains' | 'both';
  weightage: number; // Historical weightage based on past papers
  difficulty: 'easy' | 'medium' | 'hard';
  lastUpdated: Date;
  trends: {
    frequency: number; // Questions asked in last 5 years
    recentTrend: 'increasing' | 'stable' | 'decreasing';
    importance: 'high' | 'medium' | 'low';
  };
}

export interface SyllabusTaxonomy {
  version: string;
  lastUpdated: Date;
  nodes: Record<string, SyllabusNode>;
  hierarchy: {
    papers: string[];
    subjects: Record<string, string[]>;
    units: Record<string, string[]>;
    topics: Record<string, string[]>;
    subtopics: Record<string, string[]>;
  };
}

// Complete UPSC Mains Syllabus Taxonomy
export const UPSC_SYLLABUS_TAXONOMY: SyllabusTaxonomy = {
  version: '2024.1',
  lastUpdated: new Date('2024-01-01'),
  nodes: {
    // GENERAL STUDIES PAPER 1
    'gs1': {
      id: 'gs1',
      name: 'General Studies Paper 1',
      code: 'GS1',
      level: 'paper',
      children: ['gs1_hist', 'gs1_geo', 'gs1_soc'],
      keywords: ['history', 'geography', 'society', 'culture'],
      description: 'Indian Heritage and Culture, History and Geography of the World and Society',
      examType: 'mains',
      weightage: 25,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 100, recentTrend: 'stable', importance: 'high' }
    },

    // HISTORY SUBJECT
    'gs1_hist': {
      id: 'gs1_hist',
      name: 'History',
      code: 'GS1-HIST',
      level: 'subject',
      parent: 'gs1',
      children: ['gs1_hist_ancient', 'gs1_hist_medieval', 'gs1_hist_modern', 'gs1_hist_art_culture'],
      keywords: ['history', 'ancient', 'medieval', 'modern', 'culture', 'heritage'],
      description: 'Indian History and Art & Culture',
      examType: 'mains',
      weightage: 30,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 85, recentTrend: 'stable', importance: 'high' }
    },

    // ANCIENT HISTORY
    'gs1_hist_ancient': {
      id: 'gs1_hist_ancient',
      name: 'Ancient India',
      code: 'GS1-HIST-ANC',
      level: 'unit',
      parent: 'gs1_hist',
      children: ['gs1_hist_ancient_indus', 'gs1_hist_ancient_vedic', 'gs1_hist_ancient_maurya', 'gs1_hist_ancient_gupta'],
      keywords: ['ancient india', 'indus valley', 'vedic', 'maurya', 'gupta', 'harappa'],
      description: 'Ancient Indian History from Indus Valley to Gupta Period',
      examType: 'both',
      weightage: 15,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 25, recentTrend: 'stable', importance: 'medium' }
    },

    // INDUS VALLEY CIVILIZATION
    'gs1_hist_ancient_indus': {
      id: 'gs1_hist_ancient_indus',
      name: 'Indus Valley Civilization',
      code: 'GS1-HIST-ANC-IVC',
      level: 'topic',
      parent: 'gs1_hist_ancient',
      children: ['gs1_hist_ancient_indus_sites', 'gs1_hist_ancient_indus_features', 'gs1_hist_ancient_indus_decline'],
      keywords: ['harappa', 'mohenjodaro', 'dholavira', 'kalibangan', 'indus script', 'urban planning'],
      description: 'Harappan Civilization - Sites, Features, and Decline',
      examType: 'both',
      weightage: 8,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 12, recentTrend: 'increasing', importance: 'medium' }
    },

    'gs1_hist_ancient_indus_sites': {
      id: 'gs1_hist_ancient_indus_sites',
      name: 'Harappan Sites',
      code: 'GS1-HIST-ANC-IVC-SITES',
      level: 'subtopic',
      parent: 'gs1_hist_ancient_indus',
      children: [],
      keywords: ['harappa', 'mohenjodaro', 'dholavira', 'kalibangan', 'lothal', 'banawali', 'rakhigarhi'],
      description: 'Major Harappan sites and their unique features',
      examType: 'both',
      weightage: 5,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 8, recentTrend: 'stable', importance: 'medium' }
    },

    // VEDIC PERIOD
    'gs1_hist_ancient_vedic': {
      id: 'gs1_hist_ancient_vedic',
      name: 'Vedic Period',
      code: 'GS1-HIST-ANC-VED',
      level: 'topic',
      parent: 'gs1_hist_ancient',
      children: ['gs1_hist_ancient_vedic_early', 'gs1_hist_ancient_vedic_later', 'gs1_hist_ancient_vedic_literature'],
      keywords: ['rigveda', 'aryans', 'varna system', 'upanishads', 'brahmanas', 'early vedic', 'later vedic'],
      description: 'Early and Later Vedic Period - Society, Economy, Religion',
      examType: 'both',
      weightage: 10,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 15, recentTrend: 'stable', importance: 'medium' }
    },

    // MAURYAN EMPIRE
    'gs1_hist_ancient_maurya': {
      id: 'gs1_hist_ancient_maurya',
      name: 'Mauryan Empire',
      code: 'GS1-HIST-ANC-MAU',
      level: 'topic',
      parent: 'gs1_hist_ancient',
      children: ['gs1_hist_ancient_maurya_chandragupta', 'gs1_hist_ancient_maurya_ashoka', 'gs1_hist_ancient_maurya_admin'],
      keywords: ['chandragupta maurya', 'ashoka', 'kautilya', 'arthashastra', 'mauryan administration', 'edicts'],
      description: 'Mauryan Empire - Rise, Administration, and Ashoka',
      examType: 'both',
      weightage: 12,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 18, recentTrend: 'increasing', importance: 'high' }
    },

    // MODERN HISTORY
    'gs1_hist_modern': {
      id: 'gs1_hist_modern',
      name: 'Modern India',
      code: 'GS1-HIST-MOD',
      level: 'unit',
      parent: 'gs1_hist',
      children: ['gs1_hist_modern_company', 'gs1_hist_modern_revolt', 'gs1_hist_modern_nationalism', 'gs1_hist_modern_freedom'],
      keywords: ['east india company', '1857 revolt', 'nationalism', 'freedom struggle', 'gandhi', 'nehru'],
      description: 'Modern Indian History from 1757 to 1947',
      examType: 'both',
      weightage: 35,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 45, recentTrend: 'increasing', importance: 'high' }
    },

    'gs1_hist_modern_freedom': {
      id: 'gs1_hist_modern_freedom',
      name: 'Freedom Struggle',
      code: 'GS1-HIST-MOD-FREE',
      level: 'topic',
      parent: 'gs1_hist_modern',
      children: ['gs1_hist_modern_freedom_gandhi', 'gs1_hist_modern_freedom_movements', 'gs1_hist_modern_freedom_partition'],
      keywords: ['mahatma gandhi', 'non-cooperation', 'civil disobedience', 'quit india', 'partition', 'independence'],
      description: 'Indian Freedom Struggle and Independence Movement',
      examType: 'both',
      weightage: 20,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 30, recentTrend: 'increasing', importance: 'high' }
    },

    // GEOGRAPHY SUBJECT
    'gs1_geo': {
      id: 'gs1_geo',
      name: 'Geography',
      code: 'GS1-GEO',
      level: 'subject',
      parent: 'gs1',
      children: ['gs1_geo_physical', 'gs1_geo_human', 'gs1_geo_india', 'gs1_geo_world'],
      keywords: ['geography', 'physical', 'human', 'india geography', 'world geography'],
      description: 'Physical and Human Geography of India and World',
      examType: 'both',
      weightage: 40,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 55, recentTrend: 'stable', importance: 'high' }
    },

    'gs1_geo_physical': {
      id: 'gs1_geo_physical',
      name: 'Physical Geography',
      code: 'GS1-GEO-PHY',
      level: 'unit',
      parent: 'gs1_geo',
      children: ['gs1_geo_physical_landforms', 'gs1_geo_physical_climate', 'gs1_geo_physical_drainage'],
      keywords: ['landforms', 'climate', 'drainage', 'geomorphology', 'climatology', 'rivers', 'mountains'],
      description: 'Physical Features of Earth and India',
      examType: 'both',
      weightage: 25,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 35, recentTrend: 'stable', importance: 'high' }
    },

    // GENERAL STUDIES PAPER 2
    'gs2': {
      id: 'gs2',
      name: 'General Studies Paper 2',
      code: 'GS2',
      level: 'paper',
      children: ['gs2_polity', 'gs2_governance', 'gs2_social', 'gs2_international'],
      keywords: ['polity', 'governance', 'constitution', 'social justice', 'international relations'],
      description: 'Governance, Constitution, Polity, Social Justice and International Relations',
      examType: 'mains',
      weightage: 25,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 100, recentTrend: 'increasing', importance: 'high' }
    },

    'gs2_polity': {
      id: 'gs2_polity',
      name: 'Indian Polity',
      code: 'GS2-POL',
      level: 'subject',
      parent: 'gs2',
      children: ['gs2_polity_constitution', 'gs2_polity_parliament', 'gs2_polity_executive', 'gs2_polity_judiciary'],
      keywords: ['constitution', 'parliament', 'president', 'prime minister', 'supreme court', 'federalism'],
      description: 'Indian Constitution and Political System',
      examType: 'both',
      weightage: 45,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 65, recentTrend: 'increasing', importance: 'high' }
    },

    'gs2_polity_constitution': {
      id: 'gs2_polity_constitution',
      name: 'Indian Constitution',
      code: 'GS2-POL-CONST',
      level: 'unit',
      parent: 'gs2_polity',
      children: ['gs2_polity_constitution_preamble', 'gs2_polity_constitution_features', 'gs2_polity_constitution_amendments'],
      keywords: ['preamble', 'fundamental rights', 'dpsp', 'amendments', 'constituent assembly', 'dr ambedkar'],
      description: 'Indian Constitution - Features, Rights, and Amendments',
      examType: 'both',
      weightage: 25,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 40, recentTrend: 'increasing', importance: 'high' }
    },

    // GENERAL STUDIES PAPER 3
    'gs3': {
      id: 'gs3',
      name: 'General Studies Paper 3',
      code: 'GS3',
      level: 'paper',
      children: ['gs3_economy', 'gs3_environment', 'gs3_security', 'gs3_technology'],
      keywords: ['economy', 'agriculture', 'environment', 'security', 'technology', 'disaster management'],
      description: 'Technology, Economic Development, Bio-diversity, Environment, Security and Disaster Management',
      examType: 'mains',
      weightage: 25,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 100, recentTrend: 'increasing', importance: 'high' }
    },

    'gs3_economy': {
      id: 'gs3_economy',
      name: 'Indian Economy',
      code: 'GS3-ECO',
      level: 'subject',
      parent: 'gs3',
      children: ['gs3_economy_growth', 'gs3_economy_agriculture', 'gs3_economy_industry', 'gs3_economy_services'],
      keywords: ['economic growth', 'gdp', 'agriculture', 'industry', 'services', 'fiscal policy', 'monetary policy'],
      description: 'Indian Economic Development and Policies',
      examType: 'both',
      weightage: 40,
      difficulty: 'hard',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 60, recentTrend: 'increasing', importance: 'high' }
    },

    // GENERAL STUDIES PAPER 4
    'gs4': {
      id: 'gs4',
      name: 'General Studies Paper 4',
      code: 'GS4',
      level: 'paper',
      children: ['gs4_ethics', 'gs4_integrity', 'gs4_aptitude'],
      keywords: ['ethics', 'integrity', 'aptitude', 'case studies', 'moral philosophy', 'public service'],
      description: 'Ethics, Integrity and Aptitude',
      examType: 'mains',
      weightage: 25,
      difficulty: 'medium',
      lastUpdated: new Date('2024-01-01'),
      trends: { frequency: 100, recentTrend: 'stable', importance: 'high' }
    }
  },
  hierarchy: {
    papers: ['gs1', 'gs2', 'gs3', 'gs4'],
    subjects: {
      'gs1': ['gs1_hist', 'gs1_geo', 'gs1_soc'],
      'gs2': ['gs2_polity', 'gs2_governance', 'gs2_social', 'gs2_international'],
      'gs3': ['gs3_economy', 'gs3_environment', 'gs3_security', 'gs3_technology'],
      'gs4': ['gs4_ethics', 'gs4_integrity', 'gs4_aptitude']
    },
    units: {
      'gs1_hist': ['gs1_hist_ancient', 'gs1_hist_medieval', 'gs1_hist_modern', 'gs1_hist_art_culture'],
      'gs1_geo': ['gs1_geo_physical', 'gs1_geo_human', 'gs1_geo_india', 'gs1_geo_world'],
      'gs2_polity': ['gs2_polity_constitution', 'gs2_polity_parliament', 'gs2_polity_executive', 'gs2_polity_judiciary'],
      'gs3_economy': ['gs3_economy_growth', 'gs3_economy_agriculture', 'gs3_economy_industry', 'gs3_economy_services']
    },
    topics: {
      'gs1_hist_ancient': ['gs1_hist_ancient_indus', 'gs1_hist_ancient_vedic', 'gs1_hist_ancient_maurya', 'gs1_hist_ancient_gupta'],
      'gs1_hist_modern': ['gs1_hist_modern_company', 'gs1_hist_modern_revolt', 'gs1_hist_modern_nationalism', 'gs1_hist_modern_freedom'],
      'gs1_geo_physical': ['gs1_geo_physical_landforms', 'gs1_geo_physical_climate', 'gs1_geo_physical_drainage'],
      'gs2_polity_constitution': ['gs2_polity_constitution_preamble', 'gs2_polity_constitution_features', 'gs2_polity_constitution_amendments']
    },
    subtopics: {
      'gs1_hist_ancient_indus': ['gs1_hist_ancient_indus_sites', 'gs1_hist_ancient_indus_features', 'gs1_hist_ancient_indus_decline'],
      'gs1_hist_modern_freedom': ['gs1_hist_modern_freedom_gandhi', 'gs1_hist_modern_freedom_movements', 'gs1_hist_modern_freedom_partition']
    }
  }
};

/**
 * Syllabus utilities for topic mapping and analysis
 */
export class SyllabusMapper {
  private taxonomy: SyllabusTaxonomy;

  constructor(taxonomy: SyllabusTaxonomy = UPSC_SYLLABUS_TAXONOMY) {
    this.taxonomy = taxonomy;
  }

  /**
   * Find topics by keywords with relevance scoring
   */
  findTopicsByKeywords(keywords: string[], threshold: number = 0.3): Array<{
    node: SyllabusNode;
    relevanceScore: number;
    matchedKeywords: string[];
  }> {
    const results: Array<{
      node: SyllabusNode;
      relevanceScore: number;
      matchedKeywords: string[];
    }> = [];

    Object.values(this.taxonomy.nodes).forEach(node => {
      const matchedKeywords: string[] = [];
      let relevanceScore = 0;

      // Check keyword matches
      keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        
        // Direct match in node keywords
        const directMatch = node.keywords.some(nk => 
          nk.toLowerCase().includes(normalizedKeyword) || 
          normalizedKeyword.includes(nk.toLowerCase())
        );
        
        if (directMatch) {
          matchedKeywords.push(keyword);
          relevanceScore += 1.0;
        }
        
        // Partial match in name or description
        if (node.name.toLowerCase().includes(normalizedKeyword) ||
            node.description.toLowerCase().includes(normalizedKeyword)) {
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword);
          }
          relevanceScore += 0.7;
        }
      });

      // Normalize score
      relevanceScore = relevanceScore / keywords.length;

      if (relevanceScore >= threshold) {
        results.push({
          node,
          relevanceScore,
          matchedKeywords
        });
      }
    });

    // Sort by relevance score (descending)
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get topic hierarchy path
   */
  getTopicPath(topicId: string): SyllabusNode[] {
    const path: SyllabusNode[] = [];
    let currentNode = this.taxonomy.nodes[topicId];

    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.parent) {
        currentNode = this.taxonomy.nodes[currentNode.parent];
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Get all subtopics for a given topic
   */
  getAllSubtopics(topicId: string): SyllabusNode[] {
    const subtopics: SyllabusNode[] = [];
    const queue = [topicId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.taxonomy.nodes[currentId];
      
      if (node) {
        if (node.level === 'subtopic') {
          subtopics.push(node);
        }
        
        node.children.forEach(childId => {
          queue.push(childId);
        });
      }
    }

    return subtopics;
  }

  /**
   * Calculate topic importance based on trends and weightage
   */
  calculateTopicImportance(topicId: string): {
    score: number;
    factors: {
      weightage: number;
      frequency: number;
      trend: number;
      recency: number;
    };
  } {
    const node = this.taxonomy.nodes[topicId];
    if (!node) {
      return { score: 0, factors: { weightage: 0, frequency: 0, trend: 0, recency: 0 } };
    }

    // Weightage factor (0-1)
    const weightageScore = node.weightage / 100;

    // Frequency factor (0-1)
    const frequencyScore = Math.min(node.trends.frequency / 50, 1);

    // Trend factor (0-1)
    const trendScore = node.trends.recentTrend === 'increasing' ? 1 : 
                      node.trends.recentTrend === 'stable' ? 0.7 : 0.4;

    // Recency factor based on last update
    const daysSinceUpdate = (Date.now() - node.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceUpdate / 365));

    // Combined score with weights
    const score = (
      weightageScore * 0.3 +
      frequencyScore * 0.3 +
      trendScore * 0.25 +
      recencyScore * 0.15
    );

    return {
      score,
      factors: {
        weightage: weightageScore,
        frequency: frequencyScore,
        trend: trendScore,
        recency: recencyScore
      }
    };
  }

  /**
   * Get trending topics based on recent patterns
   */
  getTrendingTopics(limit: number = 10): Array<{
    node: SyllabusNode;
    trendScore: number;
    status: 'hot' | 'trending' | 'cold';
  }> {
    const topics = Object.values(this.taxonomy.nodes)
      .filter(node => node.level === 'topic' || node.level === 'subtopic')
      .map(node => {
        const importance = this.calculateTopicImportance(node.id);
        let status: 'hot' | 'trending' | 'cold';
        
        if (importance.score >= 0.8) status = 'hot';
        else if (importance.score >= 0.6) status = 'trending';
        else status = 'cold';

        return {
          node,
          trendScore: importance.score,
          status
        };
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);

    return topics;
  }

  /**
   * Get syllabus completion percentage for a user
   */
  calculateSyllabusCompletion(completedTopics: string[]): {
    overall: number;
    byPaper: Record<string, number>;
    bySubject: Record<string, number>;
  } {
    const totalTopics = Object.values(this.taxonomy.nodes)
      .filter(node => node.level === 'topic' || node.level === 'subtopic');
    
    const completion = {
      overall: (completedTopics.length / totalTopics.length) * 100,
      byPaper: {} as Record<string, number>,
      bySubject: {} as Record<string, number>
    };

    // Calculate paper-wise completion
    this.taxonomy.hierarchy.papers.forEach(paperId => {
      const paperTopics = this.getAllSubtopics(paperId);
      const completedInPaper = paperTopics.filter(topic => 
        completedTopics.includes(topic.id)
      ).length;
      completion.byPaper[paperId] = (completedInPaper / paperTopics.length) * 100;
    });

    // Calculate subject-wise completion
    Object.values(this.taxonomy.hierarchy.subjects).flat().forEach(subjectId => {
      const subjectTopics = this.getAllSubtopics(subjectId);
      const completedInSubject = subjectTopics.filter(topic => 
        completedTopics.includes(topic.id)
      ).length;
      completion.bySubject[subjectId] = (completedInSubject / subjectTopics.length) * 100;
    });

    return completion;
  }
}

// Export singleton instance
export const syllabusMapper = new SyllabusMapper();