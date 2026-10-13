import React, { useState, useEffect, useRef } from 'react';
import { EDITIONS, AVAILABLE_EDITION_DATES } from './data/editions.ts';
import { EditionData } from './types.ts';
import { Toolbar } from './components/Toolbar.tsx';
import { DatePickerPopover } from './components/DatePickerPopover.tsx';
import { PagesSidebar } from './components/PagesSidebar.tsx';
import { NewspaperViewer } from './components/NewspaperViewer.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Toast } from './components/Toast.tsx';

const STORAGE_KEY = 'fikr_custom_editions_v2';
const ADMIN_SESSION_KEY = 'fikr_admin_logged_in';

// Additional sample published editions to match Image 3 calendar (Sep 23, Sep 28, Oct 5, Oct 12)
const DEFAULT_EXPANDED_EDITIONS: Record<string, EditionData> = {
  ...EDITIONS,
  '2026-09-28': {
    id: '2026-09-28',
    dateString: '28-09-2026',
    volume: 'Vol. 02',
    urduVolume: 'شمارہ نمبر: 02',
    title: 'فکر و خیال ویکلی',
    description: '28 September 2026 Archive Edition',
    pages: [
      {
        pageNumber: 1,
        title: 'Page No 1',
        imageUrl: EDITIONS['2026-10-12'].pages[0].imageUrl,
      },
      {
        pageNumber: 2,
        title: 'Page No 2',
        imageUrl: EDITIONS['2026-10-12'].pages[1].imageUrl,
      },
    ],
  },
  '2026-09-23': {
    id: '2026-09-23',
    dateString: '23-09-2026',
    volume: 'Vol. 01',
    urduVolume: 'شمارہ نمبر: 01',
    title: 'فکر و خیال ویکلی',
    description: '23 September 2026 Archive Edition',
    pages: [
      {
        pageNumber: 1,
        title: 'Page No 1',
        imageUrl: EDITIONS['2026-10-12'].pages[0].imageUrl,
      },
      {
        pageNumber: 2,
        title: 'Page No 2',
        imageUrl: EDITIONS['2026-10-12'].pages[1].imageUrl,
      },
    ],
  },
};

export default function App() {
  // Load custom editions from localStorage
  const [allEditions, setAllEditions] = useState<Record<string, EditionData>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_EXPANDED_EDITIONS, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read localStorage', e);
    }
    return { ...DEFAULT_EXPANDED_EDITIONS };
  });

  const [availableDates, setAvailableDates] = useState<string[]>(() => {
    return Object.keys(allEditions);
  });

  // Selected date
  const getInitialEditionId = () => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam && allEditions[dateParam]) {
      return dateParam;
    }
    return '2026-10-12';
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialEditionId);
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Admin states
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);

  const currentEdition: EditionData =
    allEditions[selectedDate] || allEditions['2026-10-12'] || Object.values(allEditions)[0];

  const totalPages = currentEdition.pages.length;
  const currentPageData =
    currentEdition.pages.find((p) => p.pageNumber === currentPageNum) ||
    currentEdition.pages[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSelectDate = (dateStr: string) => {
    if (allEditions[dateStr]) {
      setSelectedDate(dateStr);
      setCurrentPageNum(1);
      triggerToast(`Loaded edition for ${allEditions[dateStr].dateString}`);
    } else {
      triggerToast(`Edition for ${dateStr} is not available in archives.`);
    }
  };

  const handleSelectPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPageNum(pageNum);
    }
  };

  const handlePrevPage = () => {
    if (currentPageNum > 1) {
      handleSelectPage(currentPageNum - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageNum < totalPages) {
      handleSelectPage(currentPageNum + 1);
    }
  };

  // Secret 5-clicks trigger handler
  const handleSecretAdminTrigger = () => {
    setIsCalendarOpen(false);
    if (isAdminLoggedIn) {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {}
    setIsAdminPanelOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsAdminPanelOpen(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    triggerToast('Logged out of Admin Portal');
  };

  // Publish from Admin Panel
  const handlePublishEdition = (newEdition: EditionData) => {
    setAllEditions((prev) => {
      const updated = { ...prev, [newEdition.id]: newEdition };
      try {
        const customOnly: Record<string, EditionData> = {};
        Object.entries(updated).forEach(([k, v]) => {
          if (!DEFAULT_EXPANDED_EDITIONS[k]) customOnly[k] = v;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
      } catch (err) {
        console.warn('Failed to save to localStorage', err);
      }
      return updated;
    });

    setAvailableDates((prev) => Array.from(new Set([...prev, newEdition.id])));
    setSelectedDate(newEdition.id);
    setCurrentPageNum(1);
  };

  const handleDeleteEdition = (id: string) => {
    setAllEditions((prev) => {
      const copy = { ...prev };
      delete copy[id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      } catch {}
      return copy;
    });
    setAvailableDates((prev) => prev.filter((d) => d !== id));

    // If currently reading the deleted edition, switch to another available edition
    if (selectedDate === id) {
      const remaining = Object.keys(allEditions).filter((d) => d !== id);
      if (remaining.length > 0) {
        setSelectedDate(remaining[0]);
        setCurrentPageNum(1);
      }
    }
    triggerToast(`Edition deleted successfully`);
  };

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isCalendarOpen &&
        toolbarContainerRef.current &&
        !toolbarContainerRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isCalendarOpen]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
        setIsShareModalOpen(false);
        setIsAdminLoginModalOpen(false);
        setIsAdminPanelOpen(false);
        setIsMobileSidebarOpen(false);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (!isShareModalOpen && !isCalendarOpen && !isAdminPanelOpen && !isAdminLoginModalOpen) {
          handleNextPage();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (!isShareModalOpen && !isCalendarOpen && !isAdminPanelOpen && !isAdminLoginModalOpen) {
          handlePrevPage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareModalOpen, isCalendarOpen, isAdminPanelOpen, isAdminLoginModalOpen, currentPageNum, totalPages]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050817] text-white select-none">
      {/* A. Left Pages Overview Sidebar (Desktop + Mobile Drawer) */}
      <PagesSidebar
        pages={currentEdition.pages}
        currentPage={currentPageNum}
        onSelectPage={handleSelectPage}
        volume={currentEdition.volume}
        urduTitle={currentEdition.title}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* B. Main Newspaper Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#050817]">
        {/* Floating Pill Toolbar Area */}
        <div ref={toolbarContainerRef} className="relative w-full flex justify-center">
          <Toolbar
            currentDateDisplay={currentEdition.dateString}
            isCalendarOpen={isCalendarOpen}
            onToggleCalendar={(e) => {
              e.stopPropagation();
              setIsCalendarOpen((prev) => !prev);
            }}
            onOpenShareModal={() => {
              setIsCalendarOpen(false);
              setIsShareModalOpen(true);
            }}
            onOpenAdminLogin={handleSecretAdminTrigger}
            currentPage={currentPageNum}
            totalPages={totalPages}
            onSelectPage={handleSelectPage}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

          {/* Date Picker Popover */}
          {isCalendarOpen && (
            <DatePickerPopover
              currentDate={selectedDate}
              availableDates={availableDates}
              onSelectDate={handleSelectDate}
              onClose={() => setIsCalendarOpen(false)}
            />
          )}
        </div>

        {/* Newspaper Viewer Canvas */}
        <NewspaperViewer
          page={currentPageData}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          hasPrev={currentPageNum > 1}
          hasNext={currentPageNum < totalPages}
        />
      </main>

      {/* C. Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        editionDate={selectedDate}
        pageImages={currentEdition.pages.map((p) => p.imageUrl)}
        onTriggerToast={triggerToast}
      />

      {/* D. Admin Login Modal (Triggered by 5 consecutive calendar clicks) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onTriggerToast={triggerToast}
      />

      {/* E. Full Admin Panel (Upload Paper & ALL PAPERS calendar view matching Image 2 & 3) */}
      {isAdminPanelOpen && (
        <AdminPanel
          onClose={() => setIsAdminPanelOpen(false)}
          onLogout={handleAdminLogout}
          allEditions={allEditions}
          onPublishEdition={handlePublishEdition}
          onDeleteEdition={handleDeleteEdition}
          onSelectEditionToView={(id) => {
            setSelectedDate(id);
            setCurrentPageNum(1);
            setIsAdminPanelOpen(false);
            triggerToast(`Opened edition for reading`);
          }}
          onTriggerToast={triggerToast}
        />
      )}

      {/* F. Toast Feedback Notification */}
      <Toast message={toastMessage} />
    </div>
  );
}
