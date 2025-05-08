import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function POST() {
  try {
    (await cookies()).set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1, // Expire the cookie immediately
      path: '/',
    });

    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch (error) {
    console.error("Error during logout:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
