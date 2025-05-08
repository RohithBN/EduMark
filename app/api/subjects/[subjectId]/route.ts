import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import getServerSession from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Session } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as Session | null;
    
        if (!session || !session.user) {
          return new NextResponse("Unauthorized", { status: 401 });
        }
    
    if (!session) {
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
  } catch (error) {
    console.error("Error fetching subject:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as Session | null;
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    if (!session || !session.user.id) {
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
  } catch (error) {
    console.error("Error updating subject:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as Session | null;
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    if (!session || !session.user.id) {
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
  } catch (error) {
    console.error("Error deleting subject:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}