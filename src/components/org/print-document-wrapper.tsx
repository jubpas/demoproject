"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  documentTitle?: string;
  organizationName?: string;
};

export function PrintDocumentWrapper({
  children,
  documentTitle,
  organizationName,
}: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);

    const beforePrint = () => {
      // Inject print-specific styles dynamically
      const styleId = "print-styles";
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @media print {
          /* Force white background for print */
          body, .print\\:bg-white, [class*="bg-slate"] {
            background: #ffffff !important;
            color: #000000 !important;
          }

          /* Hide non-printable elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Page break utilities */
          .break-inside-avoid {
            break-inside: avoid;
          }
          .break-before-page {
            break-before: page;
          }
          .break-after-page {
            break-after: page;
          }

          /* Document container */
          .print-document {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
          }

          /* Table styles for print */
          .print\\:table-auto {
            table-layout: auto !important;
          }
          .print\\:text-left {
            text-align: left !important;
          }
          .print\\:text-right {
            text-align: right !important;
          }

          /* Ensure text renders as black */
          .print\\:text-slate-\\[color\\] {
            color: #000000 !important;
          }

          /* Hide shadows for print */
          .print\\:shadow-none {
            box-shadow: none !important;
          }

          /* Page header/footer */
          .print-header {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .print-footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            margin-top: 16px;
          }

          /* Page numbers */
          .print\\:page-number::after {
            content: counter(page);
          }

          /* Force page breaks */
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid;
          }
          .print\\:page-break-before {
            page-break-before: always;
          }
          .print\\:page-break-after {
            page-break-after: always;
          }

          /* Hide UI chrome */
          nav, header, footer, aside, .no-print {
            display: none !important;
          }
        }

        @page {
          size: A4;
          margin: 15mm;
        }
      `;
    };

    beforePrint();
    setTimeout(() => window.print(), 100);
    setTimeout(() => setIsPrinting(false), 1000);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handlePrint}
        disabled={isPrinting}
        className="print:hidden inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M6 9V2h12v7" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        {isPrinting ? "กำลังพิมพ์..." : "พิมพ์เอกสาร"}
      </button>

      <div
        ref={printRef}
        className="print-document print:bg-white"
        data-print-title={documentTitle}
        data-print-org={organizationName}
      >
        {/* Print-only header */}
        <div className="print:hidden" />
        <div className="print:block hidden print-header">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {organizationName}
              </p>
              {documentTitle && (
                <p className="text-sm font-semibold text-slate-900">
                  {documentTitle}
                </p>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {new Date().toLocaleDateString(
                undefined,
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          </div>
        </div>

        {/* Main content */}
        {children}

        {/* Print-only footer */}
        <div className="print:block hidden print-footer">
          <p className="text-[9px] text-slate-400">
            เอกสารนี้สร้างจากระบบ {organizationName || "ไซต์งานโปร"}
          </p>
        </div>
      </div>
    </div>
  );
}
