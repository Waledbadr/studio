/**
 * Utility function to copy text to clipboard with fallback
 * Handles the "NotAllowedError: Failed to execute 'writeText'" issue
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Check if clipboard API is available and allowed
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback method for older browsers or when clipboard API is blocked
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    }
  } catch (error) {
    console.warn('Failed to copy to clipboard:', error);
    
    // Final fallback: create a text area and try execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    } catch (fallbackError) {
      console.error('All clipboard methods failed:', fallbackError);
      return false;
    }
  }
}

/**
 * React hook for copying text to clipboard
 */
export function useCopyToClipboard() {
  const copy = async (text: string) => {
    const success = await copyToClipboard(text);
    return success;
  };

  return { copy };
}
