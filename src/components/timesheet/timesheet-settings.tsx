"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Save, Fingerprint, MapPin, Search, Users, UserPlus, Link2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import { useUsers } from "@/context/users-context";
import { useResidences } from "@/context/residences-context";
import { useTimesheet } from "@/context/timesheet-context";
import { DEVICE_PROJECT_MAP } from "@/constants/timesheet-devices";

export function TimesheetSettings() {
  const { locale } = useLanguage();
  const { users, currentUser, saveUser } = useUsers();
  const { residences, loadResidences } = useResidences();
  const {
    projectToResidenceMap,
    updateProjectMapping,
    removeProjectMapping,
    deviceToProjectMap,
    updateDeviceMapping,
    updateBulkDeviceMappings,
    removeDeviceMapping,
    timesheetEvents,
    updateEvents,
    employeeSchedules,
    updateSchedules
  } = useTimesheet();
  const isAr = locale === "ar";

  useEffect(() => {
    loadResidences();
  }, [loadResidences]);

  const getProjectName = (id: string) => {
    const res = residences.find((r) => r.id === id);
    if (!res) return id; 
    return isAr ? (res.nameAr || res.name) : (res.nameEn || res.name);
  };

  const [mappings, setMappings] = useState<{ id: string; deviceName: string; projectName: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);      
  const [newUserProject, setNewUserProject] = useState("");

  const [newDevice, setNewDevice] = useState("");
  const [newProject, setNewProject] = useState("");

  const [newBiometricDevice, setNewBiometricDevice] = useState("");
  const [newBiometricProject, setNewBiometricProject] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  useEffect(() => {
    const initialMappings = Object.entries(DEVICE_PROJECT_MAP).map(([deviceName, projectName], i) => ({
      id: `dev-${i}`,
      deviceName,
      projectName
    }));
    setMappings(initialMappings);
  }, []);

  const handleAddDeviceMapping = () => {
    if (!newBiometricDevice.trim() || !newBiometricProject.trim()) return;      
    updateDeviceMapping(newBiometricDevice.trim(), newBiometricProject.trim()); 
    setNewBiometricDevice("");
    setNewBiometricProject("");
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split('\n');
    const newMappings: Record<string, string> = {};
    let addedCount = 0;

    lines.forEach(line => {
      // Allow tab or comma separation
      const separator = line.includes('\t') ? '\t' : ',';
      const parts = line.split(separator);
      if (parts.length >= 2) {
        const deviceName = parts[0].trim();
        const projectName = parts[1].trim();
        if (deviceName && projectName) {
          newMappings[deviceName] = projectName;
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      updateBulkDeviceMappings(newMappings);
      setBulkInput("");
      setIsBulkMode(false);
      alert(isAr ? `تم إضافة ${addedCount} جهاز بنجاح.` : `Successfully added ${addedCount} devices.`);
    } else {
      alert(isAr ? "لم يتم العثور على بيانات صحيحة. تأكد من النسخ بشكل صحيح." : "No valid data found. Ensure correct formatting.");
    }
  };

  const handleRemoveDeviceMapping = (deviceName: string) => {
    removeDeviceMapping(deviceName);
  };

  const handleAddMapping = () => {
    if (!newDevice.trim() || !newProject.trim()) return;
    updateProjectMapping(newDevice.trim(), newProject.trim());
    setNewDevice("");
    setNewProject("");
  };

  const handleRemoveMapping = (deviceName: string) => {
    removeProjectMapping(deviceName);
  };

  const displayDeviceMappings = useMemo(() => {
    return Object.entries(deviceToProjectMap).map(([deviceName, projectName], i) => ({
      id: `devmap-${i}`,
      deviceName,
      projectName
    }));
  }, [deviceToProjectMap]);

  const displayMappings = useMemo(() => {
    return Object.entries(projectToResidenceMap).map(([deviceName, residenceId], i) => ({
      id: `map-${i}`,
      deviceName,
      residenceId,
      projectName: getProjectName(residenceId)
    }));
  }, [projectToResidenceMap, residences]);

  const handleAddUserProject = async (userId: string) => {
    if (!newUserProject.trim()) return;

    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit) return;

    const currentAssignments = userToEdit.assignedResidences || [];
    if (currentAssignments.includes(newUserProject.trim())) {
      setNewUserProject("");
      return; 
    }

    const updatedUser = {
      ...userToEdit,
      assignedResidences: [...currentAssignments, newUserProject.trim()]        
    };

    try {
      await saveUser(updatedUser);
      setNewUserProject("");
      setEditingUserId(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(isAr ? "حدث خطأ أثناء حفظ أذونات المستخدم" : "Error saving user permissions");
    }
  };

  const handleRemoveUserProject = async (userId: string, projectToRemove: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit) return;

    const updatedUser = {
      ...userToEdit,
      assignedResidences: (userToEdit.assignedResidences || []).filter(p => p !== projectToRemove)
    };

    try {
      await saveUser(updatedUser);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(isAr ? "حدث خطأ أثناء إزالة الأذونات" : "Error removing permissions");
    }
  };

  const filteredDeviceMappings = displayDeviceMappings.filter(m =>
    m.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMappings = displayMappings.filter(m => 
    m.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const getUniqueBiometricProjects = () => {
    return Array.from(new Set(Object.values(DEVICE_PROJECT_MAP))).sort();       
  };

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{isAr ? "إعدادات أجهزة البصمة" : "Biometric Devices Settings"}</h1>
        <p className="text-muted-foreground mt-1">
          {isAr ? "قم بتعريف أجهزة البصمة وربطها بالمشاريع ومقرات السكن" : "Define biometric devices and link them to projects and accommodations"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-purple-600" />
                {isAr ? "ربط أجهزة البصمة بالمشاريع" : "Map Devices to Biometric Projects"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsBulkMode(!isBulkMode)}>
                {isAr ? (isBulkMode ? "إضافة فردية" : "إضافة جماعية (لصق)") : (isBulkMode ? "Single Add" : "Bulk Add (Paste)")}
              </Button>
            </div>
            <CardDescription>
              {isAr ? "أدخل اسم جهاز البصمة واربطه باسم المشروع" : "Enter the device name to map it to a biometric project."} 
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBulkMode ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{isAr ? "الصق البيانات هنا (اسم الجهاز [مسافة/فاصلة] اسم المشروع)" : "Paste Data Here (Device Name [tab/comma] Project Name)"}</label>       
                <textarea
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={isAr ? "DeviceA\tProjectX\nDeviceB\tProjectY" : "DeviceA\tProjectX\nDeviceB\tProjectY"}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isAr ? "اسم جهاز البصمة" : "Device Name"}</label>
                  <Input
                    placeholder={isAr ? "مثل: Device A" : "e.g. Device A"}   
                    value={newBiometricDevice}
                    onChange={(e) => setNewBiometricDevice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isAr ? "مشروع البصمة" : "Biometric Project"}</label>
                  <Input
                    placeholder={isAr ? "مثل: Project X" : "e.g. Project X"} 
                    value={newBiometricProject}
                    onChange={(e) => setNewBiometricProject(e.target.value)}    
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            {isBulkMode ? (
              <Button onClick={handleBulkImport} className="w-full gap-2 cursor-pointer" disabled={!bulkInput.trim()}>
                <Save className="w-4 h-4" />
                {isAr ? "حفظ الإضافة الجماعية" : "Save Bulk Import"}
              </Button>
            ) : (
              <Button onClick={handleAddDeviceMapping} className="w-full gap-2 cursor-pointer" disabled={!newBiometricDevice || !newBiometricProject}>
                <Plus className="w-4 h-4" />
                {isAr ? "إضافة الربط" : "Add Device Mapping"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                {isAr ? "ربوط الأجهزة الحالية" : "Active Device Mappings"}
              </span>
              <Badge variant="secondary">{Object.keys(deviceToProjectMap).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={isAr ? "بحث في الربوط..." : "Search mappings..."}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {filteredDeviceMappings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {isAr ? "لا توجد ربوط مطابقة." : "No mappings found."}
                </div>
              ) : (
                filteredDeviceMappings.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{m.deviceName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Link2 className="w-3 h-3" />
                        {m.projectName}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveDeviceMapping(m.deviceName)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              {isAr ? "ربط أسماء مشاريع البصمة بالسكن" : "Map Biometric Projects to Residences"}
            </CardTitle>
            <CardDescription>
              {isAr ? "اختر اسم المشروع كما يظهر في جهاز البصمة، وحدد السكن المقابل له في النظام" : "Select the project name as it comes from the biometric system, and map it to an application residence."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isAr ? "مشروع البصمة (System Project)" : "Biometric System Project Name"}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newDevice}
                onChange={(e) => setNewDevice(e.target.value)}
              >
                <option value="">{isAr ? "اختر مشروع البصمة..." : "Select biometric project..."}</option>
                {getUniqueBiometricProjects().map((projName) => (
                  <option key={projName} value={projName}>{projName}</option>   
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isAr ? "السكن المعرّف بالنظام" : "Application Residence"}</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
              >
                <option value="">{isAr ? "اختر سكن النظام..." : "Select app residence..."}</option>
                {residences.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isAr ? (r.nameAr || r.name) : (r.nameEn || r.name)}        
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddMapping} className="w-full gap-2 cursor-pointer" disabled={!newDevice || !newProject}>
               <Plus className="w-4 h-4" />
              {isAr ? "إضافة الربط بالنظام" : "Add Application Mapping"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                {isAr ? "الربوط الحالية بالنظام" : "Active Application Mappings"}
              </span>
              <Badge variant="secondary">{Object.keys(projectToResidenceMap).length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={isAr ? "بحث في الربوط..." : "Search mappings..."}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {filteredMappings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  {isAr ? "لا توجد ربوط مطابقة." : "No mappings found."}
                </div>
              ) : (
                filteredMappings.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{m.deviceName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Link2 className="w-3 h-3" />
                        {m.projectName}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveMapping(m.deviceName)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            {isAr ? "صلاحيات المستخدمين على المشاريع" : "User Project Access"}
          </CardTitle>
          <CardDescription>
            {isAr ? "قم بتعيين أو إزالة صلاحيات وصول كل مستخدم لمشاريع النظام." : "Assign or remove user access to application projects."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={isAr ? "بحث عن مستخدم..." : "Search users..."}
                className="pl-8"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 rtl:text-right ltl:text-left font-medium">{isAr ? "المستخدم" : "User"}</th>
                  <th className="p-3 rtl:text-right ltl:text-left font-medium">{isAr ? "الدور" : "Role"}</th>
                  <th className="p-3 rtl:text-right ltl:text-left font-medium">{isAr ? "المشاريع المعينة" : "Assigned Projects"}</th>
                  <th className="p-3 rtl:text-right ltl:text-left font-medium w-[200px]">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      {isAr ? "لا يوجد مستخدمين." : "No users found."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="p-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {user.assignedResidences?.map(projId => (
                            <Badge key={projId} variant="outline" className="flex items-center gap-1">
                              {getProjectName(projId)}
                              <Trash2 
                                className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" 
                                onClick={() => handleRemoveUserProject(user.id, projId)}
                              />
                            </Badge>
                          ))}
                          {(!user.assignedResidences || user.assignedResidences.length === 0) && (
                            <span className="text-xs text-muted-foreground">{isAr ? "لا توجد مشاريع" : "No projects"}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {editingUserId === user.id ? (
                          <div className="flex gap-2 items-center">
                            <select
                              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={newUserProject}
                              onChange={(e) => setNewUserProject(e.target.value)}
                            >
                              <option value="">{isAr ? "اختر مشروعاً..." : "Select project..."}</option>
                              {residences.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {isAr ? (r.nameAr || r.name) : (r.nameEn || r.name)}
                                </option>
                              ))}
                            </select>
                            <Button size="sm" onClick={() => handleAddUserProject(user.id)} disabled={!newUserProject}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingUserId(null); setNewUserProject(""); }}>
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setEditingUserId(user.id)} className="w-full text-xs">
                            <UserPlus className="w-3 h-3 mr-1" />
                            {isAr ? "إضافة مشروع للمستخدم" : "Assign Project"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
