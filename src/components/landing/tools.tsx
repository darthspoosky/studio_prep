import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, FileQuestion, PenLine, MoveRight } from 'lucide-react';

const ToolCard = ({ icon, title, description, gradient }: { icon: React.ReactNode, title: string, description: string, gradient: string }) => (
    <div className="group relative w-full">
        <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-75 transition duration-500 blur-lg`}></div>
        <Card className="relative glassmorphic h-full flex flex-col transition-transform duration-300 ease-in-out group-hover:scale-105 group-hover:-translate-y-2">
            <CardHeader className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                    {icon}
                </div>
                <CardTitle className="font-headline">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-muted-foreground mb-6">{description}</p>
                <Button variant="secondary" className="w-full group/btn">
                    Start Now <MoveRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Button>
            </CardContent>
        </Card>
    </div>
);


const Tools = () => {
    const tools = [
        {
            icon: <Mic className="w-6 h-6 text-white" />,
            title: 'Mock Interview',
            description: 'Practice with an AI interviewer that gives you real-time feedback on your answers, tone, and pacing.',
            gradient: 'from-purple-500 to-indigo-500'
        },
        {
            icon: <FileQuestion className="w-6 h-6 text-white" />,
            title: 'Daily Quiz',
            description: 'Sharpen your knowledge with quick, adaptive quizzes tailored to your exam and progress.',
            gradient: 'from-sky-500 to-cyan-500'
        },
        {
            icon: <PenLine className="w-6 h-6 text-white" />,
            title: 'Writing Practice',
            description: 'Improve your essays with AI-guided suggestions on structure, clarity, and grammar.',
            gradient: 'from-emerald-500 to-teal-500'
        }
    ];

    return (
        <section className="py-20 sm:py-32 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
                        Our Core Tools
                    </h2>
                    <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Everything you need to get exam-ready, all in one place.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tools.map((tool, index) => (
                        <ToolCard key={index} {...tool} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Tools;
