"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { 
  User, 
  Moon, 
  ChevronDown, 
  Search, 
  Clapperboard,
  BookOpenText,
  PlayCircle
} from "lucide-react";
import surahsData from "@/assets/quran_surahs.json";

interface Surah {
  number: number;
  name: { ar: string; en: string };
  verses_count: number;
}

const surahs: Surah[] = surahsData.result;

export default function App() {
  const [selectedSurah, setSelectedSurah] = useState<Surah>(surahs[0]);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(5);

  const handleSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const surah = surahs.find(s => s.number === parseInt(e.target.value)) || surahs[0];
    setSelectedSurah(surah);
    setFromAyah(1);
    setToAyah(Math.min(5, surah.verses_count) > 0 ? (surah.verses_count >= 5 ? 5 : surah.verses_count) : surah.verses_count);
  };

  const handleFromAyahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      if (val < 1) val = 1;
      if (val > selectedSurah.verses_count) val = selectedSurah.verses_count;
      setFromAyah(val);
      if (val > toAyah) setToAyah(val);
    } else {
      setFromAyah(1);
    }
  };

  const handleToAyahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      if (val > selectedSurah.verses_count) val = selectedSurah.verses_count;
      if (val < fromAyah) val = fromAyah;
      setToAyah(val);
    } else {
      setToAyah(selectedSurah.verses_count);
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#f3f4f6] font-sans overflow-hidden">
      
      {/* Left Preview Area */}
      <div className="flex-1 flex items-center justify-center relative shadow-inner h-full">
        {/* Phone Mockup Frame */}
        <div className="relative w-[340px] h-[680px] bg-black rounded-[40px] border-[10px] border-[#2A2A2A] overflow-hidden shadow-2xl flex items-center justify-center">
          {/* Background Image / Video Mockup */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-900 via-green-800 to-green-950 flex flex-col items-center justify-center pt-20 pb-10 px-6 text-center">
            {/* Visual content representation of the image provided */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center brightness-75"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full opacity-90">
              <div className="mb-2 text-white font-medium text-lg leading-relaxed text-shadow-md">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ {selectedSurah.number > 1 ? "۝" : ""}
              </div>
              <div className="text-white/80 text-xs mb-8">
                In the name of Allah, the Entirely Merciful, the Especially Merciful.
              </div>
              
              <div className="text-white/60 text-[10px] mt-auto pb-8">
                Created with Trteel Studio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Editor Controls */}
      <div className="w-[420px] bg-white h-full border-l border-gray-200 flex flex-col shadow-xl z-10 shrink-0">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
              <User size={20} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Moon size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xl relative group cursor-pointer">
             <div className="flex items-center relative">
               {/* Simulating the logo from the screenshot */}
               <BookOpenText className="w-8 h-8 text-blue-700" strokeWidth={1.5} />
               <PlayCircle className="w-4 h-4 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 fill-white" />
             </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200">
          
          {/* Section 1: Scope Settings */}
          <div className="mb-10">
            <h3 className="text-[12px] font-bold text-gray-500 mb-4 px-1">
              1. إعدادات النطاق (BATCH)
            </h3>
            
            <div className="space-y-4">
              {/* Surah Dropdown */}
              <div className="relative">
                <select 
                  className="w-full h-12 bg-gray-100/80 border-none rounded-xl px-4 appearance-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-800 cursor-pointer"
                  value={selectedSurah.number}
                  onChange={handleSurahChange}
                >
                  {surahs.map((surah) => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.name.ar}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={18} />
                </div>
              </div>

              {/* Ayah Range */}
              <div className="flex items-center gap-3">
                {/* To Ayah */}
                <div className="flex-1 relative h-14 bg-gray-100/80 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden transition-all">
                  <div className="absolute top-2 right-4 text-[10px] text-gray-500 font-medium select-none pointer-events-none">إلى آية</div>
                  <input 
                    type="number"
                    min={fromAyah}
                    max={selectedSurah.verses_count}
                    value={toAyah}
                    onChange={handleToAyahChange}
                    className="w-full h-full bg-transparent border-none pl-4 pr-4 pt-4 pb-1 text-center font-semibold text-gray-800 outline-none"
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                    / {selectedSurah.verses_count}
                  </div>
                </div>

                {/* From Ayah */}
                <div className="flex-1 relative h-14 bg-gray-100/80 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden transition-all">
                  <div className="absolute top-2 right-4 text-[10px] text-gray-500 font-medium select-none pointer-events-none">من آية</div>
                  <input 
                    type="number"
                    min={1}
                    max={selectedSurah.verses_count}
                    value={fromAyah}
                    onChange={handleFromAyahChange}
                    className="w-full h-full bg-transparent border-none px-4 pt-4 pb-1 text-center font-semibold text-gray-800 outline-none"
                  />
                </div>
              </div>

              {/* Video Ratio */}
              <div className="relative mt-2">
                <div className="absolute -top-3 right-2 bg-white px-2 py-px text-[10px] text-gray-400 z-10 hidden">مقاس الفيديو</div>
                <select 
                  className="w-full h-12 bg-gray-100/80 border-none rounded-xl px-4 appearance-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-800 cursor-pointer"
                  defaultValue="9:16"
                >
                  <option value="9:16">طولي (Reels/TikTok) - 9:16</option>
                  <option value="16:9">عرضي (YouTube) - 16:9</option>
                  <option value="1:1">مربع (Instagram) - 1:1</option>
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={18} />
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Audio & Sync */}
          <div>
            <h3 className="text-[12px] font-bold text-gray-500 mb-4 px-1">
              2. الصوت والمزامنة (THE SOUL)
            </h3>
            
            <div className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-gray-100 rounded-xl relative">
                <button className="flex-1 h-10 bg-white rounded-lg shadow-sm text-blue-600 font-semibold text-sm transition-all z-10 flex items-center justify-center">
                  قاري أونلاين
                </button>
                <button className="flex-1 h-10 rounded-lg text-gray-500 font-medium text-sm transition-all flex items-center justify-center gap-2 hover:bg-gray-200/50">
                  ارفع صوتك
                  <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm leading-none pt-[3px]">PRO</span>
                </button>
              </div>

              {/* Reciter Search */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="بحث عن قارئ..."
                  className="w-full h-12 bg-gray-100/80 border-none rounded-xl pr-4 pl-12 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 placeholder:text-gray-400 font-medium"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} />
                </div>
              </div>

              {/* Selected Reciter Card */}
              <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors group">
                <div className="font-semibold text-blue-800 text-sm">ياسر الدوسري</div>
                <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm leading-none pt-1.5">
                  مرتل
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer / CTA */}
        <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <button className="w-full h-[52px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 font-bold text-base">
            تصدير المقطع
            <Clapperboard size={20} className="mb-0.5" />
          </button>
        </div>
        
      </div>

    </div>
  );
}
