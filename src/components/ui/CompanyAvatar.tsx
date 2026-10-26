// Deterministic, muted tones so each company keeps the same colour everywhere.
const TONES = [
  "bg-[#E9E4D6] text-[#5B4A1F] dark:bg-[#2C281C] dark:text-[#E3D3A4]",
  "bg-[#DCE8E1] text-[#1E4D3B] dark:bg-[#1C2C24] dark:text-[#A8D5BC]",
  "bg-[#E2E3EE] text-[#353A6B] dark:bg-[#22243A] dark:text-[#B8BCEB]",
  "bg-[#F1DFD8] text-[#7A3220] dark:bg-[#36211B] dark:text-[#F0B9A6]",
  "bg-[#DDE7EE] text-[#1F4A63] dark:bg-[#1A2A35] dark:text-[#A7CDE6]",
  "bg-[#EADDEA] text-[#5C2D5C] dark:bg-[#2F1F2F] dark:text-[#E2B6E2]",
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const sizes = {
  sm: "size-9 rounded-lg text-xs",
  md: "size-11 rounded-xl text-sm",
  lg: "size-16 rounded-2xl text-xl",
};

export function CompanyAvatar({ name, size = "md" }: { name: string; size?: keyof typeof sizes }) {
  const tone = TONES[hash(name.toLowerCase()) % TONES.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-semibold tracking-tight ${sizes[size]} ${tone}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
