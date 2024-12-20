import { logger } from './logger';

export const clipboardUtils = {
  async copyToClipboard(code, platform) {
    try {
      // Create both HTML and plain text versions
      const htmlContent = `
        <div class="copied-component">
          <!-- ${platform.toUpperCase()} Component -->
          ${code}
        </div>
      `.trim();

      // Try using the modern Clipboard API with HTML support
      if (typeof ClipboardItem !== 'undefined') {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([code], { type: 'text/plain' });
        
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          })
        ]);
        return true;
      }

      // First fallback: Try execCommand with HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      selection.removeAllRanges();
      selection.addRange(range);

      const success = document.execCommand('copy');
      document.body.removeChild(tempDiv);
      
      if (success) {
        return true;
      }

      // Second fallback: Plain text only
      return await navigator.clipboard.writeText(code);

    } catch (error) {
      logger.error('Copy failed:', error);
      
      // Final fallback: Basic textarea method
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (fallbackError) {
        logger.error('All copy methods failed:', fallbackError);
        return false;
      }
    }
  }
}; 