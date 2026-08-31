import StaffHeader from '@/components/shared/StaffHeader';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <StaffHeader />
      {children}
    </div>
  );
}
