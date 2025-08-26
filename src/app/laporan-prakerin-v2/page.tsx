'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { sessionManager } from '@/lib/sessionManager';
import { saveAs } from 'file-saver';

export default function LaporanPrakerinV2() {
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Update activity when accessing this page
    sessionManager.updateActivity();
    
    // Log session info for debugging
    console.log('Laporan Prakerin V2 - Session Info:', sessionManager.getSessionInfo());
  }, []);

  const exportToPDF = () => {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      // Trigger browser's built-in print dialog which includes save as PDF option
      iframe.contentWindow.print();
    }
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      // Get the HTML content
      const response = await fetch('/laporan-prakerin-v2.html');
      const htmlContent = await response.text();
      
      // Create Word-compatible HTML with proper formatting
      const wordHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Laporan Kerja Praktik - Inventory Management System</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page { 
              size: A4; 
              margin: 2.5cm 2cm 2.5cm 2.5cm; 
            }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.5; 
              color: #000;
              margin: 0;
              padding: 0;
            }
            .page-break { 
              page-break-before: always; 
            }
            h1, h2, h3, h4, h5, h6 {
              font-family: 'Times New Roman', serif;
              font-weight: bold;
              color: #000;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            .chapter-title {
              text-align: center;
              font-weight: bold;
              margin: 2cm 0;
            }
            .toc-footer {
              text-align: center;
              position: fixed;
              bottom: 1cm;
            }
            /* Remove web-specific styles that don't work in Word */
            .bg-white, .shadow-lg, .rounded-lg {
              background: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            /* Ensure proper spacing */
            p {
              margin: 0 0 1em 0;
            }
            /* Fix image sizing */
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || htmlContent}
        </body>
        </html>
      `;
      
      // Create blob and download
      const blob = new Blob([wordHTML], { 
        type: 'application/msword' 
      });
      
      saveAs(blob, 'Laporan_Kerja_Praktik_Inventory_Management.doc');
      
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Terjadi kesalahan saat export ke Word. Silakan coba fitur Print sebagai alternatif.');
    } finally {
      setIsExporting(false);
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
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Laporan Kerja Praktik - Versi 2
                </h1>
                <p className="text-gray-600">
                  Format akademik resmi sesuai standar Institut Teknologi
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={exportToWord}
                  disabled={isExporting}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isExporting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white flex items-center gap-2`}
                >
                  {isExporting ? (
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
                      Export Word
                    </>
                  )}
                </button>
                
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF
                </button>
                
                <button
                  onClick={printReport}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
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
