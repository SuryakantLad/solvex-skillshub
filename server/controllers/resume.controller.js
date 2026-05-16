import Employee from '../models/Employee.js';
import { extractTextFromPDF } from '../services/resume/parser.js';
import { extractResumeData } from '../services/ai/extractor.js';
import { processBatch } from '../services/ai/utils.js';

export async function parseResume(req, res) {
  const startTime = Date.now();
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file provided' });
  if (file.size < 512) return res.status(400).json({ error: 'File appears to be empty or corrupted' });

  const { text, pages, wordCount, charCount } = await extractTextFromPDF(file.buffer);

  if (!text || text.trim().length < 100) {
    return res.status(422).json({ error: 'Could not extract text from PDF. Ensure the file is not a scanned image.' });
  }

  const parsed = await extractResumeData(text);
  const parseTimeMs = Date.now() - startTime;

  try {
    const employee = await Employee.findOne({ user: req.user.id });
    if (employee) {
      employee.aiMetadata = { ...(employee.aiMetadata || {}), resumeRawText: text.slice(0, 50000), lastParsedAt: new Date(), parseModel: 'gemini-2.5-flash', overallConfidence: 90, aiTags: parsed.domainExpertise || [] };
      await employee.save();
    }
  } catch {}

  return res.json({ success: true, data: parsed, metadata: { pages, wordCount, charCount, parseTimeMs, fileName: file.originalname, fileSize: file.size } });
}

export async function bulkImport(req, res) {
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ error: 'No files provided' });

  const results = { success: [], failed: [], total: files.length };

  const processFile = async (file) => {
    try {
      const { text } = await extractTextFromPDF(file.buffer);
      if (!text || text.trim().length < 100) throw new Error('Could not extract text from PDF');

      const parsed = await extractResumeData(text);
      if (!parsed.email && !parsed.name) throw new Error('Could not identify candidate');

      let employee = null;
      if (parsed.email) employee = await Employee.findOne({ email: parsed.email.toLowerCase() });

      const profileData = {
        name: parsed.name || file.originalname.replace('.pdf', ''),
        email: parsed.email || '',
        title: parsed.title || '',
        summary: parsed.summary || '',
        totalYearsExperience: parsed.totalYearsExperience || 0,
        skills: (parsed.skills || []).filter((s) => !s.inferred).map((s) => ({
          name: s.name, category: s.category || 'Other', proficiency: s.proficiency || 'intermediate',
          yearsOfExperience: s.yearsOfExperience || 0, source: 'resume_parse', confidence: 90,
        })),
        experience: parsed.experience || [],
        education: parsed.education || [],
        certifications: parsed.certifications || [],
        location: parsed.location || '',
        aiMetadata: { lastParsedAt: new Date(), parseModel: 'gemini-2.5-flash', overallConfidence: parsed._meta?.confidence || 80, resumeRawText: text.slice(0, 50000), aiTags: parsed.domainExpertise || [] },
      };

      if (employee) {
        Object.assign(employee, profileData);
        await employee.save();
        return { status: 'updated', name: profileData.name, email: profileData.email };
      } else {
        return { status: 'pending_review', name: profileData.name, email: profileData.email, data: profileData };
      }
    } catch (error) {
      return { status: 'failed', fileName: file.originalname, error: error.message };
    }
  };

  const batchResults = await processBatch(files, processFile, 3, 500);
  for (const result of batchResults) {
    if (result.status === 'fulfilled') {
      const val = result.value;
      if (val.status === 'failed') results.failed.push(val);
      else results.success.push(val);
    } else {
      results.failed.push({ status: 'failed', error: result.reason?.message });
    }
  }

  return res.json(results);
}
