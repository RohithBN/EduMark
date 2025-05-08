import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import  getServerSession  from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Session } from "next-auth";

// GET - Fetch all students
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as unknown as Session | null;
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const students = await db.student.findMany({
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Create a new student
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as unknown as Session | null;
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { username, usn, name } = await req.json();
    
    if (!username || !usn || !name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Check if student with the same USN or username already exists
    const existingStudent = await db.student.findFirst({
      where: {
        OR: [
          { usn },
          { username }
        ]
      }
    });
    
    if (existingStudent) {
      return new NextResponse("Student with this USN or username already exists", { status: 409 });
    }
    
    const student = await db.student.create({
      data: {
        username,
        usn,
        name,
      },
    });
    
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}