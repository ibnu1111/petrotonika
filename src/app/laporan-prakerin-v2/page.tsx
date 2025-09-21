'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { sessionManager } from '@/lib/sessionManager';
import { saveAs } from 'file-saver';
import { puppeteerExportService } from '@/services/puppeteerExportService';
import { adobeWordExportService } from '@/services/adobeWordExportService';

export default function LaporanPrakerinV2() {
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isWordExporting, setIsWordExporting] = useState(false);

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

  // Word Export Function (Adobe Premium)
  const exportWordPremium = async () => {
    setIsWordExporting(true);
    try {
      // Get HTML content
      const response = await fetch('/laporan-prakerin-v2.html');
      const htmlContent = await response.text();
      
      // Check Adobe service status first
      const adobeStatus = await adobeWordExportService.checkAdobeStatus();
      console.log('Adobe service status:', adobeStatus);

      if (!adobeStatus.adobeConfigured) {
        alert(`❌ Adobe PDF Services belum dikonfigurasi: ${adobeStatus.message}\n\n💡 Yang perlu dilengkapi:\n- ClientSecret dari Adobe Developer Console\n- AccountId dari Adobe Developer Console\n- PrivateKey dari Adobe Developer Console\n\n🔄 Menggunakan Word Standard sebagai fallback...`);
        
        // Fallback to standard export
        await exportWordStandard();
        return;
      }

      // Export Word using Adobe PDF Services (99% accuracy)
      const wordBlob = await adobeWordExportService.exportToWordPremium(htmlContent, {
        marginTop: 3.0,
        marginRight: 2.5,
        marginBottom: 2.5,
        marginLeft: 3.0,
        includeBackground: true,
        fileName: 'Laporan_KP_Premium',
        title: 'Laporan Kerja Praktik - Premium Export'
      });
      
      saveAs(wordBlob, `Laporan_KP_Premium_${new Date().toISOString().slice(0,10)}.docx`);
      
      alert('✅ Export Word Premium berhasil!\n🎯 File DOCX berkualitas tinggi siap untuk editing\n📝 Format dan layout 99% identik dengan PDF');
      
    } catch (error) {
      console.error('Word export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Adobe PDF Services')) {
        alert(`❌ Adobe PDF Services error: ${errorMessage}\n\n💡 Possible solutions:\n- Check API credentials\n- Verify service quota\n- Try again in a few minutes`);
      } else if (errorMessage.includes('HTTP error! status: 500')) {
        alert('❌ Server error during conversion\n\n💡 Tips:\n- Check backend logs\n- Verify Adobe configuration\n- Contact system administrator');
      } else {
        alert(`❌ Export Word gagal: ${errorMessage}\n\n💡 Tips:\n- Check internet connection\n- Verify backend server status\n- Try standard export as fallback`);
      }
    } finally {
      setIsWordExporting(false);
    }
  };

  // Word Export Function (Standard Fallback)
  const exportWordStandard = async () => {
    setIsWordExporting(true);
    try {
      // Get HTML content
      const response = await fetch('/laporan-prakerin-v2.html');
      const htmlContent = await response.text();
      
      // Export Word using standard HTML conversion (90-95% accuracy)
      const wordBlob = await adobeWordExportService.exportToWordStandard(htmlContent, {
        marginTop: 3.0,
        marginRight: 2.5,
        marginBottom: 2.5,
        marginLeft: 3.0,
        fileName: 'Laporan_KP_Standard',
        title: 'Laporan Kerja Praktik - Standard Export'
      });
      
      saveAs(wordBlob, `Laporan_KP_Standard_${new Date().toISOString().slice(0,10)}.html`);
      
      alert('✅ Export Word Standard berhasil!\n📄 File HTML compatible dengan Word\n💡 Buka dengan Microsoft Word untuk convert ke DOCX');
      
    } catch (error) {
      console.error('Standard Word export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Export Word Standard gagal: ${errorMessage}`);
    } finally {
      setIsWordExporting(false);
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
                
              </div>
              
              {/* Export Buttons */}
              <div className="mb-4">
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

                  {/* Export Word Premium */}
                  <button
                    onClick={exportWordPremium}
                    disabled={isPdfExporting || isWordExporting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPdfExporting || isWordExporting
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white flex items-center gap-2`}
                    title="Export Word Premium dengan Adobe PDF Services (99% akurasi - Full DOCX)"
                  >
                    {isWordExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Converting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      Export Word
                      </>
                    )}
                  </button>

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
