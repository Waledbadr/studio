/**
 * Git information utilities
 * This file provides git branch and last commit information
 */

export interface GitInfo {
  branch: string;
  lastCommitDate: string;
  lastCommitHash: string;
}

// This will be populated at build time or can be set manually
export const gitInfo: GitInfo = {
  branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'development',
  lastCommitDate: process.env.NEXT_PUBLIC_LAST_COMMIT_DATE || '2025-08-03T11:22:33.000Z',
  lastCommitHash: process.env.NEXT_PUBLIC_LAST_COMMIT_HASH || '1f287492'
};

/**
 * Get formatted git information for display with emphasis on date/time
 */
export function getFormattedGitInfo(): {
  branch: string;
  currentDateTime: string;
  lastUpdateFormatted: string;
  lastUpdateWithTime: string;
  lastUpdateRelative: string;
} {
  const lastCommitDate = new Date(gitInfo.lastCommitDate);
  const now = new Date();
  
  // Current date and time in Arabic
  const currentDateTime = now.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Format the last update date in Arabic locale
  const lastUpdateFormatted = lastCommitDate.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format with time included
  const lastUpdateWithTime = lastCommitDate.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate relative time in Arabic
  const diffInMinutes = Math.floor((now.getTime() - lastCommitDate.getTime()) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  let lastUpdateRelative: string;
  if (diffInMinutes < 60) {
    if (diffInMinutes === 0) {
      lastUpdateRelative = 'الآن';
    } else if (diffInMinutes === 1) {
      lastUpdateRelative = 'منذ دقيقة';
    } else {
      lastUpdateRelative = `منذ ${diffInMinutes} دقيقة`;
    }
  } else if (diffInHours < 24) {
    if (diffInHours === 1) {
      lastUpdateRelative = 'منذ ساعة';
    } else {
      lastUpdateRelative = `منذ ${diffInHours} ساعة`;
    }
  } else if (diffInDays === 1) {
    lastUpdateRelative = 'أمس';
  } else if (diffInDays < 7) {
    lastUpdateRelative = `منذ ${diffInDays} أيام`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    lastUpdateRelative = weeks === 1 ? 'منذ أسبوع' : `منذ ${weeks} أسابيع`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    lastUpdateRelative = months === 1 ? 'منذ شهر' : `منذ ${months} أشهر`;
  } else {
    const years = Math.floor(diffInDays / 365);
    lastUpdateRelative = years === 1 ? 'منذ سنة' : `منذ ${years} سنوات`;
  }

  return {
    branch: gitInfo.branch,
    currentDateTime,
    lastUpdateFormatted,
    lastUpdateWithTime,
    lastUpdateRelative
  };
}
