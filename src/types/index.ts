export type Reciter = {
  id: string;
  name: string;
  name_ar?: string;
  sample: string;
};

export type Surah = {
  number: number;
  name: {
    ar: string;
    en: string;
    transliteration: string;
  };
  verses_count: number;
};

export type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
};

export type QuranData = {
  data: {
    surahs: {
      number: number;
      ayahs: Ayah[];
    }[];
  };
};

export type AspectRatio = {
  id: string;
  label: string;
  desc: string;
  w: number;
  h: number;
};

export type EditorState = {
  selectedSurahNumber: number;
  fromAyah: number;
  toAyah: number;
  yPosition: number;
  xPosition: number;
  surahYPosition: number;
  surahXPosition: number;
  ayahFontSize: number;
  surahFontSize: number;
  ayahColor: string;
  ayahShadowColor: string;
  surahColor: string;
  surahShadowColor: string;
  waveColor: string;
  waveX: number;
  waveY: number;
  waveHeight: number;
  showWave: boolean;
  showSurahName: boolean;
  aspectRatio: string;
  bgType: "image" | "video";
  bgImage: any;
  bgVideo: string | null;
  bgVideoRange: [number, number];
  bgVideoDuration: number;
  showWatermark: boolean;
  watermarkMode: "image" | "text";
  watermarkImage: string | null;
  watermarkText: string;
  watermarkTextColor: string;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkX: number;
  watermarkY: number;
  bgBlur: number;
  bgDim: number;
  selectedReciterId: string;
  isDarkMode: boolean;
  exportQuality: "low" | "medium" | "high";
  exportPreset: "story" | "post" | "tiktok" | "youtube" | "whatsapp";
  showSafeArea: boolean;
};
