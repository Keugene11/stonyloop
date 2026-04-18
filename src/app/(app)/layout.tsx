import NavBar from '@/components/NavBar'
import NotificationBell from '@/components/NotificationBell'
import LastSeenUpdater from '@/components/LastSeenUpdater'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LastSeenUpdater />
      <div className="bg-bg pb-24">
        {children}
      </div>
      <NotificationBell />
      <NavBar />
    </>
  )
}
