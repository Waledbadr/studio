const fs = require('fs');

const path = 'd:/EstateCare/studio/src/components/timesheet/timesheet-settings.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '<Fingerprint className="w-5 h-5 text-purple-600" />';
const endMarker = '</CardFooter>\n        </Card>';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found');
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex);

const newJSX = `<Fingerprint className="w-5 h-5 text-purple-600" />
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
                  placeholder={isAr ? "DeviceA\\tProjectX\\nDeviceB\\tProjectY" : "DeviceA\\tProjectX\\nDeviceB\\tProjectY"}
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
        </Card>`;

// Find where to prepend the missing div that we cut out
const preReplaceIndex = before.lastIndexOf('<CardTitle className="text-lg flex items-center gap-2">');
const finalBefore = before.substring(0, preReplaceIndex) + '<div className="flex items-center justify-between">\n              <CardTitle className="text-lg flex items-center gap-2">\n                ';

fs.writeFileSync(path, finalBefore + newJSX + after);
console.log('Done replacement');
