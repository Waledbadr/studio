// This file maintains the mapping between fingerprint device names and their corresponding projects.
// Add or modify mappings here as new devices are installed.

export const DEVICE_PROJECT_MAP: Record<string, string> = {
  // Bahra Housing Camp (Industrial Complex)
  "aljuhami camp": "Bahra Housing Camp (Industerial Complex)",

  // Bahra Housing Camp (King Abdul Aziz Hospital)
  "h-um salam-b": "Bahra Housing Camp (King Abdul Aziz Hospital)",
  "h-umsalam-b2": "Bahra Housing Camp (King Abdul Aziz Hospital)",

  // Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)
  "h- wood camp2,head office-3": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "head office-2": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "head office-2,h- wood camp2": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "head office-2,head office-3": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "head office-3": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "head office-3,h- wood camp2": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "headoffice1": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "premco camp": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",
  "security-oldwoodcamp": "Jeddah Housing Camp-Hamdaniah-(Old Gypsum Factory)",

  // Jeddah Housing Camp-Hamdaniah-(Old Wood Factory)
  "airport60": "Jeddah Housing Camp-Hamdaniah-(Old Wood Factory)",
  "h- wood camp2": "Jeddah Housing Camp-Hamdaniah-(Old Wood Factory)",

  // Makkah Housing Camp
  "alaziziah housing": "Makkah Housing Camp",
  "h-a.khayat camp02,h-aziziya makkah": "Makkah Housing Camp",
  "h-aziziyamakkah1": "Makkah Housing Camp",
  
  // Makkah Housing Camp (Zahir)
  "h-a.khayat camp02": "Makkah Housing Camp (Zahir)",
  "h-a.khayatcamp-2": "Makkah Housing Camp (Zahir)",
  
  // Red Sea Housing Camp
  "sharma": "Red Sea Housing Camp",
  "sharma-1": "Red Sea Housing Camp",
  "sharma-3": "Red Sea Housing Camp",
  "sharma-4": "Red Sea Housing Camp",
  "sharma-5": "Red Sea Housing Camp",
  "sharma-6 eng": "Red Sea Housing Camp",
  "umluj housing": "Red Sea Housing Camp",
  
  // Riyadh Housing Camp
  "malaz-01": "Riyadh Housing Camp",
  
  // Riyadh King Saud University Housing Camp
  "h-ksauh-r": "Riyadh King Saud University Housing Camp",
  "hksauh-r1": "Riyadh King Saud University Housing Camp",
  "ksauh-r": "Riyadh King Saud University Housing Camp",
  "riyadh102": "Riyadh King Saud University Housing Camp",
  
  // Riyadh Remaal Housing Camp
  "althomama housing camp": "Riyadh Remaal Housing Camp",
};

export const getProjectFromDevice = (deviceName: string): string => {
  if (!deviceName) return "غير معروف";
  
  // Try exact match first (case insensitive)
  const normalized = deviceName.trim().toLowerCase();
  
  // Handle some specific edge cases with commas in the device names (as seen in source table)
  // For example: "Head Office-2,H- Wood Camp2" 
  // We'll map it to the first matching valid device if it's a comma-separated list
  const deviceParts = normalized.split(',').map(part => part.trim());
  
  for (const part of deviceParts) {
    if (DEVICE_PROJECT_MAP[part]) {
      return DEVICE_PROJECT_MAP[part];
    }
  }

  // If no exact match, try partial match (fallback)
  for (const [key, project] of Object.entries(DEVICE_PROJECT_MAP)) {
    if (normalized.includes(key)) {
      return project;
    }
  }
  
  // If we can't find a mapped project, fallback to returning the raw device name
  // so data isn't lost, but it highlights it's an unmapped device.
  return deviceName;
};
