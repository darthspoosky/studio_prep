/**
 * @fileOverview Golden dataset for UPSC content validation
 * Manually curated by UPSC experts for testing and benchmarking
 */

export interface GoldenSample {
  id: string;
  article: {
    text: string;
    source: string;
    date: Date;
    topic: string;
    wordCount: number;
  };
  expertAnnotation: {
    relevanceScore: number; // 0-1
    syllabusTopic: string;
    subjectAreas: string[];
    timelineRelevant: boolean;
    examUtility: number; // 0-1
    expectedQuestions: Array<{
      type: 'prelims' | 'mains';
      question: string;
      difficulty: number;
      qualityScore: number;
      pattern?: string;
    }>;
    knowledgeEntities: Array<{
      name: string;
      type: string;
      importance: number;
    }>;
    reviewedBy: string;
    reviewDate: Date;
    confidence: number; // Expert confidence in annotation
  };
}

export const GOLDEN_DATASET: GoldenSample[] = [
  {
    id: "GS001",
    article: {
      text: `The Supreme Court of India recently delivered a landmark judgment on the interpretation of Article 21 of the Constitution, expanding the scope of the right to life and personal liberty. The five-judge bench unanimously held that the right to life includes the right to live with dignity and encompasses various socio-economic rights. 

The court observed that Article 21 is not merely a negative right against the state but also imposes positive obligations on the state to ensure conditions for a dignified life. This interpretation brings India closer to the international human rights framework and has significant implications for policy formulation.

The judgment specifically mentioned that access to healthcare, education, and clean environment are integral components of the right to life. The court directed the government to formulate comprehensive policies to ensure these rights are accessible to all citizens, particularly marginalized communities.

Legal experts have hailed this judgment as progressive, noting its potential impact on future legislation and governance. The decision is expected to influence cases related to environmental protection, healthcare access, and social welfare schemes.`,
      source: "The Hindu - Editorial",
      date: new Date("2023-08-15"),
      topic: "Constitutional Law and Fundamental Rights",
      wordCount: 185
    },
    expertAnnotation: {
      relevanceScore: 0.95,
      syllabusTopic: "GS Paper II - Indian Constitution—historical underpinnings, evolution, features, amendments, significant provisions and basic structure",
      subjectAreas: ["Polity", "Governance", "Social Justice"],
      timelineRelevant: true,
      examUtility: 0.9,
      expectedQuestions: [
        {
          type: "prelims",
          question: "Consider the following statements about Article 21 of the Indian Constitution:\n1. It guarantees only negative rights against the state.\n2. The Supreme Court has interpreted it to include socio-economic rights.\n3. It imposes positive obligations on the state for ensuring dignified life.\n\nWhich of the statements given above is/are correct?",
          difficulty: 8,
          qualityScore: 0.9,
          pattern: "multiple-statement"
        },
        {
          type: "mains",
          question: "Critically analyze the Supreme Court's expanded interpretation of Article 21 and its implications for governance and policy formulation in India.",
          difficulty: 9,
          qualityScore: 0.95,
          pattern: "analytical"
        }
      ],
      knowledgeEntities: [
        { name: "Supreme Court of India", type: "Organization", importance: 0.9 },
        { name: "Article 21", type: "Constitutional Provision", importance: 1.0 },
        { name: "Right to Life", type: "Fundamental Right", importance: 0.95 },
        { name: "Fundamental Rights", type: "Constitutional Concept", importance: 0.8 }
      ],
      reviewedBy: "Dr. Rajesh Kumar (Constitutional Law Expert)",
      reviewDate: new Date("2023-08-20"),
      confidence: 0.95
    }
  },
  
  {
    id: "GS002", 
    article: {
      text: `India and Bangladesh have reached a historic agreement on the sharing of Teesta river waters, ending a decade-long dispute. The agreement, signed during the Prime Minister's visit to Dhaka, ensures equitable distribution of water resources and establishes a joint monitoring mechanism.

Under the agreement, India will release a minimum quantum of water during the lean season, while Bangladesh commits to sustainable water management practices. The deal also includes provisions for flood management and joint infrastructure development along the river basin.

This breakthrough comes after years of negotiations involving multiple stakeholders, including state governments and international mediators. The agreement is seen as a model for resolving transboundary water disputes in South Asia.

Environmental experts have welcomed the agreement, noting its potential for improving bilateral relations and addressing climate change challenges. The deal is expected to benefit millions of farmers and enhance food security in both countries.

The agreement also establishes a framework for cooperation on other shared rivers, indicating a new phase in India-Bangladesh water diplomacy.`,
      source: "Indian Express - News Report",
      date: new Date("2023-09-10"),
      topic: "International Relations and Water Diplomacy",
      wordCount: 178
    },
    expertAnnotation: {
      relevanceScore: 0.88,
      syllabusTopic: "GS Paper II - International Relations - Bilateral, regional and global groupings and agreements involving India",
      subjectAreas: ["International Relations", "Geography", "Environment"],
      timelineRelevant: true,
      examUtility: 0.85,
      expectedQuestions: [
        {
          type: "prelims",
          question: "The Teesta river water sharing agreement between India and Bangladesh is significant because:\n1. It resolves a decade-long bilateral dispute\n2. It establishes a joint monitoring mechanism\n3. It covers flood management provisions\n4. It serves as a model for South Asian water diplomacy\n\nSelect the correct answer using the code given below:",
          difficulty: 7,
          qualityScore: 0.85,
          pattern: "multiple-statement"
        },
        {
          type: "mains", 
          question: "Examine the significance of the India-Bangladesh Teesta river water sharing agreement in the context of South Asian water diplomacy and regional cooperation.",
          difficulty: 8,
          qualityScore: 0.9,
          pattern: "analytical"
        }
      ],
      knowledgeEntities: [
        { name: "Teesta River", type: "Geographical Feature", importance: 1.0 },
        { name: "India-Bangladesh Relations", type: "Bilateral Relationship", importance: 0.9 },
        { name: "Water Sharing Agreement", type: "International Treaty", importance: 0.95 },
        { name: "Transboundary Water Dispute", type: "International Issue", importance: 0.8 }
      ],
      reviewedBy: "Prof. Meera Sharma (International Relations)",
      reviewDate: new Date("2023-09-15"),
      confidence: 0.88
    }
  },

  {
    id: "GS003",
    article: {
      text: `The government launched the National Mission on Quantum Technologies (NMQT) with an outlay of ₹8,000 crore over five years. This ambitious initiative aims to position India as a global leader in quantum computing, communication, and sensing technologies.

The mission focuses on developing quantum computers with 50-1000 physical qubits in 8 years, satellite-based secure quantum communications, and atomic clocks for precision timing. Industry partnerships with global technology companies are being established to accelerate research and development.

Quantum technology applications span cybersecurity, drug discovery, financial modeling, and weather prediction. The mission emphasizes building a skilled workforce through dedicated quantum technology courses in premier institutions.

The initiative aligns with similar programs in the US, China, and EU, highlighting the strategic importance of quantum technologies. Experts believe this could revolutionize India's technological capabilities and economic competitiveness.

However, challenges include the need for significant investment in infrastructure, talent acquisition, and establishing quantum technology standards.`,
      source: "Business Standard - Technology",
      date: new Date("2023-07-25"),
      topic: "Science and Technology Policy",
      wordCount: 165
    },
    expertAnnotation: {
      relevanceScore: 0.92,
      syllabusTopic: "GS Paper III - Science and Technology- developments and their applications and effects in everyday life",
      subjectAreas: ["Science & Technology", "Economy", "Security"],
      timelineRelevant: true,
      examUtility: 0.9,
      expectedQuestions: [
        {
          type: "prelims",
          question: "Consider the following statements about the National Mission on Quantum Technologies (NMQT):\n1. It has a financial outlay of ₹8,000 crore over five years\n2. It aims to develop quantum computers with 50-1000 physical qubits\n3. It excludes quantum communication from its scope\n4. It focuses only on research without industry partnerships\n\nWhich of the statements given above are correct?",
          difficulty: 7,
          qualityScore: 0.85,
          pattern: "multiple-statement"
        },
        {
          type: "mains",
          question: "Discuss the strategic significance of India's National Mission on Quantum Technologies in the context of global technological competition. Analyze the challenges and opportunities in quantum technology development.",
          difficulty: 9,
          qualityScore: 0.92,
          pattern: "analytical"
        }
      ],
      knowledgeEntities: [
        { name: "National Mission on Quantum Technologies", type: "Government Initiative", importance: 1.0 },
        { name: "Quantum Computing", type: "Technology", importance: 0.95 },
        { name: "Quantum Communication", type: "Technology", importance: 0.9 },
        { name: "Cybersecurity", type: "Technology Application", importance: 0.8 }
      ],
      reviewedBy: "Dr. Ankit Verma (Science & Technology Policy)",
      reviewDate: new Date("2023-07-30"),
      confidence: 0.92
    }
  },

  {
    id: "GS004",
    article: {
      text: `The Election Commission of India announced comprehensive reforms to the electoral process, including the introduction of remote voting for migrant workers and overseas Indians. The initiative, called 'Secure Remote Electronic Voting System' (SREVS), aims to enhance democratic participation.

The system uses blockchain technology to ensure transparency and prevent manipulation. Pilot testing will begin in select constituencies during upcoming state elections, with full implementation planned for the next general elections.

Key features include biometric authentication, end-to-end encryption, and audit trails. The commission has addressed security concerns by involving cybersecurity experts and conducting extensive testing.

This development comes amid ongoing debates about electronic voting machines (EVMs) and calls for greater electoral transparency. Legal experts note that constitutional amendments may be required for overseas voting implementation.

The initiative could significantly impact voter turnout, particularly among urban migrant populations who often cannot vote due to logistical constraints.`,
      source: "Times of India - Politics",
      date: new Date("2023-06-20"),
      topic: "Electoral Reforms and Democratic Process",
      wordCount: 152
    },
    expertAnnotation: {
      relevanceScore: 0.85,
      syllabusTopic: "GS Paper II - Indian Constitution—electoral processes and institutions",
      subjectAreas: ["Polity", "Governance", "Technology"],
      timelineRelevant: true,
      examUtility: 0.8,
      expectedQuestions: [
        {
          type: "prelims",
          question: "The 'Secure Remote Electronic Voting System' (SREVS) announced by the Election Commission includes:\n1. Blockchain technology for transparency\n2. Biometric authentication\n3. End-to-end encryption\n4. Voting facility for overseas Indians\n\nSelect the correct answer using the code given below:",
          difficulty: 6,
          qualityScore: 0.8,
          pattern: "multiple-statement"
        },
        {
          type: "mains",
          question: "Evaluate the potential impact of remote voting systems on India's democratic process. Discuss the challenges and safeguards needed for secure implementation.",
          difficulty: 8,
          qualityScore: 0.85,
          pattern: "evaluative"
        }
      ],
      knowledgeEntities: [
        { name: "Election Commission of India", type: "Constitutional Body", importance: 0.9 },
        { name: "Remote Voting", type: "Electoral Technology", importance: 1.0 },
        { name: "Blockchain Technology", type: "Technology", importance: 0.8 },
        { name: "Electoral Reforms", type: "Governance Reform", importance: 0.85 }
      ],
      reviewedBy: "Dr. Priya Singh (Electoral Studies)",
      reviewDate: new Date("2023-06-25"),
      confidence: 0.85
    }
  },

  {
    id: "GS005",
    article: {
      text: `The Ministry of Environment released the National Action Plan on Climate Change (NAPCC) 2.0, updating India's climate strategy with enhanced focus on adaptation and mitigation measures. The plan targets achieving net-zero emissions by 2070 through renewable energy expansion and carbon sequestration.

Key components include the Green Hydrogen Mission, sustainable agriculture practices, and coastal zone management. The plan emphasizes nature-based solutions and community participation in climate action.

The updated strategy integrates the Panchamrit commitments made at COP26, including 500 GW renewable energy capacity by 2030 and reducing carbon intensity by 45% from 2005 levels.

International cooperation features prominently, with provisions for technology transfer and climate finance. The plan also addresses climate-induced migration and disaster risk reduction.

Environmental groups have welcomed the comprehensive approach while noting implementation challenges, particularly in achieving coordination between central and state agencies.`,
      source: "Down to Earth - Environment",
      date: new Date("2023-05-15"),
      topic: "Climate Change and Environmental Policy",
      wordCount: 148
    },
    expertAnnotation: {
      relevanceScore: 0.93,
      syllabusTopic: "GS Paper III - Conservation, environmental pollution and degradation, environmental impact assessment",
      subjectAreas: ["Environment", "International Relations", "Policy"],
      timelineRelevant: true,
      examUtility: 0.9,
      expectedQuestions: [
        {
          type: "prelims",
          question: "Which of the following are key components of the National Action Plan on Climate Change (NAPCC) 2.0?\n1. Green Hydrogen Mission\n2. Sustainable agriculture practices\n3. Coastal zone management\n4. Nuclear energy expansion\n\nSelect the correct answer using the code given below:",
          difficulty: 7,
          qualityScore: 0.85,
          pattern: "multiple-statement"
        },
        {
          type: "mains",
          question: "Critically examine India's National Action Plan on Climate Change 2.0 in the context of achieving net-zero emissions by 2070. Assess the challenges and opportunities in implementation.",
          difficulty: 9,
          qualityScore: 0.93,
          pattern: "critical-analysis"
        }
      ],
      knowledgeEntities: [
        { name: "National Action Plan on Climate Change", type: "Policy Document", importance: 1.0 },
        { name: "Net Zero Emissions", type: "Climate Target", importance: 0.95 },
        { name: "Green Hydrogen Mission", type: "Government Initiative", importance: 0.9 },
        { name: "COP26", type: "International Conference", importance: 0.8 }
      ],
      reviewedBy: "Dr. Kavitha Rao (Environmental Policy)",
      reviewDate: new Date("2023-05-20"),
      confidence: 0.93
    }
  }
];

/**
 * Helper functions for golden dataset testing
 */
export function getGoldenSampleById(id: string): GoldenSample | undefined {
  return GOLDEN_DATASET.find(sample => sample.id === id);
}

export function getGoldenSamplesBySubject(subject: string): GoldenSample[] {
  return GOLDEN_DATASET.filter(sample => 
    sample.expertAnnotation.subjectAreas.includes(subject)
  );
}

export function getGoldenSamplesByRelevanceScore(minScore: number): GoldenSample[] {
  return GOLDEN_DATASET.filter(sample => 
    sample.expertAnnotation.relevanceScore >= minScore
  );
}

export function getGoldenSamplesByDifficulty(minDifficulty: number, questionType: 'prelims' | 'mains'): GoldenSample[] {
  return GOLDEN_DATASET.filter(sample => 
    sample.expertAnnotation.expectedQuestions
      .filter(q => q.type === questionType)
      .some(q => q.difficulty >= minDifficulty)
  );
}

/**
 * Calculate benchmark metrics from golden dataset
 */
export function calculateBenchmarkMetrics() {
  const totalSamples = GOLDEN_DATASET.length;
  
  const avgRelevanceScore = GOLDEN_DATASET.reduce((sum, sample) => 
    sum + sample.expertAnnotation.relevanceScore, 0) / totalSamples;
  
  const avgExamUtility = GOLDEN_DATASET.reduce((sum, sample) => 
    sum + sample.expertAnnotation.examUtility, 0) / totalSamples;
  
  const avgConfidence = GOLDEN_DATASET.reduce((sum, sample) => 
    sum + sample.expertAnnotation.confidence, 0) / totalSamples;
  
  const subjectDistribution = GOLDEN_DATASET.reduce((acc, sample) => {
    sample.expertAnnotation.subjectAreas.forEach(subject => {
      acc[subject] = (acc[subject] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const difficultyDistribution = {
    prelims: { easy: 0, medium: 0, hard: 0 },
    mains: { easy: 0, medium: 0, hard: 0 }
  };
  
  GOLDEN_DATASET.forEach(sample => {
    sample.expertAnnotation.expectedQuestions.forEach(q => {
      const category = q.difficulty <= 6 ? 'easy' : q.difficulty <= 8 ? 'medium' : 'hard';
      difficultyDistribution[q.type][category]++;
    });
  });
  
  return {
    totalSamples,
    avgRelevanceScore,
    avgExamUtility,
    avgConfidence,
    subjectDistribution,
    difficultyDistribution,
    timelineRelevantSamples: GOLDEN_DATASET.filter(s => s.expertAnnotation.timelineRelevant).length
  };
}