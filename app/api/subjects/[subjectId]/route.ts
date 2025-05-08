import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
// import getServerSession from "next-auth"; // Removed next-auth
// import { Session } from "next-auth"; // Removed next-auth
import { Role } from "@prisma/client"; // Assuming Role enum is defined in your Prisma schema

// Mock session data - replace with your actual session logic
interface MockSession {
  user?: {
    id: string;
    role: Role;
    name?: string; // Optional: if you need the user's name
    email?: string; // Optional: if you need the user's email
    // Add other user properties if needed by your JWT implementation
  };
}

// Helper function to get session - replace with your actual JWT session retrieval
async function getMockSession(req: NextRequest): Promise<MockSession | null> {
  // In a real JWT setup, you would verify the token from cookies or headers
  // For now, this simulates a logged-in teacher for demonstration
  // const token = req.cookies.get('auth_token')?.value;
  // if (token) {
  //   try {
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //     // Adjust the user object based on your token payload
  //     return { user: { id: decoded.userId, role: decoded.role, name: decoded.name, email: decoded.email } }; 
  //   } catch (error) {
  //     return null;
  //   }
  // }
  // return null;

  // For now, let's assume a teacher is logged in for development if no token logic is present
  // IMPORTANT: Remove this mock or secure it properly for production
  console.warn("Using mock session in /api/subjects/[subjectId]/route.ts. Replace with actual JWT verification.");
  return { user: { id: "mock-teacher-id", role: Role.TEACHER, name: "Mock Teacher", email: "teacher@example.com" } };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  // const session = await getServerSession(); // Removed next-auth
  const session = await getMockSession(req); // Using mock session

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { subjectId } = params;

  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!subject) {
    return new NextResponse("Subject not found", { status: 404 });
  }

  return NextResponse.json(subject);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  // const session = await getServerSession(); // Removed next-auth
  const session = await getMockSession(req); // Using mock session

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { subjectId } = params;
  const { name, code, credits } = await req.json();

  // Verify the subject belongs to this teacher or the user is an admin
  if (session.user.role !== "ADMIN") {
    const subjectCheck = await db.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: session.user.id
      }
    });

    if (!subjectCheck) {
      return new NextResponse("You don't have permission to modify this subject", { status: 403 });
    }
  }

  const subject = await db.subject.update({
    where: { id: subjectId },
    data: {
      name,
      code,
      credits: parseInt(credits),
    }
  });

  return NextResponse.json(subject);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  // const session = await getServerSession(); // Removed next-auth
  const session = await getMockSession(req); // Using mock session

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { subjectId } = params;

  // Verify the subject belongs to this teacher or the user is an admin
  if (session.user.role !== "ADMIN") {
    const subjectCheck = await db.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: session.user.id
      }
    });

    if (!subjectCheck) {
      return new NextResponse("You don't have permission to delete this subject", { status: 403 });
    }
  }

  // Delete the subject and all related marks
  await db.mark.deleteMany({
    where: { subjectId }
  });

  const subject = await db.subject.delete({
    where: { id: subjectId }
  });

  return NextResponse.json(subject);
}