'use client';

import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card } from '@/components/ui';
import { BackendExportService } from '@/services/backendExportService';
import { puppeteerExportService } from '@/services/puppeteerExportService';

export default function LaporanPrakerinPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [puppeteerStatus, setPuppeteerStatus] = useState<string>('Unknown');
  const backendService = new BackendExportService();
  const handleViewReport = () => {
    window.open('/laporan-prakerin.html', '_blank');
  };

  const handlePrintReport = () => {
    const reportWindow = window.open('/laporan-prakerin.html', '_blank');
    if (reportWindow) {
      reportWindow.onload = () => {
        reportWindow.print();
      };
    }
  };

  const handleDownloadReport = () => {
    // Open the report in a new window and trigger print dialog for PDF save
    const reportWindow = window.open('/laporan-prakerin.html', '_blank');
    if (reportWindow) {
      reportWindow.onload = () => {
        // Give the page time to fully load before printing
        setTimeout(() => {
          reportWindow.print();
        }, 1000);
      };
    }
  };

  // Backend Export Functions
  const handleBackendExport = async () => {
    setIsLoading(true);
    try {
      // Fetch HTML content from the public folder
      const response = await fetch('/laporan-prakerin.html');
      const htmlContent = await response.text();

      // Export using iTextSharp (70-85% accuracy)
      const blob = await backendService.exportToPdf(htmlContent);
      downloadBlob(blob, `laporan-itext-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Backend export failed:', error);
      alert('Export gagal: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // PuppeteerSharp Export Functions
  const handlePuppeteerExport = async () => {
    setIsLoading(true);
    try {
      // Fetch HTML content from the public folder
      const response = await fetch('/laporan-prakerin.html');
      const htmlContent = await response.text();

      // Export using PuppeteerSharp (95-99% accuracy)
      const blob = await puppeteerExportService.exportToPdf(htmlContent);
      downloadBlob(blob, `laporan-puppeteer-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PuppeteerSharp export failed:', error);
      alert('PuppeteerSharp export gagal: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializePuppeteer = async () => {
    setIsLoading(true);
    try {
      const result = await puppeteerExportService.initializeBrowser();
      setPuppeteerStatus('Initialized');
      alert('PuppeteerSharp browser initialized successfully!');
      console.log('Browser initialized:', result);
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      alert('Failed to initialize browser: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePuppeteerTest = async () => {
    setIsLoading(true);
    try {
      const blob = await puppeteerExportService.testExport();
      downloadBlob(blob, `puppeteer-test-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('PuppeteerSharp test failed:', error);
      alert('PuppeteerSharp test failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function untuk download blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan Prakerin</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Laporan Praktek Kerja Industri - Sistem Manajemen Inventori PT Petronika
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card title="📄 View Report">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Buka laporan dalam tab baru untuk dibaca atau dicetak.
              </p>
              <Button 
                onClick={handleViewReport}
                className="w-full"
                variant="primary"
              >
                View Report
              </Button>
            </div>
          </Card>

          <Card title="🖨️ Print Report">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Print langsung laporan atau simpan sebagai PDF dari browser.
              </p>
              <Button 
                onClick={handlePrintReport}
                className="w-full"
                variant="secondary"
              >
                Print Report
              </Button>
            </div>
          </Card>

          <Card title="� Download PDF">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download laporan sebagai file PDF melalui dialog print browser.
              </p>
              <Button 
                onClick={handleDownloadReport}
                className="w-full"
                variant="ghost"
              >
                Download PDF
              </Button>
            </div>
          </Card>
        </div>

        {/* Backend Export Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🏢 Backend Export (.NET)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="📊 iTextSharp Export" className="bg-white">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export menggunakan iTextSharp (70-85% akurasi). Cocok untuk preview cepat.
                </p>
                <Button 
                  onClick={handleBackendExport}
                  disabled={isLoading}
                  className="w-full"
                  variant="primary"
                >
                  {isLoading ? 'Exporting...' : 'Export with iTextSharp'}
                </Button>
              </div>
            </Card>

            <Card title="🎯 PuppeteerSharp Export" className="bg-white">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Export menggunakan PuppeteerSharp (95-99% akurasi). Hasil identik dengan web.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleInitializePuppeteer}
                    disabled={isLoading}
                    className="w-full"
                    variant="secondary"
                    size="sm"
                  >
                    {isLoading ? 'Initializing...' : 'Initialize Browser'}
                  </Button>
                  <Button 
                    onClick={handlePuppeteerExport}
                    disabled={isLoading}
                    className="w-full"
                    variant="primary"
                  >
                    {isLoading ? 'Exporting...' : 'Export with PuppeteerSharp'}
                  </Button>
                  <Button 
                    onClick={handlePuppeteerTest}
                    disabled={isLoading}
                    className="w-full"
                    variant="ghost"
                    size="sm"
                  >
                    {isLoading ? 'Testing...' : 'Test PuppeteerSharp'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📈 Comparison</h3>
            <div className="grid gap-2 text-sm">
              <div><strong>iTextSharp:</strong> ⚡ Cepat, 📊 70-85% akurasi, 💻 Ringan</div>
              <div><strong>PuppeteerSharp:</strong> 🎯 Akurat, 📈 95-99% akurasi, 🌐 Identik web</div>
            </div>
          </div>
        </div>

        {/* Embedded Preview */}
        <Card title="📖 Preview Laporan">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Preview laporan di bawah ini. Untuk pengalaman terbaik, gunakan tombol &quot;View Report&quot; di atas.
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe 
                src="/laporan-prakerin.html" 
                className="w-full h-full border-0"
                title="Laporan Prakerin Preview"
              />
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
