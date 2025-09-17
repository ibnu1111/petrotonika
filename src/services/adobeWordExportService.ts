interface ExportInfo {
  formats: string[];
  defaultOptions: ExportOptions;
  features: string[];
  endpoints: {
    [key: string]: string;
  };
}

interface ExportOptions {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeBackground?: boolean;
  fileName?: string;
  title?: string;
}

interface ExportResponse {
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}

class AdobeWordExportService {
  private baseUrl = 'https://localhost:44385/api'; // Updated to match backend port

  /**
   * Export HTML to premium DOCX using Adobe PDF Services
   * Flow: HTML → PDF → DOCX (Adobe conversion)
   */
  async exportToWordPremium(htmlContent: string, options: ExportOptions = {}): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/report/export-word-premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          options: {
            marginTop: options.marginTop || 3.0,
            marginRight: options.marginRight || 2.5,
            marginBottom: options.marginBottom || 2.5,
            marginLeft: options.marginLeft || 3.0,
            includeBackground: options.includeBackground !== false,
          },
          fileName: options.fileName || 'Laporan_KP',
          title: options.title || 'Laporan Kerja Praktik'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Verify it's actually a DOCX file
      if (blob.type && !blob.type.includes('wordprocessingml') && !blob.type.includes('application/octet-stream')) {
        console.warn('Unexpected content type:', blob.type);
      }

      return blob;
    } catch (error) {
      console.error('Adobe Word export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export HTML to standard Word-compatible HTML (fallback)
   */
  async exportToWordStandard(htmlContent: string, options: ExportOptions = {}): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/report/export-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          options: {
            marginTop: options.marginTop || 3.0,
            marginRight: options.marginRight || 2.5,
            marginBottom: options.marginBottom || 2.5,
            marginLeft: options.marginLeft || 3.0,
          },
          fileName: options.fileName || 'Laporan_KP',
          title: options.title || 'Laporan Kerja Praktik'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Standard Word export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check Adobe PDF Services configuration status
   */
  async checkAdobeStatus(): Promise<{ adobeConfigured: boolean; status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/report/adobe-status`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          adobeConfigured: false,
          status: 'error',
          message: `Service unavailable: ${response.status}`
        };
      }

      return await response.json();
    } catch (error) {
      return {
        adobeConfigured: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Service unavailable'
      };
    }
  }

  /**
   * Check service health and availability
   */
  async healthCheck(): Promise<{ status: string; adobeAvailable: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/report/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        return {
          status: 'error',
          adobeAvailable: false,
          message: `Service unavailable: ${response.status}`
        };
      }

      // Response is successful, no need to process data for health check
      return {
        status: 'healthy',
        adobeAvailable: true,
        message: 'All services operational'
      };
    } catch (error) {
      return {
        status: 'error',
        adobeAvailable: false,
        message: error instanceof Error ? error.message : 'Service unavailable'
      };
    }
  }

  /**
   * Get export info and available formats
   */
  async getExportInfo(): Promise<ExportInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/report/export-info`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get export info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get export info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const adobeWordExportService = new AdobeWordExportService();

// Export the class for potential custom instances
export { AdobeWordExportService };

// Export types
export type { ExportOptions, ExportResponse, ExportInfo };