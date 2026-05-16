import User from '../models/User.js';
import Employee from '../models/Employee.js';

export async function seedDatabase(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Seeding is not allowed in production' });
  }

  const { action = 'seed' } = req.body;

  if (action === 'clear') {
    await Promise.all([
      Employee.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } }),
    ]);
    return res.json({ success: true, message: 'Database cleared (admin users preserved)' });
  }

  const existingCount = await Employee.countDocuments();
  if (existingCount > 0) {
    return res.json({ success: false, message: `Database already has ${existingCount} employees. Clear first if you want to re-seed.` });
  }

  const { SEED_EMPLOYEES } = await import('../services/seed.js');

  let created = 0;
  for (const seed of SEED_EMPLOYEES) {
    try {
      const existing = await User.findOne({ email: seed.user.email });
      if (existing) continue;

      const user = await User.create(seed.user);
      await Employee.create({ ...seed.profile, user: user._id });
      created++;
    } catch (err) {
      console.error(`Failed to seed ${seed.user.email}:`, err.message);
    }
  }

  return res.json({ success: true, message: `Seeded ${created} employees`, created });
}

export async function getSeedStatus(req, res) {
  const [userCount, employeeCount] = await Promise.all([User.countDocuments(), Employee.countDocuments()]);
  return res.json({ users: userCount, employees: employeeCount });
}
