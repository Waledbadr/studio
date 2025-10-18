"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  disabled?: boolean;
  count?: number;
}

export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  className,
  disabled,
  count,
}: QuickActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={cn(
        "relative h-auto py-4 px-6 flex-col gap-2 hover:scale-105 transition-transform",
        className
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {count}
        </span>
      )}
    </Button>
  );
}
