import * as React from "react"

import { cn } from "@/lib/utils"


interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "ltr" | "rtl"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, direction, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Glassmorphism base for all cards
        "rounded-xl border border-white/20 bg-white/40 text-card-foreground shadow-[0_10px_35px_-15px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        // Dark mode tuning (slightly more transparent)
        "dark:border-white/5 dark:bg-white/5",
        // Responsive padding for mobile/desktop
        "p-3 sm:p-6",
        // RTL support
        direction === "rtl" ? "rtl" : "ltr",
        className
      )}
      dir={direction}
      {...props}
    />
  )
)
Card.displayName = "Card"


interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "ltr" | "rtl"
}
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, direction, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-3 sm:p-6",
        direction === "rtl" ? "rtl" : "ltr",
        className
      )}
      dir={direction}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"


interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "ltr" | "rtl"
}
const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, direction, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        direction === "rtl" ? "rtl" : "ltr",
        className
      )}
      dir={direction}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"


interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "ltr" | "rtl"
}
const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, direction, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        direction === "rtl" ? "rtl" : "ltr",
        className
      )}
      dir={direction}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"


interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "ltr" | "rtl"
}
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, direction, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-3 pt-0 sm:p-6 sm:pt-0",
        direction === "rtl" ? "rtl" : "ltr",
        className
      )}
      dir={direction}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"


interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "ltr" | "rtl"
}
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, direction, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-3 pt-0 sm:p-6 sm:pt-0",
        direction === "rtl" ? "rtl" : "ltr",
        className
      )}
      dir={direction}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
