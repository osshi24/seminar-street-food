'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import {
  getStoreOwnerProfile,
  updateStoreOwnerProfile,
  changeStoreOwnerPassword,
  type StoreOwnerProfile,
} from '../../../../lib/api/auth';
import StoreOwnerPageHeader from '../../../../components/dashboard/common/StoreOwnerPageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { cn } from '../../../../lib/cn';

const STATUS_LABEL: Record<string, { label: string; tone: 'success' | 'muted' | 'warning' | 'danger' }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  pending: { label: 'Chờ phê duyệt', tone: 'warning' },
  inactive: { label: 'Tạm khoá', tone: 'muted' },
  rejected: { label: 'Bị từ chối', tone: 'danger' },
};

export default function StoreOwnerAccountPage() {
  const [profile, setProfile] = useState<StoreOwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getStoreOwnerProfile()
      .then((p) => {
        setProfile(p);
        setFullName(p.fullName ?? '');
        setPhone(p.phone ?? '');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const updated = await updateStoreOwnerProfile({ fullName, phone });
      setProfile(updated);
      setProfileMessage({ type: 'success', text: 'Đã cập nhật thông tin cá nhân.' });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể cập nhật. Vui lòng thử lại.';
      setProfileMessage({ type: 'error', text: message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordMessage({
        type: 'error',
        text: 'Mật khẩu mới phải tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await changeStoreOwnerPassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.';
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="h-64 animate-pulse rounded-xl bg-white" />
        <div className="h-64 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5 text-sm text-rose-700">
          Không tải được thông tin tài khoản.
        </CardContent>
      </Card>
    );
  }

  const statusMeta = STATUS_LABEL[profile.status] ?? { label: profile.status, tone: 'muted' };
  const isDirty =
    fullName.trim() !== (profile.fullName ?? '') ||
    phone.trim() !== (profile.phone ?? '');

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Tài khoản"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin liên hệ và đổi mật khẩu đăng nhập."
        meta={`Thành viên từ ${new Date(profile.createdAt).toLocaleDateString('vi-VN')}`}
        action={<Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>}
      />

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-orange-600">
            <UserCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
            <CardDescription>Họ tên và số điện thoại liên hệ.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Field
              label="Họ và tên"
              value={fullName}
              onChange={setFullName}
              placeholder="Nguyễn Văn A"
              required
            />
            <Field
              label="Số điện thoại"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="0123 456 789"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="flex-1 truncate">{profile.email}</span>
                <Badge variant="muted" className="text-[10px]">
                  Không đổi được
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Email là định danh tài khoản, liên hệ Admin nếu cần thay đổi.
              </p>
            </div>

            {profileMessage && (
              <FormMessage type={profileMessage.type} text={profileMessage.text} />
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!isDirty || savingProfile}
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <CheckCircle2 />
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-50 text-orange-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
            <CardDescription>
              Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordField
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              autoComplete="current-password"
              required
            />
            <PasswordField
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              autoComplete="new-password"
              required
            />
            <PasswordField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              autoComplete="new-password"
              required
            />

            {passwordMessage && (
              <FormMessage type={passwordMessage.type} text={passwordMessage.text} />
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  savingPassword
                }
                className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <KeyRound />
                {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

function Field({ label, value, onChange, placeholder, type = 'text', required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  required?: boolean;
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  required,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function FormMessage({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div
      className={cn(
        'rounded-md px-3 py-2 text-sm ring-1',
        type === 'success'
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-rose-50 text-rose-700 ring-rose-200',
      )}
    >
      {text}
    </div>
  );
}
