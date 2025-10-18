"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  MapPin,
  Home,
  DoorOpen,
  Calendar,
  UserCheck,
  LogIn,
  LogOut,
  ArrowRightLeft,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface WorkerCardProps {
  worker: {
    id: string;
    name: string;
    employeeId?: string;
    nationaliy?: string;
    company?: string;
    role?: string;
    isAssigned: boolean;
    currentResidence?: string;
    currentRoom?: string;
    residenceName?: string;
    roomName?: string;
    checkInDate?: string;
  };
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onTransfer?: () => void;
  onSwap?: () => void;
  onViewTimeline?: () => void;
  selected?: boolean;
  onSelect?: () => void;
}

export function WorkerCard({
  worker,
  onCheckIn,
  onCheckOut,
  onTransfer,
  onSwap,
  onViewTimeline,
  selected,
  onSelect,
}: WorkerCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-all ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left Section: Worker Info */}
          <div className="flex items-center gap-4 flex-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onSelect}
                className="h-4 w-4 rounded border-gray-300"
              />
            )}

            <div className="flex-shrink-0">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${
                  worker.isAssigned ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}
              >
                {worker.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate">{worker.name}</h3>
                {worker.isAssigned ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <UserCheck className="h-3 w-3 mr-1" />
                    مسكّن
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    غير مسكّن
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {worker.employeeId && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {worker.employeeId}
                  </span>
                )}
                {worker.nationaliy && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {worker.nationaliy}
                  </span>
                )}
                {worker.company && (
                  <Badge variant="outline" className="text-xs">
                    {worker.company}
                  </Badge>
                )}
                {worker.role && worker.role !== 'Worker' && (
                  <Badge variant="secondary" className="text-xs">
                    {worker.role}
                  </Badge>
                )}
              </div>

              {worker.isAssigned && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                    <Home className="h-4 w-4" />
                    <span className="font-semibold">{worker.residenceName}</span>
                    <span>•</span>
                    <DoorOpen className="h-4 w-4" />
                    <span>{worker.roomName}</span>
                  </div>
                  {worker.checkInDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      منذ {new Date(worker.checkInDate).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            {!worker.isAssigned ? (
              <Button
                size="sm"
                onClick={onCheckIn}
                className="bg-green-600 hover:bg-green-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                تسكين
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onTransfer && (
                    <DropdownMenuItem onClick={onTransfer}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      نقل إلى غرفة أخرى
                    </DropdownMenuItem>
                  )}
                  {onSwap && (
                    <DropdownMenuItem onClick={onSwap}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      مبادلة مع عامل
                    </DropdownMenuItem>
                  )}
                  {onViewTimeline && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onViewTimeline}>
                        <Calendar className="h-4 w-4 mr-2" />
                        عرض السجل الزمني
                      </DropdownMenuItem>
                    </>
                  )}
                  {onCheckOut && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onCheckOut} className="text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        إخراج من السكن
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
