import RegisterForm from '../../../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký tài khoản Store Owner</h1>
          <p className="mt-2 text-sm text-gray-600">
            Điền thông tin bên dưới để đăng ký tham gia Phố Ẩm Thực
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <a href="/store-owner/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </a>
        </p>
      </div>
    </main>
  );
}
