'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isDevMode } from '@/lib/dev-mode';
import { QuestionUploadService, FileUploadResult } from '@/services/questionUploadService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, FileText, AlertCircle, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface UploadState {
  isUploading: boolean;
  progress: number;
  result: FileUploadResult | null;
  error: string | null;
}

export default function QuestionUploadPage() {
  const { user } = useAuth();
  const [examType, setExamType] = useState<'Prelims' | 'Mains'>('Prelims');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paper, setPaper] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    result: null,
    error: null
  });

  // Check if user has dev access
  const hasDevAccess = isDevMode(user?.email);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !hasDevAccess || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadState({
      isUploading: true,
      progress: 0,
      result: null,
      error: null
    });

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await QuestionUploadService.uploadFile(
        file,
        examType,
        user.uid,
        year,
        paper || undefined
      );

      clearInterval(progressInterval);

      setUploadState({
        isUploading: false,
        progress: 100,
        result,
        error: result.success ? null : result.message
      });

    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        result: null,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }, [user, hasDevAccess, examType, year, paper]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    disabled: uploadState.isUploading || !hasDevAccess
  });

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      result: null,
      error: null
    });
  };

  if (!hasDevAccess) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available for developers and administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank Upload</h1>
          <p className="text-muted-foreground mt-2">
            Upload previous year questions for UPSC Prelims and Mains
          </p>
        </div>
        <Badge variant="secondary" className="text-blue-600">
          🚀 Dev Mode
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Configuration</CardTitle>
            <CardDescription>
              Set the exam type, year, and paper details before uploading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examType">Exam Type</Label>
              <Select value={examType} onValueChange={(value: 'Prelims' | 'Mains') => setExamType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prelims">UPSC Prelims</SelectItem>
                  <SelectItem value="Mains">UPSC Mains</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                min={2000}
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paper">Paper (Optional)</Label>
              <Select value={paper} onValueChange={setPaper}>
                <SelectTrigger>
                  <SelectValue placeholder="Select paper" />
                </SelectTrigger>
                <SelectContent>
                  {examType === 'Prelims' ? (
                    <>
                      <SelectItem value="GS1">General Studies Paper I</SelectItem>
                      <SelectItem value="CSAT">Civil Services Aptitude Test</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="GS1">General Studies Paper I</SelectItem>
                      <SelectItem value="GS2">General Studies Paper II</SelectItem>
                      <SelectItem value="GS3">General Studies Paper III</SelectItem>
                      <SelectItem value="GS4">General Studies Paper IV</SelectItem>
                      <SelectItem value="Essay">Essay Paper</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>
              Drag and drop your question file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
                ${uploadState.isUploading ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              
              {isDragActive ? (
                <p className="text-primary">Drop the file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">Drop your question file here</p>
                  <p className="text-sm text-muted-foreground">
                    Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadState.isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading and processing...</span>
                  <span>{uploadState.progress}%</span>
                </div>
                <Progress value={uploadState.progress} className="w-full" />
              </div>
            )}

            {/* Upload Result */}
            {uploadState.result && (
              <div className="mt-4">
                <Alert className={uploadState.result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {uploadState.result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={uploadState.result.success ? "text-green-800" : "text-red-800"}>
                      {uploadState.result.message}
                    </AlertDescription>
                  </div>
                </Alert>

                {uploadState.result.stats && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded">
                      <div className="font-medium">Total Records</div>
                      <div className="text-2xl font-bold">{uploadState.result.stats.totalRecords}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="font-medium">Successful</div>
                      <div className="text-2xl font-bold text-green-600">{uploadState.result.stats.successfulRecords}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="font-medium">Failed</div>
                      <div className="text-2xl font-bold text-red-600">{uploadState.result.stats.failedRecords}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="font-medium">Success Rate</div>
                      <div className="text-2xl font-bold">
                        {Math.round((uploadState.result.stats.successfulRecords / uploadState.result.stats.totalRecords) * 100)}%
                      </div>
                    </div>
                  </div>
                )}

                {uploadState.result.errors && uploadState.result.errors.length > 0 && (
                  <div className="mt-4">
                    <details className="bg-red-50 border border-red-200 rounded p-3">
                      <summary className="font-medium text-red-800 cursor-pointer">
                        View Errors ({uploadState.result.errors.length})
                      </summary>
                      <div className="mt-2 space-y-1 text-sm text-red-700">
                        {uploadState.result.errors.map((error, index) => (
                          <div key={index} className="font-mono text-xs">
                            {error}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                <Button 
                  onClick={resetUpload} 
                  variant="outline" 
                  className="mt-4 w-full"
                >
                  Upload Another File
                </Button>
              </div>
            )}

            {/* Error Display */}
            {uploadState.error && !uploadState.result && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {uploadState.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Templates</CardTitle>
          <CardDescription>
            Download these templates to format your question data correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium">Prelims Questions Template</h3>
                  <p className="text-sm text-muted-foreground">Excel template for MCQ questions</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium">Mains Questions Template</h3>
                  <p className="text-sm text-muted-foreground">Excel template for descriptive questions</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>Supported File Formats</CardTitle>
          <CardDescription>
            Guidelines for preparing your question data files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Excel Files (.xlsx, .xls)</h4>
              <p className="text-sm text-muted-foreground">
                Use the provided templates with predefined column headers. Ensure all required fields are filled.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">CSV Files (.csv)</h4>
              <p className="text-sm text-muted-foreground">
                Comma-separated values with headers in the first row. Use the same column names as Excel templates.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">JSON Files (.json)</h4>
              <p className="text-sm text-muted-foreground">
                Array of question objects with properties matching the database schema.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Ensure all required fields are provided to avoid import failures</li>
              <li>• Question IDs should be unique across the system</li>
              <li>• Use proper formatting for arrays (comma-separated values)</li>
              <li>• Verify answer options and correct answers before uploading</li>
              <li>• Large files may take several minutes to process</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}