"use client"
import { useEffect } from 'react';
import Header from '@/components/header';

export default function ReturnPage() {
  useEffect(() => {
    // This ensures the PDF fills the available space
    const iframe = document.getElementById('return-pdf') as HTMLIFrameElement;
    if (iframe) {
      const updateHeight = () => {
        iframe.style.height = `${window.innerHeight - 100}px`; // Adjust for header
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Return Policy</h1>
        <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            id="return-pdf"
            src="/return.pdf"
            className="w-full border-0"
            style={{ minHeight: '800px' }}
          />
        </div>
      </main>
    </div>
  );
}
