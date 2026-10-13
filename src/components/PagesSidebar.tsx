import React from 'react';
import { PageData } from '../types.ts';

interface PagesSidebarProps {
  pages: PageData[];
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  volume: string;
  urduTitle: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const PagesSidebar: React.FC<PagesSidebarProps> = ({
  pages,
  currentPage,
  onSelectPage,
  volume,
  urduTitle,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 md:z-20 w-[265px] lg:w-[280px] h-full bg-[#0B1224] border-r border-[#1A243F] flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-[#1A243F]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C98B] shadow-[0_0_8px_#00C98B]" />
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Pages Overview
            </span>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-medium">
            {pages.length} Pages
          </span>
        </div>

        {/* Thumbnails list */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {pages.map((page) => {
            const isActive = page.pageNumber === currentPage;
            return (
              <div
                key={page.pageNumber}
                onClick={() => {
                  onSelectPage(page.pageNumber);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`cursor-pointer group flex flex-col rounded-xl overflow-hidden transition-all duration-200 select-none ${
                  isActive
                    ? 'border-2 border-[#00C98B] shadow-[0_0_15px_rgba(0,201,139,0.25)]'
                    : 'border border-[#1A243F]/80 hover:border-gray-500 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Thumbnail Preview Area - Fits A4 / A3 / Broadsheet */}
                <div className="bg-[#0e172e] p-2 flex items-center justify-center relative overflow-hidden aspect-[1/1.414]">
                  <img
                    src={page.imageUrl}
                    alt={page.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded shadow-sm bg-white"
                  />
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-[#00C98B] text-[#050817] text-[10px] font-black px-1.5 py-0.5 rounded shadow">
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Footer Label */}
                <div
                  className={`py-2 text-center text-xs font-semibold tracking-wide border-t border-white/5 ${
                    isActive ? 'bg-[#101b38] text-white' : 'bg-[#0a1020] text-gray-400'
                  }`}
                >
                  {page.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Brand info footer */}
        <div className="p-3 bg-[#070c1a] border-t border-[#1A243F]/70 text-[11px] text-gray-400 flex items-center justify-between shrink-0">
          <span className="font-medium font-urdu text-sm text-gray-300 truncate max-w-[170px]">
            {urduTitle}
          </span>
          <span className="text-gray-400 font-semibold shrink-0">{volume}</span>
        </div>
      </aside>
    </>
  );
};
