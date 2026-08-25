import { createClient } from '@/lib/supabase/client';

export interface BibleVerse {
  id?: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
}

/**
 * Fetch all verses for a specific book and chapter
 */
export async function getChapter(book: string, chapter: number): Promise<BibleVerse[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .eq('book', book)
    .eq('chapter', Number(chapter))
    .order('verse', { ascending: true });

  if (error) {
    console.error('Supabase fetch error details:', error);
    return [];
  }

  return data || [];
}

/**
 * Search scripture text OR parse direct passage references (e.g., "John 3:16", "Genesis 1")
 */
export async function searchVerses(query: string, limit = 50): Promise<BibleVerse[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const supabase = createClient();

  // Pattern: "1 John 3:16", "John 3:16", "John 3", etc.
  const passageRegex = /^((?:\d\s+)?[A-Za-z]+)\s+(\d+)(?::(\d+))?$/;
  const match = cleanQuery.match(passageRegex);

  if (match) {
    const [, bookInput, chapterStr, verseStr] = match;
    const chapterNum = parseInt(chapterStr, 10);

    let dbQuery = supabase
      .from('bible_verses')
      .select('*')
      .ilike('book', `%${bookInput}%`)
      .eq('chapter', chapterNum);

    if (verseStr) {
      dbQuery = dbQuery.eq('verse', parseInt(verseStr, 10));
    }

    const { data: referenceData, error: referenceError } = await dbQuery
      .order('verse', { ascending: true })
      .limit(limit);

    if (!referenceError && referenceData && referenceData.length > 0) {
      return referenceData;
    }
  }

  // Fallback: Full-text keyword search
  const { data, error } = await supabase
    .from('bible_verses')
    .select('*')
    .ilike('text', `%${cleanQuery}%`)
    .order('book', { ascending: true })
    .order('chapter', { ascending: true })
    .order('verse', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Supabase search error details:', error);
    return [];
  }

  return data || [];
}