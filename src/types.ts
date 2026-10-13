export interface PageData {
  pageNumber: number;
  imageUrl: string;
  title: string;
}

export interface EditionData {
  id: string; // e.g. "2026-10-12"
  dateString: string; // "12-10-2026"
  volume: string; // "Vol. 04"
  urduVolume: string; // "شمارہ نمبر: 04"
  title: string; // "فکر و خیال ویکلی"
  description: string;
  pages: PageData[];
}
