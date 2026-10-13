import { EditionData } from '../types.ts';

export const EDITIONS: Record<string, EditionData> = {
  '2026-10-12': {
    id: '2026-10-12',
    dateString: '12-10-2026',
    volume: 'Vol. 04',
    urduVolume: 'شمارہ نمبر: 04',
    title: 'فکر و خیال ویکلی',
    description: '12 October 2026 Edition featuring editorial on مباحثہ یا شہرت کا کھیل؟ پس پردہ مقاصد اور علمی معیار',
    pages: [
      {
        pageNumber: 1,
        title: 'Page No 1',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD0ZR1PSgdrbhTIrN8IyLQ-7-2tT1Q1iY6yK6aA9zStXwpbFDMgWY1vqEr1d12kyoKjbUjs_Gmv5OLypXDmc4vGfqLfpIbvAcPwG7uo_ryladl8J5BM7B3x4NVZxlLUv0lW0LLqn7EmJt-mpFrodOSAgcr81wJ0D1Hb7voCwkbSWWC8d2oRNw_A3eIsRH2fmvoHmGg3kslySWs-kJFGd4uRqbtG1ZcqElHV0_iPk8-9DzmX-oFhXWD9cSBA8gO00Ji3aIM',
      },
      {
        pageNumber: 2,
        title: 'Page No 2',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAvCvVWuEdx1q_A82MorxQf46nJ2QzIiV2P0S17J6T_zsUbdPJ0gPfMNPcGsA8KnyC_7r58smFqHU0psDA99tcOhqizoRfmYGG05qWsaLTMusBBhZdpRXXBBwXPH_sJL93UQ5hKcFoSmPJJ6MP7TUXeRn4-_7gAeFdzQyGXR2hQ72avVRCrBX7prMaS4sGuaGPWWfRvoVPTN3UW2Cy27Y9Y3RRZxFgnbFh4kUjXpUswRi5Szo8qJpGbNjbX2RW_gv5-4ZA',
      },
    ],
  },
  '2026-10-05': {
    id: '2026-10-05',
    dateString: '05-10-2026',
    volume: 'Vol. 03',
    urduVolume: 'شمارہ نمبر: 03',
    title: 'فکر و خیال ویکلی',
    description: '05 October 2026 Archive Edition',
    pages: [
      {
        pageNumber: 1,
        title: 'Page No 1',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD0ZR1PSgdrbhTIrN8IyLQ-7-2tT1Q1iY6yK6aA9zStXwpbFDMgWY1vqEr1d12kyoKjbUjs_Gmv5OLypXDmc4vGfqLfpIbvAcPwG7uo_ryladl8J5BM7B3x4NVZxlLUv0lW0LLqn7EmJt-mpFrodOSAgcr81wJ0D1Hb7voCwkbSWWC8d2oRNw_A3eIsRH2fmvoHmGg3kslySWs-kJFGd4uRqbtG1ZcqElHV0_iPk8-9DzmX-oFhXWD9cSBA8gO00Ji3aIM',
      },
      {
        pageNumber: 2,
        title: 'Page No 2',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAvCvVWuEdx1q_A82MorxQf46nJ2QzIiV2P0S17J6T_zsUbdPJ0gPfMNPcGsA8KnyC_7r58smFqHU0psDA99tcOhqizoRfmYGG05qWsaLTMusBBhZdpRXXBBwXPH_sJL93UQ5hKcFoSmPJJ6MP7TUXeRn4-_7gAeFdzQyGXR2hQ72avVRCrBX7prMaS4sGuaGPWWfRvoVPTN3UW2Cy27Y9Y3RRZxFgnbFh4kUjXpUswRi5Szo8qJpGbNjbX2RW_gv5-4ZA',
      },
    ],
  },
};

export const AVAILABLE_EDITION_DATES = ['2026-10-12', '2026-10-05'];
