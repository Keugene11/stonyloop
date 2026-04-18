import NavBar from '@/components/NavBar'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import LastSeenUpdater from '@/components/LastSeenUpdater'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LastSeenUpdater />
      <Sidebar />
      <TopBar />
      <div className="bg-bg pt-[env(safe-area-inset-top)] pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pt-0 lg:pb-0">
        {children}
      </div>
      <NavBar />
    </>
  )
}
