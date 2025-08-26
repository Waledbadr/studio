"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        // تسجيل الدخول
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: `مرحباً ${data.user.name}`,
          });
          router.push('/');
        } else {
          const errorData = await response.json() as any;
          setError(errorData.error || 'خطأ في تسجيل الدخول');
        }
      } else {
        // إنشاء حساب جديد
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        if (response.ok) {
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: "يمكنك الآن تسجيل الدخول",
          });
          setMode("signin");
          setName("");
          setPassword("");
        } else {
          const errorData = await response.json() as any;
          setError(errorData.error || 'خطأ في إنشاء الحساب');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === "signin" 
            ? "أدخل بياناتك للوصول إلى النظام" 
            : "أنشئ حساباً جديداً للبدء"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === "signup"}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                جاري المعالجة...
              </div>
            ) : (
              mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="text-sm"
          >
            {mode === "signin" ? (
              <>
                ليس لديك حساب؟{" "}
                <span className="font-medium text-primary">إنشاء حساب جديد</span>
              </>
            ) : (
              <>
                لديك حساب بالفعل؟{" "}
                <span className="font-medium text-primary">تسجيل الدخول</span>
              </>
            )}
          </Button>
        </div>

        {mode === "signin" && (
          <div className="mt-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">حسابات تجريبية:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>مدير:</strong> dev@estatecare.com / admin123</div>
                <div><strong>مستخدم:</strong> ahmed@test.com / admin123</div>
                <div><strong>مدير قسم:</strong> fatima@test.com / admin123</div>
                <div><strong>فني:</strong> tech@test.com / admin123</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
