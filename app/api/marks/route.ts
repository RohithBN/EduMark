import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import  getServerSession  from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Session } from "next-auth";

// GET - Fetch marks (can filter by subject or student)
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as Session | null;
       
           if (!session || !session.user) {
             return new NextResponse("Unauthorized", { status: 401 });
           }

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");
    const studentId = url.searchParams.get("studentId");
    
    // Build the query based on provided filters
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
    
    return NextResponse.json(marks);
  } catch (error: unknown) {
    console.error("Error fetching marks:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Create or update a mark
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as Session | null;
       
           if (!session || !session.user) {
             return new NextResponse("Unauthorized", { status: 401 });
           }

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { studentId, subjectId, value } = await req.json();
    
    if (!studentId || !subjectId || value === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if the subject belongs to the current teacher
    if (session.user.role !== "ADMIN") {
      const subject = await db.subject.findUnique({
        where: { 
          id: subjectId,
          teacherId: session.user.id // Only if the subject belongs to this teacher
        }
      });
      
      if (!subject) {
        return new NextResponse("You are not authorized to add marks for this subject", { status: 403 });
      }
    }
    
    // Check if mark already exists and update it, otherwise create new
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
      mark = await db.mark.update({
        where: {
          id: existingMark.id
        },
        data: {
          value: parseFloat(value)
        }
      });
    } else {
      mark = await db.mark.create({
        data: {
          value: parseFloat(value),
          studentId,
          subjectId
        }
      });
    }
    
    return NextResponse.json(mark);
  } catch (error: unknown) {
    console.error("Error creating/updating mark:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}