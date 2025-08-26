'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/theme-selector";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Palette, Database, Home } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/context/users-context-simple";


export default function SetupPage() {
    const { toast } = useToast();
    const { currentUser } = useUsers();
    const isAdmin = currentUser?.role === 'Admin';
    const dangerousEnabled = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DANGEROUS_TOOLS === 'true';
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isAddingRooms, setIsAddingRooms] = useState(false);
    const [isFixingStock, setIsFixingStock] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('database');
    const RESET_PASSWORD = 'RESET123';
    
    // Check for theme tab in URL hash
    useEffect(() => {
        // If themes hash present or user is not Admin, default to themes tab
        if (typeof window !== 'undefined' && (window.location.hash === '#themes' || !isAdmin)) {
            setActiveTab('themes');
        }
    }, [isAdmin]);

    const seedInitialData = async () => {
        setIsLoading(true);
        try {
            toast({ title: 'Unavailable', description: 'Seeding via Firebase is disabled during Cloudflare migration.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetSystem = async () => {
        if (password !== RESET_PASSWORD) {
            toast({ title: 'Error', description: 'Incorrect password.', variant: 'destructive' });
            return;
        }
        setIsResetting(true);
        try {
            toast({ title: 'Unavailable', description: 'Reset is disabled during Cloudflare migration. Implement D1 cleanup instead.', variant: 'destructive' });
            setPassword('');
        } finally {
            setIsResetting(false);
        }
    };

    const handleAddRooms = async () => {
        setIsAddingRooms(true);
        try {
            toast({ title: 'Unavailable', description: 'Add Rooms via Firebase is disabled during Cloudflare migration.', variant: 'destructive' });
        } finally {
            setIsAddingRooms(false);
        }
    };

    const fixStockData = async () => {
        setIsFixingStock(true);
        try {
            toast({ title: 'Unavailable', description: 'Fix Stock uses Firestore and is disabled. Implement D1-based recalculation.', variant: 'destructive' });
        } finally {
            setIsFixingStock(false);
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">System Setup & Configuration</h1>
                <p className="text-muted-foreground">Configure your system settings and manage data</p>
            </div>
            
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {isAdmin && (
                                            <TabsTrigger value="database" className="flex items-center gap-2">
                                                    <Database className="h-4 w-4" />
                                                    Database Setup
                                            </TabsTrigger>
                                        )}
                                        <TabsTrigger value="themes" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Theme Settings
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="themes" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Personalization Settings
                            </CardTitle>
                            <CardDescription>
                                Customize the appearance of your application with different color themes and modes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ThemeSelector />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {isAdmin && (
                <TabsContent value="database" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {dangerousEnabled && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <Database className="h-5 w-5" />
                                      Initial Data Setup
                                  </CardTitle>
                                  <CardDescription>
                                      This checks if your database is empty and adds sample data for development.
                                  </CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <Button onClick={seedInitialData} disabled={isLoading} className="w-full">
                                      {isLoading ? (
                                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
                                      ) : (
                                          'Seed Database'
                                      )}
                                  </Button>
                              </CardContent>
                          </Card>
                        )}

                        {dangerousEnabled && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <Home className="h-5 w-5" />
                                      Add Specific Rooms
                                  </CardTitle>
                                  <CardDescription>
                                      Adds a predefined list of rooms to a specific floor/building. Intended for one-off setup.
                                  </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  <Button onClick={handleAddRooms} disabled={isAddingRooms} className="w-full">
                                      {isAddingRooms ? (
                                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Rooms...</>
                                      ) : (
                                          'Add Rooms to B1'
                                      )}
                                  </Button>
                              </CardContent>
                          </Card>
                        )}

                        {dangerousEnabled && (
                          <Card>
                              <CardHeader>
                                  <CardTitle className="text-destructive">Reset Database</CardTitle>
                                  <CardDescription>
                                      <strong>Warning:</strong> Permanently deletes operational data, resets inventory stock, and clears counters. Users and feedback are preserved.
                                  </CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="destructive" className="w-full">
                                              Reset All Data
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  This action cannot be undone. This will permanently delete operational data including orders, transfers, maintenance records, and reset inventory stock to zero. Users and feedback data will be preserved.
                                                  <br /><br />
                                                  Please type <strong>RESET123</strong> to confirm:
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <div className="grid gap-4 py-4">
                                              <Label htmlFor="reset-password">Confirmation Password</Label>
                                              <Input
                                                  id="reset-password"
                                                  type="password"
                                                  value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  placeholder="Type RESET123 to confirm"
                                              />
                                          </div>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                  onClick={handleResetSystem}
                                                  disabled={isResetting || password !== RESET_PASSWORD}
                                                  className="bg-destructive hover:bg-destructive/90"
                                              >
                                                  {isResetting ? (
                                                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                                                  ) : (
                                                      'Reset Database'
                                                  )}
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </CardContent>
                          </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-yellow-600">Fix Stock Issues</CardTitle>
                                <CardDescription>
                                    Use this tool if you're experiencing stock calculation issues. It will recalculate stock levels based on transaction history.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={fixStockData} disabled={isFixingStock} className="w-full" variant="outline">
                                    {isFixingStock ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fixing Stock...</>
                                    ) : (
                                        'Fix Stock Issues'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
