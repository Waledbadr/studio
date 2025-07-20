'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Lightbulb, Sparkles } from "lucide-react";

export default function ToolsPage() {
    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">AI Assistant Tools</h1>
                <p className="text-muted-foreground">Leverage AI to get insights and improve reporting.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Lightbulb className="h-6 w-6 text-primary" />
                            <CardTitle>Maintenance Insight Tool</CardTitle>
                        </div>
                        <CardDescription>Describe a maintenance issue to get suggestions for similar past issues and potential solutions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="e.g., The air conditioning unit in building C is making a loud rattling noise and not cooling effectively..." className="min-h-[150px]" />
                        <Button>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get Insights
                        </Button>
                         <div className="mt-4 p-4 bg-muted/50 rounded-lg border min-h-[100px]">
                            <h4 className="font-semibold mb-2 text-sm">AI Suggestions:</h4>
                            <p className="text-sm text-muted-foreground">Suggestions based on historical data will appear here...</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Bot className="h-6 w-6 text-primary" />
                            <CardTitle>Compliance Assistant</CardTitle>
                        </div>
                        <CardDescription>Write your maintenance reports and get AI-powered guidance to ensure quality and compliance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="Start writing your report here..." className="min-h-[150px]" />
                        <Button>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze Report
                        </Button>
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border min-h-[100px]">
                            <h4 className="font-semibold mb-2 text-sm">Compliance Feedback:</h4>
                            <p className="text-sm text-muted-foreground">Feedback to improve report quality will appear here...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
