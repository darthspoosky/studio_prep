/**
 * Model Answer Service
 * Handles model answer comparison and peer benchmarking
 */

import { openai, anthropic, AI_MODELS } from '@/lib/ai-providers';
import { z } from 'zod';

// Types and Schemas
export const ModelAnswerSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  content: z.string(),
  score: z.number().min(0).max(100),
  authorType: z.enum(['expert', 'ai_generated', 'top_performer']),
  authorName: z.string().optional(),
  verified: z.boolean().default(false),
  keywords: z.array(z.string()),
  structure: z.object({
    introduction: z.string(),
    mainPoints: z.array(z.string()),
    conclusion: z.string(),
    wordCount: z.number()
  }),
  metadata: z.object({
    examType: z.string(),
    subject: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    timeLimit: z.number(),
    createdAt: z.date()
  })
});

export const ComparisonResultSchema = z.object({
  similarity: z.number().min(0).max(100),
  coverageGap: z.number().min(0).max(100),
  structuralAlignment: z.number().min(0).max(100),
  qualityDifference: z.number().min(-100).max(100),
  missingPoints: z.array(z.string()),
  additionalPoints: z.array(z.string()),
  improvementRoadmap: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    category: z.string(),
    suggestion: z.string(),
    expectedImprovement: z.number()
  })),
  strengthsVsModel: z.array(z.string()),
  weaknessesVsModel: z.array(z.string())
});

export type ModelAnswer = z.infer<typeof ModelAnswerSchema>;
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;

/**
 * Service for managing model answers and comparisons
 */
export class ModelAnswerService {
  
  /**
   * Generate a model answer for a given question using AI
   */
  async generateModelAnswer(questionText: string, examType: string, subject: string): Promise<ModelAnswer> {
    const prompt = `You are a UPSC expert examiner. Generate a high-quality model answer for this question:

QUESTION: ${questionText}
EXAM TYPE: ${examType}
SUBJECT: ${subject}

Requirements:
1. Create a comprehensive, well-structured answer
2. Include specific examples and case studies
3. Follow proper UPSC answer format
4. Aim for 800-1000 words
5. Include introduction, body paragraphs, and conclusion

Provide response in JSON format:
{
  "content": "Complete model answer text",
  "structure": {
    "introduction": "Introduction paragraph",
    "mainPoints": ["Point 1", "Point 2", "Point 3"],
    "conclusion": "Conclusion paragraph",
    "wordCount": number
  },
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "difficulty": "medium",
  "estimatedScore": number (80-95),
  "timeRequired": number (minutes),
  "keyStrengths": ["strength1", "strength2"]
}`;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.openai.gpt4Turbo,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');

    const modelAnswer: ModelAnswer = {
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionId: `q_${Math.random().toString(36).substr(2, 9)}`,
      content: aiResponse.content,
      score: aiResponse.estimatedScore || 85,
      authorType: 'ai_generated',
      authorName: 'AI Expert',
      verified: true,
      keywords: aiResponse.keywords || [],
      structure: aiResponse.structure || {
        introduction: '',
        mainPoints: [],
        conclusion: '',
        wordCount: aiResponse.content?.split(' ').length || 0
      },
      metadata: {
        examType,
        subject,
        difficulty: aiResponse.difficulty || 'medium',
        timeLimit: aiResponse.timeRequired || 45,
        createdAt: new Date()
      }
    };

    return modelAnswer;
  }

  /**
   * Compare user answer with model answer
   */
  async compareWithModelAnswer(
    userAnswer: string,
    modelAnswer: ModelAnswer,
    questionText: string
  ): Promise<ComparisonResult> {
    const prompt = `You are an expert UPSC examiner. Compare this student answer with the model answer:

QUESTION: ${questionText}

MODEL ANSWER (Score: ${modelAnswer.score}):
${modelAnswer.content}

STUDENT ANSWER:
${userAnswer}

Analyze and provide detailed comparison in JSON format:
{
  "similarity": number (0-100, content overlap),
  "coverageGap": number (0-100, how much student missed),
  "structuralAlignment": number (0-100, structural similarity),
  "qualityDifference": number (-100 to +100, quality gap),
  "missingPoints": ["critical point 1", "critical point 2"],
  "additionalPoints": ["extra point 1", "extra point 2"],
  "improvementRoadmap": [
    {
      "priority": "high|medium|low",
      "category": "content|structure|language|examples",
      "suggestion": "specific improvement suggestion",
      "expectedImprovement": number (points improvement expected)
    }
  ],
  "strengthsVsModel": ["what student did well compared to model"],
  "weaknessesVsModel": ["what student missed vs model"],
  "detailedAnalysis": "Comprehensive comparison explanation"
}

Focus on:
1. Content coverage and depth
2. Structural organization
3. Use of examples and evidence
4. UPSC-specific requirements
5. Actionable improvement suggestions`;

    const response = await anthropic.messages.create({
      model: AI_MODELS.anthropic.claude3Sonnet,
      max_tokens: 3000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const comparisonData = JSON.parse(content.text);
      return ComparisonResultSchema.parse(comparisonData);
    }
    throw new Error('Unexpected response format from Claude');
  }

  /**
   * Find the best matching model answers for a question
   */
  async findSimilarModelAnswers(questionText: string, examType: string): Promise<ModelAnswer[]> {
    // In a real implementation, this would search a database
    // For now, generating a representative model answer
    const subjects = ['General Studies', 'Public Administration', 'Political Science'];
    const modelAnswers: ModelAnswer[] = [];

    for (const subject of subjects.slice(0, 2)) { // Limit to 2 for demo
      try {
        const modelAnswer = await this.generateModelAnswer(questionText, examType, subject);
        modelAnswers.push(modelAnswer);
      } catch (error) {
        console.error(`Failed to generate model answer for ${subject}:`, error);
      }
    }

    return modelAnswers;
  }

  /**
   * Analyze peer performance for benchmarking
   */
  async analyzePeerPerformance(
    userScore: number,
    questionId: string,
    examType: string
  ): Promise<{
    percentile: number;
    averageScore: number;
    topPercentileThreshold: number;
    distribution: { range: string; count: number; percentage: number }[];
    insights: string[];
  }> {
    // Simulated peer data - in production, this would query actual user data
    const simulatedScores = this.generateSimulatedPeerScores(userScore);
    
    const totalAnswers = simulatedScores.length;
    const scoresBelow = simulatedScores.filter(score => score < userScore).length;
    const percentile = Math.round((scoresBelow / totalAnswers) * 100);
    
    const averageScore = Math.round(
      simulatedScores.reduce((sum, score) => sum + score, 0) / totalAnswers
    );
    
    const topPercentileThreshold = simulatedScores.sort((a, b) => b - a)[Math.floor(totalAnswers * 0.1)];
    
    const distribution = this.calculateScoreDistribution(simulatedScores);
    const insights = this.generatePerformanceInsights(userScore, percentile, averageScore, topPercentileThreshold);

    return {
      percentile,
      averageScore,
      topPercentileThreshold,
      distribution,
      insights
    };
  }

  /**
   * Generate actionable improvement plan based on model comparison
   */
  async generateImprovementPlan(
    comparison: ComparisonResult,
    userCurrentLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<{
    shortTermGoals: string[];
    longTermGoals: string[];
    practiceExercises: string[];
    resourceRecommendations: string[];
    expectedTimeframe: string;
  }> {
    const prompt = `Based on this writing comparison analysis, create a personalized improvement plan:

COMPARISON DATA: ${JSON.stringify(comparison)}
USER LEVEL: ${userCurrentLevel}

Generate a comprehensive improvement plan in JSON:
{
  "shortTermGoals": ["1-2 week goals"],
  "longTermGoals": ["1-3 month goals"],
  "practiceExercises": ["specific exercises to practice"],
  "resourceRecommendations": ["books, materials, methods"],
  "expectedTimeframe": "realistic timeline for improvement",
  "priorityAreas": ["most critical areas to focus on"],
  "milestones": ["measurable progress indicators"]
}

Make it practical and actionable for UPSC preparation.`;

    const response = await openai.chat.completions.create({
      model: AI_MODELS.openai.gpt4,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  // Helper methods
  private generateSimulatedPeerScores(userScore: number): number[] {
    const scores: number[] = [];
    const baseScores = [45, 52, 58, 63, 67, 71, 75, 79, 82, 85, 88, 91, 94];
    
    // Generate distribution around user score
    for (let i = 0; i < 1000; i++) {
      const baseScore = baseScores[Math.floor(Math.random() * baseScores.length)];
      const variation = (Math.random() - 0.5) * 20; // ±10 points variation
      const score = Math.max(0, Math.min(100, Math.round(baseScore + variation)));
      scores.push(score);
    }
    
    // Add some scores around user's score for realistic comparison
    for (let i = 0; i < 50; i++) {
      const variation = (Math.random() - 0.5) * 10; // ±5 points around user
      const score = Math.max(0, Math.min(100, Math.round(userScore + variation)));
      scores.push(score);
    }
    
    return scores;
  }

  private calculateScoreDistribution(scores: number[]): { range: string; count: number; percentage: number }[] {
    const ranges = [
      { min: 0, max: 39, label: '0-39' },
      { min: 40, max: 49, label: '40-49' },
      { min: 50, max: 59, label: '50-59' },
      { min: 60, max: 69, label: '60-69' },
      { min: 70, max: 79, label: '70-79' },
      { min: 80, max: 89, label: '80-89' },
      { min: 90, max: 100, label: '90-100' }
    ];

    return ranges.map(range => {
      const count = scores.filter(score => score >= range.min && score <= range.max).length;
      const percentage = Math.round((count / scores.length) * 100);
      return {
        range: range.label,
        count,
        percentage
      };
    });
  }

  private generatePerformanceInsights(
    userScore: number,
    percentile: number,
    averageScore: number,
    topThreshold: number
  ): string[] {
    const insights: string[] = [];

    if (percentile >= 90) {
      insights.push("🎉 Excellent performance! You're in the top 10% of test takers.");
    } else if (percentile >= 75) {
      insights.push("👍 Good performance! You're performing better than most candidates.");
    } else if (percentile >= 50) {
      insights.push("📈 Average performance with room for improvement.");
    } else {
      insights.push("🎯 Focus area identified - significant improvement potential.");
    }

    if (userScore > averageScore) {
      insights.push(`✅ You scored ${userScore - averageScore} points above average.`);
    } else if (userScore < averageScore) {
      insights.push(`📊 You scored ${averageScore - userScore} points below average.`);
    }

    if (userScore < topThreshold) {
      insights.push(`🚀 Gap to top 10%: ${topThreshold - userScore} points.`);
    }

    return insights;
  }
}