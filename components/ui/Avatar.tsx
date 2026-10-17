const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-3xl",
} as const;

interface Props {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/** User avatar: the uploaded image when there is one, otherwise the name's initial. */
export default function Avatar({ name, src, size = "md", className = "" }: Props) {
  const base = `${SIZES[size]} rounded-full shrink-0 ${className}`;

  if (src) {
    // Plain <img>: avatars come from Cloudinary or local SVGs, both outside next/image's optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? "Ảnh đại diện"} className={`${base} object-cover bg-slate-100`} />;
  }

  return (
    <span
      aria-hidden="true"
      className={`${base} bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center`}
    >
      {name?.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
