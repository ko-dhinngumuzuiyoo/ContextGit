import { useNavigate, useLocation } from "react-router-dom";

export default function SidepanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-12 items-center gap-2 border-b border-gray-200 bg-white px-3">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            &larr;
          </button>
        )}
        <span
          onClick={() => navigate("/")}
          className="cursor-pointer text-base font-bold tracking-tight"
        >
          ContextGit
        </span>
      </header>
      <main className="flex-1 overflow-y-auto p-3">{children}</main>
    </div>
  );
}
