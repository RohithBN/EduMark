import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables. The application will not function correctly without it.");
  // Consider throwing an error in production to prevent startup
  // throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
}

interface DecodedToken {
  userId: string;
  // Add other fields you expect in your token payload, e.g., username, email
  role: Role; // Assuming role is part of your JWT payload
}

// Authentication verification helper function
async function verifyAuth(req: NextRequest): Promise<{ user?: DecodedToken; error?: NextResponse }> {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not available at runtime.");
    return { error: new NextResponse("Internal Server Configuration Error: JWT_SECRET missing", { status: 500 }) };
  }
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return { error: NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    // Basic check for essential properties
    if (!decoded.userId || !decoded.role) {
        console.error("Token missing essential fields (userId, role):", decoded);
        return { error: NextResponse.json({ message: "Unauthorized: Invalid token payload" }, { status: 401 }) };
    }
    return { user: decoded };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("JWT Error:", error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error("JWT Token Expired:", error.message);
    } else {
      console.error("Token verification error (unknown type):", error);
    }
    return { error: NextResponse.json({ message: "Unauthorized: Invalid or expired token" }, { status: 401 }) };
  }
}


// GET - Fetch all subjects
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return authResult.error;
  }
  // No role check for GET, assuming any authenticated user can view subjects
  // If only teachers/admins should view, add:
  // if (authResult.user?.role !== Role.TEACHER && authResult.user?.role !== Role.ADMIN) {
  //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // }

  try {
    const url = new URL(req.url);
    const teacherId = url.searchParams.get("teacherId");

    const subjects = await db.subject.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ message: "Failed to fetch subjects", error: error?.message }, { status: 500 });
  }
}

// POST - Create a new subject
export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return authResult.error;
  }

  if (!authResult.user || authResult.user.role !== Role.TEACHER) {
    return NextResponse.json({ message: "Forbidden: Only teachers can create subjects" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, code, credits } = body;

    if (!name || !code || credits === undefined || credits === null) {
      return NextResponse.json({ message: "Missing required fields: name, code, credits" }, { status: 400 });
    }

    const creditsNumber = typeof credits === "number" ? credits : parseInt(credits);
    if (isNaN(creditsNumber)) {
      return NextResponse.json({ message: "Credits must be a number" }, { status: 400 });
    }

    // Check for duplicate code
    const existingSubject = await db.subject.findUnique({
      where: { code }
    });
    if (existingSubject) {
      return NextResponse.json({ message: "Subject with this code already exists" }, { status: 409 });
    }

    const subject = await db.subject.create({
      data: {
        name,
        code,
        credits: creditsNumber,
        teacherId: authResult.user.userId, // Use authenticated user's ID
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    console.error("Error creating subject:", error);
    // Add more specific error handling if needed, e.g., Prisma errors
    return NextResponse.json({ message: "Failed to create subject", error: error?.message }, { status: 500 });
  }
}