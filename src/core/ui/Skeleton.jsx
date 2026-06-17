import { motion } from "framer-motion";
import { ACID, BG } from "../../tokens";

const shimmer = {
  background: `linear-gradient(90deg, ${ACID}08 25%, ${ACID}18 50%, ${ACID}08 75%)`,
  backgroundSize: "200% 100%",
};

const shimmerAnim = {
  animate: { backgroundPosition: ["200% 0", "-200% 0"] },
  transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
};

function SkeletonBlock({ width = "100%", height = 16, style, ...rest }) {
  return (
    <motion.div
      {...shimmerAnim}
      style={{ ...shimmer, borderRadius: 2, width, height, minHeight: height, ...style }}
      {...rest}
    />
  );
}

function SkeletonCircle({ size = 44, style, ...rest }) {
  return (
    <motion.div
      {...shimmerAnim}
      style={{ ...shimmer, borderRadius: "50%", width: size, height: size, minWidth: size, ...style }}
      {...rest}
    />
  );
}

function SkeletonText({ lines = 3, width = "100%", lineHeight = 12, gap = 8, ...rest }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, width }} {...rest}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ style, ...rest }) {
  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${ACID}15`,
        borderRadius: 2,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
      {...rest}
    >
      <SkeletonBlock height={120} />
      <SkeletonText lines={2} lineHeight={10} gap={6} />
    </div>
  );
}

function SkeletonTrackRow({ style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderBottom: `1px solid ${ACID}10`,
        ...style,
      }}
      {...rest}
    >
      <SkeletonBlock width={36} height={36} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <SkeletonBlock height={10} width="65%" />
        <SkeletonBlock height={8} width="40%" />
      </div>
      <SkeletonBlock width={48} height={20} />
    </div>
  );
}

function SkeletonGrid({ columns = 2, rows = 4, cardHeight = 180, gap = 8, style, ...rest }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
      }}
      {...rest}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <SkeletonCard key={i} style={{ gap: 8 }} />
      ))}
    </div>
  );
}

function MusicLabSkeleton() {
  return (
    <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6, padding: "8px 0" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} width={60} height={28} />
        ))}
      </div>
      <SkeletonBlock height={32} width="100%" />
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonTrackRow key={i} />
      ))}
    </div>
  );
}

function VaultGallerySkeleton() {
  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} width={64} height={28} />
        ))}
      </div>
      <SkeletonGrid columns={2} rows={4} cardHeight={160} gap={6} />
    </div>
  );
}

function CapsulesSkeleton() {
  return (
    <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6, padding: "8px 0" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} width={80} height={28} />
        ))}
      </div>
      <SkeletonBlock height={32} width="100%" />
      <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} width={60} height={24} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} height={56} width="100%" />
      ))}
    </div>
  );
}

export default Object.assign(SkeletonBlock, {
  Block: SkeletonBlock,
  Circle: SkeletonCircle,
  Text: SkeletonText,
  Card: SkeletonCard,
  TrackRow: SkeletonTrackRow,
  Grid: SkeletonGrid,
  MusicLab: MusicLabSkeleton,
  VaultGallery: VaultGallerySkeleton,
  Capsules: CapsulesSkeleton,
});
