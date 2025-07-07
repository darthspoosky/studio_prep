
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Footer from "@/components/landing/footer";
import Header from "@/components/layout/header";
import Link from "next/link";
import { ArrowLeft, Loader2, Target, Flame, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getRandomPrelimsQuestions, type PrelimsQuestionWithContext } from "@/services/historyService";
import { saveQuizAttempt } from "@/services/quizAttemptsService";
import { cn } from "@/lib/utils";

type QuizState = "config" | "loading" | "active" | "results";

const FormattedQuestion = ({ text }: { text: string }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        return <p className="font-semibold leading-relaxed text-foreground">{text}</p>;
    }
    const firstStatementIndex = lines.findIndex(line => /^\d+\.\s/.test(line.trim()));
    if (firstStatementIndex === -1) {
        return <p className="font-semibold leading-relaxed text-foreground" style={{ whiteSpace: 'pre-line' }}>{text}</p>;
    }
    const preamble = lines.slice(0, firstStatementIndex).join('\n');
    let lastStatementIndex = firstStatementIndex;
    for (let i = firstStatementIndex + 1; i < lines.length; i++) {
        if (/^\d+\.\s/.test(lines[i].trim())) {
            lastStatementIndex = i;
        } else {
            break; 
        }
    }
    const statements = lines.slice(firstStatementIndex, lastStatementIndex + 1);
    const conclusion = lines.slice(lastStatementIndex + 1).join('\n');
    return (
        <div className="font-semibold leading-relaxed text-foreground">
            {preamble && <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>{preamble}</p>}
            <ol className="list-decimal list-inside space-y-2 my-3">
                {statements.map((stmt, index) => (
                    <li key={index} className="pl-2">{stmt.trim().replace(/^\d+\.\s/, '')}</li>
                ))}
            </ol>
            {conclusion && <p className="mt-3" style={{ whiteSpace: 'pre-line' }}>{conclusion}</p>}
        </div>
    );
};


export default function DailyQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [quizState, setQuizState] = useState<QuizState>("config");
  const [questions, setQuestions] = useState<PrelimsQuestionWithContext[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [numQuestions, setNumQuestions] = useState("5");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleStartQuiz = async () => {
    if (!user) return;
    setQuizState("loading");
    try {
      const fetchedQuestions = await getRandomPrelimsQuestions(user.uid, parseInt(numQuestions));
      if (fetchedQuestions.length < parseInt(numQuestions)) {
        toast({
          variant: "destructive",
          title: "Not enough questions!",
          description: `We could only find ${fetchedQuestions.length} questions. Please analyze more articles to build your question bank.`,
        });
        if (fetchedQuestions.length === 0) {
            setQuizState("config");
            return;
        }
      }
      setQuestions(fetchedQuestions);
      setScore(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setQuizState("active");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to start quiz",
        description: "Could not fetch questions. Please try again.",
      });
      setQuizState("config");
    }
  };
  
  const handleAnswerSelect = (optionText: string) => {
    if (isAnswered) return;
  
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = currentQuestion.options.find(o => o.text === optionText)?.correct || false;

    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    setSelectedAnswer(optionText);
    setIsAnswered(true);

    if (user) {
      saveQuizAttempt(user.uid, currentQuestion.historyId, currentQuestion.question, optionText, isCorrect, currentQuestion.subject, currentQuestion.difficulty);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setQuizState("results");
    }
  };
  
  const resetQuiz = () => {
      setQuizState("config");
      setQuestions([]);
  };

  if (authLoading || !user) {
    return null;
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24 sm:py-32 flex items-center justify-center">
        {quizState === 'config' && (
             <Card className="w-full max-w-lg glassmorphic shadow-2xl shadow-primary/10">
                <CardHeader className="text-center">
                    <h1 className="font-headline text-4xl font-bold tracking-tighter">Daily Quiz</h1>
                    <p className="text-muted-foreground mt-2">Sharpen your knowledge with quick, adaptive quizzes.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="num-questions">Number of Questions</Label>
                        <Select value={numQuestions} onValueChange={setNumQuestions}>
                            <SelectTrigger id="num-questions">
                                <SelectValue placeholder="Select number of questions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <p className="text-xs text-muted-foreground text-center">Questions are randomly selected from your analysis history.</p>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full" onClick={handleStartQuiz}>
                        Start Quiz
                    </Button>
                </CardFooter>
            </Card>
        )}

        {quizState === 'loading' && (
             <Card className="w-full max-w-lg glassmorphic shadow-2xl shadow-primary/10 text-center p-12">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <h2 className="mt-4 font-headline text-2xl">Preparing Your Quiz...</h2>
                <p className="text-muted-foreground">Fetching questions from your history.</p>
            </Card>
        )}

        {quizState === 'active' && currentQuestion && (
            <Card className="w-full max-w-2xl glassmorphic shadow-2xl shadow-primary/10">
                <CardHeader>
                    <Progress value={(currentQuestionIndex + 1) / questions.length * 100} className="mb-4" />
                    <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormattedQuestion text={currentQuestion.question} />
                    <div className="grid grid-cols-1 gap-3 mt-6">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedAnswer === option.text;
                            const isCorrect = option.correct;
                            return (
                                <Button
                                key={index}
                                variant="outline"
                                onClick={() => handleAnswerSelect(option.text)}
                                disabled={isAnswered}
                                className={cn(
                                    "justify-start text-left h-auto py-3 px-4 whitespace-normal",
                                    isAnswered && (isCorrect ? "border-green-500 bg-green-500/10 hover:bg-green-500/20" : isSelected ? "border-red-500 bg-red-500/10 hover:bg-red-500/20" : "")
                                )}
                                >
                                    {isAnswered && (isCorrect ? <CheckCircle className="mr-2 text-green-500"/> : isSelected ? <XCircle className="mr-2 text-red-500"/> : <div className="w-6 mr-2"></div>)}
                                    {option.text}
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextQuestion} disabled={!isAnswered}>
                        {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                    </Button>
                </CardFooter>
            </Card>
        )}
        
        {quizState === 'results' && (
             <Card className="w-full max-w-lg glassmorphic shadow-2xl shadow-primary/10 text-center p-8">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Quiz Complete!</CardTitle>
                    <CardDescription>Here's how you did.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-6xl font-bold text-primary">{score} / {questions.length}</div>
                    <p className="text-xl font-medium">Your Accuracy: {Math.round((score / questions.length) * 100)}%</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={resetQuiz} size="lg">Take Another Quiz</Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardFooter>
            </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
