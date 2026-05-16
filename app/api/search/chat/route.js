import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import { generateChat } from '@/lib/ai/gemini';
import { parseJsonSafely } from '@/lib/ai/parser';
import { buildChatPrompt } from '@/lib/ai/prompts';
import { keywordScore } from '@/lib/ai/search';

export const maxDuration = 60;

const MAX_CANDIDATES = 40;

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'hr') {
      return NextResponse.json({ error: 'HR access required' }, { status: 403 });
    }

    const body = await request.json();
    const { message, history = [], currentCandidates = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build Gemini prompt using the chat prompt builder
    const prompt = buildChatPrompt(message, history, currentCandidates);

    const rawText = await generateChat(prompt);
    let aiResponse;
    try {
      aiResponse = parseJsonSafely(rawText);
    } catch {
      aiResponse = {
        message: rawText.slice(0, 500),
        action: 'answer',
        searchQuery: null,
        filters: {},
        candidateIds: [],
        followUpSuggestions: [],
      };
    }

    // If Gemini wants to search, execute it
    let searchResults = null;
    if (aiResponse.action === 'search' && aiResponse.searchQuery) {
      await connectDB();

      const mongoFilter = { isDeleted: false, status: 'active' };
      const f = aiResponse.filters ?? {};

      if (f.available === true) mongoFilter['availability.isAvailable'] = true;
      if (f.department) {
        mongoFilter.department = {
          $regex: `^${f.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          $options: 'i',
        };
      }
      if (f.minExperience != null || f.maxExperience != null) {
        mongoFilter.totalYearsExperience = {};
        if (f.minExperience != null) mongoFilter.totalYearsExperience.$gte = Number(f.minExperience);
        if (f.maxExperience != null) mongoFilter.totalYearsExperience.$lte = Number(f.maxExperience);
      }

      const employees = await Employee.find(mongoFilter)
        .select('name title department skills summary totalYearsExperience location availability')
        .sort({ profileCompleteness: -1, totalYearsExperience: -1 })
        .limit(MAX_CANDIDATES)
        .lean();

      // Fast keyword scoring (no extra Gemini call needed for chat refinements)
      searchResults = keywordScore(aiResponse.searchQuery, employees)
        .slice(0, 15)
        .map(({ _keywordScore, ...emp }) => emp);
    }

    return NextResponse.json({
      message: aiResponse.message,
      action: aiResponse.action,
      searchQuery: aiResponse.searchQuery,
      filters: aiResponse.filters ?? {},
      candidateIds: aiResponse.candidateIds ?? [],
      followUpSuggestions: aiResponse.followUpSuggestions ?? [],
      searchResults,
    });
  } catch (error) {
    console.error('[chat-search]', error);
    if (error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'Gemini rate limit reached. Please try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Chat failed. Please try again.' }, { status: 500 });
  }
}
