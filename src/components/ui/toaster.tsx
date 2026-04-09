"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variant === "success"
          ? "success"
          : variant === "destructive"
          ? "destructive"
          : variant === "warning"
          ? "warning"
          : "default"

        const iconClasses =
          variant === "success"
            ? "text-emerald-600"
            : variant === "destructive"
            ? "text-red-600"
            : variant === "warning"
            ? "text-amber-600"
            : "text-sky-600"

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3" dir="rtl">
              <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 shadow-sm ${iconClasses}`}>
                {icon === "success" ? <CheckCircle2 className="h-4 w-4" /> : icon === "destructive" ? <XCircle className="h-4 w-4" /> : icon === "warning" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle className="text-right font-semibold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-right text-sm text-slate-700 dark:text-slate-300">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
