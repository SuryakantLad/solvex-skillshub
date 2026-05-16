import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/db/models/User';
import { signToken } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/cookies';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account has been deactivated' }, { status: 403 });
    }

    if (user.isLocked) {
      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Try again later.' },
        { status: 423 }
      );
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      await user.incrementLoginAttempts();
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await user.resetLoginAttempts();

    user.lastLoginAt = new Date();
    const forwarded = request.headers.get('x-forwarded-for');
    user.lastLoginIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    await user.save();

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar || '',
    };

    const token = await signToken(tokenPayload);
    await setAuthCookie(token);

    return NextResponse.json({
      user: tokenPayload,
      redirectTo: user.role === 'hr' ? '/hr' : '/employee',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
