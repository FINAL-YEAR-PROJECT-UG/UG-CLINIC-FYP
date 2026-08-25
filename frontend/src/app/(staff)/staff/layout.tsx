export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden">
      {/* Background Campus Video & Soft Dimming Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/ug-video.mp4" type="video/mp4" />
          <source src="/UG video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#0B1221]/20" />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
