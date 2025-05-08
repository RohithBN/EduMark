import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt"; // Changed from "@types/bcrypt"

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json(); // Changed username to name

    if (!email || !name || !password) { // Changed username to name
      return new NextResponse("Missing required fields (email, name, password)", { status: 400 }); // Changed username to name
    }

    if (password.length < 6) {
      return new NextResponse("Password must be at least 6 characters long", { status: 400 });
    }

    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return new NextResponse("User with this email already exists", { status: 409 });
    }

    // Assuming you want to check for existing user by name as well.
    // If your schema doesn't have a unique constraint on 'name', this might not be what you intend.
    // For now, I'm commenting this out as 'name' is usually not unique like 'username' or 'email'.
    // If 'name' should be unique, ensure your Prisma schema reflects that with @unique on the 'name' field.
    /*
    const existingUserByName = await db.user.findUnique({
      // where: { name }, // This would cause an error if 'name' is not a unique field in your User model
    });

    if (existingUserByName) {
      return new NextResponse("User with this name already exists", { status: 409 });
    }
    */

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name, // Changed username to name
        password: hashedPassword,
      },
    });

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error during registration:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}