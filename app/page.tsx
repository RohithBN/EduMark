import Link from "next/link";
import { redirect } from "next/navigation";
import  getServerSession  from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen text-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-3/5">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                PCC Marks Management System
              </h1>
              <p className="mt-6 text-lg md:text-xl max-w-3xl">
                A comprehensive solution for managing PCC subject marks with seamless student data management, 
                credit-based subject tracking, and powerful marking tools.
              </p>
              <div className="mt-10">
                <Link
                  href="/login"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                >
                  Sign In to Get Started
                </Link>
              </div>
            </div>
            <div className="mt-10 md:mt-0 md:w-2/5">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                    <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                    <div className="h-4 w-4 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-gray-400 text-xs">marks-system.app</div>
                </div>
                <div className="mt-4">
                  <div className="bg-gray-100 rounded-md p-4">
                    <div className="font-mono text-sm text-gray-700">
                      <div className="text-blue-600 font-bold"># PCC Marks System</div>
                      <div className="mt-2">Successfully loaded student data ✓</div>
                      <div>PCC Subjects registered ✓</div>
                      <div>Credit system configured ✓</div>
                      <div>Marks entry dashboard ready ✓</div>
                      <div className="mt-3 text-green-600">Ready to use!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Streamlined Academic Management
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Student Management</h3>
              <p className="mt-2 text-gray-600">
                Easily upload and manage student data with USN and username tracking.
                Search and filter capabilities provide quick access to student records.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Subject Management</h3>
              <p className="mt-2 text-gray-600">
                Create and manage PCC subjects with proper credit allocation.
                Support for both 1-credit and 3-credit courses with custom-tailored interfaces.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Marks Dashboard</h3>
              <p className="mt-2 text-gray-600">
                Intuitive interface for teachers to enter and manage marks.
                Comprehensive analytics and reporting for subject performance evaluation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PCC Marks Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
