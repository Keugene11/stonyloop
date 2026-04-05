import NavBar from '@/components/NavBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-bg pb-24">
        {children}
      </div>
      <NavBar />
    </>
  )
}
