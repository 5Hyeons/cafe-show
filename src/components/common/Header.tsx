
export function Header() {
  return (
    <header className="bg-white border-b border-[rgba(187,194,201,0.5)] flex items-center justify-between px-5 pt-7 pb-3">
      {/* Back Button */}
      <button className="w-6 h-6">
        <img src="/assets/icon-arrow-left.svg" alt="뒤로가기" className="w-full h-full" />
      </button>

      {/* Logo */}
      <div className="h-[22px] flex items-center">
        <img src="/assets/logo-cafeshow-4x.png" alt="CafeShow" className="h-full" />
      </div>

      {/* Language Button */}
      <button className="w-6 h-6">
        <img src="/assets/icon-language.svg" alt="언어 선택" className="w-full h-full" />
      </button>
    </header>
  );
}
