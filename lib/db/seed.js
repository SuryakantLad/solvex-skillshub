/**
 * lib/db/seed.js
 * Seed utilities for TalentGraph AI.
 *
 * Usage (dev / test only):
 *   import { seedDatabase, clearDatabase, SEED_EMPLOYEES } from '@/lib/db/seed';
 *
 *   // Via API route (see app/api/seed/route.js):
 *   POST /api/seed
 */

import connectDB from '@/lib/mongodb';
import User from './models/User';
import Employee from './models/Employee';
import Skill from './models/Skill';

// ─────────────────────────────────────────────────────────────────────────────
// Example Seed Document — Alice Chen (full schema demonstration)
// Copy this pattern for every seed employee.
// ─────────────────────────────────────────────────────────────────────────────
export const EXAMPLE_EMPLOYEE_DOCUMENT = {
  // ── User record (separate collection) ─────────────────────────────────────
  user: {
    name: 'Alice Chen',
    email: 'alice.chen@company.com',
    password: 'Password123!',
    role: 'employee',
    avatar: '',
    onboardingComplete: true,
    preferences: {
      emailNotifications: true,
      theme: 'dark',
    },
  },

  // ── Employee profile (Employee collection) ─────────────────────────────────
  profile: {
    // Personal
    name: 'Alice Chen',
    email: 'alice.chen@company.com',
    phone: '+1 (415) 555-0182',
    location: 'San Francisco, CA',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    avatar: '',
    linkedIn: 'https://linkedin.com/in/alicechen',
    github: 'https://github.com/alicechen',
    website: 'https://alicechen.dev',

    // Role
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    team: 'Platform',
    employeeId: 'ENG-0042',
    status: 'active',
    workType: 'full_time',
    startDate: new Date('2021-03-01'),

    // Bio
    totalYearsExperience: 7,
    summary:
      'Senior frontend engineer with 7 years building high-performance ' +
      'React applications. Deep expertise in TypeScript, design systems, ' +
      'and performance optimization. Passionate about developer experience ' +
      'and accessible UI.',

    // Verified skills
    skills: [
      { name: 'React', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 6, source: 'manual', confidence: 100 },
      { name: 'TypeScript', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 5, source: 'manual', confidence: 100 },
      { name: 'Next.js', category: 'Frontend', proficiency: 'advanced', yearsOfExperience: 4, source: 'resume_parse', confidence: 95 },
      { name: 'GraphQL', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 3, source: 'manual', confidence: 100 },
      { name: 'Tailwind CSS', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 3, source: 'manual', confidence: 100 },
      { name: 'Node.js', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2, source: 'resume_parse', confidence: 88 },
      { name: 'AWS', category: 'Cloud', proficiency: 'intermediate', yearsOfExperience: 2, source: 'resume_parse', confidence: 82 },
      { name: 'Jest', category: 'QA', proficiency: 'advanced', yearsOfExperience: 5, source: 'manual', confidence: 100 },
      { name: 'Figma', category: 'Design', proficiency: 'intermediate', yearsOfExperience: 2, source: 'ai_inferred', confidence: 75 },
    ],

    // AI-suggested skills pending review
    inferredSkills: [
      { name: 'Storybook', category: 'Frontend', confidence: 80, source: 'resume_parse', status: 'pending' },
      { name: 'Webpack', category: 'Frontend', confidence: 72, source: 'ai_inferred', status: 'pending' },
      { name: 'Playwright', category: 'QA', confidence: 68, source: 'ai_inferred', status: 'accepted' },
    ],

    // Work history
    experience: [
      {
        company: 'Stripe',
        role: 'Senior Frontend Engineer',
        employmentType: 'full_time',
        startDate: new Date('2021-03-01'),
        current: true,
        location: 'San Francisco, CA',
        description:
          'Led frontend architecture for the merchant payment dashboard ' +
          'serving 2M+ businesses. Reduced bundle size by 40% through code ' +
          'splitting and tree-shaking initiatives.',
        achievements: [
          'Reduced dashboard LCP from 4.2 s to 1.8 s',
          'Mentored 4 junior engineers across two teams',
          'Introduced component library adopted by 6 product squads',
        ],
        technologies: ['React', 'TypeScript', 'GraphQL', 'Tailwind CSS', 'Jest'],
        teamSize: 8,
      },
      {
        company: 'Airbnb',
        role: 'Frontend Engineer',
        employmentType: 'full_time',
        startDate: new Date('2018-06-01'),
        endDate: new Date('2021-02-28'),
        current: false,
        location: 'San Francisco, CA',
        description:
          'Built search experience and host onboarding flows. ' +
          'Owned the accessibility audit initiative that brought the main ' +
          'booking flow to WCAG 2.1 AA compliance.',
        achievements: [
          'Improved booking conversion by 12% via UX iteration',
          'Delivered WCAG 2.1 AA compliance for booking flow',
        ],
        technologies: ['React', 'Redux', 'Jest', 'CSS Modules'],
        teamSize: 12,
      },
    ],

    // Projects
    projects: [
      {
        name: 'react-a11y-audit',
        description:
          'Open-source CLI tool that audits React component trees for ' +
          'accessibility issues using axe-core.',
        role: 'Creator & Maintainer',
        status: 'active',
        startDate: new Date('2020-04-01'),
        current: true,
        technologies: ['TypeScript', 'React', 'axe-core', 'CLI'],
        teamSize: 1,
        impact: '2,400 GitHub stars · 800 weekly npm downloads',
        url: 'https://react-a11y-audit.dev',
        repoUrl: 'https://github.com/alicechen/react-a11y-audit',
        highlights: ['Featured in React Newsletter #312', 'Used by 60+ companies'],
      },
    ],

    // Certifications
    certifications: [
      {
        name: 'AWS Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2022-05-15'),
        expiryDate: new Date('2025-05-15'),
        credentialId: 'AWS-SAA-C03-12345',
        url: 'https://www.credly.com/badges/aws-saa',
        isVerified: true,
      },
    ],

    // Education
    education: [
      {
        institution: 'University of California, Berkeley',
        degree: "Bachelor's",
        field: 'Computer Science',
        startYear: 2013,
        endYear: 2017,
        grade: '3.8 / 4.0',
        honors: 'Magna Cum Laude',
        activities: ['ACM Club President', 'HackBerkeley Organizer'],
      },
    ],

    // Availability
    availability: {
      isAvailable: false,
      noticePeriodDays: 30,
      preferredWorkType: 'full_time',
      openTo: ['promotion', 'lateral_transfer'],
      preferredRoles: ['Staff Engineer', 'Engineering Manager'],
      remotePreference: 'hybrid',
    },

    // AI metadata (populated after a resume parse)
    aiMetadata: {
      lastParsedAt: new Date('2024-11-20T10:32:00Z'),
      parseModel: 'gemini-2.5-flash',
      parseVersion: '2',
      overallConfidence: 94,
      aiSummary:
        'Highly skilled frontend engineer with a strong track record at ' +
        'high-growth companies. Demonstrates deep expertise in React ' +
        'ecosystem and a secondary strength in accessibility.',
      parseHistory: [
        { parsedAt: new Date('2024-11-20T10:32:00Z'), model: 'gemini-2.5-flash', confidence: 94, skillsExtracted: 9 },
        { parsedAt: new Date('2024-03-10T08:15:00Z'), model: 'gemini-2.5-flash', confidence: 87, skillsExtracted: 7 },
      ],
      aiTags: ['frontend', 'react', 'typescript', 'design-system', 'senior'],
    },

    // HR approval
    approval: {
      status: 'approved',
      autoApproved: false,
      submittedAt: new Date('2024-11-20T10:35:00Z'),
      reviewedAt: new Date('2024-11-21T09:00:00Z'),
      reviewNotes: 'Profile verified against HRIS. All certifications confirmed.',
    },

    // Analytics
    analytics: {
      profileViews: 47,
      searchAppearances: 112,
      lastViewedAt: new Date(),
      lastActiveAt: new Date(),
    },

    tags: ['react', 'frontend', 'typescript', 'senior', 'san-francisco'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Seed Data Arrays
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_HR_USERS = [
  {
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@company.com',
    password: 'Password123!',
    role: 'hr',
    onboardingComplete: true,
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    password: 'Password123!',
    role: 'hr',
    onboardingComplete: true,
  },
];

export const SEED_EMPLOYEES = [
  {
    user: { name: 'Alice Chen', email: 'alice.chen@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Senior Frontend Engineer', department: 'Engineering', location: 'San Francisco, CA',
      totalYearsExperience: 7, status: 'active', workType: 'full_time',
      summary: 'Senior frontend engineer with 7 years building high-performance React applications at Stripe and Airbnb.',
      skills: [
        { name: 'React', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 6 },
        { name: 'TypeScript', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'Next.js', category: 'Frontend', proficiency: 'advanced', yearsOfExperience: 4 },
        { name: 'GraphQL', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'Tailwind CSS', category: 'Frontend', proficiency: 'expert', yearsOfExperience: 3 },
        { name: 'Node.js', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2 },
        { name: 'AWS', category: 'Cloud', proficiency: 'intermediate', yearsOfExperience: 2 },
        { name: 'Jest', category: 'QA', proficiency: 'advanced', yearsOfExperience: 5 },
      ],
      experience: [
        { company: 'Stripe', role: 'Senior Frontend Engineer', startDate: new Date('2021-03-01'), current: true, technologies: ['React', 'TypeScript', 'GraphQL'] },
        { company: 'Airbnb', role: 'Frontend Engineer', startDate: new Date('2018-06-01'), endDate: new Date('2021-02-28'), technologies: ['React', 'Redux'] },
      ],
      certifications: [{ name: 'AWS Solutions Architect Associate', issuer: 'Amazon Web Services', issueDate: new Date('2022-05-15') }],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: false, openTo: ['promotion'], noticePeriodDays: 30 },
      tags: ['react', 'frontend', 'typescript', 'senior'],
    },
  },
  {
    user: { name: 'Bob Martinez', email: 'bob.martinez@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Full Stack Engineer', department: 'Engineering', location: 'Austin, TX',
      totalYearsExperience: 5, status: 'active', workType: 'full_time',
      summary: 'Full stack engineer specializing in scalable Node.js APIs and React frontends with AWS cloud experience.',
      skills: [
        { name: 'Node.js', category: 'Backend', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'Python', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 4 },
        { name: 'React', category: 'Frontend', proficiency: 'advanced', yearsOfExperience: 4 },
        { name: 'PostgreSQL', category: 'Database', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'AWS', category: 'Cloud', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'Docker', category: 'DevOps', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'Redis', category: 'Database', proficiency: 'intermediate', yearsOfExperience: 2 },
      ],
      experience: [
        { company: 'Shopify', role: 'Full Stack Engineer', startDate: new Date('2022-01-01'), current: true, technologies: ['Node.js', 'React', 'PostgreSQL'] },
        { company: 'HubSpot', role: 'Backend Engineer', startDate: new Date('2019-07-01'), endDate: new Date('2021-12-31'), technologies: ['Python', 'PostgreSQL'] },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: true, openTo: ['new_role', 'promotion'], noticePeriodDays: 14 },
      tags: ['fullstack', 'node', 'python', 'aws'],
    },
  },
  {
    user: { name: 'Carol Johnson', email: 'carol.johnson@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'ML Engineer', department: 'AI/Data', location: 'New York, NY',
      totalYearsExperience: 6, status: 'active', workType: 'full_time',
      summary: 'Machine learning engineer with deep NLP expertise. Previously at OpenAI and Google Brain. Certified TensorFlow developer.',
      skills: [
        { name: 'Python', category: 'Backend', proficiency: 'expert', yearsOfExperience: 6 },
        { name: 'TensorFlow', category: 'AI/ML', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'PyTorch', category: 'AI/ML', proficiency: 'expert', yearsOfExperience: 4 },
        { name: 'NLP', category: 'AI/ML', proficiency: 'advanced', yearsOfExperience: 4 },
        { name: 'LLM Fine-tuning', category: 'AI/ML', proficiency: 'advanced', yearsOfExperience: 2 },
        { name: 'Kubernetes', category: 'DevOps', proficiency: 'intermediate', yearsOfExperience: 2 },
        { name: 'SQL', category: 'Database', proficiency: 'advanced', yearsOfExperience: 5 },
      ],
      experience: [
        { company: 'OpenAI', role: 'ML Engineer', startDate: new Date('2022-04-01'), current: true, technologies: ['Python', 'PyTorch'] },
        { company: 'Google', role: 'Software Engineer – ML', startDate: new Date('2018-09-01'), endDate: new Date('2022-03-31'), technologies: ['TensorFlow', 'Python'] },
      ],
      certifications: [
        { name: 'TensorFlow Developer Certificate', issuer: 'Google', issueDate: new Date('2020-03-01') },
        { name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', issueDate: new Date('2019-06-01') },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: false, openTo: ['advisory'], noticePeriodDays: 60 },
      tags: ['ml', 'nlp', 'python', 'llm', 'senior'],
    },
  },
  {
    user: { name: 'David Park', email: 'david.park@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Senior DevOps Engineer', department: 'Infrastructure', location: 'Seattle, WA',
      totalYearsExperience: 8, status: 'active', workType: 'full_time',
      summary: 'Senior DevOps engineer with 8 years managing cloud-native infrastructure at Netflix and Amazon. CKA and AWS Pro certified.',
      skills: [
        { name: 'Kubernetes', category: 'DevOps', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'Docker', category: 'DevOps', proficiency: 'expert', yearsOfExperience: 7 },
        { name: 'Terraform', category: 'DevOps', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'AWS', category: 'Cloud', proficiency: 'expert', yearsOfExperience: 8 },
        { name: 'CI/CD', category: 'DevOps', proficiency: 'expert', yearsOfExperience: 7 },
        { name: 'Python', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 5 },
        { name: 'Go', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2 },
        { name: 'Prometheus', category: 'DevOps', proficiency: 'advanced', yearsOfExperience: 4 },
      ],
      experience: [
        { company: 'Netflix', role: 'Senior DevOps Engineer', startDate: new Date('2020-08-01'), current: true, technologies: ['Kubernetes', 'AWS', 'Terraform'] },
        { company: 'Amazon', role: 'Cloud Infrastructure Engineer', startDate: new Date('2015-06-01'), endDate: new Date('2020-07-31'), technologies: ['AWS', 'Docker', 'Python'] },
      ],
      certifications: [
        { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', issueDate: new Date('2021-02-01') },
        { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', issueDate: new Date('2021-08-01') },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: true, openTo: ['new_role', 'promotion'], noticePeriodDays: 30 },
      tags: ['devops', 'kubernetes', 'aws', 'terraform', 'senior'],
    },
  },
  {
    user: { name: 'Emma Wilson', email: 'emma.wilson@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Lead Product Designer', department: 'Design', location: 'London, UK',
      totalYearsExperience: 6, status: 'active', workType: 'full_time',
      summary: 'Lead product designer creating intuitive experiences for complex enterprise software. Expert in design systems and user research.',
      skills: [
        { name: 'Figma', category: 'Design', proficiency: 'expert', yearsOfExperience: 5 },
        { name: 'UX Research', category: 'Design', proficiency: 'expert', yearsOfExperience: 6 },
        { name: 'Prototyping', category: 'Design', proficiency: 'expert', yearsOfExperience: 6 },
        { name: 'CSS', category: 'Frontend', proficiency: 'advanced', yearsOfExperience: 5 },
        { name: 'Design Systems', category: 'Design', proficiency: 'expert', yearsOfExperience: 4 },
        { name: 'React', category: 'Frontend', proficiency: 'intermediate', yearsOfExperience: 2 },
        { name: 'Motion Design', category: 'Design', proficiency: 'advanced', yearsOfExperience: 3 },
      ],
      experience: [
        { company: 'Linear', role: 'Lead Product Designer', startDate: new Date('2021-05-01'), current: true, technologies: ['Figma', 'React'] },
        { company: 'Intercom', role: 'Product Designer', startDate: new Date('2018-02-01'), endDate: new Date('2021-04-30'), technologies: ['Figma', 'CSS'] },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: true, openTo: ['new_role', 'lateral_transfer'], noticePeriodDays: 28 },
      tags: ['design', 'ux', 'figma', 'design-systems', 'senior'],
    },
  },
  {
    user: { name: 'Frank Thomas', email: 'frank.thomas@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Senior Backend Engineer', department: 'Engineering', location: 'Chicago, IL',
      totalYearsExperience: 10, status: 'active', workType: 'full_time',
      summary: 'Experienced backend engineer with 10 years in Java and distributed systems. Strong background in financial technology.',
      skills: [
        { name: 'Java', category: 'Backend', proficiency: 'expert', yearsOfExperience: 10 },
        { name: 'Spring Boot', category: 'Backend', proficiency: 'expert', yearsOfExperience: 8 },
        { name: 'PostgreSQL', category: 'Database', proficiency: 'expert', yearsOfExperience: 9 },
        { name: 'Microservices', category: 'Backend', proficiency: 'expert', yearsOfExperience: 6 },
        { name: 'Kafka', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 4 },
        { name: 'AWS', category: 'Cloud', proficiency: 'advanced', yearsOfExperience: 5 },
        { name: 'Kotlin', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2 },
      ],
      experience: [
        { company: 'JPMorgan Chase', role: 'Senior Backend Engineer', startDate: new Date('2019-01-01'), current: true, technologies: ['Java', 'Spring Boot', 'Kafka'] },
        { company: 'IBM', role: 'Software Engineer', startDate: new Date('2014-06-01'), endDate: new Date('2018-12-31'), technologies: ['Java', 'PostgreSQL'] },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: false, openTo: ['promotion'], noticePeriodDays: 60 },
      tags: ['java', 'backend', 'microservices', 'fintech', 'senior'],
    },
  },
  {
    user: { name: 'Grace Lee', email: 'grace.lee@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Mobile Engineer', department: 'Engineering', location: 'Los Angeles, CA',
      totalYearsExperience: 4, status: 'active', workType: 'full_time',
      summary: 'Mobile engineer building consumer-facing apps with millions of users. Strong in React Native and native iOS Swift.',
      skills: [
        { name: 'React Native', category: 'Mobile', proficiency: 'expert', yearsOfExperience: 4 },
        { name: 'Swift', category: 'Mobile', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'TypeScript', category: 'Frontend', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'iOS', category: 'Mobile', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'Firebase', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 3 },
        { name: 'GraphQL', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 2 },
      ],
      experience: [
        { company: 'Duolingo', role: 'Mobile Engineer', startDate: new Date('2022-06-01'), current: true, technologies: ['React Native', 'Swift'] },
        { company: 'Uber', role: 'Mobile Engineer', startDate: new Date('2020-09-01'), endDate: new Date('2022-05-31'), technologies: ['React Native', 'TypeScript'] },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: true, openTo: ['new_role', 'promotion'], noticePeriodDays: 14 },
      tags: ['mobile', 'react-native', 'swift', 'ios', 'mid-level'],
    },
  },
  {
    user: { name: 'Henry Brown', email: 'henry.brown@company.com', password: 'Password123!', role: 'employee' },
    profile: {
      title: 'Principal Cloud Architect', department: 'Infrastructure', location: 'Denver, CO',
      totalYearsExperience: 12, status: 'active', workType: 'full_time',
      summary: 'Multi-cloud architect with 12 years designing enterprise cloud solutions. Triple-certified across AWS, Azure, and GCP.',
      skills: [
        { name: 'AWS', category: 'Cloud', proficiency: 'expert', yearsOfExperience: 12 },
        { name: 'Azure', category: 'Cloud', proficiency: 'expert', yearsOfExperience: 8 },
        { name: 'GCP', category: 'Cloud', proficiency: 'advanced', yearsOfExperience: 5 },
        { name: 'Terraform', category: 'DevOps', proficiency: 'expert', yearsOfExperience: 7 },
        { name: 'Security', category: 'Security', proficiency: 'advanced', yearsOfExperience: 8 },
        { name: 'Python', category: 'Backend', proficiency: 'advanced', yearsOfExperience: 6 },
        { name: 'Architecture Design', category: 'Management', proficiency: 'expert', yearsOfExperience: 8 },
      ],
      experience: [
        { company: 'Microsoft', role: 'Principal Cloud Architect', startDate: new Date('2018-03-01'), current: true, technologies: ['Azure', 'AWS', 'Terraform'] },
        { company: 'Accenture', role: 'Cloud Solutions Architect', startDate: new Date('2012-09-01'), endDate: new Date('2018-02-28'), technologies: ['AWS', 'GCP'] },
      ],
      certifications: [
        { name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', issueDate: new Date('2020-01-01') },
        { name: 'Azure Solutions Architect Expert', issuer: 'Microsoft', issueDate: new Date('2020-06-01') },
        { name: 'Google Professional Cloud Architect', issuer: 'Google', issueDate: new Date('2021-03-01') },
      ],
      approval: { status: 'approved', autoApproved: true },
      availability: { isAvailable: false, openTo: ['advisory'], noticePeriodDays: 90 },
      tags: ['cloud', 'aws', 'azure', 'gcp', 'architect', 'principal'],
    },
  },
];

/** A curated set of skills to pre-populate the global skills catalog */
export const SEED_SKILLS_CATALOG = [
  { name: 'react', slug: 'react', displayName: 'React', category: 'Frontend', aliases: ['reactjs', 'react.js'], isVerified: true, usageCount: 8, trend: 'growing' },
  { name: 'typescript', slug: 'typescript', displayName: 'TypeScript', category: 'Frontend', aliases: ['ts'], isVerified: true, usageCount: 7, trend: 'growing' },
  { name: 'next.js', slug: 'next-js', displayName: 'Next.js', category: 'Frontend', aliases: ['nextjs'], isVerified: true, usageCount: 5, trend: 'growing' },
  { name: 'node.js', slug: 'node-js', displayName: 'Node.js', category: 'Backend', aliases: ['nodejs', 'node'], isVerified: true, usageCount: 6, trend: 'stable' },
  { name: 'python', slug: 'python', displayName: 'Python', category: 'Backend', aliases: ['py'], isVerified: true, usageCount: 6, trend: 'growing' },
  { name: 'aws', slug: 'aws', displayName: 'AWS', category: 'Cloud', aliases: ['amazon web services'], isVerified: true, usageCount: 8, trend: 'growing' },
  { name: 'kubernetes', slug: 'kubernetes', displayName: 'Kubernetes', category: 'DevOps', aliases: ['k8s'], isVerified: true, usageCount: 4, trend: 'growing' },
  { name: 'docker', slug: 'docker', displayName: 'Docker', category: 'DevOps', aliases: [], isVerified: true, usageCount: 5, trend: 'stable' },
  { name: 'postgresql', slug: 'postgresql', displayName: 'PostgreSQL', category: 'Database', aliases: ['postgres', 'pg'], isVerified: true, usageCount: 5, trend: 'stable' },
  { name: 'graphql', slug: 'graphql', displayName: 'GraphQL', category: 'Backend', aliases: [], isVerified: true, usageCount: 4, trend: 'stable' },
  { name: 'terraform', slug: 'terraform', displayName: 'Terraform', category: 'DevOps', aliases: [], isVerified: true, usageCount: 4, trend: 'growing' },
  { name: 'java', slug: 'java', displayName: 'Java', category: 'Backend', aliases: [], isVerified: true, usageCount: 3, trend: 'stable' },
  { name: 'react native', slug: 'react-native', displayName: 'React Native', category: 'Mobile', aliases: ['rn'], isVerified: true, usageCount: 2, trend: 'stable' },
  { name: 'swift', slug: 'swift', displayName: 'Swift', category: 'Mobile', aliases: [], isVerified: true, usageCount: 2, trend: 'stable' },
  { name: 'figma', slug: 'figma', displayName: 'Figma', category: 'Design', aliases: [], isVerified: true, usageCount: 3, trend: 'growing' },
  { name: 'pytorch', slug: 'pytorch', displayName: 'PyTorch', category: 'AI/ML', aliases: [], isVerified: true, usageCount: 2, trend: 'growing' },
  { name: 'tensorflow', slug: 'tensorflow', displayName: 'TensorFlow', category: 'AI/ML', aliases: [], isVerified: true, usageCount: 2, trend: 'stable' },
  { name: 'azure', slug: 'azure', displayName: 'Azure', category: 'Cloud', aliases: ['microsoft azure'], isVerified: true, usageCount: 2, trend: 'growing' },
  { name: 'gcp', slug: 'gcp', displayName: 'GCP', category: 'Cloud', aliases: ['google cloud', 'google cloud platform'], isVerified: true, usageCount: 2, trend: 'growing' },
  { name: 'kafka', slug: 'kafka', displayName: 'Apache Kafka', category: 'Backend', aliases: ['apache kafka'], isVerified: true, usageCount: 2, trend: 'stable' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seeder Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * clearDatabase()
 * Deletes all documents from User, Employee, and Skill collections.
 * DEV / TEST ONLY.
 */
export async function clearDatabase() {
  await connectDB();
  const results = await Promise.allSettled([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Skill.deleteMany({}),
  ]);
  const counts = results.map((r) => (r.status === 'fulfilled' ? r.value.deletedCount : 0));
  return { users: counts[0], employees: counts[1], skills: counts[2] };
}

/**
 * seedDatabase()
 * Wipes and re-seeds all collections with demo data.
 * Returns a summary of what was created.
 * DEV / TEST ONLY.
 */
export async function seedDatabase() {
  await connectDB();

  // Clear first
  await clearDatabase();

  // ── HR Users ────────────────────────────────────────────────────────────────
  const hrUsers = [];
  for (const hrData of SEED_HR_USERS) {
    const u = await User.create(hrData);
    hrUsers.push(u);
  }

  // ── Employee Users + Profiles ───────────────────────────────────────────────
  const createdEmployees = [];
  for (const seedEntry of SEED_EMPLOYEES) {
    const user = await User.create(seedEntry.user);
    const employee = new Employee({
      user: user._id,
      name: user.name,
      email: user.email,
      ...seedEntry.profile,
    });
    employee.calculateCompleteness();
    await employee.save();
    createdEmployees.push(employee);
  }

  // ── Skills Catalog ──────────────────────────────────────────────────────────
  const insertedSkills = await Skill.insertMany(SEED_SKILLS_CATALOG, { ordered: false });

  return {
    hrUsers: hrUsers.length,
    employees: createdEmployees.length,
    skills: insertedSkills.length,
    credentials: {
      hr: { email: SEED_HR_USERS[0].email, password: 'Password123!' },
      employee: { email: SEED_EMPLOYEES[0].user.email, password: 'Password123!' },
    },
  };
}
