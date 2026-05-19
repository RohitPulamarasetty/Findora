import Image from "next/image";

interface FindoraLogoProps {
  size?: number;
  className?: string;
}

export function FindoraLogo({ size = 28, className }: FindoraLogoProps) {
  return (
    <Image
      src="/favicon-96x96.png"
      alt="Findora"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
