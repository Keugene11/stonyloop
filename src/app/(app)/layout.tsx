import NavBar from '@/components/NavBar'
import LastSeenUpdater from '@/components/LastSeenUpdater'
import UniversitySwitcher from '@/components/UniversitySwitcher'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LastSeenUpdater />
      <UniversitySwitcher />
      <div className="bg-bg pb-24">
        {children}
      </div>
      <NavBar />
    </>
  )
}
