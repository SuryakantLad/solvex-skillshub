import Employee from '../models/Employee.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listEmployees(req, res) {
  const { department, skill, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (department) filter.department = { $regex: escapeRegex(department), $options: 'i' };
  if (skill) filter['skills.name'] = { $regex: escapeRegex(skill), $options: 'i' };

  const [employees, total] = await Promise.all([
    Employee.find(filter).select('-aiMetadata.resumeRawText').sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Employee.countDocuments(filter),
  ]);

  return res.json({ employees, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
}

export async function getEmployee(req, res) {
  const { id } = req.params;
  const employee = await Employee.findById(id).select('-aiMetadata.resumeRawText').lean();
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  return res.json({ employee });
}

export async function updateEmployee(req, res) {
  const { id } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const isOwner = employee.user.toString() === req.user.id;
  const isHR = req.user.role === 'hr';
  if (!isOwner && !isHR) return res.status(403).json({ error: 'Not authorized to update this profile' });

  const PROTECTED = ['user', '_id', 'aiMetadata', 'analytics', 'approval'];
  for (const key of PROTECTED) delete req.body[key];

  Object.assign(employee, req.body);
  await employee.save();

  return res.json({ employee });
}

export async function getMyProfile(req, res) {
  const employee = await Employee.findOne({ user: req.user.id }).select('-aiMetadata.resumeRawText').lean();
  if (!employee) return res.status(404).json({ error: 'Employee profile not found' });
  return res.json({ employee });
}

export async function acceptInferredSkill(req, res) {
  const { id, skillId } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const isOwner = employee.user.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'hr') return res.status(403).json({ error: 'Not authorized' });

  const accepted = employee.acceptInferredSkill(skillId);
  if (!accepted) return res.status(400).json({ error: 'Skill not found or already reviewed' });

  await employee.save();
  return res.json({ success: true, employee });
}

export async function rejectInferredSkill(req, res) {
  const { id, skillId } = req.params;
  const employee = await Employee.findById(id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const isOwner = employee.user.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'hr') return res.status(403).json({ error: 'Not authorized' });

  const rejected = employee.rejectInferredSkill(skillId);
  if (!rejected) return res.status(400).json({ error: 'Skill not found or already reviewed' });

  await employee.save();
  return res.json({ success: true, employee });
}
