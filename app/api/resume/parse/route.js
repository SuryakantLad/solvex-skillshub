import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import { extractResumeData as parseResumeWithAI } from '@/lib/ai/extractor';
import { extractTextFromPDF } from '@/lib/resume/parser';
import connectDB from '@/lib/mongodb';
import Employee from '@/lib/db/models/Employee';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('resume');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
    }

    if (file.size < 512) {
      return NextResponse.json({ error: 'File appears to be empty or corrupted' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using utility
    const { text, pages, wordCount, charCount } = await extractTextFromPDF(buffer);

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Ensure the file is not a scanned image.' },
        { status: 422 }
      );
    }

    // Send to Claude for structured extraction
    const parsed = await parseResumeWithAI(text);
    const parseTimeMs = Date.now() - startTime;

    // Persist raw resume text + metadata to Employee record (best-effort)
    try {
      await connectDB();
      const employee = await Employee.findOne({ user: user.id });
      if (employee) {
        employee.aiMetadata = {
          ...(employee.aiMetadata || {}),
          resumeRawText: text.slice(0, 50000), // cap at 50k chars
          lastParsedAt: new Date(),
          parseModel: 'gemini-2.5-flash',
          overallConfidence: 90,
          aiTags: parsed.domainExpertise || [],
        };
        await employee.save();
      }
    } catch {
      // Non-critical — don't fail the request if storage fails
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      metadata: {
        pages,
        wordCount,
        charCount,
        parseTimeMs,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (error) {
    console.error('Resume parse error:', error);

    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      return NextResponse.json(
        { error: 'AI failed to structure the resume data. Please try again.' },
        { status: 422 }
      );
    }

    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('429')) {
      return NextResponse.json({ error: 'Claude AI rate limit reached. Please try again in a moment.' }, { status: 503 });
    }
    if (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('API_KEY')) {
      return NextResponse.json({ error: 'AI service unavailable. Check your GEMINI_API_KEY configuration.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Failed to parse resume. Please try again.' }, { status: 500 });
  }
}
