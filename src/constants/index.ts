import { AspectRatio, Surah, Reciter, QuranData } from "@/types";
import surahsData from "@/assets/quran_surahs.json";
import quranDataRaw from "@/assets/quran.json";
import recitersDataRaw from "@/assets/reciters.json";

import bg1 from "@/assets/images/1.svg";
import bg2 from "@/assets/images/2.svg";
import bg3 from "@/assets/images/3.svg";
import bg4 from "@/assets/images/4.svg";
import bg5 from "@/assets/images/5.svg";

export const recitersData = recitersDataRaw as { reciters: Reciter[] };
export const reciters = recitersData.reciters;
export const quranData = quranDataRaw as unknown as QuranData;

export const fallbackSurah: Surah = {
  number: 1,
  name: {
    ar: "الفاتحة",
    en: "The Opening",
    transliteration: "Al-Fatihah",
  },
  verses_count: 7,
};

const surahSource = surahsData as { result?: Surah[] };
export const surahs = surahSource.result?.length ? surahSource.result : [fallbackSurah];

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: "9/16", label: "طولي (9:16)", desc: "Reels, TikTok, Stories", w: 1080, h: 1920 },
  { id: "1/1", label: "مربع (1:1)", desc: "Instagram Post", w: 1080, h: 1080 },
  { id: "16/9", label: "عرضي (16:9)", desc: "YouTube, Facebook", w: 1920, h: 1080 },
  { id: "4/5", label: "طولي (4:5)", desc: "Instagram Social Feed", w: 1080, h: 1350 },
];

export const BACKGROUNDS = [bg1, bg2, bg3, bg4, bg5];
