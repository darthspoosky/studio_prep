
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Bot, Video, Mic, MicOff, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Layout Imports
import MainLayout from '@/app/dashboard/components/layout/MainLayout';
import LeftSidebar from '@/app/dashboard/components/layout/LeftSidebar';
import RightSidebar from '@/app/dashboard/components/layout/RightSidebar';
import MobileHeader from '@/app/dashboard/components/layout/MobileHeader';
import { UserNav } from '@/components/layout/user-nav';
import { getUserUsage, type UsageStats } from '@/services/usageService';
import { getUserQuizStats, type UserQuizStats } from '@/services/quizAttemptsService';


interface ExtendedUserQuizStats extends UserQuizStats {
    streak: number;
    improvement: number;
}

export default function MockInterviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form fields state
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [roleProfile, setRoleProfile] = useState("");

  // Interview session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [interviewData, setInterviewData] = useState<any>(null);
  const [transcription, setTranscription] = useState("");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Layout-related state
  const [quizStats, setQuizStats] = useState<ExtendedUserQuizStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
     if (user?.uid) {
      const fetchStats = async () => {
        try {
          const [stats, usage] = await Promise.all([
            getUserQuizStats(user.uid),
            getUserUsage(user.uid)
          ]);
          setQuizStats({ ...stats, streak: 0, improvement: 0 }); // Add dummy data
          setUsageStats(usage);
        } catch (error) {
          console.error("Error fetching dashboard stats:", error);
        }
      };
      
      fetchStats();
    }
  }, [user, loading, router]);

  const handleStartInterview = async () => {
    if (!interviewType || !difficulty) {
        toast({ title: "Configuration Incomplete", description: "Please select an interview type and difficulty level.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch('/api/mock-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await user?.getIdToken()}` },
            body: JSON.stringify({ interviewType, difficulty, roleProfile }),
        });
        if (!response.ok) throw new Error('Failed to start the interview session.');
        const data = await response.json();
        setInterviewData(data);
        setSessionStarted(true);
        toast({ title: "Session Started!", description: "Your mock interview is ready." });
    } catch (error) {
        console.error("Error starting interview:", error);
        toast({ title: "Error", description: "Could not start the interview session. Please try again later.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            audioChunksRef.current = [];
            
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                try {
                    const response = await fetch("/api/transcribe", { 
                        method: "POST", 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audioDataUri: base64Audio })
                    });
                    if (!response.ok) throw new Error("Transcription failed");
                    const data = await response.json();
                    setTranscription(data.transcription);
                } catch (error) {
                    console.error("Error transcribing audio:", error);
                    toast({ title: "Transcription Error", description: "Could not transcribe the audio.", variant: "destructive" });
                }
            };
        };
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Recording Started", description: "Your answer is being recorded." });
    } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({ title: "Microphone Error", description: "Could not access the microphone. Please check your browser permissions.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast({ title: "Recording Stopped", description: "Your answer has been saved." });
    }
  };

  const playQuestion = async (text: string) => {
    try {
        const response = await fetch("/api/tts", { 
            method: "POST", 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error("TTS failed");
        const { audio } = await response.json();
        const audioEl = new Audio(audio);
        audioEl.play();
    } catch (error) {
        console.error("Error playing audio:", error);
        toast({ title: "Playback Error", description: "Could not play the audio.", variant: "destructive" });
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <MainLayout
      leftSidebar={<LeftSidebar usageStats={usageStats} />}
      rightSidebar={<RightSidebar quizStats={quizStats} />}
      mobileHeader={<MobileHeader 
        usageStats={usageStats}
        pageTitle="Mock Interview" 
        userNav={<UserNav />} 
      />}
    >
        {!sessionStarted ? (
            <>
                <div className="text-center mb-16">
                    <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tighter">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Mock Interview</span>
                    </h1>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">Practice with our AI interviewer to get real-time feedback on your answers, tone, and pacing.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1">
                        <Card className="glassmorphic shadow-2xl shadow-primary/10">
                            <CardHeader>
                                <CardTitle>Configure Your Interview</CardTitle>
                                <CardDescription>Set up the parameters for your practice session.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="interview-type">Interview Type</Label>
                                    <Select value={interviewType} onValueChange={setInterviewType}>
                                        <SelectTrigger id="interview-type"><SelectValue placeholder="Select an interview type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="personality-test">Personality Test (UPSC Style)</SelectItem>
                                            <SelectItem value="technical-interview">Technical Interview (IBPS, RBI)</SelectItem>
                                            <SelectItem value="situational-judgement">Situational Judgement Test</SelectItem>
                                            <SelectItem value="hr-round">General HR Round</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role-profile">Paste Exam / Role Profile (Optional)</Label>
                                    <Textarea id="role-profile" placeholder="For a more tailored experience..." className="h-24" value={roleProfile} onChange={(e) => setRoleProfile(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="difficulty">Difficulty Level</Label>
                                    <Select value={difficulty} onValueChange={setDifficulty}>
                                        <SelectTrigger id="difficulty"><SelectValue placeholder="Select a difficulty level" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Beginner</SelectItem>
                                            <SelectItem value="medium">Intermediate</SelectItem>
                                            <SelectItem value="hard">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button size="lg" className="w-full" onClick={handleStartInterview} disabled={isLoading}>
                                    {isLoading && <Loader2 className="animate-spin mr-2" />} {isLoading ? "Configuring Session..." : "Start Interview"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="relative aspect-video w-full glassmorphic rounded-lg shadow-2xl shadow-primary/10 flex flex-col items-center justify-center p-8 overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 -z-10"></div>
                            <Bot className="w-24 h-24 text-primary/30 mb-4 animate-pulse" />
                            <h3 className="font-headline text-2xl text-foreground">Your AI Interviewer is Ready</h3>
                            <p className="text-muted-foreground mt-2 text-center">Your camera and microphone will be activated once the session starts.</p>
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md p-2 bg-black/30 text-white text-sm"><Video className="w-5 h-5" /><span>PrepTalk AI</span></div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Interview in Progress...</h2>
                <Card className="text-left w-full max-w-4xl mx-auto glassmorphic mb-8">
                    <CardHeader><CardTitle>AI Interviewer</CardTitle></CardHeader>
                    <CardContent>
                         {interviewData?.report?.firstQuestion && (
                            <div className="flex items-center gap-4">
                                <p className="text-lg flex-1">{interviewData.report.firstQuestion}</p>
                                <Button onClick={() => playQuestion(interviewData.report.firstQuestion)} variant="outline" size="icon">
                                    <Play className="h-4 w-4"/>
                                </Button>
                            </div>
                        )}
                        {transcription && <p className="mt-4 p-4 bg-muted/50 rounded-md">{transcription}</p>}
                    </CardContent>
                </Card>
                <div className="mt-6">
                    {!isRecording ? (
                        <Button size="lg" onClick={startRecording} className="rounded-full w-24 h-24 bg-green-500 hover:bg-green-600"><Mic className="w-10 h-10" /></Button>
                    ) : (
                        <Button size="lg" onClick={stopRecording} className="rounded-full w-24 h-24 bg-red-500 hover:bg-red-600"><MicOff className="w-10 h-10" /></Button>
                    )}
                </div>
                <Card className="text-left w-full max-w-4xl mx-auto glassmorphic mt-8">
                    <CardHeader><CardTitle>Session Details (Debug)</CardTitle></CardHeader>
                    <CardContent>
                        <pre className="bg-gray-900 text-white p-4 rounded-md overflow-x-auto">{JSON.stringify(interviewData, null, 2)}</pre>
                    </CardContent>
                </Card>
            </div>
        )}
    </MainLayout>
  );
}
