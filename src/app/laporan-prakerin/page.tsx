'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card } from '@/components/ui';

export default function LaporanPrakerinPage() {
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
