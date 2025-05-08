import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../auth/[...nextauth]/route";

// GET - Fetch all subjects
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get teacher ID for filtering if needed
    const url = new URL(req.url);
    const teacherId = url.searchParams.get("teacherId");
    
    const subjects = await db.subject.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: {
        teacher: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Create a new subject
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { name, code, credits } = await req.json();
    
    if (!name || !code || !credits) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Check if subject with the same code already exists
    const existingSubject = await db.subject.findUnique({
      where: { code }
    });
    
    if (existingSubject) {
      return new NextResponse("Subject with this code already exists", { status: 409 });
    }
    
    const subject = await db.subject.create({
      data: {
        name,
        code,
        credits: parseInt(credits),
        teacherId: session.user?.id
      },
    });
    
    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}