import { Logo } from '@/components/Logo';
import { Sidebar } from '@/components/Sidebar';
import { logoutAction } from '@/lib/auth-actions';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside
        className="flex w-60 flex-col justify-between p-4"
        style={{ borderRight: '1px solid var(--color-primary-light)' }}
      >
        <div>
          <div className="mb-6">
            <Logo size={30} />
          </div>
          <Sidebar />
        </div>
        <form action={logoutAction}>
          <button className="cv-btn-ghost w-full" type="submit">
            Log out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
