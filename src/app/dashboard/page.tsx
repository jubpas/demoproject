import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-lg font-semibold text-gray-800">
                My App
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{session?.user?.email}</span>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ยินดีต้อนรับ, {session?.user?.name || session?.user?.email || "ผู้ใช้"}!
          </h1>
          <p className="text-gray-600">
            คุณเข้าสู่ระบบเรียบร้อยแล้ว นี่เป็นหน้า Dashboard ที่ป้องกัน
          </p>
        </div>
      </main>
    </div>
  );
}