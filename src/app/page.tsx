import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">ยินดีต้อนรับสู่ My App</h1>
        <p className="text-gray-600 mb-8">
          {session
            ? `ยินดีต้อนรับ, ${session.user?.name || session.user?.email || "ผู้ใช้"}!`
            : "แอปพลิเคชัน Next.js พร้อมระบบ Login"}
        </p>
        <div className="space-y-4">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="block w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                ไป Dashboard
              </Link>
              <p className="text-sm text-gray-500">อีเมล: {session.user?.email}</p>
            </>
          ) : (
            <div className="space-x-4">
              <Link
                href="/login"
                className="inline-block bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="inline-block bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600"
              >
                สมัครบัญชี
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}