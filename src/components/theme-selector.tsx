'use client';

import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useUsers } from '@/context/users-context';
import { colorThemes, type ColorTheme } from '@/lib/themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Monitor, Moon, Sun, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ThemeSelector() {
  const { colorTheme, mode, setColorTheme, setMode } = useTheme();
  const { currentUser, saveUser } = useUsers();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleColorThemeChange = async (newColorTheme: string) => {
    setIsLoading(true);
    try {
      // Update theme immediately
      setColorTheme(newColorTheme);
      
      // Save to user settings if user is logged in
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          themeSettings: {
            colorTheme: newColorTheme,
            mode: mode
          }
        };
        await saveUser(updatedUser);
      }
      
      toast({
        title: 'تم تحديث الثيم',
        description: `تم تطبيق ثيم ${colorThemes.find(t => t.id === newColorTheme)?.displayName} بنجاح`
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ إعدادات الثيم',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (newMode: 'light' | 'dark' | 'system') => {
    setIsLoading(true);
    try {
      // Update mode immediately
      setMode(newMode);
      
      // Save to user settings if user is logged in
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          themeSettings: {
            colorTheme: colorTheme,
            mode: newMode
          }
        };
        await saveUser(updatedUser);
      }
      
      const modeNames = {
        light: 'الفاتح',
        dark: 'الداكن',
        system: 'حسب النظام'
      };
      
      toast({
        title: 'تم تحديث الوضع',
        description: `تم تطبيق الوضع ${modeNames[newMode]} بنجاح`
      });
    } catch (error) {
      console.error('Error saving mode:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ إعدادات الوضع',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ThemePreview = ({ theme }: { theme: ColorTheme }) => (
    <div className="relative rounded-lg overflow-hidden border">
      <div className="grid grid-cols-2">
        {/* Light Mode Preview */}
        <div className="p-3 bg-white">
          <div className="space-y-2">
            <div 
              className="w-full h-6 rounded"
              style={{ backgroundColor: theme.preview.primary }}
            />
            <div 
              className="w-3/4 h-4 rounded"
              style={{ backgroundColor: theme.preview.secondary }}
            />
            <div 
              className="w-1/2 h-3 rounded"
              style={{ backgroundColor: theme.preview.accent }}
            />
          </div>
        </div>
        
        {/* Dark Mode Preview */}
        <div className="p-3 bg-gray-900">
          <div className="space-y-2">
            <div 
              className="w-full h-6 rounded"
              style={{ backgroundColor: theme.preview.primary }}
            />
            <div className="w-3/4 h-4 rounded bg-gray-600" />
            <div 
              className="w-1/2 h-3 rounded"
              style={{ backgroundColor: theme.preview.accent }}
            />
          </div>
        </div>
      </div>
      
      {/* Selection indicator */}
      {colorTheme === theme.id && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          إعدادات الثيم والألوان
        </h3>
        <p className="text-sm text-muted-foreground">
          اختر الألوان والوضع المفضل لديك. سيتم حفظ الإعدادات في حسابك.
        </p>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colors">الألوان</TabsTrigger>
          <TabsTrigger value="mode">الوضع</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorThemes.map((theme) => (
              <Card 
                key={theme.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  colorTheme === theme.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleColorThemeChange(theme.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {theme.displayName}
                    {colorTheme === theme.id && <Check className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {theme.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ThemePreview theme={theme} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="mode" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                mode === 'light' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleModeChange('light')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2">
                  <Sun className="h-8 w-8 text-yellow-500" />
                </div>
                <CardTitle className="text-sm flex items-center justify-center gap-2">
                  الوضع الفاتح
                  {mode === 'light' && <Check className="h-4 w-4 text-primary" />}
                </CardTitle>
                <CardDescription className="text-xs">
                  ألوان فاتحة ومشرقة مناسبة للاستخدام النهاري
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                mode === 'dark' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleModeChange('dark')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2">
                  <Moon className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="text-sm flex items-center justify-center gap-2">
                  الوضع الداكن
                  {mode === 'dark' && <Check className="h-4 w-4 text-primary" />}
                </CardTitle>
                <CardDescription className="text-xs">
                  ألوان داكنة مريحة للعين في الإضاءة المنخفضة
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                mode === 'system' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleModeChange('system')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2">
                  <Monitor className="h-8 w-8 text-gray-500" />
                </div>
                <CardTitle className="text-sm flex items-center justify-center gap-2">
                  حسب النظام
                  {mode === 'system' && <Check className="h-4 w-4 text-primary" />}
                </CardTitle>
                <CardDescription className="text-xs">
                  يتبع إعدادات نظام التشغيل تلقائياً
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {currentUser && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">المستخدم: {currentUser.name}</Badge>
          <span>سيتم حفظ الإعدادات في حسابك</span>
        </div>
      )}
    </div>
  );
}
