import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // This will prevent the server from starting if JWT_SECRET is not set.
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables. Please set it in your .env.local file.");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing required fields (email, password)" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email, role: user.role }, // Changed username to name, added role
      JWT_SECRET as string, // JWT_SECRET is guaranteed to be defined here due to the check above
      { expiresIn: "1d" } // Token expires in 1 day
    );

    (await cookies()).set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: '/',
    });
    
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: "Login successful", user: userWithoutPassword }, { status: 200 });

  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
