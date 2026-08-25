'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { X, ExternalLink, Loader2, BookOpen } from 'lucide-react';

interface ScriptureDrawerProps {
  reference: string | null;
  onClose: () => void;
}

interface BibleVerse {
  id?: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function ScriptureDrawer({ reference, onClose }: ScriptureDrawerProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [parsedBook, setParsedBook] = useState<string>('Genesis');
  const [parsedChapter, setParsedChapter] = useState<number>(1);
  const supabase = createClient();

  useEffect(() => {
    if (!reference) return;

    async function fetchScripture() {
      setLoading(true);

      // Regex handles numbered books, single verses, and ranges (e.g. "2 Peter 1:20-21" or "John 3:16")
      const regex = /^(\d?\s?[A-Za-z\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
      const match = reference?.trim().match(regex);

      if (!match) {
        console.error("Could not parse reference format:", reference);
        setVerses([]);
        setLoading(false);
        return;
      }

      const [, rawBook, chapterStr, startVerseStr, endVerseStr] = match;
      const bookName = rawBook.trim();
      const chapterNum = parseInt(chapterStr, 10);
      const startVerse = parseInt(startVerseStr, 10);
      const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : startVerse;

      setParsedBook(bookName);
      setParsedChapter(chapterNum);

      // Query Supabase with ILIKE for book matching and verse range filters
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .ilike('book', `%${bookName}%`)
        .eq('chapter', chapterNum)
        .gte('verse', startVerse)
        .lte('verse', endVerse)
        .order('verse', { ascending: true });

      if (error) {
        console.error("Error fetching drawer verses:", error.message);
        setVerses([]);
      } else {
        setVerses(data || []);
      }

      setLoading(false);
    }

    fetchScripture();
  }, [reference, supabase]);

  if (!reference) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-opacity">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer Content */}
      <div className="w-full max-w-md bg-slate-900 text-white h-full flex flex-col shadow-2xl border-l border-slate-800">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <BookOpen className="w-5 h-5" />
            <span>{reference}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-slate-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-sm">Fetching scripture text...</span>
            </div>
          ) : verses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4 space-y-2">
              <p className="text-sm text-slate-400">
                Could not load text for "{reference}".
              </p>
              <p className="text-xs text-slate-500">
                Ensure your database table contains records matching this passage.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-base leading-relaxed">
              {verses.map((v) => (
                <p key={v.id || `${v.chapter}-${v.verse}`} className="flex items-start gap-2">
                  <sup className="text-amber-400 font-sans text-xs font-bold shrink-0 mt-1 select-none">
                    {v.verse}
                  </sup>
                  <span>{v.text}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer - Direct link to full Bible reader */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <Link
            href={`/bible?book=${encodeURIComponent(parsedBook)}&chapter=${parsedChapter}`}
            onClick={onClose}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-md shadow-amber-400/10"
          >
            <span>Read Full Chapter</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}