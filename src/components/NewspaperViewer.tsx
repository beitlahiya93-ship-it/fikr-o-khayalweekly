import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';
import { PageData } from '../types.ts';
import { PaperLoadingScreen } from './PaperLoadingScreen.tsx';

interface NewspaperViewerProps {
  page: PageData;
  onPrevPage: () => void;
  onNextPage: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const NewspaperViewer: React.FC<NewspaperViewerProps> = ({
  page,
  onPrevPage,
  onNextPage,
  hasPrev,
  hasNext,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showZoomBadge, setShowZoomBadge] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Panning state
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const triggerZoomBadge = useCallback(() => {
    setShowZoomBadge(true);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => {
      setShowZoomBadge(false);
    }, 1200);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const next = Math.min(2.8, Number((prev + 0.25).toFixed(2)));
      return next;
    });
    triggerZoomBadge();
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.75, Number((prev - 0.25).toFixed(2)));
      return next;
    });
    triggerZoomBadge();
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    triggerZoomBadge();
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleQuickZoom = () => {
    setZoomLevel((prev) => (prev > 1.0 ? 1.0 : 1.6));
    triggerZoomBadge();
  };

  // Reset zoom & scroll when page changes
  useEffect(() => {
    setZoomLevel(1.0);
    setImageLoaded(false);
    setImageError(false);
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollTo({ top: 0, left: 0 });
    }
  }, [page.imageUrl]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mouse drag panning handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1.0 || !scrollWrapperRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - scrollWrapperRef.current.offsetLeft,
      y: e.pageY - scrollWrapperRef.current.offsetTop,
      scrollLeft: scrollWrapperRef.current.scrollLeft,
      scrollTop: scrollWrapperRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollWrapperRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollWrapperRef.current.offsetLeft;
    const y = e.pageY - scrollWrapperRef.current.offsetTop;
    const walkX = (x - dragStart.x) * 1.4;
    const walkY = (y - dragStart.y) * 1.4;
    scrollWrapperRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    scrollWrapperRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 px-2.5 md:px-5 pb-3.5 overflow-hidden flex flex-col relative w-full h-full min-h-0">
      <div
        ref={viewerContainerRef}
        className="w-full h-full bg-[#0B1224] rounded-2xl border border-[#1A243F]/80 relative overflow-hidden flex items-center justify-center shadow-2xl"
      >
        {/* Floating Zoom Controls Bar (Top-Right Overlay matching Screenshot 1 & 3) */}
        <div className="absolute top-3.5 right-3.5 z-30 bg-[#0B1224]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl flex items-center p-1 text-gray-300">
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-90 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-90 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          <button
            onClick={handleResetZoom}
            title="Reset Zoom (0)"
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-90 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-90 cursor-pointer ml-0.5 hidden sm:inline-flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Scroll & Pan Container */}
        <div
          ref={scrollWrapperRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full overflow-auto flex items-center justify-center p-2 md:p-4 select-none ${
            zoomLevel > 1.0 ? (isDragging ? 'pan-grabbing' : 'pan-grab') : ''
          }`}
        >
          {/* Zoom Transformation Wrapper */}
          <div
            style={{ transform: `scale(${zoomLevel})` }}
            className="transition-transform duration-200 ease-out origin-center flex items-center justify-center min-w-full min-h-full"
          >
            {/* Loading state matching image.png */}
            {!imageLoaded && !imageError && (
              <div className="flex items-center justify-center w-full h-full min-h-[500px]">
                <PaperLoadingScreen
                  isFullScreen={false}
                  statusText={`Loading ${page.title}...`}
                />
              </div>
            )}

            {/* Error state fallback */}
            {imageError ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#0e172e] rounded-xl border border-white/10 text-center max-w-md">
                <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p className="text-sm font-semibold text-gray-300">Unable to load broadsheet image</p>
                <p className="text-xs text-gray-500 mt-1">Please check your internet connection and reload.</p>
              </div>
            ) : (
              <img
                src={page.imageUrl}
                alt={page.title}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                onClick={handleQuickZoom}
                title="Click to zoom in / reset"
                className={`max-h-[80vh] md:max-h-[82vh] w-auto max-w-full object-contain shadow-2xl rounded-sm bg-white transition-opacity duration-200 cursor-zoom-in ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </div>
        </div>

        {/* Quick Page navigation side arrows for convenience */}
        {hasPrev && (
          <button
            onClick={onPrevPage}
            title="Previous Page"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white flex items-center justify-center transition-all opacity-0 hover:opacity-100 focus:opacity-100 z-20 backdrop-blur-sm"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNextPage}
            title="Next Page"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white flex items-center justify-center transition-all opacity-0 hover:opacity-100 focus:opacity-100 z-20 backdrop-blur-sm"
          >
            ›
          </button>
        )}

        {/* Zoom Level Indicator Badge */}
        <div
          className={`absolute bottom-4 right-4 bg-black/70 backdrop-blur text-[11px] font-mono text-gray-200 px-2.5 py-1 rounded-md pointer-events-none transition-opacity duration-300 z-30 ${
            showZoomBadge ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    </div>
  );
};
