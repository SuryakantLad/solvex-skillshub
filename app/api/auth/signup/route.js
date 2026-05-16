import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/db/models/User';
import Employee from '@/lib/db/models/Employee';
import { signToken } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/cookies';

export async function POST(request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['hr', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true,
    });

    // Create an Employee profile for employee-role users
    if (role === 'employee') {
      await Employee.create({
        user: user._id,
        name: user.name,
        email: user.email,
        title: '',
        department: '',
        skills: [],
        approvalStatus: { status: 'draft' },
      });
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || '',
    };

    const token = await signToken(tokenPayload);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        user: tokenPayload,
        redirectTo: role === 'hr' ? '/hr' : '/employee',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
  }
}
