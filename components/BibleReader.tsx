'use client';

import { useState, useEffect } from 'react';
import { getChapter, searchVerses, type BibleVerse } from '@/lib/supabase/bible';
import { ChevronLeft, ChevronRight, BookOpen, Search, Book, Type } from 'lucide-react';

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

export default function BibleReader() {
  const [mode, setMode] = useState<'read' | 'search'>('read');
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  // Font Size Index (Default: Index 2 -> LG text-lg)
  const [fontSizeIndex, setFontSizeIndex] = useState(2);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // Execute Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchVerses(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Jump directly to passage from search results
  const jumpToPassage = (book: string, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setMode('read');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
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
        </div>

        {mode === 'read' ? (
          <div className="flex items-center gap-3">
            <select 
              value={selectedBook}
              onChange={(e) => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
              className="bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {BIBLE_BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <div className="flex items-center gap-1">
              <button 
                disabled={selectedChapter <= 1}
                onClick={() => setSelectedChapter(prev => prev - 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2">Ch. {selectedChapter}</span>
              <button 
                onClick={() => setSelectedChapter(prev => prev + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
              className="bg-amber-400 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-300 transition-colors"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {/* Main Display Area */}
      {mode === 'read' ? (
        <div className="bg-amber-50/20 dark:bg-slate-900/40 p-6 sm:p-10 rounded-2xl border border-amber-100 dark:border-slate-800 shadow-sm min-h-[400px]">
          <h2 className="text-2xl font-sans font-bold text-center mb-8 border-b pb-4 border-slate-200 dark:border-slate-800 text-white">
            {selectedBook} {selectedChapter}
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-48 text-slate-400 animate-pulse">
              Loading scripture...
            </div>
          ) : verses.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              No verses found for this chapter.
            </div>
          ) : (
            <div className={`prose dark:prose-invert max-w-none space-y-3 font-sans leading-relaxed transition-all duration-150 ${FONT_SIZES[fontSizeIndex].class}`}>
              {verses.map((v) => (
                <span key={v.id || `${v.chapter}-${v.verse}`} className="inline group hover:bg-amber-100/50 dark:hover:bg-slate-800/50 rounded px-1 transition-colors">
                  <sup className="text-amber-400 font-sans text-xs font-bold mr-1 select-none">
                    {v.verse}
                  </sup>
                  <span className="text-slate-200">{v.text} </span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/40 p-6 sm:p-10 rounded-2xl border border-slate-800 shadow-sm min-h-[400px]">
          <h2 className="text-xl font-bold mb-6 text-slate-200 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            {searchResults.length > 0 ? `Results for "${searchQuery}"` : 'Scripture Search'}
          </h2>

          {isSearching ? (
            <div className="text-center text-slate-400 py-12 animate-pulse">
              Searching scriptures...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              {searchQuery ? 'No matching verses found.' : 'Search by reference (e.g., John 3:16) or keyword (e.g., love).'}
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((v) => (
                <div 
                  key={v.id || `${v.book}-${v.chapter}-${v.verse}`}
                  onClick={() => jumpToPassage(v.book, v.chapter)}
                  className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-amber-400 group-hover:underline">
                      {v.book} {v.chapter}:{v.verse}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Book className="w-3 h-3" /> Jump to chapter
                    </span>
                  </div>
                  <p className={`text-slate-300 font-sans leading-relaxed transition-all duration-150 ${FONT_SIZES[fontSizeIndex].class}`}>
                    "{v.text}"
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