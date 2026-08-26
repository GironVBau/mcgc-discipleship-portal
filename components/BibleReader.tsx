'use client';

import { useState, useEffect, useRef } from 'react';
import { getChapter, searchVerses, type BibleVerse } from '@/lib/supabase/bible';
import { ChevronLeft, ChevronRight, BookOpen, Search, Book, Info, X } from 'lucide-react';

const BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
  'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
  'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
  'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John',
  '2 John', '3 John', 'Jude', 'Revelation'
];

// Tailwind classes for font size scaling
const FONT_SIZES = [
  { label: 'SM', class: 'text-sm' },
  { label: 'MD', class: 'text-base' },
  { label: 'LG', class: 'text-lg' },
  { label: 'XL', class: 'text-xl' },
];

/**
 * Top Notice Component explaining KJV translator notes and supplied words.
 */
function TranslatorNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="relative p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-slate-300 text-xs sm:text-sm leading-relaxed shadow-md backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-amber-400 flex items-center gap-1.5 text-sm">
            <Info className="w-4 h-4 text-amber-400 shrink-0" /> Note on Italicized / Parenthesized Words in the KJV
          </p>
          <p className="text-slate-300">
            Words displayed in <span className="italic text-slate-400 font-medium">(italics)</span> were supplied by the original King James translators to ensure complete English sentences. They do not appear explicitly in the ancient Hebrew or Greek manuscripts, but were added for clarity and readability.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Cleans up raw KJV text brackets {...} into readable inline notes.
 */
function FormattedVerseText({ text }: { text: string }) {
  // Split text by KJV bracket notes {...}
  const parts = text.split(/(\{.*?\})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          const cleanNote = part.slice(1, -1);
          return (
            <span
              key={index}
              className="text-xs italic text-slate-400 font-normal px-1 select-none"
              title={`KJV Translator Note: ${cleanNote}`}
            >
              ({cleanNote})
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export default function BibleReader() {
  const [mode, setMode] = useState<'read' | 'search'>('read');
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggle state for the translator notice banner
  const [showNotice, setShowNotice] = useState(true);

  // Font Size Index (Default: Index 2 -> LG text-lg)
  const [fontSizeIndex, setFontSizeIndex] = useState(2);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ref for auto-scrolling to selected verse
  const verseRefs = useRef<{ [key: number]: HTMLSpanElement | null }>({});

  // Fetch Chapter
  useEffect(() => {
    if (mode !== 'read') return;
    async function fetchVerses() {
      setLoading(true);
      const data = await getChapter(selectedBook, selectedChapter);
      setVerses(data || []);
      setLoading(false);
    }
    fetchVerses();
  }, [selectedBook, selectedChapter, mode]);

  // Scroll to selected verse once content loads
  useEffect(() => {
    if (selectedVerse && verseRefs.current[selectedVerse]) {
      verseRefs.current[selectedVerse]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedVerse, verses, loading]);

  // Execute Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchVerses(searchQuery);
    setSearchResults(results || []);
    setIsSearching(false);
  };

  // Jump directly to passage from search results
  const jumpToPassage = (book: string, chapter: number, verse?: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    if (verse) setSelectedVerse(verse);
    setMode('read');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Notice Banner Placement at Top */}
      {showNotice && <TranslatorNotice onClose={() => setShowNotice(false)} />}

      {/* Dynamic Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          {/* Read / Search Mode Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('read')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                mode === 'read' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Read
            </button>
            <button
              onClick={() => setMode('search')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                mode === 'search' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </div>

          {/* Font Size Adjuster Control */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setFontSizeIndex((prev) => Math.max(0, prev - 1))}
              disabled={fontSizeIndex === 0}
              className="px-2 py-0.5 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="text-[10px] font-semibold text-amber-400 px-2 select-none border-x border-slate-700">
              {FONT_SIZES[fontSizeIndex].label}
            </span>
            <button
              type="button"
              onClick={() => setFontSizeIndex((prev) => Math.min(FONT_SIZES.length - 1, prev + 1))}
              disabled={fontSizeIndex === FONT_SIZES.length - 1}
              className="px-2 py-0.5 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Toggle Notice Button (if closed) */}
          {!showNotice && (
            <button
              onClick={() => setShowNotice(true)}
              className="p-1.5 bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg border border-slate-700 transition-colors"
              title="Show KJV Translator Note"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        {mode === 'read' ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Book Selector */}
            <select 
              value={selectedBook}
              onChange={(e) => { 
                setSelectedBook(e.target.value); 
                setSelectedChapter(1); 
                setSelectedVerse(null);
              }}
              className="bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {BIBLE_BOOKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Chapter Navigation & Selector */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 px-1 py-0.5">
              <button 
                disabled={selectedChapter <= 1}
                onClick={() => {
                  setSelectedChapter((prev) => prev - 1);
                  setSelectedVerse(null);
                }}
                className="p-1 rounded hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title="Previous Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-semibold px-1 text-slate-300">Ch.</span>
              <input
                type="number"
                min={1}
                value={selectedChapter}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0) {
                    setSelectedChapter(val);
                    setSelectedVerse(null);
                  }
                }}
                className="w-12 bg-slate-900 text-white text-center text-sm font-semibold py-0.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <button 
                onClick={() => {
                  setSelectedChapter((prev) => prev + 1);
                  setSelectedVerse(null);
                }}
                className="p-1 rounded hover:bg-slate-700 transition-colors"
                title="Next Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Verse Jump Dropdown */}
            {verses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                <span className="text-xs font-semibold text-slate-400">Verse:</span>
                <select
                  value={selectedVerse || ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    setSelectedVerse(v);
                  }}
                  className="bg-slate-900 text-amber-400 font-semibold px-2 py-0.5 rounded border border-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">All</option>
                  {verses.map((v) => (
                    <option key={v.verse} value={v.verse}>
                      {v.verse}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder='Try "John 3:16", "Genesis 1", or "light"...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-72"
            />
            <button
              type="submit"
              className="bg-amber-400 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-300 transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {/* Main Reader Display */}
      {mode === 'read' ? (
        <div className="bg-slate-900/60 p-6 sm:p-10 rounded-2xl border border-slate-800 shadow-md min-h-[400px]">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-8 border-b pb-4 border-slate-800 text-white tracking-tight">
            {selectedBook} {selectedChapter}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-48 text-slate-400 animate-pulse font-medium">
              Loading scripture...
            </div>
          ) : verses.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              No verses found for this chapter.
            </div>
          ) : (
            <div className={`max-w-3xl mx-auto space-y-2 leading-relaxed transition-all duration-150 ${FONT_SIZES[fontSizeIndex].class}`}>
              {verses.map((v) => {
                const isSelected = selectedVerse === v.verse;

                return (
                  <span
                    key={v.id || `${v.chapter}-${v.verse}`}
                    ref={(el) => {
                      verseRefs.current[v.verse] = el;
                    }}
                    onClick={() => setSelectedVerse(v.verse)}
                    className={`inline rounded px-1.5 py-0.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 ring-1 ring-amber-400/80 text-amber-100'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                  >
                    <sup className="text-amber-400 font-bold text-xs mr-1 select-none">
                      {v.verse}
                    </sup>
                    <span className="font-normal">
                      <FormattedVerseText text={v.text} />
                    </span>
                    {' '}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Search Mode Display */
        <div className="bg-slate-900/60 p-6 sm:p-10 rounded-2xl border border-slate-800 shadow-md min-h-[400px]">
          <h2 className="text-xl font-bold mb-6 text-slate-200 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            {searchResults.length > 0 ? `Results for "${searchQuery}"` : 'Scripture Search'}
          </h2>

          {isSearching ? (
            <div className="text-center text-slate-400 py-12 animate-pulse font-medium">
              Searching scriptures...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              {searchQuery ? 'No matching verses found.' : 'Search by reference (e.g., John 3:16) or keyword (e.g., light).'}
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((v) => (
                <div 
                  key={v.id || `${v.book}-${v.chapter}-${v.verse}`}
                  onClick={() => jumpToPassage(v.book, v.chapter, v.verse)}
                  className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-amber-400/50 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-amber-400 group-hover:underline">
                      {v.book} {v.chapter}:{v.verse}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                      <Book className="w-3.5 h-3.5" /> Jump to verse
                    </span>
                  </div>
                  <p className={`text-slate-200 leading-relaxed ${FONT_SIZES[fontSizeIndex].class}`}>
                    "<FormattedVerseText text={v.text} />"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}