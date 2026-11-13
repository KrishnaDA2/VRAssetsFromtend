
import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ModelGrid } from './components/models/ModelGrid';
import { InspectorView } from './components/viewer/InspectorView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UploadModal } from './components/upload/UploadModal';
import { CreateCompanyModal } from './components/admin/CreateCompanyModal';
import { CreateProjectModal } from './components/admin/CreateProjectModal';
import { ToastContainer } from './components/common/Toast';
import { LoginModal } from './components/auth/LoginModal';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    isLoginModalOpen,
    connectionStatus,
    handleLoginSuccess,
  } = useApp();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Header stays at the top */}
      <header className="flex-none">
        <Header />
      </header>

      {/* Remaining viewport height */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Independent sidebar scrolling */}
        {(activeTab === 'browse' || activeTab === 'admin') && (
          <div className="h-full min-h-0 shrink-0 overflow-y-auto overscroll-y-contain">
            <Sidebar />
          </div>
        )}

        {/* Independent main content scrolling */}
        <main className="flex-1 min-w-0 min-h-0 h-full overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {activeTab === 'browse' && <ModelGrid />}
          {activeTab === 'viewer' && <InspectorView />}
          {activeTab === 'admin' && <AdminDashboard />}
        </main>
      </div>

      {/* Global modals and notifications */}
      <UploadModal />
      <CreateCompanyModal />
      <CreateProjectModal />
      <ToastContainer />

      {/* Authentication modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onSuccess={handleLoginSuccess}
        connectionStatus={connectionStatus}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return <MainLayout />;
};

export default App;
