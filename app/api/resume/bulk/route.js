import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import { extractResumeData as parseResumeWithAI } from '@/lib/ai/extractor';
import { extractTextFromPDF } from '@/lib/resume/parser';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import User from '@/lib/db/models/User';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Map parsed resume data onto an Employee document (upsert by email)
async function upsertEmployee(parsed, hrUserId) {
  if (!parsed.email) return { status: 'skipped', reason: 'No email extracted — cannot identify employee' };

  const email = parsed.email.toLowerCase().trim();

  // Check if a User account already exists for this email
  let userDoc = await User.findOne({ email });
  if (!userDoc) {
    // Create a placeholder User account
    userDoc = await User.create({
      name: parsed.name || email.split('@')[0],
      email,
      password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), // random, never used
      role: 'employee',
    });
  }

  const existingEmployee = await Employee.findOne({ user: userDoc._id });

  const skillDocs = (parsed.skills ?? []).map((s) => ({
    name: s.name,
    category: mapCategory(s.category),
    proficiency: s.proficiency ?? 'intermediate',
    yearsOfExperience: s.yearsOfExperience ?? 0,
    source: 'resume_parse',
    confidence: 85,
    isInferred: s.inferred ?? false,
  }));

  const expDocs = (parsed.experience ?? []).map((e) => ({
    company: e.company,
    role: e.role,
    startDate: e.startDate ? new Date(e.startDate) : undefined,
    endDate: e.endDate ? new Date(e.endDate) : undefined,
    current: e.current ?? false,
    description: e.description ?? '',
    technologies: e.technologies ?? [],
    location: e.location ?? '',
  }));

  const eduDocs = (parsed.education ?? []).map((e) => ({
    institution: e.institution,
    degree: e.degree ?? '',
    field: e.field ?? '',
    startYear: e.startYear,
    endYear: e.endYear,
    grade: e.grade ?? '',
  }));

  const certDocs = (parsed.certifications ?? []).map((c) => ({
    name: c.name,
    issuer: c.issuer ?? '',
    issueDate: c.issueDate ? new Date(c.issueDate) : undefined,
    expiryDate: c.expiryDate ? new Date(c.expiryDate) : undefined,
    credentialId: c.credentialId ?? '',
  }));

  if (existingEmployee) {
    // Merge: overwrite with fresh parse, keep existing data that wasn't extracted
    existingEmployee.name = parsed.name || existingEmployee.name;
    existingEmployee.title = parsed.title || existingEmployee.title;
    existingEmployee.summary = parsed.summary || existingEmployee.summary;
    existingEmployee.location = parsed.location || existingEmployee.location;
    existingEmployee.phone = parsed.phone || existingEmployee.phone;
    existingEmployee.totalYearsExperience = parsed.totalYearsExperience || existingEmployee.totalYearsExperience;
    if (skillDocs.length > 0) existingEmployee.skills = skillDocs;
    if (expDocs.length > 0) existingEmployee.experience = expDocs;
    if (eduDocs.length > 0) existingEmployee.education = eduDocs;
    if (certDocs.length > 0) existingEmployee.certifications = certDocs;
    existingEmployee.aiMetadata = {
      ...(existingEmployee.aiMetadata ?? {}),
      lastParsedAt: new Date(),
      parseModel: 'gemini-2.5-flash',
      overallConfidence: 85,
      aiTags: parsed.domainExpertise ?? [],
    };
    await existingEmployee.save();
    return { status: 'updated', employeeId: existingEmployee._id.toString(), name: existingEmployee.name };
  }

  const employee = await Employee.create({
    user: userDoc._id,
    name: parsed.name || email.split('@')[0],
    email,
    phone: parsed.phone ?? '',
    title: parsed.title ?? '',
    summary: parsed.summary ?? '',
    location: parsed.location ?? '',
    totalYearsExperience: parsed.totalYearsExperience ?? 0,
    skills: skillDocs,
    experience: expDocs,
    education: eduDocs,
    certifications: certDocs,
    aiMetadata: {
      lastParsedAt: new Date(),
      parseModel: 'gemini-2.5-flash',
      overallConfidence: 85,
      aiTags: parsed.domainExpertise ?? [],
    },
  });

  return { status: 'created', employeeId: employee._id.toString(), name: employee.name };
}

function mapCategory(raw) {
  const valid = ['Frontend', 'Backend', 'Database', 'Cloud', 'DevOps', 'Mobile', 'AI/ML', 'Design', 'Management', 'Security', 'Data', 'QA', 'Blockchain', 'Other'];
  return valid.includes(raw) ? raw : 'Other';
}

export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'hr') {
      return NextResponse.json({ error: 'HR access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('resumes');

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files per batch` }, { status: 400 });
    }

    await connectDB();

    const results = [];

    // Process sequentially to respect Anthropic rate limits
    for (const file of files) {
      const fileName = file.name ?? 'unknown.pdf';

      if (file.type !== 'application/pdf') {
        results.push({ fileName, status: 'error', reason: 'Not a PDF file' });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        results.push({ fileName, status: 'error', reason: 'File exceeds 10 MB limit' });
        continue;
      }

      if (file.size < 512) {
        results.push({ fileName, status: 'error', reason: 'File appears empty or corrupted' });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { text } = await extractTextFromPDF(buffer);

        if (!text || text.trim().length < 100) {
          results.push({ fileName, status: 'error', reason: 'Could not extract text — may be a scanned image' });
          continue;
        }

        const parsed = await parseResumeWithAI(text);

        if (parsed._extractionFailed) {
          results.push({ fileName, status: 'error', reason: parsed._fallbackReason ?? 'AI extraction failed' });
          continue;
        }

        const upsertResult = await upsertEmployee(parsed, user.id);
        results.push({ fileName, ...upsertResult });
      } catch (err) {
        results.push({ fileName, status: 'error', reason: err.message ?? 'Processing failed' });
      }
    }

    const summary = {
      total: results.length,
      created: results.filter((r) => r.status === 'created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
    };

    return NextResponse.json({ results, summary });
  } catch (error) {
    console.error('Bulk import error:', error);

    if (error?.message?.includes('credit') || error?.message?.includes('quota')) {
      return NextResponse.json({ error: 'API credits exhausted.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Bulk import failed. Please try again.' }, { status: 500 });
  }
}
