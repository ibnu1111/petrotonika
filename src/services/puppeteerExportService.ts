// PuppeteerSharp Export Service untuk integrasi dengan .NET API
// File: services/puppeteerExportService.ts

// Type definitions
interface ExportOptions {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeBackground?: boolean;
  format?: string;
  width?: number;
  height?: number;
}

interface BrowserStatus {
  isInitialized: boolean;
  browserVersion?: string;
  status: string;
  message?: string;
}

interface ServiceInfo {
  serviceName: string;
  version: string;
  status: string;
  browserStatus: BrowserStatus;
}

interface HealthCheckResult {
  isHealthy: boolean;
  status: string;
  message: string;
  timestamp: string;
}

interface BrowserInitResult {
  success: boolean;
  message: string;
  browserVersion?: string;
}

export class PuppeteerExportService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://simamen.belakanglayar.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Export ke PDF menggunakan PuppeteerSharp (95-99% akurasi)
   * Menggunakan Chromium browser untuk hasil identik dengan web
   */
  async exportToPdf(htmlContent: string, options?: ExportOptions): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/puppeteer/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          options,
          fileName: `laporan-puppeteer-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting to PDF with PuppeteerSharp:', error);
      throw error;
    }
  }

  /**
   * Initialize PuppeteerSharp browser (download Chromium if needed)
   */
  async initializeBrowser(): Promise<BrowserInitResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/puppeteer/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initializing PuppeteerSharp browser:', error);
      throw error;
    }
  }

  /**
   * Get PuppeteerSharp browser status
   */
  async getBrowserStatus(): Promise<BrowserStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/puppeteer/status`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting browser status:', error);
      throw error;
    }
  }

  /**
   * Test PuppeteerSharp export dengan sample content
   */
  async testExport(): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/puppeteer/test`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error testing PuppeteerSharp export:', error);
      throw error;
    }
  }

  /**
   * Get PuppeteerSharp service info dan capabilities
   */
  async getServiceInfo(): Promise<ServiceInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/api/puppeteer/info`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting service info:', error);
      throw error;
    }
  }

  /**
   * Health check untuk PuppeteerSharp service
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/puppeteer/health`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }

  /**
   * Download file dari blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Export singleton instance
export const puppeteerExportService = new PuppeteerExportService();
