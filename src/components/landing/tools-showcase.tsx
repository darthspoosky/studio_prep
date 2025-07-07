import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, FileQuestion, PenLine, MoveRight, Newspaper, Users } from 'lucide-react';
import type { UsageStats } from '@/services/usageService';

const tools = [
    {
        id: 'newspaperAnalysis',
        icon: <Newspaper className="w-6 h-6 text-white" />,
        title: 'Newspaper Analysis',
        description: 'Get AI-powered analysis of daily news to improve comprehension and critical thinking.',
        gradient: 'from-orange-500 to-amber-500',
        href: '/newspaper-analysis'
    },
    {
        id: 'mockInterview',
        icon: <Mic className="w-6 h-6 text-white" />,
        title: 'Mock Interview',
        description: 'Practice with an AI interviewer that gives you real-time feedback on your answers.',
        gradient: 'from-purple-500 to-indigo-500',
        href: '/mock-interview'
    },
    {
        id: 'dailyQuiz',
        icon: <FileQuestion className="w-6 h-6 text-white" />,
        title: 'Daily Quiz',
        description: 'Sharpen your knowledge with quick, adaptive quizzes tailored to your exam and progress.',
        gradient: 'from-sky-500 to-cyan-500',
        href: '/daily-quiz'
    },
    {
        id: 'writingPractice',
        icon: <PenLine className="w-6 h-6 text-white" />,
        title: 'Writing Practice',
        description: 'Improve your essays with AI-guided suggestions on structure, clarity, and grammar.',
        gradient: 'from-emerald-500 to-teal-500',
        href: '/writing-practice'
    }
];

const ToolCard = ({ icon, title, description, gradient, href, count }: { icon: React.ReactNode, title: string, description: string, gradient: string, href: string, count?: number }) => (
    <Link href={href} className="group relative w-full h-full block">
        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-75 transition duration-500 blur-lg`}></div>
        <Card className="relative glassmorphic h-full flex flex-col justify-between transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-2">
            <div>
                <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                        {icon}
                    </div>
                    <CardTitle className="font-headline">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                    {count !== undefined && count > 0 && (
                        <div className="mt-4 flex items-center text-xs text-muted-foreground">
                            <Users className="w-4 h-4 mr-2"/>
                            <span>Used {count.toLocaleString()} times</span>
                        </div>
                    )}
                </CardContent>
            </div>
            <div className="p-6 pt-0">
                <div className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    Start Now <MoveRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Card>
    </Link>
);


const ToolsShowcase = ({ globalUsage }: { globalUsage: UsageStats }) => {
    return (
        <section id="tools" className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">
                        <span className="animate-gradient-anim bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">
                            A Smarter Way to Prepare
                        </span>
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                        Our suite of AI-powered tools is designed to target your weaknesses and supercharge your strengths.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {tools.map((tool) => (
                        <ToolCard 
                            key={tool.title} 
                            {...tool} 
                            count={globalUsage[tool.id as keyof UsageStats]} 
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ToolsShowcase;
