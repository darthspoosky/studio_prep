'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Image, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  FileImage,
  Settings,
  RefreshCw
} from 'lucide-react';

interface ProcessingFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

interface ExtractionOptions {
  extractText: boolean;
  extractImages: boolean;
  enhanceImageQuality: boolean;
  splitPDFPages: boolean;
  aiProcessing: boolean;
  confidenceThreshold: number;
  outputFormat: 'json' | 'structured';
}

const defaultOptions: ExtractionOptions = {
  extractText: true,
  extractImages: true,
  enhanceImageQuality: false,
  splitPDFPages: false,
  aiProcessing: true,
  confidenceThreshold: 0.7,
  outputFormat: 'json'
};

export default function AdvancedQuestionExtractionPage() {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [options, setOptions] = useState<ExtractionOptions>(defaultOptions);
  const [systemStats, setSystemStats] = useState<any>(null);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: 'pending' as const,
        progress: 0
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }, []),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // Process all files
  const processFiles = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    
    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      
      // Add options
      formData.append('options', JSON.stringify(options));

      // Update file statuses to processing
      setFiles(prev => prev.map(f => ({ ...f, status: 'processing', progress: 0, startTime: new Date() })));

      const response = await fetch('/api/ai/extract-questions-advanced', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update files with results
        setFiles(prev => prev.map(f => {
          const fileResult = result.files.find((r: any) => r.fileName === f.file.name);
          if (fileResult) {
            return {
              ...f,
              status: fileResult.success ? 'completed' : 'failed',
              progress: 100,
              result: fileResult,
              error: fileResult.error,
              endTime: new Date()
            };
          }
          return f;
        }));
      } else {
        // Mark all as failed
        setFiles(prev => prev.map(f => ({
          ...f,
          status: 'failed',
          progress: 0,
          error: result.error || 'Processing failed',
          endTime: new Date()
        })));
      }
    } catch (error) {
      console.error('Processing error:', error);
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'failed',
        progress: 0,
        error: 'Network error',
        endTime: new Date()
      })));
    } finally {
      setProcessing(false);
    }
  };

  // Get system status
  const getSystemStatus = async () => {
    try {
      const response = await fetch('/api/ai/extract-questions-advanced');
      const status = await response.json();
      setSystemStats(status);
    } catch (error) {
      console.error('Failed to get system status:', error);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all files
  const clearAllFiles = () => {
    setFiles([]);
  };

  // Download results
  const downloadResults = () => {
    const results = files
      .filter(f => f.status === 'completed' && f.result)
      .map(f => ({
        fileName: f.file.name,
        questions: f.result.questions,
        metadata: f.result.metadata
      }));

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `extracted-questions-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (start?: Date, end?: Date) => {
    if (!start || !end) return '';
    const duration = end.getTime() - start.getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  // Get status color
  const getStatusColor = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalQuestions = files.reduce((sum, f) => sum + (f.result?.questionCount || 0), 0);
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'failed').length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Question Extraction</h1>
        <p className="text-gray-600">
          Extract questions from PDFs and images using AI. Supports multiple files, PDF page splitting, and image enhancement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Files Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{files.length}</div>
            <div className="text-sm text-gray-600">
              {completedFiles} completed, {failedFiles} failed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Questions Extracted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQuestions}</div>
            <div className="text-sm text-gray-600">
              {completedFiles > 0 ? Math.round(totalQuestions / completedFiles) : 0} avg per file
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              System Status
              <Button variant="ghost" size="sm" onClick={getSystemStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="secondary">
                  {systemStats?.status || 'Loading...'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Temp Files:</span>
                <span>{systemStats?.systemStats?.tempFiles || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span>{systemStats?.systemStats?.tempStorageUsed || '0 Bytes'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Upload PDF files or images containing questions. Maximum 10 files, 50MB each.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, JPG, PNG, WebP (max 50MB per file)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Selected Files ({files.length})</CardTitle>
                  <CardDescription>Files ready for processing</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearAllFiles}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button onClick={processFiles} disabled={processing}>
                    {processing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Extract Questions
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {file.file.type.startsWith('image/') ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileImage className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{file.file.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(file.file.size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                        {file.status === 'processing' && (
                          <div className="w-20">
                            <Progress value={file.progress} className="h-2" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={processing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>Real-time processing status of uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files to process
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {file.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {file.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                          {file.status === 'processing' && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
                          <span className="font-medium">{file.file.name}</span>
                        </div>
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                      </div>
                      
                      {file.status === 'processing' && (
                        <Progress value={file.progress} className="mb-3" />
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Duration:</span> {formatDuration(file.startTime, file.endTime)}
                        </div>
                        <div>
                          <span className="text-gray-500">Size:</span> {formatFileSize(file.file.size)}
                        </div>
                        {file.result && (
                          <>
                            <div>
                              <span className="text-gray-500">Questions:</span> {file.result.questionCount}
                            </div>
                            <div>
                              <span className="text-gray-500">Confidence:</span> {(file.result.extractedContent.confidence * 100).toFixed(1)}%
                            </div>
                          </>
                        )}
                      </div>
                      
                      {file.error && (
                        <Alert className="mt-3">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{file.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Extraction Results</CardTitle>
                <CardDescription>Review and download extracted questions</CardDescription>
              </div>
              {totalQuestions > 0 && (
                <Button onClick={downloadResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {completedFiles === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No completed extractions yet
                </div>
              ) : (
                <div className="space-y-6">
                  {files.filter(f => f.status === 'completed').map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{file.file.name}</h3>
                        <Badge variant="secondary">
                          {file.result.questionCount} questions
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {file.result.questions.slice(0, 3).map((question: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{question.subject}</Badge>
                              <Badge variant="outline">{question.difficulty}</Badge>
                            </div>
                            <div className="text-sm">
                              <strong>Q{question.questionNumber}:</strong> {question.questionText.english?.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                        
                        {file.result.questionCount > 3 && (
                          <div className="text-sm text-gray-500 text-center">
                            ... and {file.result.questionCount - 3} more questions
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Settings</CardTitle>
              <CardDescription>Configure processing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.extractText}
                      onChange={(e) => setOptions(prev => ({ ...prev, extractText: e.target.checked }))}
                    />
                    <span>Extract Text</span>
                  </label>
                  <p className="text-sm text-gray-500">Extract readable text from documents</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.extractImages}
                      onChange={(e) => setOptions(prev => ({ ...prev, extractImages: e.target.checked }))}
                    />
                    <span>Extract Images</span>
                  </label>
                  <p className="text-sm text-gray-500">Extract images from documents</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.enhanceImageQuality}
                      onChange={(e) => setOptions(prev => ({ ...prev, enhanceImageQuality: e.target.checked }))}
                    />
                    <span>Enhance Image Quality</span>
                  </label>
                  <p className="text-sm text-gray-500">Improve image quality for better OCR</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.splitPDFPages}
                      onChange={(e) => setOptions(prev => ({ ...prev, splitPDFPages: e.target.checked }))}
                    />
                    <span>Split PDF Pages</span>
                  </label>
                  <p className="text-sm text-gray-500">Process PDF pages separately</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.aiProcessing}
                      onChange={(e) => setOptions(prev => ({ ...prev, aiProcessing: e.target.checked }))}
                    />
                    <span>AI Processing</span>
                  </label>
                  <p className="text-sm text-gray-500">Use AI to extract questions</p>
                </div>

                <div className="space-y-2">
                  <label className="block">
                    <span className="text-sm font-medium">Confidence Threshold</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={options.confidenceThreshold}
                      onChange={(e) => setOptions(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                      className="w-full mt-1"
                    />
                    <span className="text-xs text-gray-500">{(options.confidenceThreshold * 100).toFixed(0)}%</span>
                  </label>
                  <p className="text-sm text-gray-500">Minimum confidence for question extraction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}