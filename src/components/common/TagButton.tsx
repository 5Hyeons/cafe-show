interface TagButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'red' | 'white';
}

export function TagButton({ children, onClick, variant = 'red' }: TagButtonProps) {
  if (variant === 'white') {
    return (
      <button
        onClick={onClick}
        className="backdrop-blur-[10px] border border-cafeshow-gray-200 rounded-full px-3 py-2 text-base text-black whitespace-nowrap"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="backdrop-blur-[10px] bg-cafeshow-red rounded-full px-3 py-2 text-base text-white whitespace-nowrap"
    >
      {children}
    </button>
  );
}
