import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DeviceMonitoring } from './components/dashboard/DeviceMonitoring';
import { DeviceMap } from './components/dashboard/DeviceMap';
import { CommunityReports } from './components/dashboard/CommunityReports';
import { NotificationsView } from './components/dashboard/NotificationsView';
import { PublicReportPage } from './components/public/PublicReportPage';
import { SystemWorkflowModal } from './components/public/SystemWorkflowModal';
import { AiWasteScannerPage } from './components/scanner/AiWasteScannerPage';
import { WasteAnalyticsAndHistory } from './components/dashboard/WasteAnalyticsAndHistory';
import { MuaraAngkeOceanographyDashboard } from './components/dashboard/MuaraAngkeOceanographyDashboard';
import { DigitalTwin3DView } from './components/dashboard/DigitalTwin3DView';
import { LandingContentManager } from './components/dashboard/LandingContentManager';
import { LoginModal } from './components/auth/LoginModal';
import { iotService } from './services/iotService';
import { authService } from './services/authService';
import { Device, WasteReport, AppNotification, WasteScanResult, AuthUser, User } from './types';
import { ShieldAlert, ArrowLeft, Box, LogOut } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<string>('landing');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-01');
  const [workflowModalOpen, setWorkflowModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [reportPrefill, setReportPrefill] = useState<{
    photoUrl?: string;
    wasteType?: any;
    description?: string;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | User | null>(() =>
    authService.getCurrentUser()
  );

  const [devices, setDevices] = useState<Device[]>(() => iotService.getDevices());
  const [logs, setLogs] = useState(() => iotService.getLogs());
  const [reports, setReports] = useState<WasteReport[]>(() => iotService.getReports());
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    iotService.getNotifications()
  );
  const [scans, setScans] = useState<WasteScanResult[]>(() => iotService.getScans());

  useEffect(() => {
    const unsubscribeIot = iotService.subscribe(() => {
      setDevices(iotService.getDevices());
      setLogs(iotService.getLogs());
      setReports(iotService.getReports());
      setNotifications(iotService.getNotifications());
      setScans(iotService.getScans());
    });
    // Sinkronkan sekali: data Supabase bisa saja sudah tiba sebelum subscribe terpasang
    setDevices(iotService.getDevices());
    setLogs(iotService.getLogs());

    const unsubscribeAuth = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribeIot();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (activeView.startsWith('operator-') && !currentUser) {
      setActiveView('landing');
    }
  }, [currentUser, activeView]);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const handleNavigate = (view: string) => {
    if (view === 'public-about') {
      setWorkflowModalOpen(true);
      return;
    }

    if (view === 'oceanography') {
      if (currentUser) {
        setActiveView('operator-oceanography');
      } else {
        setActiveView('public-oceanography');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Remap legacy scan-history view to unified Statistik & Riwayat Scan
    const normalizedView = view === 'operator-scans' ? 'operator-analytics' : view;

    if (normalizedView.startsWith('operator-') && !currentUser) {
      setLoginModalOpen(true);
      return;
    }

    if (normalizedView === 'operator-cms' && currentUser?.role !== 'admin') {
      return;
    }

    setActiveView(normalizedView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: AuthUser | User) => {
    setCurrentUser(user);
    setLoginModalOpen(false);
    setActiveView('operator-device');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActiveView('landing');
    setLoginModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isOperatorMode = activeView.startsWith('operator-');
  const operatorCurrentTab = isOperatorMode ? activeView.replace('operator-', '') : 'device';

  return (
    <div className="min-h-screen h-auto flex flex-col bg-[#f8fafc] text-[#0f2942] w-full max-w-full overflow-x-hidden box-border">
      {isOperatorMode ? (
        <DashboardLayout
          currentTab={operatorCurrentTab}
          onSelectTab={(tab) => handleNavigate(`operator-${tab}`)}
          onExitToPublic={() => handleNavigate('landing')}
          notifications={notifications}
          currentUser={currentUser}
          onLogout={handleLogout}
        >
          {operatorCurrentTab === 'digital-twin' &&
            (currentUser?.role === 'admin' ? (
              <DigitalTwin3DView
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={(id) => setSelectedDeviceId(id)}
                currentUser={currentUser}
                onNavigateToDeviceMonitoring={() => handleNavigate('operator-device')}
              />
            ) : (
              <div className="bg-white rounded-xl p-8 sm:p-10 border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
                <div className="w-14 h-14 bg-sky-50 text-[#0284c7] rounded-xl flex items-center justify-center mx-auto border border-sky-200">
                  <Box className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#0284c7]">
                    Fitur Khusus Administrator
                  </span>
                  <h3 className="text-xl font-bold text-[#0f2942] mt-1">
                    Digital Twin 3D SEABRIS Terproteksi
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Visualisasi model 3D WebGL dan inspeksi gantry sensor ultrasonik dikhususkan untuk akun <strong>Administrator Utama</strong>.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f2942] hover:bg-[#1e3a8a] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#38bdf8]" />
                    <span>Logout & Masuk sebagai Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('operator-device')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0f2942] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <span>Kembali ke Monitoring Alat</span>
                  </button>
                </div>
              </div>
            ))}

          {operatorCurrentTab === 'oceanography' && (
            <MuaraAngkeOceanographyDashboard
              isPublicView={false}
              currentUser={currentUser}
              onNavigateToDevice={() => {
                setSelectedDeviceId('dev-01');
                handleNavigate('operator-device');
              }}
              onNavigateToMap={() => handleNavigate('operator-map')}
            />
          )}

          {operatorCurrentTab === 'device' && (
            <DeviceMonitoring
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(id) => setSelectedDeviceId(id)}
              logs={logs}
              currentUser={currentUser}
              onNavigateToMap={() => handleNavigate('operator-map')}
              onNavigateToReports={() => handleNavigate('operator-reports')}
              onNavigateToScanner={() => handleNavigate('ai-scanner')}
              onNavigateToDigitalTwin={() => handleNavigate('operator-digital-twin')}
            />
          )}

          {operatorCurrentTab === 'map' && (
            <DeviceMap
              devices={devices}
              onSelectDevice={(id) => {
                setSelectedDeviceId(id);
                handleNavigate('operator-device');
              }}
            />
          )}

          {operatorCurrentTab === 'reports' && (
            <CommunityReports
              reports={reports}
              currentUser={currentUser}
            />
          )}

          {(operatorCurrentTab === 'analytics' || operatorCurrentTab === 'scans') && (
            <WasteAnalyticsAndHistory
              scans={scans}
              currentUser={currentUser}
              onOpenScanner={() => handleNavigate('ai-scanner')}
            />
          )}

          {operatorCurrentTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onNavigateToDevice={(devId) => {
                if (devId) setSelectedDeviceId(devId);
                handleNavigate('operator-device');
              }}
              onNavigateToReports={() => handleNavigate('operator-reports')}
            />
          )}

          {operatorCurrentTab === 'cms' &&
            (currentUser?.role === 'admin' ? (
              <LandingContentManager
                currentUser={currentUser}
                onNavigateToLanding={() => handleNavigate('landing')}
              />
            ) : (
              <div className="bg-white rounded-xl p-8 border border-rose-200 text-center max-w-lg mx-auto my-12">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f2942] mb-2">Akses Dibatasi</h3>
                <p className="text-xs text-slate-600 mb-6">
                  Manajemen Konten Beranda hanya dapat diakses oleh akun dengan peran <strong>Administrator</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate('operator-device')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f2942] hover:bg-[#1e3a8a] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#38bdf8]" />
                  <span>Kembali ke Monitoring Alat</span>
                </button>
              </div>
            ))}
        </DashboardLayout>
      ) : (
        <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden box-border">
          <Navbar
            activeView={activeView}
            onNavigate={handleNavigate}
            unreadCount={unreadNotifs}
            currentUser={currentUser}
            onOpenLogin={() => setLoginModalOpen(true)}
            onLogout={handleLogout}
          />

          <main className="flex-1 w-full max-w-full overflow-x-hidden box-border">
            {activeView === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                currentUser={currentUser}
                primaryDevice={devices[0]}
              />
            )}

            {activeView === 'ai-scanner' && (
              <AiWasteScannerPage
                onNavigateToReport={(prefill) => {
                  setReportPrefill(prefill);
                  handleNavigate('public-report');
                }}
                onNavigateToHistory={() => handleNavigate('operator-analytics')}
              />
            )}

            {(activeView === 'public-oceanography' || activeView === 'oceanography') && (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 box-border">
                <MuaraAngkeOceanographyDashboard
                  isPublicView={true}
                  currentUser={currentUser}
                  onOpenLogin={() => setLoginModalOpen(true)}
                  onNavigateToDevice={() => {
                    if (currentUser) {
                      handleNavigate('operator-device');
                    } else {
                      setLoginModalOpen(true);
                    }
                  }}
                  onNavigateToMap={() => {
                    if (currentUser) {
                      handleNavigate('operator-map');
                    } else {
                      setLoginModalOpen(true);
                    }
                  }}
                />
              </div>
            )}

            {activeView === 'public-report' && (
              <PublicReportPage
                onBack={() => handleNavigate('landing')}
                prefillData={reportPrefill}
                onReportSubmitted={() => {
                  setReportPrefill(null);
                }}
              />
            )}
          </main>

          <Footer onNavigate={handleNavigate} />
        </div>
      )}

      <SystemWorkflowModal
        isOpen={workflowModalOpen}
        onClose={() => setWorkflowModalOpen(false)}
        onOpenMonitoring={() => {
          setWorkflowModalOpen(false);
          handleNavigate('operator-device');
        }}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}