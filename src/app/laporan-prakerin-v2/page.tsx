'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { sessionManager } from '@/lib/sessionManager';
import { saveAs } from 'file-saver';
import { puppeteerExportService } from '@/services/puppeteerExportService';

export default function LaporanPrakerinV2() {
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  useEffect(() => {
    // Update activity when accessing this page
    sessionManager.updateActivity();
    
    // Log session info for debugging
    console.log('Laporan Prakerin V2 - Session Info:', sessionManager.getSessionInfo());
  }, []);

  // PDF Export Function
  const exportPdf = async () => {
    setIsPdfExporting(true);
    try {
      // Get HTML content
      const response = await fetch('/laporan-prakerin-v2.html');
      const htmlContent = await response.text();
      
      // Test service health first
      const healthStatus = await puppeteerExportService.healthCheck();
      console.log('PDF service health:', healthStatus);

      // Export PDF (95-99% accuracy)
      const pdfBlob = await puppeteerExportService.exportToPdf(htmlContent, {
        marginTop: 3.0,
        marginRight: 2.5,
        marginBottom: 2.5,
        marginLeft: 3.0,
        includeBackground: true
      });
      
      saveAs(pdfBlob, `Laporan_KP_${new Date().toISOString().slice(0,10)}.pdf`);
      
      alert('✅ Export PDF berhasil!\n🎯 File PDF siap untuk submission');
      
    } catch (error) {
      console.error('PDF export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Browser not initialized')) {
        const initConfirm = confirm('❌ Browser belum diinisialisasi.\n\n🔧 Inisialisasi browser sekarang?\n(Download Chromium ~100MB)');
        if (initConfirm) {
          try {
            await puppeteerExportService.initializeBrowser();
            alert('✅ Browser berhasil diinisialisasi!\nSilakan coba export lagi.');
          } catch (initError) {
            alert('❌ Gagal inisialisasi browser: ' + (initError as Error).message);
          }
        }
      } else {
        alert(`❌ Export PDF gagal: ${errorMessage}\n\n💡 Tips:\n- Initialize browser terlebih dahulu\n- Pastikan .NET server running\n- Check internet connection untuk download Chromium`);
      }
    } finally {
      setIsPdfExporting(false);
    }
  };

  const initializeBrowser = async () => {
    setIsPdfExporting(true);
    try {
      const result = await puppeteerExportService.initializeBrowser();
      console.log('Browser initialized:', result);
      alert('✅ Browser berhasil diinisialisasi!\n🌐 Chromium browser siap digunakan\n📄 Sekarang bisa export PDF dengan akurasi tinggi');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      alert('❌ Gagal inisialisasi browser: ' + (error as Error).message + '\n\n💡 Pastikan:\n- Koneksi internet tersedia\n- Disk space cukup (~100MB)\n- .NET server running');
    } finally {
      setIsPdfExporting(false);
    }
  };

  const testExport = async () => {
    setIsPdfExporting(true);
    try {
      const testBlob = await puppeteerExportService.testExport();
      saveAs(testBlob, `PDF_Test_${new Date().toISOString().slice(0,10)}.pdf`);
      alert('✅ Test PDF berhasil!\n📄 Test PDF downloaded\n🎯 Service berfungsi dengan baik');
    } catch (error) {
      console.error('PDF test failed:', error);
      alert('❌ Test PDF gagal: ' + (error as Error).message);
    } finally {
      setIsPdfExporting(false);
    }
  };

  const printReport = () => {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-white">
          <div className="p-4">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Laporan Kerja Praktik - Versi 2
                </h1>
                <p className="text-gray-600 mb-2">
                  Format akademik resmi sesuai standar Institut Teknologi
                </p>
                
                {/* Export Info */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2 text-sm">
                  <h3 className="font-semibold text-blue-800 mb-1">📄 PDF Export (High Accuracy):</h3>
                  <ul className="text-blue-700 space-y-1">
                    <li><strong>🌐 Export PDF:</strong> Chromium-based rendering (95-99% akurasi)</li>
                    <li><strong>🔧 Browser Init:</strong> One-time Chromium setup (~100MB)</li>
                    <li><strong>🧪 Test Export:</strong> Sample PDF untuk verifikasi service</li>
                    <li className="text-xs text-blue-600">💡 Identical web rendering dengan server backend</li>
                  </ul>
                </div>
              </div>
              
              {/* Export Buttons */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">📄 Export Methods:</h4>
                <div className="flex gap-2 flex-wrap">
                  {/* Export PDF */}
                  <button
                    onClick={exportPdf}
                    disabled={isPdfExporting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPdfExporting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white flex items-center gap-2`}
                    title="Export PDF dengan akurasi tinggi (95-99% - Identik Web)"
                  >
                    {isPdfExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                      </>
                    )}
                  </button>
                  
                  {/* Initialize Browser */}
                  {/* <button
                    onClick={initializeBrowser}
                    disabled={isPdfExporting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPdfExporting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    } text-white flex items-center gap-2`}
                    title="Initialize Chromium browser (One time setup)"
                  >
                    {isPdfExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Initializing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Init Browser
                      </>
                    )}
                  </button> */}
                  
                  {/* Test Export */}
                  {/* <button
                    onClick={testExport}
                    disabled={isPdfExporting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPdfExporting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white flex items-center gap-2`}
                    title="Test PDF export dengan sample content"
                  >
                    {isPdfExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test PDF
                      </>
                    )}
                  </button> */}

                  {/* Print */}
                  <button
                    onClick={printReport}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                    title="Print atau save as PDF melalui browser"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe 
                src="/laporan-prakerin-v2.html"
                className="w-full h-screen border-0"
                title="Laporan Prakerin Versi 2"
              />
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
