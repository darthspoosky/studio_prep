
'use client';

import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Question } from '@/types/quiz';

// Type definitions for different content types
export interface StudyMaterial {
  title: string;
  author: string;
  subject: string;
  category: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Timestamp;
  metadata?: {
    pages?: number;
    language?: string;
    isbn?: string;
  };
}

export interface MediaAsset {
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  category: string;
  subject: string;
  tags: string[];
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: Timestamp;
  metadata?: {
    description?: string;
    source?: string;
  };
}

export interface NewsArticle {
  title?: string;
  content: string;
  source: string;
  url?: string;
  publishedDate: string;
  category: string;
  relevance: 'high' | 'medium' | 'low';
  extractedAt: Timestamp;
  processed: boolean;
  metadata?: {
    author?: string;
    tags?: string[];
    syllabusTopic?: string;
  };
}

export interface SyllabusSection {
  id: string;
  type: 'prelims' | 'mains' | 'optional' | 'essay';
  paper?: string;
  subject: string;
  topic: string;
  subtopics: string[];
  weightage?: number;
  difficulty?: number;
  tags: string[];
  lastUpdated: Timestamp;
}

export interface UserBulkData {
  email: string;
  displayName?: string;
  role: 'student' | 'premium' | 'instructor' | 'admin';
  batch?: string;
  examPreference?: string;
  metadata?: {
    registrationSource?: string;
    initialPassword?: string;
    sendWelcomeEmail?: boolean;
  };
}

export interface AnalyticsData {
  type: 'user-performance' | 'question-difficulty' | 'topic-analysis' | 'usage-stats';
  data: Record<string, unknown>;
  dateRange: {
    start: string;
    end: string;
  };
  description?: string;
  importedAt: Timestamp;
  metadata?: {
    source?: string;
    version?: string;
  };
}

export interface UploadData {
  fileInput?: File;
  jsonInput?: string;
  formData?: Record<string, string | number | boolean>;
}

/**
 * Uploads an array of past year questions to Firestore in a single batch.
 * @param questions An array of Question objects to upload.
 * @returns The number of questions successfully prepared for upload.
 */
export async function uploadBulkPastYearQuestions(questions: Question[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const batch = writeBatch(db);
  const questionsCollection = collection(db, 'pastYearQuestions');

  questions.forEach(question => {
    const questionRef = doc(questionsCollection);
    const questionWithTimestamp = {
      ...question,
      uploadedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    batch.set(questionRef, questionWithTimestamp);
  });

  try {
    await batch.commit();
    return questions.length;
  } catch (error) {
    console.error("Error committing batch upload:", error);
    throw new Error("Failed to upload questions to the database.");
  }
}

/**
 * Uploads study materials (books, PDFs, etc.) to Firestore
 * @param materials An array of StudyMaterial objects to upload
 * @returns The number of materials successfully uploaded
 */
export async function uploadBulkStudyMaterials(materials: StudyMaterial[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const batch = writeBatch(db);
  const materialsCollection = collection(db, 'studyMaterials');

  materials.forEach(material => {
    const materialRef = doc(materialsCollection);
    const materialWithTimestamp = {
      ...sanitizeData(material as unknown as Record<string, unknown>),
      uploadedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    batch.set(materialRef, materialWithTimestamp);
  });

  try {
    await batch.commit();
    return materials.length;
  } catch (error) {
    console.error("Error uploading study materials:", error);
    throw new Error("Failed to upload study materials to the database.");
  }
}

/**
 * Uploads media assets (images, videos, etc.) to Firestore
 * @param assets An array of MediaAsset objects to upload
 * @returns The number of assets successfully uploaded
 */
export async function uploadBulkMediaAssets(assets: MediaAsset[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const batch = writeBatch(db);
  const assetsCollection = collection(db, 'mediaAssets');

  assets.forEach(asset => {
    const assetRef = doc(assetsCollection);
    const assetWithTimestamp = {
      ...sanitizeData(asset as unknown as Record<string, unknown>),
      uploadedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    batch.set(assetRef, assetWithTimestamp);
  });

  try {
    await batch.commit();
    return assets.length;
  } catch (error) {
    console.error("Error uploading media assets:", error);
    throw new Error("Failed to upload media assets to the database.");
  }
}

/**
 * Uploads news articles for current affairs to Firestore
 * @param articles An array of NewsArticle objects to upload
 * @returns The number of articles successfully uploaded
 */
export async function uploadBulkNewsArticles(articles: NewsArticle[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const batch = writeBatch(db);
  const articlesCollection = collection(db, 'newsArticles');

  articles.forEach(article => {
    const articleRef = doc(articlesCollection);
    const articleWithTimestamp = {
      ...sanitizeData(article as unknown as Record<string, unknown>),
      extractedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      processed: false
    };
    batch.set(articleRef, articleWithTimestamp);
  });

  try {
    await batch.commit();
    return articles.length;
  } catch (error) {
    console.error("Error uploading news articles:", error);
    throw new Error("Failed to upload news articles to the database.");
  }
}

/**
 * Uploads syllabus sections and topics to Firestore
 * @param sections An array of SyllabusSection objects to upload
 * @returns The number of sections successfully uploaded
 */
export async function uploadBulkSyllabusSections(sections: SyllabusSection[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const batch = writeBatch(db);
  const syllabusCollection = collection(db, 'syllabusSections');

  sections.forEach(section => {
    const sectionRef = doc(syllabusCollection, section.id);
    const sectionWithTimestamp = {
      ...section,
      lastUpdated: serverTimestamp()
    };
    batch.set(sectionRef, sectionWithTimestamp);
  });

  try {
    await batch.commit();
    return sections.length;
  } catch (error) {
    console.error("Error uploading syllabus sections:", error);
    throw new Error("Failed to upload syllabus sections to the database.");
  }
}

/**
 * Uploads user data in bulk to Firestore
 * @param users An array of UserBulkData objects to upload
 * @returns The number of users successfully processed
 */
export async function uploadBulkUserData(users: UserBulkData[]): Promise<number> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  // Note: This would typically require Firebase Admin SDK for user creation
  // For now, we'll just store the user data for processing
  const batch = writeBatch(db);
  const usersCollection = collection(db, 'bulkUserImports');

  users.forEach(user => {
    const userRef = doc(usersCollection);
    const userWithTimestamp = {
      ...user,
      importedAt: serverTimestamp(),
      processed: false,
      status: 'pending'
    };
    batch.set(userRef, userWithTimestamp);
  });

  try {
    await batch.commit();
    return users.length;
  } catch (error) {
    console.error("Error uploading user data:", error);
    throw new Error("Failed to upload user data to the database.");
  }
}

/**
 * Uploads analytics data to Firestore
 * @param analyticsData AnalyticsData object to upload
 * @returns Success status
 */
export async function uploadAnalyticsData(analyticsData: AnalyticsData): Promise<string> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  const analyticsCollection = collection(db, 'analyticsImports');
  const dataWithTimestamp = {
    ...sanitizeData(analyticsData as unknown as Record<string, unknown>),
    importedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(analyticsCollection, dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error uploading analytics data:", error);
    throw new Error("Failed to upload analytics data to the database.");
  }
}

/**
 * Sanitizes data by removing undefined values and empty strings
 * @param obj The object to sanitize
 * @returns Sanitized object with no undefined values
 */
function sanitizeData(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Using the exported UploadData interface defined above

/**
 * Generic file upload handler that processes different content types
 * @param contentType The type of content being uploaded
 * @param data The data to upload
 * @returns Upload result with count and status
 */
export async function uploadContentByType(
  contentType: string,
  data: UploadData
): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    let count = 0;
    let message = '';

    switch (contentType) {
      case 'questions':
        if (data.jsonInput) {
          const questions = JSON.parse(data.jsonInput);
          count = await uploadBulkPastYearQuestions(questions);
          message = `${count} questions uploaded successfully`;
        }
        break;

      case 'books':
        if (data.formData && data.fileInput) {
          const rawMaterial = {
            title: data.formData.title,
            author: data.formData.author,
            subject: data.formData.subject,
            category: data.formData.category,
            description: data.formData.description,
            fileUrl: '', // Would be set after file upload to storage
            fileName: data.fileInput.name,
            fileSize: data.fileInput.size,
            uploadedAt: serverTimestamp()
          };
          
          // Sanitize the material object to remove undefined values
          const material = sanitizeData(rawMaterial) as unknown as StudyMaterial;
          count = await uploadBulkStudyMaterials([material]);
          message = `Study material "${material.title}" uploaded successfully`;
        }
        break;

      case 'images':
        if (data.fileInput && data.formData) {
          const rawAsset = {
            fileName: data.fileInput.name,
            fileUrl: '', // Would be set after file upload to storage
            category: data.formData.imageCategory,
            subject: data.formData.imageSubject,
            tags: data.formData.imageTags ? String(data.formData.imageTags).split(',').map((t: string) => t.trim()) : [],
            fileSize: data.fileInput.size,
            uploadedAt: serverTimestamp()
          };
          
          // Sanitize the asset object to remove undefined values
          const asset = sanitizeData(rawAsset) as unknown as MediaAsset;
          count = await uploadBulkMediaAssets([asset]);
          message = `Media asset "${asset.fileName}" uploaded successfully`;
        }
        break;

      case 'news':
        if (data.jsonInput && data.formData) {
          const rawArticle = {
            content: data.jsonInput,
            source: data.formData.newsSource,
            url: data.formData.newsUrl,
            publishedDate: data.formData.newsDate,
            category: data.formData.newsCategory,
            relevance: data.formData.newsRelevance,
            extractedAt: serverTimestamp(),
            processed: false
          };
          
          // Sanitize the article object to remove undefined values
          const article = sanitizeData(rawArticle) as unknown as NewsArticle;
          count = await uploadBulkNewsArticles([article]);
          message = `News article from ${article.source} uploaded successfully`;
        }
        break;

      case 'syllabus':
        if (data.jsonInput && data.formData) {
          const sections = JSON.parse(data.jsonInput);
          count = await uploadBulkSyllabusSections(sections);
          message = `${count} syllabus sections uploaded successfully`;
        }
        break;

      case 'users':
        if (data.formData) {
          // This would process the user data based on operation type
          count = 1; // Placeholder
          message = `User operation "${data.formData.userOperation}" queued successfully`;
        }
        break;

      case 'analytics':
        if (data.formData) {
          const rawAnalyticsData = {
            type: data.formData.analyticsType,
            data: data.fileInput ? {} : JSON.parse(data.jsonInput || '{}'),
            dateRange: {
              start: data.formData.startDate,
              end: data.formData.endDate
            },
            description: data.formData.analyticsDescription,
            importedAt: serverTimestamp()
          };
          
          // Sanitize the analytics data object to remove undefined values
          const analyticsData = sanitizeData(rawAnalyticsData) as unknown as AnalyticsData;
          await uploadAnalyticsData(analyticsData);
          count = 1;
          message = `Analytics data for "${analyticsData.type}" imported successfully`;
        }
        break;

      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    return { success: true, count, message };
  } catch (error: unknown) {
    console.error(`Error uploading ${contentType}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : `Failed to upload ${contentType}` 
    };
  }
}

/**
 * Get upload statistics for admin dashboard
 * @returns Object with counts of different content types
 */
export async function getUploadStatistics(): Promise<Record<string, number>> {
  if (!db) {
    throw new Error("Firestore not initialized.");
  }

  try {
    // This would typically use aggregation queries or maintain counters
    // For now, returning mock data
    return {
      questions: 0,
      studyMaterials: 0,
      mediaAssets: 0,
      newsArticles: 0,
      syllabusSections: 0,
      users: 0,
      analyticsImports: 0
    };
  } catch (error) {
    console.error("Error fetching upload statistics:", error);
    throw new Error("Failed to fetch upload statistics.");
  }
}
