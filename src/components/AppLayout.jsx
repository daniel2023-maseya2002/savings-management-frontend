import TopNav from "./TopNav";
// import NotificationsMenu from "./NotificationsMenu";
import { Card } from "./ui/Card";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Global Navigation */}
      <TopNav />

      {/* Notification Dropdown */}
      {/* <NotificationsMenu /> */}

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <Card className="max-w-7xl mx-auto">
          {children}
        </Card>
      </main>
    </div>
  );
}
