'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Lightbulb, Sparkles, Database, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ToolsPage() {
    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-2xl font-bold">AI Assistant Tools & Data Management</h1>
                <p className="text-muted-foreground">Leverage AI to get insights and manage data quality.</p>
            </div>
            
            {/* Data Management Tools */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Data Management Tools</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-orange-200 bg-orange-50/50">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Database className="h-6 w-6 text-orange-600" />
                                <CardTitle className="text-orange-900">Transfer Audit & Fix</CardTitle>
                            </div>
                            <CardDescription>
                                Scan for missing transfer transaction records and fix data inconsistencies in inventory movements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Use this tool to identify and fix missing transaction records for completed transfers between residences.
                            </p>
                            <Link href="/inventory/transfer-audit">
                                <Button className="w-full">
                                    <Database className="mr-2 h-4 w-4" />
                                    Open Transfer Audit Tool
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* AI Tools */}
            <div>
                <h2 className="text-xl font-semibold mb-4">AI Assistant Tools</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
    )
}
