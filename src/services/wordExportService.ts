export interface WordExportOptions {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeBackground?: boolean;
  useHighAccuracy?: boolean;
}

export interface WordExportRequest {
  htmlContent: string;
  fileName?: string;
  includeBackground?: boolean;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  useHighAccuracy?: boolean;
}

export class WordExportService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://localhost:44385' 
      : 'https://localhost:44385';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/WordExport/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Word Export health check failed:', error);
      return false;
    }
  }

  async exportToDocx(htmlContent: string, options: WordExportOptions = {}): Promise<Blob> {
    try {
      const requestBody: WordExportRequest = {
        htmlContent,
        marginTop: options.marginTop ?? 3.0,
        marginRight: options.marginRight ?? 2.5,
        marginBottom: options.marginBottom ?? 2.5,
        marginLeft: options.marginLeft ?? 3.0,
        includeBackground: options.includeBackground ?? true,
        useHighAccuracy: options.useHighAccuracy ?? true,
      };

      const response = await fetch(`${this.baseUrl}/api/WordExport/export-docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Word export failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Word export error:', error);
      throw error;
    }
  }

  async exportToDocxWithPuppeteer(htmlContent: string, options: WordExportOptions = {}): Promise<Blob> {
    try {
      const requestBody: WordExportRequest = {
        htmlContent,
        marginTop: options.marginTop ?? 3.0,
        marginRight: options.marginRight ?? 2.5,
        marginBottom: options.marginBottom ?? 2.5,
        marginLeft: options.marginLeft ?? 3.0,
        includeBackground: options.includeBackground ?? true,
        useHighAccuracy: true, // Always high accuracy for Puppeteer
      };

      const response = await fetch(`${this.baseUrl}/api/WordExport/export-with-puppeteer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Puppeteer Word export failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Puppeteer Word export error:', error);
      throw error;
    }
  }

  async exportReportToDocx(htmlContent: string, options: WordExportOptions = {}): Promise<Blob> {
    try {
      const requestBody: WordExportRequest = {
        htmlContent,
        marginTop: options.marginTop ?? 3.0,
        marginRight: options.marginRight ?? 2.5,
        marginBottom: options.marginBottom ?? 2.5,
        marginLeft: options.marginLeft ?? 3.0,
        includeBackground: options.includeBackground ?? true,
        useHighAccuracy: true,
      };

      const response = await fetch(`${this.baseUrl}/api/WordExport/export-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Report Word export failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Report Word export error:', error);
      throw error;
    }
  }

  async exportPdfToWord(htmlContent: string, options: WordExportOptions = {}): Promise<Blob> {
    try {
      const requestBody: WordExportRequest = {
        htmlContent,
        marginTop: options.marginTop ?? 3.0,
        marginRight: options.marginRight ?? 2.5,
        marginBottom: options.marginBottom ?? 2.5,
        marginLeft: options.marginLeft ?? 3.0,
        includeBackground: options.includeBackground ?? true,
        useHighAccuracy: true,
      };

      const response = await fetch(`${this.baseUrl}/api/WordExport/export-pdf-to-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF-to-Word export failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('PDF-to-Word export error:', error);
      throw error;
    }
  }

  async testExport(): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/WordExport/test-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Word test export failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Word test export error:', error);
      throw error;
    }
  }

  async getBrowserStatus(): Promise<{ isInitialized: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/WordExport/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isInitialized: true,
          message: data.status || 'Service is healthy'
        };
      } else {
        return {
          isInitialized: false,
          message: 'Service is not available'
        };
      }
    } catch (error) {
      return {
        isInitialized: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const wordExportService = new WordExportService();
