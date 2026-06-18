import { avatarColors, getInitials } from "@/lib/avatar";

interface EmployeeAvatarProps {
  id: string;
  name: string;
  size?: number;
}

export default function EmployeeAvatar({ id, name, size = 44 }: EmployeeAvatarProps) {
  const { background, foreground } = avatarColors(id);
  const initials = getInitials(name);

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0 select-none"
      style={{
        backgroundColor: background,
        color: foreground,
        width: size,
        height: size,
        fontSize: size * 0.38,
        letterSpacing: "0.02em",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
