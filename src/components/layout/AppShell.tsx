import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { Toast } from '../ui/Toast'
import { TopNav } from './TopNav'
import { Footer } from './Footer'
import { BookingView }   from '../booking/BookingView'
import { DashboardView } from '../../pages/DashboardView'
import { AdminView }     from '../admin/AdminView'

export function AppShell() {
  const app = useApp()

  // If a client somehow ends up on the admin view, push them back
  useEffect(() => {
    if (app.userRole === 'client' && app.view === 'admin') {
      app.setView('book')
    }
  }, [app.userRole, app.view])

  return (
    <div className="min-h-screen">
      <TopNav />
      {app.view === 'book'      && <BookingView />}
      {app.view === 'dashboard' && <DashboardView />}
      {app.view === 'admin'     && app.userRole === 'admin' && <AdminView />}
      <Footer />
      <Toast toast={app.toast} />
    </div>
  )
}
