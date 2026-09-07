import Image from "next/image";

export function BrandEmblem({ featured = false }: { featured?: boolean }) {
  return (
    <Image
      src="/brand/emperor-vortex.png"
      alt={featured ? "Emperor penguin above a geometric gold vortex" : ""}
      width={1254}
      height={1254}
      sizes={featured ? "(max-width: 640px) 200px, 240px" : "54px"}
      priority={featured}
      className={
        "brand-emblem " +
        (featured ? "brand-emblem-feature" : "brand-emblem-compact")
      }
    />
  );
}

export function BrandLockup({ featured = false }: { featured?: boolean }) {
  return (
    <span
      className={"brand-lockup" + (featured ? " brand-lockup-featured" : "")}
    >
      <span className="brand-wordmark">
        <span>Commitment</span> <span>Pools</span>
      </span>
      <BrandEmblem featured={featured} />
    </span>
  );
}
