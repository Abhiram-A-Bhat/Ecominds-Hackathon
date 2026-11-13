import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LockIcon as Lock } from '@phosphor-icons/react/dist/csr/Lock';
import { ArrowUpIcon as ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { ShieldIcon as Shield } from '@phosphor-icons/react/dist/csr/Shield';
import { FlameIcon as Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { RobotIcon as Bot } from '@phosphor-icons/react/dist/csr/Robot';
import { SignOutIcon as LogOut } from '@phosphor-icons/react/dist/csr/SignOut';
import { BroadcastIcon as Radar } from '@phosphor-icons/react/dist/csr/Broadcast';
import { ArrowCounterClockwiseIcon as RotateCcw } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Router, useRouter, Link } from './router/Router';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { Sidebar } from './components/shell/Sidebar';
import { Topbar } from './components/shell/Topbar';
import { MobileTabBar, MobileDrawer } from './components/shell/MobileNav';
import { CommandPalette, useRecentRoutes } from './components/CommandPalette';
import { getRoute, canAccess, interfacesFor, ROUTES } from './config/navigation';
import { useGlobalSpotlight, useScrollState, useAutoReveal } from './hooks/useMotion';
import { EcoCopilot } from './components/EcoCopilot';
import { GamificationDrawer } from './components/GamificationDrawer';
import { ActionMeshCenter } from './components/ActionMeshCenter';
import { GreenGuardianDrawer } from './components/GreenGuardianDrawer';
import { EcoMascotPopup } from './components/EcoMascotPopup';
import { GuardianAlarm } from './components/guardian/GuardianAlarm';
import { PlantReminder } from './components/PlantReminder';
import { plantCareService } from './services/plantCareService';
import { triggerEcoCelebration } from './utils/ecoCelebration';
import { actionMesh } from './services/actionMeshService';
import { guardianTaskService } from './services/guardianTaskService';
import { useAuth, resetLiveUsers } from './contexts/AuthContext';

// Pages
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AiScannerPage } from './pages/AiScannerPage';
import { CampusBinsPage } from './pages/CampusBinsPage';
import { EwastePage } from './pages/EwastePage';
import { ExchangePage } from './pages/ExchangePage';
import { CafeteriaPage } from './pages/CafeteriaPage';
import { CampusTreesPage } from './pages/CampusTreesPage';
import { CleanerOpsPage } from './pages/CleanerOpsPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { TraceabilityLedgerPage } from './pages/TraceabilityLedgerPage';
import { BountiesPage } from './pages/BountiesPage';
import { NaacAuditPage } from './pages/NaacAuditPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { RnsitIdeasPage } from './pages/RnsitIdeasPage';
import { AdminVerificationPage } from './pages/AdminVerificationPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { CctvSentinelPage } from './pages/CctvSentinelPage';
import { AdoptPlantPage } from './pages/AdoptPlantPage';
import { OverseerPage } from './pages/OverseerPage';
import { PlantReportsPage } from './pages/PlantReportsPage';
import { StudentFeedbackPage } from './pages/StudentFeedbackPage';

import { 
  INITIAL_BINS, 
  SALVAGED_EWASTE_ITEMS, 
  PASS_THE_TORCH_ITEMS, 
  CAMPUS_TREES, 
  SURPLUS_FOOD_BROADCASTS 
} from './data/mockData';

// ─── Route guard: page exists but belongs to another interface ──────────────
function NoAccessNotice({ path, roleTitle }) {
  const homes = interfacesFor(path);
  const title = ROUTES[path] ? (typeof ROUTES[path].title === 'string' ? ROUTES[path].title : Object.values(ROUTES[path].title)[0]) : 'This page';
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div className="glass" style={{ maxWidth: 520, padding: '40px 32px', borderRadius: 24, textAlign: 'center', borderColor: 'rgba(248,113,113,.25)' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 18px', borderRadius: 20, display: 'grid', placeItems: 'center',
          background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', color: '#f87171',
          animation: 'popIn .6s var(--ease-spring) both, float 5s ease-in-out .6s infinite',
        }}>
          <Lock size={26} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{title} lives in another interface</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 24px' }}>
          You're signed in as <strong>{roleTitle}</strong>. This module is part of the <strong>{homes.join(' and ')}</strong> interface{homes.length > 1 ? 's' : ''}.
        </p>
        <Link to="/" className="btn-eco" style={{ padding: '11px 22px', textDecoration: 'none', fontSize: 13.5 }}>
          Back to my home
        </Link>
      </div>
    </div>
  );
}

// Missed plant waterings are settled for every adopter while anyone has the app open.
function usePlantSettlement(adjustPoints, currentUser) {
  useEffect(() => {
    if (!currentUser) return;
    const run = () => {
      plantCareService.settle().forEach(o => {
        adjustPoints(o.userId, o.delta, `Missed watering: ${o.plant.name} (${o.misses} cycle${o.misses > 1 ? 's' : ''})`, 'TREE');
        if (o.userId === currentUser.id) {
          triggerEcoCelebration({ title: `${o.plant.name} went thirsty`, message: `You missed ${o.misses} watering${o.misses > 1 ? 's' : ''}. ${o.delta} EcoCredits.${o.shielded ? ' Your streak shield kept your streak alive.' : ''}`, points: 0, badge: `${o.delta} pts` });
        }
      });
    };
    run();
    plantCareService.refreshConditions(); // re-plan schedules from live weather
    const wx = setInterval(() => plantCareService.refreshConditions(), 15 * 60e3);
    const unsub = plantCareService.subscribe(() => setTimeout(run, 0));
    const iv = setInterval(run, 30000);
    return () => { unsub(); clearInterval(iv); clearInterval(wx); };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

function BackToTop() {
  const { y } = useScrollState(600);
  return (
    <button
      type="button"
      className={`btn-ghost back-to-top ${y > 600 ? 'show' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={y > 600 ? 0 : -1}
      style={{ padding: '8px 14px', fontSize: 12, background: 'rgba(5,17,11,.9)', backdropFilter: 'blur(12px)' }}
    >
      <ArrowUp size={14} /> Top
    </button>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <div>
        <div className="gradient-text" style={{ fontSize: 'clamp(72px, 14vw, 140px)', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1 }}>404</div>
        <p style={{ color: 'var(--text-2)', fontSize: 15, margin: '10px 0 24px' }}>This corner of campus hasn’t been planted yet.</p>
        <Link to="/" className="btn-eco" style={{ padding: '11px 22px', textDecoration: 'none', fontSize: 13.5 }}>Take me home</Link>
      </div>
    </div>
  );
}

// ─── Auth-gated app shell ───────────────────────────────────────────────────
function AppContent() {
  const { path, navigate, navKey } = useRouter();
  const { currentUser, role, roleMeta, isAdmin, isStudent, updateCredits, adjustPoints, getLiveUsers, logout } = useAuth();
  usePlantSettlement(adjustPoints, currentUser);
  useGlobalSpotlight();
  useRecentRoutes(path);
  const routeViewRef = useRef(null);
  useAutoReveal(routeViewRef, `${path}:${!!currentUser}`);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser && path !== '/login') {
      navigate('/login');
    }
    if (currentUser && path === '/login') {
      navigate('/');
    }
  }, [currentUser, path]);

  // Shared campus-state (bins, trees, etc.)
  const [bins, setBins] = useState(INITIAL_BINS);
  const [salvagedItems, setSalvagedItems] = useState(SALVAGED_EWASTE_ITEMS);
  const [exchangeItems, setExchangeItems] = useState(PASS_THE_TORCH_ITEMS);
  const [trees, setTrees] = useState(CAMPUS_TREES);
  const [surplusAlerts, setSurplusAlerts] = useState(SURPLUS_FOOD_BROADCASTS);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isActionMeshOpen, setIsActionMeshOpen] = useState(false);
  const [isGuardianDrawerOpen, setIsGuardianDrawerOpen] = useState(false);
  const [userXp, setUserXp] = useState(currentUser?.xp ?? 0);

  // Derive credits from current user (falls back gracefully for admin)
  const userCredits = currentUser?.credits ?? 0;
  const setUserCredits = (updater) => {
    const latestCredits = getLiveUsers().find(u => u.id === currentUser?.id)?.credits ?? userCredits;
    const next = typeof updater === 'function' ? updater(latestCredits) : updater;
    updateCredits(next - latestCredits);
  };

  // Request notification permission once on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Watch for bins going CRITICAL and fire browser notification
  const prevBinsRef = useRef(bins);
  useEffect(() => {
    const prevBins = prevBinsRef.current;
    bins.forEach(bin => {
      const prev = prevBins.find(b => b.id === bin.id);
      if (prev && prev.fillLevel < 80 && bin.fillLevel >= 80) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 Ecominds Alert: Bin Surge Detected', {
            body: `${bin.name} (${bin.block}) has reached ${bin.fillLevel}% — immediate collection needed.`,
            icon: '/brand/rnsit-25th-anniversary.png',
            tag: bin.id,
          });
        }
      }
    });
    prevBinsRef.current = bins;
  }, [bins]);

  // Global Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sidebar collapse (persisted) + mobile drawer
  const [sbCollapsed, setSbCollapsed] = useState(() => {
    try { return localStorage.getItem('ecosphere_sb_collapsed') === '1'; } catch { return false; }
  });
  const toggleSidebar = useCallback(() => setSbCollapsed(c => {
    try { localStorage.setItem('ecosphere_sb_collapsed', c ? '0' : '1'); } catch { /* storage unavailable */ }
    return !c;
  }), []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useEffect(() => { setDrawerOpen(false); }, [path]);

  // "[" toggles the sidebar (ignored while typing)
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.target?.isContentEditable) toggleSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  // Theme the whole UI to the signed-in interface (accent colours read --role)
  useEffect(() => {
    if (role) document.documentElement.dataset.role = role;
    else delete document.documentElement.dataset.role;
  }, [role]);

  // Dynamic page title per route — WCAG 2.4.2 (Page Titled)
  useEffect(() => {
    const route = getRoute(path, role || 'STUDENT');
    const pageTitle = path === '/login' ? 'Sign In' : route?.title || 'Not found';
    document.title = `${pageTitle} — Ecominds RNSIT`;
  }, [path, role]);

  const handleEmptyBin = (binId) => {
    setBins(prev => prev.map(bin => {
      if (bin.id === binId) {
        return { ...bin, fillLevel: 5, status: 'NORMAL', lastCollected: 'Just now' };
      }
      return bin;
    }));
    const openTicket = actionMesh.getTickets().find(t => t.targetEntityId === binId && t.status !== 'RESOLVED');
    if (openTicket) {
      actionMesh.resolveTicket(openTicket.id, `Cleared & verified by Ground Ops at ${new Date().toLocaleTimeString()}`);
    }
    guardianTaskService.completeAssignedTasksForTarget(binId, currentUser);
    triggerEcoCelebration({
      title: `Bin ${binId} Cleared & Compacted!`,
      message: "Diverted from landfill into campus circular sorting stream",
      points: 0
    });
  };

  const handleUpdateBinFill = (binId, newLevel) => {
    const targetBin = bins.find(b => b.id === binId) || { name: `Bin ${binId}`, block: 'Campus Grounds' };
    setBins(prev => prev.map(bin => {
      if (bin.id === binId) {
        let status = 'NORMAL';
        if (newLevel >= 80) status = 'CRITICAL';
        else if (newLevel >= 60) status = 'WARNING';
        return { ...bin, fillLevel: newLevel, status };
      }
      return bin;
    }));

    if (newLevel >= 80) {
      triggerEcoCelebration({
        title: `🚨 IOT BIN SURGE: ${targetBin.name}!`,
        message: `Ultrasonic sensor reports ${newLevel}% full. A collection task was assigned to Ramesh K. in Ground Ops.`,
        points: 0,
        badge: `SURGE ${newLevel}%`
      });

      const activeCollection = guardianTaskService.getTasks().some(task =>
        task.category === 'BIN_OVERFLOW' && task.targetId === binId && task.status !== 'COMPLETED');
      if (!activeCollection) {
        guardianTaskService.createTask({
          title: `Empty ${targetBin.name} (${binId}) — sensor at ${newLevel}%`,
          targetId: binId,
          assignedStaffId: 'staff-001',
          assignedStaffName: 'Ramesh K.',
          location: `${targetBin.block} (12.9018° N, 77.5184° E)`,
          category: 'BIN_OVERFLOW',
          severity: 'CRITICAL',
          points: 0,
          co2Saved: 'Prevents corridor littering & cross-stream contamination',
          detectedBy: 'Ultrasonic HC-SR04 IoT Array',
          appliances: 'Campus bin collection',
        });
      }
    }
  };

  // Show login page without shell
  if (!currentUser || path === '/login') {
    return <LoginPage />;
  }

  const openGuardians = () => setIsGuardianDrawerOpen(true);
  const routeTable = {
    '/':             () => <HomePage bins={bins} userCredits={userCredits} salvagedItems={salvagedItems} trees={trees} surplusAlerts={surplusAlerts} onOpenGuardians={openGuardians} onOpenSearch={() => setIsSearchOpen(true)} />,
    '/cctv-sentinel':() => <CctvSentinelPage />,
    '/rnsit-matrix': () => <RnsitIdeasPage userCredits={userCredits} setUserCredits={setUserCredits} onOpenActionMesh={() => setIsActionMeshOpen(true)} />,
    '/scanner':      () => <AiScannerPage userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/bins':         () => <CampusBinsPage bins={bins} onEmptyBin={handleEmptyBin} />,
    '/ewaste':       () => <EwastePage salvagedItems={salvagedItems} setSalvagedItems={setSalvagedItems} userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/traceability': () => <TraceabilityLedgerPage />,
    '/exchange':     () => <ExchangePage userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/mess':         () => <CafeteriaPage surplusAlerts={surplusAlerts} setSurplusAlerts={setSurplusAlerts} userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/bounties':     () => <BountiesPage userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/trees':        () => <CampusTreesPage trees={trees} setTrees={setTrees} userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/cleaner-ops':  () => <CleanerOpsPage bins={bins} onEmptyBin={handleEmptyBin} />,
    '/admin':        () => <AdminAnalyticsPage bins={bins} onUpdateBinFill={handleUpdateBinFill} />,
    '/admin-verify': () => <AdminVerificationPage />,
    '/audit':        () => <NaacAuditPage />,
    '/leaderboard':  () => <LeaderboardPage userCredits={userCredits} setUserCredits={setUserCredits} />,
    '/profile':      () => <StudentProfilePage />,
    '/adopt':        () => <AdoptPlantPage />,
    '/overseer':     () => <OverseerPage />,
    '/feedback':     () => <StudentFeedbackPage />,
    '/plant-reports':() => <PlantReportsPage />,
  };
  const render = routeTable[path];
  const page = !render ? <NotFound /> : !canAccess(path, role) ? <NoAccessNotice path={path} roleTitle={roleMeta?.title} /> : render();

  const resetDemo = () => {
    if (!window.confirm('Reset all demo data (points, tasks, plants, Overseer seat) for every interface?')) return;
    resetLiveUsers(); guardianTaskService.reset(); plantCareService.reset();
    try { Object.keys(sessionStorage).filter(k => k.startsWith('ecosphere_alarm_seen_')).forEach(k => sessionStorage.removeItem(k)); } catch { /* ignore */ }
  };
  const quickActions = [
    { title: isStudent ? 'Open my Guardian missions' : 'Open Guardian dispatch board', hint: isStudent ? 'Claim live campus tasks' : 'Watch students claim tasks', icon: Shield, accent: '#34d399', run: openGuardians },
    { title: 'Demo: raise a sensor detection', hint: 'Rings every Green Guardian', icon: Radar, accent: '#fbbf24', run: () => guardianTaskService.simulateDetection() },
    isStudent
      ? { title: 'Daily quests & Eco-Wheel', hint: 'Keep your streak alive', icon: Flame, accent: '#fbbf24', run: () => setIsGamificationOpen(true) }
      : { title: 'Open Hermes dispatch mesh', hint: 'Autonomous ticket routing', icon: Bot, accent: '#c084fc', run: () => setIsActionMeshOpen(true) },
    ...(isAdmin ? [{ title: 'Reset demo data', hint: 'Points, tasks, plants and the Overseer seat', icon: RotateCcw, accent: '#f87171', run: resetDemo }] : []),
    { title: 'Sign out', hint: currentUser.name, icon: LogOut, accent: '#f87171', run: logout },
  ];

  return (
    <div className={`app-shell ${sbCollapsed ? 'sb-collapsed' : ''}`}>
      {navKey > 0 && <div key={navKey} className="route-progress" aria-hidden="true" />}

      {/* Skip to main content — keyboard accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        style={{
          position: 'fixed', top: -60, left: 12,
          background: 'var(--green)', color: '#022c1c',
          fontWeight: 900, fontSize: 13, padding: '8px 18px',
          borderRadius: 8, textDecoration: 'none', zIndex: 9999,
          transition: 'top 0.2s',
        }}
        onFocus={e => { e.currentTarget.style.top = '12px'; }}
        onBlur={e => { e.currentTarget.style.top = '-60px'; }}
      >
        Skip to main content
      </a>

      <Sidebar collapsed={sbCollapsed} onToggle={toggleSidebar} bins={bins} />

      <div className="main-col" style={{ position: 'relative', zIndex: 1 }}>
        <Topbar
          userCredits={userCredits}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenGamification={() => setIsGamificationOpen(true)}
          onOpenActionMesh={() => setIsActionMeshOpen(true)}
          onOpenGuardians={openGuardians}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <main id="main-content" style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(16px, 3vw, 28px) clamp(14px, 3vw, 32px) 80px', width: '100%', flex: 1 }}>
          <div key={path} ref={routeViewRef} className="route-view">
            <RouteErrorBoundary resetKey={path}>
              {page}
            </RouteErrorBoundary>
          </div>
        </main>

        <footer role="contentinfo" className="print:hidden" style={{ borderTop: '1px solid var(--border)', padding: '22px clamp(14px, 3vw, 32px)' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, color: 'var(--text-3)' }}>
            <span>
              <strong style={{ color: 'var(--text-2)' }}>RNS Institute of Technology</strong> · Team <strong style={{ color: 'var(--green)' }}>ECO MINDS</strong> · Faculty Hackathon 2026
            </span>
            <span title="Divyashree S · Sowmyashree S · Kavitha S · Purnima S Mittalkod · Nayana C P · Harshitha P">
              UN SDG 11 · 12 · 13 · Mission LiFE
              {isAdmin && <> · <Link to="/audit" style={{ color: 'var(--green)', textDecoration: 'none' }}>NAAC archive</Link></>}
            </span>
          </div>
        </footer>
      </div>

      <MobileTabBar onOpenDrawer={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />

      <BackToTop />

      {/* Global overlays */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        bins={bins}
        salvagedItems={salvagedItems}
        quickActions={quickActions}
      />

      <EcoCopilot />

      <GamificationDrawer
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        userCredits={userCredits}
        setUserCredits={setUserCredits}
        lifetimePoints={currentUser?.lifetimePoints ?? userCredits}
        userXp={userXp}
        onAddXp={(amount) => {
          setUserXp(prev => {
            const next = prev + amount;
            return next;
          });
        }}
      />

      <ActionMeshCenter
        isOpen={isActionMeshOpen}
        onClose={() => setIsActionMeshOpen(false)}
        bins={bins}
        onEmptyBin={handleEmptyBin}
        trees={trees}
        setTrees={setTrees}
        userCredits={userCredits}
        setUserCredits={setUserCredits}
        onAddXp={(amount) => setUserXp(prev => prev + amount)}
      />

      <GreenGuardianDrawer
        isOpen={isGuardianDrawerOpen}
        onClose={() => setIsGuardianDrawerOpen(false)}
        userCredits={userCredits}
        setUserCredits={setUserCredits}
      />

      <EcoMascotPopup />

      {isStudent && <GuardianAlarm onOpenMissions={openGuardians} />}
      {isStudent && <PlantReminder />}
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
