// Backend Export Service untuk integrasi dengan .NET API
// File: services/backendExportService.ts

interface ExportOptions {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  includeBackground?: boolean;
  format?: string;
}

interface ExportInfo {
  status: string;
  message: string;
  timestamp: string;
  availableFormats: string[];
}

export class BackendExportService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://localhost:44385') {
    this.baseUrl = baseUrl;
  }

  /**
   * Export ke PDF menggunakan iTextSharp (70-85% akurasi)
   */
  async exportToPdf(htmlContent: string, options?: ExportOptions): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/report/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          options: options || {
            marginTop: 3.0,
            marginRight: 2.5,
            marginBottom: 2.5,
            marginLeft: 3.0,
            includeBackground: true,
            format: 'A4'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Backend export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Backend PDF export error:', error);
      throw error;
    }
  }



  /**
   * Get export info dari backend
   */
  async getExportInfo(): Promise<ExportInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/api/report/export-info`);
      if (!response.ok) {
        throw new Error(`Failed to get export info: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get export info error:', error);
      throw error;
    }
  }

  /**
   * Health check backend service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/report/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}
