import React, { useRef } from 'react';
import { Calendar, ChevronDown, Share2, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

interface ToolbarProps {
  currentDateDisplay: string;
  isCalendarOpen: boolean;
  onToggleCalendar: (e: React.MouseEvent) => void;
  onOpenShareModal: () => void;
  onOpenAdminLogin: () => void;
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentDateDisplay,
  isCalendarOpen,
  onToggleCalendar,
  onOpenShareModal,
  onOpenAdminLogin,
  currentPage,
  totalPages,
  onSelectPage,
  onPrevPage,
  onNextPage,
  onToggleMobileSidebar,
}) => {
  // Secret 5 consecutive clicks within 2.5 seconds to unlock admin portal
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleDateButtonClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 800) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      onOpenAdminLogin();
      return;
    }

    onToggleCalendar(e);
  };

  return (
    <div className="w-full pt-3 pb-2 px-2 sm:px-4 flex justify-center items-center shrink-0 z-30 pointer-events-auto">
      {/* Floating Pill Toolbar - Matches Fourth Image */}
      <div className="bg-[#F0F2F5] text-gray-800 rounded-full pl-1.5 pr-2 py-1.5 shadow-xl flex items-center gap-1 sm:gap-2 border border-white/50 backdrop-blur-sm max-w-full">
        
        {/* Mobile/Sidebar Toggle Grid Icon */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            title="Toggle Pages Overview"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        )}

        {/* Date Selector Button (Click 5 times quickly for Admin Panel) */}
        <button
          onClick={handleDateButtonClick}
          aria-expanded={isCalendarOpen}
          title="Click to view dates · (Admin: Click 5x quickly)"
          className="bg-[#006B5B] hover:bg-[#00584B] text-white px-3 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer select-none"
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
          <span className="tabular-nums tracking-wide">{currentDateDisplay}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-white/90 transition-transform duration-200 shrink-0 ${
              isCalendarOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="bg-[#006B5B] hover:bg-[#00584B] text-white px-3 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Share</span>
        </button>

        {/* Page Navigation Controls - Matches Fourth Image */}
        <div className="flex items-center px-0.5 gap-1 shrink-0">
          {/* Previous Page */}
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 max-w-[120px] sm:max-w-none overflow-x-auto py-0.5 no-scrollbar">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => onSelectPage(pageNum)}
                  title={`Go to Page ${pageNum}`}
                  className={`w-7 h-7 shrink-0 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#006B5B] text-white ring-2 ring-emerald-300 shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            title="Next Page"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
};
