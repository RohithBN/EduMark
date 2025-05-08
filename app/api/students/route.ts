import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // This check is important for server startup.
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables. The application will not function correctly without it.");
  // In a production scenario, you might want to throw an error here to prevent startup:
  // throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
}

interface DecodedToken {
  userId: string;
  username: string; // Assuming username is in the token
  email: string;    // Assuming email is in the token
  // Add other fields you expect in your token payload
}

// Authentication verification helper function
async function verifyAuth(req: NextRequest): Promise<{ user?: DecodedToken; error?: NextResponse }> {
  if (!JWT_SECRET) { 
    // Runtime check, though ideally caught at server startup.
    console.error("JWT_SECRET is not available at runtime. This should have been caught at startup.");
    return { error: new NextResponse("Internal Server Configuration Error: JWT_SECRET missing", { status: 500 }) };
  }
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return { error: new NextResponse("Unauthorized: No token provided", { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return { user: decoded };
  } catch (error) {
    // Log specific JWT errors for better debugging
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("JWT Error:", error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error("JWT Token Expired:", error.message);
    } else {
      console.error("Token verification error (unknown type):", error);
    }
    return { error: new NextResponse("Unauthorized: Invalid or expired token", { status: 401 }) };
  }
}


// GET - Fetch all students
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return authResult.error;
    }
    // You can access the authenticated user's details via authResult.user
    // console.log("GET /api/students: Authenticated user ID:", authResult.user?.userId);

    const students = await db.student.findMany({
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return new NextResponse("Internal Error in GET /api/students", { status: 500 });
  }
}

// POST - Create a new student
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return authResult.error;
    }
    // console.log("POST /api/students: Authenticated user ID:", authResult.user?.userId);
    
    const { username, usn, name } = await req.json();
    
    if (!username || !usn || !name) {
      return new NextResponse("Missing required fields (username, usn, name)", { status: 400 });
    }
    
    const existingStudent = await db.student.findFirst({
      where: {
        OR: [
          { usn },
          { username } // Assuming student username should also be unique, adjust if not
        ]
      }
    });
    
    if (existingStudent) {
      let message = "Student with this ";
      if (existingStudent.usn === usn && existingStudent.username === username) {
        message += "USN and username already exists";
      } else if (existingStudent.usn === usn) {
        message += "USN already exists";
      } else {
        message += "username already exists";
      }
      return new NextResponse(message, { status: 409 });
    }
    
    const student = await db.student.create({
      data: {
        username,
        usn,
        name,
        // If you want to associate the student with the user who created them:
        // createdById: authResult.user?.userId, // Ensure your Student model has a relation to User
      },
    });
    
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    // Check for Prisma-specific errors if needed, e.g., unique constraint violation
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { ... }
    return new NextResponse("Internal Error in POST /api/students", { status: 500 });
  }
}