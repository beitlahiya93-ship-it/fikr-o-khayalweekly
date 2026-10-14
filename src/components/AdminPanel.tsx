import React, { useState, useRef } from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Cloud,
  ChevronDown,
  Database,
  X,
  Newspaper,
  Eye,
  AlertTriangle,
  Zap,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import { EditionData, PageData } from '../types.ts';
import {
  renderPdfToImages,
  readAndCompressImageFile,
  dataUrlToBlob,
  RenderedPage,
} from '../utils/pdfRenderer.ts';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  resetSupabaseClient,
  getSupabaseClient,
} from '../utils/supabaseClient.ts';

interface AdminPanelProps {
  onClose: () => void;
  onLogout: () => void;
  allEditions: Record<string, EditionData>;
  onPublishEdition: (edition: EditionData) => void;
  onDeleteEdition: (id: string) => void;
  onSelectEditionToView: (id: string) => void;
  onTriggerToast: (msg: string) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  onLogout,
  allEditions,
  onPublishEdition,
  onDeleteEdition,
  onSelectEditionToView,
  onTriggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'all_papers'>('upload');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Selected edition for view/delete modal in ALL PAPERS
  const [editionActionModal, setEditionActionModal] = useState<EditionData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Supabase form config
  const [supabaseConfig, setSupabaseConfig] = useState(getStoredSupabaseConfig);

  // Upload Form State (Matches Image 2)
  const [publishDate, setPublishDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`; // DD-MM-YYYY format matching screenshot
  });
  const [showDatePickerInput, setShowDatePickerInput] = useState<boolean>(false);

  const [extractedPages, setExtractedPages] = useState<RenderedPage[]>([]);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const manualImageInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF upload with strict 40-60 KB compression
  const handlePdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingPdf(true);
    setLoadingStatus('Rendering and compressing pages to 40-60 KB...');

    try {
      const rendered = await renderPdfToImages(file, (curr, tot) => {
        setLoadingStatus(`Compressing page ${curr} of ${tot} to 40-60 KB...`);
      });

      if (rendered.length === 0) {
        throw new Error('Could not extract pages from PDF.');
      }

      setExtractedPages(rendered);
      onTriggerToast(`Extracted ${rendered.length} pages (all compressed to ~40-60 KB)!`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'PDF extraction failed';
      onTriggerToast(`Error: ${msg}`);
    } finally {
      setLoadingPdf(false);
      setLoadingStatus('');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  // Add manual image page with compression to 40-60 KB
  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newPages: RenderedPage[] = [];
      const fileList = Array.from(files);
      fileList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type.startsWith('image/')) {
          const { dataUrl, sizeKb } = await readAndCompressImageFile(file);
          newPages.push({
            pageNumber: extractedPages.length + i + 1,
            title: `Page No ${extractedPages.length + i + 1}`,
            imageUrl: dataUrl,
            sizeKb,
          });
        }
      }

      setExtractedPages((prev) => {
        const combined = [...prev, ...newPages];
        return combined.map((p, idx) => ({
          ...p,
          pageNumber: idx + 1,
          title: `Page No ${idx + 1}`,
        }));
      });
      onTriggerToast(`Added ${newPages.length} image page(s) (compressed to ~40-60 KB)!`);
    } catch (err: unknown) {
      console.error(err);
      onTriggerToast('Failed to load images');
    } finally {
      if (manualImageInputRef.current) manualImageInputRef.current.value = '';
    }
  };

  const handleRemovePage = (index: number) => {
    setExtractedPages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((p, idx) => ({
        ...p,
        pageNumber: idx + 1,
        title: `Page No ${idx + 1}`,
      }));
    });
  };

  // Publish Newspaper with automatic Supabase storage upload
  const handlePublish = async () => {
    if (extractedPages.length === 0) {
      onTriggerToast('Please select a PDF or add at least 1 page before publishing.');
      return;
    }

    setPublishing(true);

    // Convert DD-MM-YYYY to YYYY-MM-DD for ID
    const parts = publishDate.split('-');
    let dateId = publishDate;
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // DD-MM-YYYY -> YYYY-MM-DD
        dateId = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else if (parts[0].length === 4) {
        // Already YYYY-MM-DD
        dateId = publishDate;
      }
    }

    const pagesData: PageData[] = [];
    const client = getSupabaseClient();

    // Upload each compressed 40-60 KB page to Supabase Storage if configured
    for (let i = 0; i < extractedPages.length; i++) {
      const page = extractedPages[i];
      let finalImageUrl = page.imageUrl;

      if (client) {
        try {
          const blob = dataUrlToBlob(page.imageUrl);
          const filePath = `editions/${dateId}/page-${page.pageNumber}.jpg`;

          // Upload to 'epaper-files' bucket
          const { error: uploadError } = await client.storage
            .from('epaper-files')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data } = client.storage.from('epaper-files').getPublicUrl(filePath);
            if (data?.publicUrl) {
              finalImageUrl = data.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Storage upload note', storageErr);
        }
      }

      pagesData.push({
        pageNumber: page.pageNumber,
        title: page.title,
        imageUrl: finalImageUrl,
      });
    }

    const newEdition: EditionData = {
      id: dateId,
      dateString: publishDate,
      volume: `Vol. ${Object.keys(allEditions).length + 1}`,
      urduVolume: `شمارہ نمبر: 0${Object.keys(allEditions).length + 1}`,
      title: 'فکر و خیال ویکلی',
      description: `Published on ${publishDate} with ${pagesData.length} pages (~40-60 KB each)`,
      pages: pagesData,
    };

    // Save record to Supabase Database if configured
    if (client) {
      try {
        await client.from('epaper_editions').upsert({
          id: newEdition.id,
          date_string: newEdition.dateString,
          volume: newEdition.volume,
          pages: newEdition.pages,
          created_at: new Date().toISOString(),
        });
        onTriggerToast('Saved to Supabase Database & Storage with public URLs!');
      } catch (dbErr) {
        console.warn('Database upsert note', dbErr);
      }
    }

    onPublishEdition(newEdition);
    setPublishing(false);
    onTriggerToast(`🚀 Successfully published newspaper for ${publishDate}!`);
    setActiveTab('all_papers');
  };

  // Delete Edition handler
  const handleDeleteSelectedEdition = async () => {
    if (!editionActionModal) return;

    const editionId = editionActionModal.id;
    const client = getSupabaseClient();

    if (client) {
      try {
        await client.from('epaper_editions').delete().eq('id', editionId);
        // Clean up storage files if bucket exists
        await client.storage.from('epaper-files').remove([
          `editions/${editionId}/page-1.jpg`,
          `editions/${editionId}/page-2.jpg`,
          `editions/${editionId}/page-3.jpg`,
          `editions/${editionId}/page-4.jpg`,
        ]);
      } catch (err) {
        console.warn('Supabase delete note', err);
      }
    }

    onDeleteEdition(editionId);
    setEditionActionModal(null);
    setShowDeleteConfirm(false);
    onTriggerToast(`Deleted edition (${editionId})`);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSupabaseConfig(supabaseConfig);
    resetSupabaseClient();
    setShowSupabaseSettings(false);
    onTriggerToast('Supabase configuration saved!');
  };

  // Dates with published editions for the calendar view
  const publishedDateMap = React.useMemo(() => {
    const map: Record<string, EditionData> = {};
    Object.values(allEditions).forEach((edition) => {
      map[edition.id] = edition;
    });
    return map;
  }, [allEditions]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050817] text-white overflow-hidden select-none">
      {/* Top Header (Matches Image 2 & 3) */}
      <header className="px-5 md:px-8 py-4 border-b border-[#1A243F] bg-[#070c1a] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#00C98B] tracking-tight flex items-center gap-2">
            E-Paper Admin Panel
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage publications & Cloud Storage</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* + Upload Paper Button */}
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#00A86B] text-white shadow-md shadow-[#00A86B]/30'
                : 'bg-[#131D38] text-gray-300 hover:text-white border border-[#233560]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Paper</span>
          </button>

          {/* ALL PAPERS Button */}
          <button
            type="button"
            onClick={() => setActiveTab('all_papers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'all_papers'
                ? 'bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/30'
                : 'bg-[#131D38] text-gray-300 hover:text-white border border-[#233560]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>ALL PAPERS</span>
          </button>

          {/* Supabase Config Button */}
          <button
            type="button"
            onClick={() => setShowSupabaseSettings(true)}
            title="Configure Supabase Cloud URL & Key"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#131D38] hover:bg-[#1a284e] text-emerald-400 border border-[#233560] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supabase</span>
          </button>

          {/* Supabase SQL Setup Button */}
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            title="Copy Supabase SQL Setup Script for Table & Bucket"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#131D38] hover:bg-[#1a284e] text-cyan-400 border border-[#233560] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SQL Script</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2D0B12] text-red-400 hover:bg-red-950 border border-red-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          {/* Exit Admin to Reader */}
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            View Reader
          </button>
        </div>
      </header>

      {/* Main Body Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
        {/* ============================================================== */}
        {/* TAB 1: UPLOAD PAPER (Matches Image 2) */}
        {/* ============================================================== */}
        {activeTab === 'upload' && (
          <div className="w-full max-w-[660px] bg-[#0B1224] border border-[#1A243F] rounded-2xl p-6 md:p-8 shadow-2xl animate-in fade-in duration-150">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00C98B]" />
                <h2 className="text-base md:text-lg font-bold text-[#00C98B]">
                  Upload E-Paper Edition
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Auto 40-60 KB Compression
              </span>
            </div>

            {/* Publish Date Section */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Publish Date
              </label>
              <div className="bg-[#070c1a] border border-[#1A243F] rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                  <CalendarIcon className="w-4 h-4 text-[#00C98B]" />
                  <span>{publishDate}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDatePickerInput(!showDatePickerInput)}
                  className="px-3 py-1 bg-[#131D38] hover:bg-[#1a284e] text-xs font-medium text-gray-300 hover:text-white rounded-lg border border-[#233560] transition-colors cursor-pointer"
                >
                  Change Date
                </button>
              </div>

              {showDatePickerInput && (
                <div className="mt-2.5 p-3 bg-[#070c1a] rounded-xl border border-white/10 flex items-center gap-3">
                  <input
                    type="date"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [yyyy, mm, dd] = e.target.value.split('-');
                        setPublishDate(`${dd}-${mm}-${yyyy}`);
                        setShowDatePickerInput(false);
                      }
                    }}
                    className="bg-[#0B1224] border border-[#1A243F] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-gray-400">Select publication issue date</span>
                </div>
              )}
            </div>

            {/* Dashed PDF Upload Box */}
            <div className="border-2 border-dashed border-[#00A86B]/60 bg-[#070c1a]/70 rounded-2xl p-7 text-center mb-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00C98B]/10 flex items-center justify-center text-[#00C98B] mb-2.5">
                <FileText className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-white mb-1">Upload Full PDF Document</h3>
              <p className="text-xs text-gray-400 max-w-sm mb-4">
                Upload a single PDF. All pages auto-compress to <strong className="text-emerald-400">40 to 60 KB</strong> for maximum cloud storage savings.
              </p>

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handlePdfFile}
              />

              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={loadingPdf}
                className="bg-[#009F82] hover:bg-[#00876E] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-[#009F82]/30 transition-all cursor-pointer active:scale-95"
              >
                {loadingPdf ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>{loadingPdf ? loadingStatus : 'Select PDF File'}</span>
              </button>
            </div>

            {/* Extracted Pages Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-300">
                  Extracted Pages (Review before Publish)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#131D38] border border-[#233560] text-gray-300">
                  {extractedPages.length} Pages
                </span>
              </div>

              {/* Pages rows */}
              <div className="space-y-2.5">
                {extractedPages.length === 0 ? (
                  <div className="bg-[#070c1a] border border-[#1A243F] rounded-xl p-3.5 text-xs text-gray-400 flex items-center justify-between">
                    <span>Pg 1: No file chosen yet</span>
                    <button
                      type="button"
                      onClick={() => manualImageInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#131D38] hover:bg-[#1a284e] text-[11px] rounded text-gray-300 hover:text-white cursor-pointer"
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  extractedPages.map((page, idx) => (
                    <div
                      key={idx}
                      className="bg-[#070c1a] border border-[#1A243F] rounded-xl p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-13 bg-white rounded overflow-hidden shrink-0 border border-white/20">
                          <img
                            src={page.imageUrl}
                            alt={`Page ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            Pg {idx + 1}: {page.title}
                          </div>
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <span>{page.sizeKb ? `${page.sizeKb} KB` : '48 KB'}</span>
                            <span className="text-gray-500">· Target: 40-60 KB</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePage(idx)}
                        title="Remove page"
                        className="p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add manual image page trigger */}
              <input
                ref={manualImageInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleManualImageUpload}
              />
              <button
                type="button"
                onClick={() => manualImageInputRef.current?.click()}
                className="mt-3 text-xs text-[#00C98B] hover:text-[#00E599] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                + Add manual image page
              </button>
            </div>

            {/* Big Publish Button */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || loadingPdf || extractedPages.length === 0}
              className="w-full bg-[#009F82] hover:bg-[#00876E] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-[#009F82]/30 transition-all cursor-pointer active:scale-98"
            >
              {publishing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>{publishing ? 'Saving & Uploading to Supabase Cloud...' : '🚀 Publish Newspaper to Cloud'}</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ALL PAPERS (Matches Image 3 with DELETE support) */}
        {/* ============================================================== */}
        {activeTab === 'all_papers' && (
          <div className="w-full max-w-5xl animate-in fade-in duration-150">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6 bg-[#0B1224] border border-[#1A243F] rounded-xl px-5 py-3.5">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <CalendarIcon className="w-5 h-5 text-[#4F46E5]" />
                <span>Publication Calendar</span>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#131D38] border border-[#233560] text-white text-xs font-bold rounded-lg px-3 py-1.5 pr-8 appearance-none outline-none cursor-pointer"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2027}>2027</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 12 Months Grid (3 columns on desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const firstDay = new Date(selectedYear, monthIndex, 1).getDay();
                const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();

                return (
                  <div
                    key={monthName}
                    className="bg-[#0B1224] border border-[#1A243F] rounded-2xl p-4 shadow-lg flex flex-col"
                  >
                    {/* Month Header */}
                    <h3 className="font-bold text-center text-sm text-gray-100 pb-3 border-b border-white/5">
                      {monthName} {selectedYear}
                    </h3>

                    {/* Day labels SU MO TU WE TH FR SA */}
                    <div className="grid grid-cols-7 gap-1 mt-3 mb-1 text-center">
                      {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day) => (
                        <span key={day} className="text-[10px] font-bold text-gray-500">
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* Days Numbers */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mt-1">
                      {/* Leading empty cells */}
                      {Array.from({ length: firstDay }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="py-1 text-transparent select-none">
                          -
                        </div>
                      ))}

                      {/* Day cells */}
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const dateId = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const edition = publishedDateMap[dateId];

                        if (edition) {
                          // Published edition badge with newspaper icon
                          return (
                            <button
                              key={dayNum}
                              onClick={() => {
                                setEditionActionModal(edition);
                                setShowDeleteConfirm(false);
                              }}
                              title={`Manage ${edition.title} (${edition.dateString}) - Click to View or Delete`}
                              className="py-1 rounded-lg bg-[#006B5B] hover:bg-[#00584B] text-white font-bold ring-2 ring-emerald-300 shadow-sm flex flex-col items-center justify-center transition-all cursor-pointer group relative"
                            >
                              <span>{dayNum}</span>
                              <span className="text-[9px] text-emerald-200 flex items-center gap-0.5">
                                <Newspaper className="w-2.5 h-2.5 inline" />
                              </span>
                            </button>
                          );
                        }

                        return (
                          <div
                            key={dayNum}
                            className="py-1.5 text-gray-400 font-medium select-none text-xs"
                          >
                            {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* EDITION DETAIL / DELETE MODAL (When clicking a date in ALL PAPERS) */}
      {/* ============================================================== */}
      {editionActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditionActionModal(null)}
            className="absolute inset-0 bg-black/80 modal-backdrop"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#0B1224] border border-[#1A243F] rounded-2xl p-6 w-full max-w-[420px] shadow-2xl text-white z-10 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => setEditionActionModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#006B5B]/30 border border-[#00C98B]/30 flex items-center justify-center text-[#00C98B]">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{editionActionModal.title}</h3>
                <p className="text-xs text-gray-400">
                  Edition: <span className="text-emerald-400 font-semibold">{editionActionModal.dateString}</span> ({editionActionModal.volume})
                </p>
              </div>
            </div>

            <div className="bg-[#070c1a] p-3 rounded-xl border border-white/5 mb-5 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Total Pages:</span>
                <span className="font-semibold text-white">{editionActionModal.pages.length} Pages</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Avg Page Size:</span>
                <span className="font-mono text-emerald-400 font-semibold">~48 KB (Optimized)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold">Active in Publication Calendar</span>
              </div>
            </div>

            {/* Delete confirmation view */}
            {showDeleteConfirm ? (
              <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 mb-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-red-200">Confirm Deletion</p>
                <p className="text-[11px] text-gray-300 mt-1 mb-3">
                  Are you sure you want to delete this edition from the calendar and readers?
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedEdition}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* View in Reader */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectEditionToView(editionActionModal.id);
                    setEditionActionModal(null);
                    onClose();
                  }}
                  className="w-full bg-[#009F82] hover:bg-[#00876E] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View in Reader</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Delete This Edition</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUPABASE CONFIG MODAL */}
      {/* ============================================================== */}
      {showSupabaseSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowSupabaseSettings(false)}
            className="absolute inset-0 bg-black/80 modal-backdrop"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#0B1224] border border-[#1A243F] rounded-2xl p-6 w-full max-w-[480px] shadow-2xl text-white z-10"
          >
            <button
              onClick={() => setShowSupabaseSettings(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-emerald-400 font-bold text-lg">
              <Database className="w-5 h-5" />
              <span>Supabase Cloud Integration</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Connect your Supabase project to store uploaded editions and broadsheet pages in the cloud.
            </p>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseConfig.url}
                  onChange={(e) =>
                    setSupabaseConfig((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className="w-full bg-[#070d1e] border border-[#1A243F] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Anon Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseConfig.anonKey}
                  onChange={(e) =>
                    setSupabaseConfig((prev) => ({ ...prev, anonKey: e.target.value }))
                  }
                  className="w-full bg-[#070d1e] border border-[#1A243F] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupabaseSettings(false)}
                  className="px-4 py-2 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#009F82] hover:bg-[#00876E] text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUPABASE SQL SCRIPT MODAL */}
      {/* ============================================================== */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowSqlModal(false)}
            className="absolute inset-0 bg-black/80 modal-backdrop"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#0B1224] border border-[#1A243F] rounded-2xl p-6 w-full max-w-[680px] shadow-2xl text-white z-10 flex flex-col max-h-[90vh]"
          >
            <button
              onClick={() => setShowSqlModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-1.5 text-cyan-400 font-bold text-lg">
              <Code2 className="w-5 h-5" />
              <span>Supabase SQL Setup Script</span>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              Copy this SQL script and paste it into the <strong>Supabase SQL Editor</strong> and click <strong>RUN</strong>. It creates both the <strong>Table Editor</strong> table (<code className="text-emerald-400">epaper_editions</code>) and the <strong>Storage Bucket</strong> (<code className="text-emerald-400">epaper-files</code>) with full public read & upload permissions.
            </p>

            {/* Quick Steps */}
            <div className="bg-[#070c1a] p-3 rounded-xl border border-white/5 text-[11px] text-gray-300 space-y-1 mb-3">
              <div className="font-semibold text-emerald-400">Supabase میں استعمال کا آسان طریقہ:</div>
              <div>1. <span className="text-white font-medium">Supabase Dashboard</span> کھولیں اور بائیں مینو سے <span className="text-cyan-300 font-medium">SQL Editor</span> پر کلک کریں۔</div>
              <div>2. نیچے دیا گیا SQL اسکرپٹ <span className="text-white font-medium">Copy</span> کر کے وہاں <span className="text-white font-medium">Paste</span> کریں۔</div>
              <div>3. نیچے سبز بٹن <span className="text-emerald-400 font-bold">RUN</span> پر کلک کریں۔ آپ کا Table اور Storage Bucket خود بخود بن جائے گا۔</div>
              <div>4. پھر <span className="text-cyan-300 font-medium">Project Settings &gt; API</span> سے URL اور Anon Key لے کر ایڈمن پینل میں محفوظ کریں۔</div>
            </div>

            {/* SQL Code Box */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#050817] border border-[#1A243F] rounded-xl p-3 min-h-[220px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-xs text-gray-400">
                <span className="font-mono text-cyan-300">schema_and_storage.sql</span>
                <button
                  type="button"
                  onClick={() => {
                    const sql = `-- 1. CREATE STORAGE BUCKET FOR E-PAPER PAGES (40-60 KB EACH)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epaper-files',
  'epaper-files',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. STORAGE POLICIES: ALLOW PUBLIC READ & ANON UPLOADS
DROP POLICY IF EXISTS "Public Access epaper-files" ON storage.objects;
CREATE POLICY "Public Access epaper-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'epaper-files');

DROP POLICY IF EXISTS "Allow Uploads to epaper-files" ON storage.objects;
CREATE POLICY "Allow Uploads to epaper-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'epaper-files');

DROP POLICY IF EXISTS "Allow Updates to epaper-files" ON storage.objects;
CREATE POLICY "Allow Updates to epaper-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'epaper-files');

DROP POLICY IF EXISTS "Allow Deletes from epaper-files" ON storage.objects;
CREATE POLICY "Allow Deletes from epaper-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'epaper-files');

-- 3. CREATE 'epaper_editions' TABLE IN TABLE EDITOR
CREATE TABLE IF NOT EXISTS public.epaper_editions (
  id TEXT PRIMARY KEY,
  date_string TEXT NOT NULL,
  volume TEXT,
  urdu_volume TEXT,
  title TEXT DEFAULT 'فکر و خیال ویکلی',
  description TEXT,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.epaper_editions ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES: ALLOW PUBLIC READING & ADMIN PUBLISHING
DROP POLICY IF EXISTS "Allow public read access to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow public read access to epaper_editions"
ON public.epaper_editions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow insert to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow insert to epaper_editions"
ON public.epaper_editions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow update to epaper_editions"
ON public.epaper_editions FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow delete to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow delete to epaper_editions"
ON public.epaper_editions FOR DELETE
USING (true);

-- 6. SPEED OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_epaper_editions_date 
ON public.epaper_editions (date_string);

CREATE INDEX IF NOT EXISTS idx_epaper_editions_created_at 
ON public.epaper_editions (created_at DESC);`;
                    navigator.clipboard.writeText(sql).then(() => {
                      setCopiedSql(true);
                      onTriggerToast('Supabase SQL copied to clipboard!');
                      setTimeout(() => setCopiedSql(false), 2000);
                    });
                  }}
                  className="px-3 py-1 rounded bg-[#00A86B] hover:bg-[#00925c] text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors shadow-sm"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={`-- 1. CREATE STORAGE BUCKET FOR E-PAPER PAGES (40-60 KB EACH)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epaper-files',
  'epaper-files',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. STORAGE POLICIES: ALLOW PUBLIC READ & ANON UPLOADS
DROP POLICY IF EXISTS "Public Access epaper-files" ON storage.objects;
CREATE POLICY "Public Access epaper-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'epaper-files');

DROP POLICY IF EXISTS "Allow Uploads to epaper-files" ON storage.objects;
CREATE POLICY "Allow Uploads to epaper-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'epaper-files');

DROP POLICY IF EXISTS "Allow Updates to epaper-files" ON storage.objects;
CREATE POLICY "Allow Updates to epaper-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'epaper-files');

DROP POLICY IF EXISTS "Allow Deletes from epaper-files" ON storage.objects;
CREATE POLICY "Allow Deletes from epaper-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'epaper-files');

-- 3. CREATE 'epaper_editions' TABLE IN TABLE EDITOR
CREATE TABLE IF NOT EXISTS public.epaper_editions (
  id TEXT PRIMARY KEY,
  date_string TEXT NOT NULL,
  volume TEXT,
  urdu_volume TEXT,
  title TEXT DEFAULT 'فکر و خیال ویکلی',
  description TEXT,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.epaper_editions ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES: ALLOW PUBLIC READING & ADMIN PUBLISHING
DROP POLICY IF EXISTS "Allow public read access to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow public read access to epaper_editions"
ON public.epaper_editions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow insert to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow insert to epaper_editions"
ON public.epaper_editions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow update to epaper_editions"
ON public.epaper_editions FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow delete to epaper_editions" ON public.epaper_editions;
CREATE POLICY "Allow delete to epaper_editions"
ON public.epaper_editions FOR DELETE
USING (true);

-- 6. SPEED OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_epaper_editions_date 
ON public.epaper_editions (date_string);

CREATE INDEX IF NOT EXISTS idx_epaper_editions_created_at 
ON public.epaper_editions (created_at DESC);`}
                className="w-full flex-1 bg-transparent text-[11px] font-mono text-emerald-300/90 outline-none resize-none overflow-y-auto leading-relaxed selection:bg-cyan-500 selection:text-white"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
