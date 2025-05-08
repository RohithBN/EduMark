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
  role: Role;
  // Add other fields you expect in your token payload, e.g., username, email
}

// Authentication verification helper function
async function verifyAuth(req: NextRequest): Promise<{ user?: DecodedToken; error?: NextResponse }> {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not available at runtime.");
    return { error: NextResponse.json({ message: "Internal Server Configuration Error: JWT_SECRET missing" }, { status: 500 }) };
  }
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return { error: NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
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

// GET - Fetch marks (can filter by subject or student)
export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return authResult.error;
  }
  // Assuming any authenticated user can view marks.
  // Add role checks if needed:
  // if (authResult.user?.role !== Role.TEACHER && authResult.user?.role !== Role.ADMIN) {
  //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // }
  console.log("GET /api/marks: Authenticated user ID:", authResult.user?.userId, "Role:", authResult.user?.role);

  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");
    const studentId = url.searchParams.get("studentId");
    console.log("GET /api/marks: Filters - subjectId:", subjectId, "studentId:", studentId);
    
    const whereClause: { subjectId?: string; studentId?: string } = {};
    if (subjectId) whereClause.subjectId = subjectId;
    if (studentId) whereClause.studentId = studentId;
    
    const marks = await db.mark.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            usn: true,
            username: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true
          }
        }
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    });
    
    console.log("GET /api/marks: Fetched marks count:", marks.length);
    return NextResponse.json(marks);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching marks:", errorMessage, error instanceof Error ? error.stack : undefined);
    return NextResponse.json({ message: "Failed to fetch marks", error: errorMessage }, { status: 500 });
  }
}

// POST - Create or update a mark
export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return authResult.error;
  }

  if (!authResult.user || (authResult.user.role !== Role.TEACHER && authResult.user.role !== Role.ADMIN)) {
    console.log("POST /api/marks: Forbidden - User role not TEACHER or ADMIN. User ID:", authResult.user?.userId, "Role:", authResult.user?.role);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }
  console.log("POST /api/marks: Authenticated user ID:", authResult.user.userId, "Role:", authResult.user.role);
  
  try {
    const body = await req.json();
    console.log("POST /api/marks: Request body:", JSON.stringify(body, null, 2));
    const { studentId, subjectId, value } = body;
    
    if (!studentId || !subjectId || value === undefined || value === null) {
      console.log("POST /api/marks: Missing required fields:", { studentId, subjectId, value });
      return NextResponse.json({ message: "Missing required fields: studentId, subjectId, value" }, { status: 400 });
    }

    console.log("POST /api/marks: Value received for parsing:", value, "Type:", typeof value);
    const parsedValue = parseFloat(String(value)); // Ensure value is string before parseFloat

    if (isNaN(parsedValue)) {
      console.log("POST /api/marks: Invalid value for mark after parseFloat. Original value:", value);
      return NextResponse.json({ message: "Invalid mark value. Must be a number." }, { status: 400 });
    }

    // Check if the subject belongs to the current teacher (if user is not ADMIN)
    if (authResult.user.role === Role.TEACHER) {
      console.log("POST /api/marks: TEACHER role, checking subject ownership. Teacher ID:", authResult.user.userId, "Subject ID:", subjectId);
      const subject = await db.subject.findFirst({ // Use findFirst for clarity on single record expectation
        where: { 
          id: subjectId,
          teacherId: authResult.user.userId 
        }
      });
      
      if (!subject) {
        console.log("POST /api/marks: Subject not found or user not authorized for subject:", subjectId, "Teacher ID from session:", authResult.user.userId);
        return NextResponse.json({ message: "You are not authorized to add marks for this subject, or the subject does not exist." }, { status: 403 });
      }
      console.log("POST /api/marks: Subject ownership verified for subject:", subjectId);
    }
    
    // Check if mark already exists and update it, otherwise create new
    console.log("POST /api/marks: Checking for existing mark for studentId:", studentId, "subjectId:", subjectId);
    const existingMark = await db.mark.findUnique({
      where: {
        studentId_subjectId: {
          studentId,
          subjectId
        }
      }
    });
    
    let mark;
    if (existingMark) {
      console.log("POST /api/marks: Updating existing mark ID:", existingMark.id, "with value:", parsedValue);
      mark = await db.mark.update({
        where: {
          id: existingMark.id
        },
        data: {
          value: parsedValue
        }
      });
    } else {
      console.log("POST /api/marks: Creating new mark for studentId:", studentId, "subjectId:", subjectId, "with value:", parsedValue);
      mark = await db.mark.create({
        data: {
          value: parsedValue,
          studentId,
          subjectId
        }
      });
    }
    console.log("POST /api/marks: Mark operation successful:", JSON.stringify(mark, null, 2));
    return NextResponse.json(mark);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating/updating mark:", errorMessage, error instanceof Error ? error.stack : undefined);
    return NextResponse.json({ message: "Failed to create/update mark", error: errorMessage }, { status: 500 });
  }
}