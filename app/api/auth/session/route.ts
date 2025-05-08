import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

interface DecodedToken {
  userId: string;
  name: string; // Changed from username to name
  email: string;
  role: string; // Added role to match token payload
  iat: number;
  exp: number;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }

    // Ensure JWT_SECRET is defined before use in jwt.verify
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined"); // Should have been caught by the top-level check
      return NextResponse.json({ message: "Internal Server Error: JWT_SECRET not configured" }, { status: 500 });
    }

    let decoded: DecodedToken;
    try {
      // Explicitly cast to unknown first if direct cast fails due to complex types
      decoded = jwt.verify(token, JWT_SECRET) as unknown as DecodedToken;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ message: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      // Ensure role is selected if it's needed by the client consuming the session
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true }, 
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized: User not found" }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
