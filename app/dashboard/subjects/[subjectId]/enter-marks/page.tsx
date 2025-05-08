"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import React from "react";

interface Student {
  id: string;
  name: string;
  usn: string;
  username: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

interface Mark {
  id: string;
  value: number;
  studentId: string;
  subjectId: string;
  student: {
    name: string;
    usn: string;
    username: string;
  };
}

export default function EnterMarksPage({ params }: { params: { subjectId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [markValue, setMarkValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Use React.use() to unwrap the params object
  const { subjectId } = params;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch subject details
        const subjectRes = await fetch(`/api/subjects/${subjectId}`);
        if (!subjectRes.ok) {
          throw new Error("Failed to fetch subject details");
        }
        const subjectData = await subjectRes.json();
        setSubject(subjectData);

        // Fetch all students
        const studentsRes = await fetch("/api/students");
        if (!studentsRes.ok) {
          throw new Error("Failed to fetch students");
        }
        const studentsData = await studentsRes.json();
        setStudents(studentsData);

        // Fetch existing marks for this subject
        const marksRes = await fetch(`/api/marks?subjectId=${subjectId}`);
        if (!marksRes.ok) {
          throw new Error("Failed to fetch marks");
        }
        const marksData = await marksRes.json();
        setMarks(marksData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session, status, subjectId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || markValue === "") {
      toast.error("Please select a student and enter a mark");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/marks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          subjectId,
          value: parseFloat(markValue),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save mark");
      }

      const savedMark = await response.json();

      // Update UI
      const studentInfo = students.find(s => s.id === selectedStudentId);
      if (studentInfo) {
        const updatedMarks = [...marks];
        const existingMarkIndex = marks.findIndex(m => m.studentId === selectedStudentId);
        
        if (existingMarkIndex >= 0) {
          updatedMarks[existingMarkIndex] = {
            ...updatedMarks[existingMarkIndex],
            value: parseFloat(markValue)
          };
        } else {
          updatedMarks.push({
            id: savedMark.id,
            value: parseFloat(markValue),
            studentId: selectedStudentId,
            subjectId,
            student: {
              name: studentInfo.name,
              usn: studentInfo.usn,
              username: studentInfo.username
            }
          });
        }
        
        setMarks(updatedMarks);
      }

      toast.success("Mark saved successfully");
      setSelectedStudentId("");
      setMarkValue("");
    } catch (error) {
      console.error("Error saving mark:", error);
      toast.error("Failed to save mark");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    // Filter out students who already have marks
    const hasExistingMark = marks.some(mark => mark.studentId === student.id);
    if (hasExistingMark && !selectedStudentId) return false;
    if (!searchTerm) return true;
    
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Subject not found</p>
        <Link href="/dashboard/subjects" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
          <p className="text-gray-600">
            {subject.code} • {subject.credits} {subject.credits === 1 ? "Credit" : "Credits"}
          </p>
        </div>
        <Link
          href={`/dashboard/subjects/${subjectId}/marks`}
          className="text-blue-600 hover:text-blue-800"
        >
          View All Marks
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Enter New Mark</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a student..."
                    className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && filteredStudents.length > 0 && !selectedStudentId && (
                    <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setSearchTerm(student.name);
                          }}
                        >
                          <div className="font-medium text-black">{student.name}</div>
                          <div className="text-xs text-black">{student.usn}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="mark" className="block text-sm font-medium text-black mb-1">
                  Mark Value
                </label>
                <input
                  type="number"
                  id="mark"
                  value={markValue}
                  onChange={(e) => setMarkValue(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter mark (0-100)"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              {selectedStudentId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId("");
                    setSearchTerm("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 mr-2"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving || !selectedStudentId || markValue === ""}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Mark"}
              </button>
            </div>
          </form>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Marks</h2>
          {marks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No marks have been entered for this subject yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium  text-black uppercase tracking-wider"
                    >
                      Student Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium  text-blackuppercase tracking-wider"
                    >
                      USN
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium  text-black uppercase tracking-wider"
                    >
                      Mark
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marks.map((mark) => (
                    <tr key={mark.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{mark.student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{mark.student.usn}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{mark.value.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedStudentId(mark.studentId);
                            setSearchTerm(mark.student.name);
                            setMarkValue(mark.value.toString());
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}