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
      employee.aiMetadata = {
        ...(employee.aiMetadata || {}),
        resumeRawText: text.slice(0, 50000),
        lastParsedAt: new Date(),
        parseModel: 'gemini-2.5-flash',
        overallConfidence: parsed._meta?.confidence ?? 90,
        aiTags: parsed.domainExpertise || [],
      };
      await employee.save();
    }
  } catch {}

  return res.json({
    success: true,
    data: parsed,
    metadata: { pages, wordCount, charCount, parseTimeMs, fileName: file.originalname, fileSize: file.size },
  });
}

// Employee directly applies parsed (and optionally edited) resume data to their own profile
export async function applyResumeDirect(req, res) {
  const employee = await Employee.findOne({ user: req.user.id });
  if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

  const { title, summary, skills, experience, education, certifications, totalYearsExperience } = req.body;

  if (title) employee.title = title;
  if (summary) employee.summary = summary;
  if (totalYearsExperience > 0) employee.totalYearsExperience = totalYearsExperience;

  if (Array.isArray(skills) && skills.length > 0) {
    const existingNames = new Set(employee.skills.map((s) => s.name.toLowerCase()));
    for (const skill of skills) {
      if (!existingNames.has(skill.name.toLowerCase())) {
        employee.skills.push({
          name: skill.name,
          category: skill.category || 'Other',
          proficiency: skill.proficiency || 'intermediate',
          yearsOfExperience: skill.yearsOfExperience || 0,
          source: 'resume_parse',
          confidence: skill.confidence || 90,
        });
        existingNames.add(skill.name.toLowerCase());
      } else {
        const existing = employee.skills.find((s) => s.name.toLowerCase() === skill.name.toLowerCase());
        if (existing && skill.proficiency) existing.proficiency = skill.proficiency;
      }
    }
  }

  if (Array.isArray(experience) && experience.length > 0) employee.experience = experience;
  if (Array.isArray(education) && education.length > 0) employee.education = education;
  if (Array.isArray(certifications) && certifications.length > 0) employee.certifications = certifications;

  await employee.save();
  return res.json({ success: true, employee });
}

// Employee submits parsed resume data for HR review
export async function submitResumeReview(req, res) {
  const employee = await Employee.findOne({ user: req.user.id });
  if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

  const { title, summary, skills, experience, education, certifications, totalYearsExperience, domainExpertise, fileName, confidence } = req.body;

  employee.pendingResumeData = {
    title, summary, skills, experience, education, certifications,
    totalYearsExperience, domainExpertise, fileName, confidence,
    submittedAt: new Date(),
  };
  employee.approval.status = 'pending_review';
  employee.approval.submittedAt = new Date();

  await employee.save();
  return res.json({ success: true, message: 'Resume submitted for HR review' });
}

// HR: list all employees with a pending resume review
export async function listResumeReviews(req, res) {
  const employees = await Employee.find({
    isDeleted: false,
    'approval.status': 'pending_review',
    pendingResumeData: { $ne: null },
  })
    .select('name email title department profileCompleteness pendingResumeData approval')
    .sort({ 'approval.submittedAt': -1 })
    .lean();

  return res.json({ reviews: employees, total: employees.length });
}

// HR: approve a review — applies parsed data to the real profile
export async function approveResumeReview(req, res) {
  const { id } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  if (!employee.pendingResumeData) return res.status(400).json({ error: 'No pending review for this employee' });

  const d = employee.pendingResumeData;

  if (d.title) employee.title = d.title;
  if (d.summary) employee.summary = d.summary;
  if (d.totalYearsExperience > 0) employee.totalYearsExperience = d.totalYearsExperience;

  if (Array.isArray(d.skills) && d.skills.length > 0) {
    const existingNames = new Set(employee.skills.map((s) => s.name.toLowerCase()));
    for (const skill of d.skills) {
      if (!existingNames.has(skill.name.toLowerCase())) {
        employee.skills.push({ name: skill.name, category: skill.category || 'Other', proficiency: skill.proficiency || 'intermediate', yearsOfExperience: skill.yearsOfExperience || 0, source: 'resume_parse', confidence: skill.confidence || 90 });
        existingNames.add(skill.name.toLowerCase());
      }
    }
  }
  if (Array.isArray(d.experience) && d.experience.length > 0) employee.experience = d.experience;
  if (Array.isArray(d.education) && d.education.length > 0) employee.education = d.education;
  if (Array.isArray(d.certifications) && d.certifications.length > 0) employee.certifications = d.certifications;

  employee.pendingResumeData = null;
  employee.approval.status = 'approved';
  employee.approval.reviewedBy = req.user.id;
  employee.approval.reviewedAt = new Date();
  employee.approval.reviewNotes = req.body.notes || '';

  await employee.save();
  return res.json({ success: true, employee });
}

// HR: reject a review
export async function rejectResumeReview(req, res) {
  const { id } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  employee.pendingResumeData = null;
  employee.approval.status = 'rejected';
  employee.approval.reviewedBy = req.user.id;
  employee.approval.reviewedAt = new Date();
  employee.approval.reviewNotes = req.body.notes || '';

  await employee.save();
  return res.json({ success: true });
}

// HR: edit parsed data inline then approve
export async function editApproveResumeReview(req, res) {
  const { id } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const { title, summary, skills, experience, education, certifications, totalYearsExperience, notes } = req.body;

  if (title !== undefined) employee.title = title;
  if (summary !== undefined) employee.summary = summary;
  if (totalYearsExperience !== undefined) employee.totalYearsExperience = totalYearsExperience;
  if (Array.isArray(skills) && skills.length > 0) {
    employee.skills = skills.map((s) => ({ name: s.name, category: s.category || 'Other', proficiency: s.proficiency || 'intermediate', yearsOfExperience: s.yearsOfExperience || 0, source: 'resume_parse', confidence: s.confidence || 90 }));
  }
  if (Array.isArray(experience) && experience.length > 0) employee.experience = experience;
  if (Array.isArray(education) && education.length > 0) employee.education = education;
  if (Array.isArray(certifications) && certifications.length > 0) employee.certifications = certifications;

  employee.pendingResumeData = null;
  employee.approval.status = 'approved';
  employee.approval.reviewedBy = req.user.id;
  employee.approval.reviewedAt = new Date();
  employee.approval.reviewNotes = notes || '';

  await employee.save();
  return res.json({ success: true, employee });
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
