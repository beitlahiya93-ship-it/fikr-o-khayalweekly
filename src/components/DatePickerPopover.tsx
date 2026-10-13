import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerPopoverProps {
  currentDate: string; // YYYY-MM-DD
  availableDates: string[]; // ['2026-10-12', '2026-10-05', ...]
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
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

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  currentDate,
  availableDates,
  onSelectDate,
  onClose,
}) => {
  // Parse initial month and year from currentDate (YYYY-MM-DD)
  const initialYear = parseInt(currentDate.split('-')[0], 10) || 2026;
  const initialMonth = parseInt(currentDate.split('-')[1], 10) - 1 || 9; // 9 = October

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calculate days in month and starting day offset
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-14 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 mt-2 bg-white rounded-2xl shadow-2xl p-4 w-[310px] md:w-[325px] text-gray-800 border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm md:text-base">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 mt-3 mb-1.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <span key={day} className="text-[11px] font-semibold text-gray-400">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="py-2 text-transparent">
            -
          </div>
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const dayNum = index + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isSelected = currentDate === dateStr;
          const isAvailable = availableDates.includes(dateStr);

          if (isSelected) {
            return (
              <button
                key={dateStr}
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                className="py-1.5 rounded-lg bg-[#006B5B] text-white font-bold ring-2 ring-emerald-300 shadow-sm transition-all"
              >
                {dayNum}
              </button>
            );
          }

          if (isAvailable) {
            return (
              <button
                key={dateStr}
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                className="py-1.5 rounded-lg bg-[#D1FAE5] text-emerald-900 font-bold hover:bg-[#A7F3D0] transition-colors"
              >
                {dayNum}
              </button>
            );
          }

          return (
            <div
              key={dateStr}
              className="py-1.5 text-gray-300 font-normal cursor-not-allowed select-none"
            >
              {dayNum}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006B5B]" />
          <span>Active edition</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#a7f3d0]" />
          <span>Available archive</span>
        </div>
      </div>
    </div>
  );
};
