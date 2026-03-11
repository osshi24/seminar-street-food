import LoginForm from '../../../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập Store Owner</h1>
          <p className="mt-2 text-sm text-gray-600">Phố Ẩm Thực — Quản lý gian hàng</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <a href="/store-owner/register" className="text-blue-600 hover:underline">
            Đăng ký ngay
          </a>
        </p>
      </div>
    </main>
  );
}
