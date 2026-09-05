export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-white/[0.05] blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-white/[0.03] blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
}
