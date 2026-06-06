// Cochlear — Product demo with iOS lock screen intro
const { useState, useEffect, useMemo } = React;

// ─── Theme tables ─────────────────────────────────────────────
const MOODS = {
  daylight: {
    name: 'Daylight',
    homeBg: '#fbfaf6',
    cardBg: '#f4f1ea',
    menuBg: '#f4f1ea',
    menuText: '#2a2520',
    menuMuted: 'rgba(42,37,32,0.10)',
    text: '#2a2520',
    subText: '#6b6258',
    statusColor: '#2a2520',
    cardDivider: 'rgba(0,0,0,0.06)',
    scrim: 'rgba(0,0,0,0.35)',
    patternBlend: 'normal',
    patternOpacity: 1,
    ctaBg: '#1b8ad6',
    ctaText: '#fff',
    shellShadow: '0 40px 80px rgba(40,30,15,0.18), 0 0 0 1px rgba(0,0,0,0.12)'
  },
  midnight: {
    name: 'Midnight',
    homeBg: '#100c08',
    cardBg: '#1a1510',
    menuBg: '#080604',
    menuText: '#f1ece2',
    menuMuted: 'rgba(245,241,234,0.10)',
    text: '#f1ece2',
    subText: '#9b9085',
    statusColor: '#f1ece2',
    cardDivider: 'rgba(255,255,255,0.07)',
    scrim: 'rgba(0,0,0,0.55)',
    patternBlend: 'screen',
    patternOpacity: 0.42,
    ctaBg: '#f1ece2',
    ctaText: '#0f0b07',
    shellShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)'
  },
  clinical: {
    name: 'Clinical',
    homeBg: '#ffffff',
    cardBg: '#f4f6fa',
    menuBg: '#0e1726',
    menuText: '#eef3fb',
    menuMuted: 'rgba(238,243,251,0.10)',
    text: '#0d1726',
    subText: '#5b6577',
    statusColor: '#0d1726',
    cardDivider: 'rgba(13,23,38,0.07)',
    scrim: 'rgba(13,23,38,0.45)',
    patternBlend: 'luminosity',
    patternOpacity: 0.55,
    ctaBg: '#0e6df0',
    ctaText: '#fff',
    shellShadow: '0 40px 80px rgba(15,30,60,0.16), 0 0 0 1px rgba(13,23,38,0.10)'
  }
};

// ─── Icons ────────────────────────────────────────────────────
const MI = ({ name, size = 24, weight = 400, fill = 0, color, style }) =>
  <span
    className="material-symbols-rounded"
    style={{
      fontSize: size,
      fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      color,
      lineHeight: 1,
      userSelect: 'none',
      ...style
    }}>
    {name}</span>;

const BatteryFull = ({ size = 28, color }) =>
  <svg width={size * 1.5} height={size} viewBox="0 0 42 28" fill="none" style={{ display: 'block' }}>
    <rect x="1" y="3" width="36" height="22" rx="3" stroke={color} strokeWidth="2" />
    <rect x="38" y="9" width="3" height="10" rx="1.5" fill={color} />
    <rect x="4" y="6" width="30" height="16" rx="1" fill={color} />
  </svg>;

const StatusOK = ({ size = 28, ringColor = '#3aaf3f' }) =>
  <svg width={size} height={size} viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="13" fill={ringColor} stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
    <path d="M8 14.5l4 4 8-9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;

// Gmail app icon (white rounded tile with multicolor M envelope)
const GmailIcon = ({ size = 38 }) =>
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', borderRadius: 9 }}>
    <rect width="48" height="48" rx="10" fill="#fff" />
    <g transform="translate(7 12)">
      <path d="M3 24V8.5L17 18 31 8.5V24a2 2 0 0 1-2 2h-3V13.5L17 20 8 13.5V26H5a2 2 0 0 1-2-2Z" fill="#4285F4" />
      <path d="M3 8.5V24a2 2 0 0 0 2 2h3V13.5L3 8.5Z" fill="#34A853" />
      <path d="M31 8.5V24a2 2 0 0 1-2 2h-3V13.5L31 8.5Z" fill="#FBBC04" />
      <path d="M3 6.2C3 4.4 5.1 3.4 6.5 4.5L17 12.4 27.5 4.5C28.9 3.4 31 4.4 31 6.2V8.5L17 18 3 8.5V6.2Z" fill="#EA4335" />
    </g>
  </svg>;

// Cochlear app icon (amber rounded tile with the Cochlear swirl logo)
const CochlearIcon = ({ size = 38, accent }) =>
  <div style={{
    width: size, height: size, borderRadius: 9, flexShrink: 0,
    background: accent || '#e0a23b',
    display: 'grid', placeItems: 'center',
  }}>
    <img src="cochlear-logo.png" alt="Cochlear" style={{ width: '74%', height: '74%', objectFit: 'contain' }} />
  </div>;

// ─── Lock Screen ──────────────────────────────────────────────
function LockScreen({ onOpenApp, onDismiss, accent }) {
  const [time, setTime] = useState(new Date());
  const [swiping, setSwiping] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const [liftY, setLiftY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = React.useRef(false);
  const dragStartRef = React.useRef(0);
  const liftRef = React.useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notifications = [
    { id: 0, type: 'gmail', sender: 'Cochlear', subject: "It's time to complete your Remote Check", text: 'Send to Anita through the app by Sunday 1 June.', time: 'now' },
    { id: 1, text: "It's time to complete your Remote Check", app: 'Cochlear' },
    { id: 2, text: "Have you recently replaced your Microphone protectors?", app: 'Cochlear' },
  ];

  const visible = notifications.filter(n => !dismissed.has(n.id));

  const handleSwipe = (id, deltaX) => {
    if (deltaX < -100) {
      setDismissed(prev => new Set([...prev, id]));
      setSwiping(null);
    }
  };

  // Swipe-up-to-unlock gesture on the bottom handle
  const beginLift = (y) => { dragStartRef.current = y; draggingRef.current = true; setDragging(true); };
  const moveLift = (y) => {
    if (!draggingRef.current) return;
    const dy = Math.min(0, y - dragStartRef.current);
    liftRef.current = dy;
    setLiftY(dy);
  };
  const endLift = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (liftRef.current < -110) {
      setLiftY(-1000);
      setTimeout(onDismiss, 300);
    } else {
      liftRef.current = 0;
      setLiftY(0);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      transform: `translateY(${liftY}px)`,
      opacity: Math.max(0, Math.min(1, 1 + liftY / 480)),
      transition: dragging ? 'none' : 'transform 320ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease',
      backgroundImage: 'url(uploads/pasted-1779332463010-0.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex', flexDirection: 'column',
      color: '#fff',
      overflow: 'hidden',
      willChange: 'transform, opacity',
    }}>
      {/* Dark overlay for text contrast */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.35)',
        pointerEvents: 'none',
      }} />
      <LiveStatusBar color="#fff" />

      {/* Clock - top center */}
      <div style={{
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 76, fontWeight: 200, lineHeight: 1,
          fontFamily: '-apple-system, system-ui',
          letterSpacing: -2,
        }}>
          {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div style={{
          fontSize: 18, fontWeight: 500, opacity: 0.7,
          fontFamily: '-apple-system, system-ui',
        }}>
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Notifications section */}
      {visible.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 240,
          left: 0,
          right: 0,
          paddingBottom: 120,
        }}>
          {/* Notification Centre heading */}
          <div style={{
            padding: '0 20px 12px',
            fontSize: 15,
            fontWeight: 600,
            opacity: 0.7,
            fontFamily: '-apple-system, system-ui',
          }}>
            Notification Centre
          </div>

          {/* Notification list */}
          <div style={{
            padding: '0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {visible.map((notif) => (
              <LockNotification
                key={notif.id}
                notif={notif}
                accent={accent[0]}
                onTap={() => onOpenApp()}
                onSwipe={(dx) => handleSwipe(notif.id, dx)}
                swiping={swiping}
                setSwiping={setSwiping}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draggable home handle — swipe up to unlock */}
      <div
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); beginLift(e.clientY); }}
        onPointerMove={(e) => moveLift(e.clientY)}
        onPointerUp={endLift}
        onPointerCancel={endLift}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 110,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 12,
          cursor: 'grab',
          touchAction: 'none',
          zIndex: 30,
        }}
      >
        <div style={{
          width: 139, height: 5, borderRadius: 100,
          background: 'rgba(255,255,255,0.55)',
          transition: 'background 200ms ease',
        }} />
      </div>
    </div>
  );
}

function LockNotification({ notif, accent, onTap, onSwipe, swiping, setSwiping }) {
  const [startX, setStartX] = useState(0);
  const [deltaX, setDeltaX] = useState(0);

  const handleStart = (e) => {
    const x = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setStartX(x);
    setSwiping(notif.id);
  };

  const handleMove = (e) => {
    if (swiping !== notif.id) return;
    const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const dx = x - startX;
    if (dx < 0) setDeltaX(dx);
  };

  const handleEnd = () => {
    if (swiping !== notif.id) return;
    if (deltaX > -100 && deltaX < -20) {
      // Not far enough, snap back
      setDeltaX(0);
      setSwiping(null);
    } else if (deltaX <= -100) {
      onSwipe(deltaX);
    } else if (Math.abs(deltaX) < 10) {
      // Tap
      onTap();
    }
    setDeltaX(0);
  };

  return (
    <div
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{
        transform: `translateX(${deltaX}px)`,
        transition: swiping === notif.id ? 'none' : 'transform 280ms ease-out',
        cursor: 'pointer',
      }}
    >
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 18,
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.1)',
      }}>
        {notif.type === 'gmail' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GmailIcon size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.1 }}>{notif.sender}</span>
                <span style={{ fontSize: 13, opacity: 0.6, marginLeft: 'auto', flexShrink: 0 }}>{notif.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{notif.subject}</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, lineHeight: 1.35, opacity: 0.85 }}>{notif.text}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CochlearIcon size={38} accent={accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.1 }}>{notif.app}</span>
                <span style={{ fontSize: 13, opacity: 0.6, marginLeft: 'auto', flexShrink: 0 }}>now</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.35 }}>{notif.text}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Backdrop variants ────────────────────────────────────────
function Backdrop({ backdrop, accent, mood }) {
  const m = MOODS[mood];
  const accentMain = accent[0];
  const accentDeep = accent[1] || accent[0];

  return (
    <div style={{ position: 'absolute', inset: 0, background: m.homeBg, overflow: 'hidden' }}>
      {backdrop === 'pebbles' &&
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(pattern-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          opacity: m.patternOpacity,
          mixBlendMode: m.patternBlend
        }} />
      }
      {backdrop === 'wash' &&
        <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} aria-hidden="true">
          <defs>
            <linearGradient id="washGrad" x1="100%" y1="0%" x2="20%" y2="100%">
              <stop offset="0%" stopColor={accentMain} stopOpacity="1" />
              <stop offset="100%" stopColor={accentDeep} stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <path d="M 420 -20 L 420 470 C 380 480, 350 440, 310 415 C 265 388, 220 425, 185 470 C 150 515, 105 560, 55 575 C 25 583, 0 580, -20 580 L -20 0 C 30 -10, 80 -15, 140 -18 C 220 -22, 320 -20, 420 -20 Z"
            fill="url(#washGrad)" opacity={mood === 'midnight' ? 0.75 : 1} />
        </svg>
      }
      {backdrop === 'quiet' &&
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(120% 80% at 100% -10%, ${accentMain}22 0%, transparent 55%)`
        }} />
      }
    </div>
  );
}

// ─── Flyout menu ──────────────────────────────────────────────
function Flyout({ open, onClose, mood, accent }) {
  const m = MOODS[mood];
  const accentMain = accent[0];

  const items1 = [
    { icon: 'monitoring', label: 'Hearing Insights' },
    { icon: 'location_on', label: 'Locate Device' },
    { icon: 'mobile_check', label: 'Remote Check' },
    { icon: 'chat_bubble', label: 'Message Centre' }
  ];
  const items2 = [
    { icon: 'settings', label: 'Settings' },
    { icon: 'menu_book', label: 'Help & Support' }
  ];
  const items3 = [
    { icon: 'restart_alt', label: 'Reset to Defaults' }
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 40,
        background: open ? m.scrim : 'rgba(0,0,0,0)',
        transition: 'background 260ms ease',
        pointerEvents: open ? 'auto' : 'none'
      }} />
      <aside style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 41,
        width: 'min(88%, 340px)',
        background: m.menuBg, color: m.menuText,
        transform: open ? 'translateX(0)' : 'translateX(-103%)',
        transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '0 0 60px rgba(0,0,0,0.35)' : 'none'
      }} aria-hidden={!open}>
        <div style={{ height: 'var(--statusbar-h, 54px)' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 18px 14px' }}>
          <button onClick={onClose} aria-label="Close menu" style={{
            background: 'transparent', border: 0, padding: 8, cursor: 'pointer',
            color: m.menuText, opacity: 0.85, display: 'grid', placeItems: 'center'
          }}>
            <MI name="close" size={28} weight={300} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
          <MenuGroup items={items1} accent={accentMain} text={m.menuText} />
          <Divider color={m.menuMuted} />
          <MenuGroup items={items2} accent={accentMain} text={m.menuText} />
          <Divider color={m.menuMuted} />
          <MenuGroup items={items3} accent={accentMain} text={m.menuText} />
        </div>
      </aside>
    </>
  );
}

const Divider = ({ color }) => <div style={{ height: 1, background: color, margin: '12px 24px' }} />;

function MenuGroup({ items, accent, text }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((it) =>
        <li key={it.label}>
          <button style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 18,
            padding: '14px 26px', background: 'transparent', border: 0, cursor: 'pointer',
            color: text, fontFamily: 'inherit', fontSize: 17, fontWeight: 400, textAlign: 'left'
          }}>
            <MI name={it.icon} size={26} weight={400} color={accent} />
            <span>{it.label}</span>
          </button>
        </li>
      )}
    </ul>
  );
}

// ─── In-app Notifications ─────────────────────────────────────
function Notifications({ mood, accent, onOpenRemoteCheck }) {
  const m = MOODS[mood];
  const accentMain = accent[0];

  const notifications = [
    { id: 1, subject: 'Remote Check', text: "It's time to complete your Remote Check", action: onOpenRemoteCheck },
    { id: 2, subject: 'Hearing Health', text: "Have you recently replaced your Microphone protectors?" },
  ];

  return (
    <div style={{
      position: 'absolute', top: 'calc(var(--statusbar-h, 54px) + 60px)',
      left: 16, right: 16, zIndex: 10,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {notifications.map((notif) => (
        <div key={notif.id} onClick={() => notif.action && notif.action()} style={{
          background: mood === 'midnight' ? 'rgba(45,42,38,0.95)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 18, padding: '14px 16px',
          boxShadow: mood === 'midnight'
            ? '0 8px 24px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08)'
            : '0 8px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
          cursor: notif.action ? 'pointer' : 'default',
        }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: m.text }}>
            {notif.subject}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 15, lineHeight: 1.35, color: m.text }}>
            {notif.text}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Home screen ──────────────────────────────────────────────
function Home({ onMenu, mood, backdrop, accent, onOpenRemoteCheck }) {
  const m = MOODS[mood];
  const accentMain = accent[0];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Backdrop backdrop={backdrop} accent={accent} mood={mood} />
        <Notifications mood={mood} accent={accent} onOpenRemoteCheck={onOpenRemoteCheck} />

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'calc(var(--statusbar-h, 54px) + 6px) 18px 0'
        }}>
          <button onClick={onMenu} aria-label="Open menu" style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'grid', placeItems: 'center', color: m.text
          }}>
            <MI name="menu" size={30} weight={400} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BatteryFull size={26} color={mood === 'midnight' ? '#7cd185' : '#1f7a3a'} />
            <StatusOK size={28} ringColor={mood === 'midnight' ? '#48c057' : '#3aaf3f'} />
          </div>
        </div>
      </div>

      <section style={{
        background: m.cardBg,
        borderTop: `1px solid ${m.cardDivider}`,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        color: m.text
      }}>
        <Row>
          <RowLabel color={m.text}>Volume</RowLabel>
          <span style={{ fontSize: 56, fontWeight: 300, color: m.text, lineHeight: 1, letterSpacing: -1 }}>6</span>
        </Row>
        <RowDivider color={m.cardDivider} />
        <Row>
          <RowLabel color={m.text}>Program</RowLabel>
          <ProgramScanGlyph stroke={m.text} accent={accentMain} />
        </Row>
        <RowDivider color={m.cardDivider} />
        <Row>
          <RowLabel color={m.text}>Audio Sources</RowLabel>
          <AudioSourcesGlyph stroke={m.text} accent={accentMain} />
        </Row>
      </section>
    </div>
  );
}

const Row = ({ children }) => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 26px', minHeight: 76 }}>{children}</div>;
const RowDivider = ({ color }) => <div style={{ height: 1, background: color, margin: '0 24px' }} />;
const RowLabel = ({ children, color }) => <span style={{ fontSize: 18, fontWeight: 500, color, letterSpacing: 0.1 }}>{children}</span>;

function ProgramScanGlyph({ stroke, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="42" height="42" viewBox="0 0 42 42">
        <path d="M11 7 H33 A4 4 0 0 1 37 11 V27 A4 4 0 0 1 33 31 H22 L15 36.5 V31 H11 A4 4 0 0 1 7 27 V11 A4 4 0 0 1 11 7 Z"
          fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
        <path d="M3.5 14 A8 8 0 0 1 11.5 6" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M1 17 A12 12 0 0 1 13 5" stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55" />
      </svg>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: stroke }}>SCAN</span>
    </div>
  );
}

function AudioSourcesGlyph({ stroke, accent }) {
  return (
    <svg width="48" height="40" viewBox="0 0 48 40">
      <path d="M22 4 C13 4 8 11 8 19 C8 25 11 28 13 30 C15 32 16 33 16 35 C16 37 17 38 19 38 C22 38 23 35 23 33 C23 30 21 28 21 25 C21 23 22 22 24 22 C27 22 29 20 29 17 C29 14 27 12 24 12 C22 12 21 13 21 14 C21 16 23 16 23 15"
        fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="33" y="22" width="2.4" height="8" rx="1.2" fill={accent} />
      <rect x="37" y="18" width="2.4" height="16" rx="1.2" fill={accent} />
      <rect x="41" y="14" width="2.4" height="24" rx="1.2" fill={accent} />
    </svg>
  );
}

// ─── Tweaks panel ─────────────────────────────────────────────
const ACCENT_OPTIONS = [
  ['#e0a23b', '#7a4f15'],
  ['#e86a4a', '#7d2a1b'],
  ['#7fae6b', '#2f5230'],
  ['#3f7adf', '#16306b']
];

function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Mood" />
      <TweakRadio label="Surface" value={t.mood} options={['daylight', 'midnight', 'clinical']} onChange={(v) => setTweak('mood', v)} />
      <TweakSection label="Hero" />
      <TweakRadio label="Backdrop" value={t.backdrop} options={['pebbles', 'wash', 'quiet']} onChange={(v) => setTweak('backdrop', v)} />
      <TweakSection label="Accent" />
      <TweakColor label="Palette" value={t.accent} options={ACCENT_OPTIONS} onChange={(v) => setTweak('accent', v)} />
    </TweaksPanel>
  );
}

// ─── iOS Home Screen (image + live status bar + Nucleus Smart hotspot) ──────────
const NUCLEUS_HOTSPOT = { left: '4%', top: '31%', width: '17%', height: '12%' };

// White "app opening" box that scales from the icon to fullscreen, then fades out
function LaunchOverlay({ phase }) {
  if (!phase) return null;
  const base = {
    position: 'absolute', background: '#fff', zIndex: 55, pointerEvents: 'none',
    display: 'grid', placeItems: 'center',
  };
  let style;
  if (phase === 'start') {
    style = { ...base, ...NUCLEUS_HOTSPOT, borderRadius: 20, opacity: 1, transition: 'none' };
  } else if (phase === 'expand') {
    style = {
      ...base, left: '0%', top: '0%', width: '100%', height: '100%', borderRadius: 0, opacity: 1,
      transition: 'left 400ms cubic-bezier(0.4,0,0.2,1), top 400ms cubic-bezier(0.4,0,0.2,1), width 400ms cubic-bezier(0.4,0,0.2,1), height 400ms cubic-bezier(0.4,0,0.2,1), border-radius 400ms ease',
    };
  } else { // fade
    style = {
      ...base, left: '0%', top: '0%', width: '100%', height: '100%', borderRadius: 0, opacity: 0,
      transition: 'opacity 360ms ease',
    };
  }
  return <div style={style} />;
}

function PhoneHomeScreen({ onOpenApp }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'url(home-screen.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
    }}>
      <LiveStatusBar color="#fff" />

      {/* Nucleus Smart app icon hotspot */}
      <button
        onClick={onOpenApp}
        aria-label="Open Nucleus Smart"
        style={{
          position: 'absolute',
          ...NUCLEUS_HOTSPOT,
          background: 'transparent', border: 0, cursor: 'pointer',
          borderRadius: 18,
        }}
      />
    </div>
  );
}

// ─── Reusable live status bar (time + battery) ───────────────
function LiveStatusBar({ color = '#fff' }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 54,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px 0', boxSizing: 'border-box',
      color, fontFamily: '-apple-system, system-ui',
      pointerEvents: 'none', zIndex: 25,
    }}>
      <span style={{ fontWeight: 600, fontSize: 16 }}>
        {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
        <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/><rect x="5" y="5" width="3" height="6" rx="0.6" fill="currentColor"/><rect x="10" y="2.5" width="3" height="8.5" rx="0.6" fill="currentColor"/><rect x="15" y="0" width="3" height="11" rx="0.6" fill="currentColor"/></svg>
        <span>100%</span>
      </div>
    </div>
  );
}

// Invisible tap target
const Hotspot = ({ onClick, label, style }) => (
  <button
    onClick={onClick}
    aria-label={label}
    style={{
      position: 'absolute', background: 'transparent', border: 0, cursor: 'pointer',
      borderRadius: 14, padding: 0, ...style,
    }}
  />
);

// ─── Remote Check — intro screen ──────────────────────────────
function RemoteCheckStart({ onBack, onStart }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#2a2521' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(remote-check-start.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat',
      }} />
      <LiveStatusBar color="#fff" />
      <Hotspot label="Back" onClick={onBack} style={{ left: '1%', top: '6%', width: '15%', height: '6%' }} />
      <Hotspot label="Get started" onClick={onStart} style={{ left: '4%', top: '80.5%', width: '92%', height: '8.5%', borderRadius: 40 }} />
    </div>
  );
}

// ─── Remote Check — progress screen ───────────────────────────
function RemoteCheckProgress({ onBack }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#2a2521',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(remote-check-progress.png)',
        backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat',
      }} />
      <LiveStatusBar color="#fff" />
      <Hotspot label="Back" onClick={onBack} style={{ left: '1%', top: '6%', width: '15%', height: '6%' }} />
    </div>
  );
}

// ─── In-app navigation stack (dashboard → remote check → progress) ──
function AppScreens({ t, menuOpen, setMenuOpen }) {
  const [view, setView] = useState('dashboard');
  const [anim, setAnim] = useState(null); // { base, moving, dir }

  const go = (to, dir) => {
    setAnim(dir === 'forward' ? { base: view, moving: to, dir } : { base: to, moving: view, dir });
    setView(to);
    setTimeout(() => setAnim(null), 360);
  };

  const renderView = (name) => {
    if (name === 'dashboard') {
      return (
        <>
          <Home
            mood={t.mood} backdrop={t.backdrop} accent={t.accent}
            onMenu={() => setMenuOpen(true)}
            onOpenRemoteCheck={() => go('remotecheck', 'forward')}
          />
          <Flyout open={menuOpen} onClose={() => setMenuOpen(false)} mood={t.mood} accent={t.accent} />
          <LiveStatusBar color={MOODS[t.mood].statusColor} />
        </>
      );
    }
    if (name === 'remotecheck') {
      return <RemoteCheckStart onBack={() => go('dashboard', 'back')} onStart={() => go('progress', 'forward')} />;
    }
    if (name === 'progress') {
      return <RemoteCheckProgress onBack={() => go('remotecheck', 'back')} />;
    }
    return null;
  };

  if (!anim) {
    return <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>{renderView(view)}</div>;
  }

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>{renderView(anim.base)}</div>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        animation: `${anim.dir === 'forward' ? 'omSlideInRight' : 'omSlideOutRight'} 360ms cubic-bezier(0.22,1,0.36,1) both`,
        boxShadow: '-12px 0 32px rgba(0,0,0,0.28)',
      }}>{renderView(anim.moving)}</div>
    </>
  );
}

// ─── App shell with demo flow ─────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('lock'); // 'lock' | 'home' | 'app'
  const [launch, setLaunch] = useState(null); // null | 'start' | 'expand' | 'fade'
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  // iOS-style app-open: white box grows from the icon, holds, then fades to reveal the app
  const launchApp = () => {
    if (launch) return;
    setLaunch('start');
    requestAnimationFrame(() => requestAnimationFrame(() => setLaunch('expand')));
    setTimeout(() => setScreen('app'), 420);  // mount the app beneath once the box has filled
    setTimeout(() => setLaunch('fade'), 800);  // begin fade-out after 800ms
    setTimeout(() => setLaunch(null), 1180);   // remove overlay once faded
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen && isPhone ? 'hidden' : '';
  }, [menuOpen, isPhone]);

  const m = MOODS[t.mood];

  useEffect(() => {
    if (isPhone) return;
    document.body.style.background = t.mood === 'midnight' ? 'oklch(0.15 0.005 60)' :
      t.mood === 'clinical' ? 'oklch(0.96 0.005 240)' : 'oklch(0.96 0.005 80)';
    return () => { document.body.style.background = ''; };
  }, [t.mood, isPhone]);

  const homeProps = { mood: t.mood, backdrop: t.backdrop, accent: t.accent };

  const content = screen === 'app' ? (
    <AppScreens t={t} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
  ) : (
    <>
      {/* iOS home screen sits as the base layer; the lock screen lifts away to reveal it */}
      <PhoneHomeScreen onOpenApp={launchApp} />
      {screen === 'lock' && (
        <LockScreen
          onOpenApp={() => setScreen('app')}
          onDismiss={() => setScreen('home')}
          accent={t.accent}
        />
      )}
    </>
  );

  if (isPhone) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: m.homeBg,
        ['--statusbar-h']: 'calc(env(safe-area-inset-top, 0px) + 18px)'
      }}>
        {content}
        <LaunchOverlay phase={launch} />
        <TweaksUI t={t} setTweak={setTweak} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ position: 'relative', width: 402, height: 830 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 48, overflow: 'hidden',
          background: screen === 'lock' ? '#1a1715' : m.homeBg,
          boxShadow: m.shellShadow,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          ['--statusbar-h']: '54px'
        }}>
          <div style={{
            position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
            width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50
          }} />
          {content}
          {screen === 'app' && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
              height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              paddingBottom: 8, pointerEvents: 'none'
            }}>
              <div style={{
                width: 139, height: 5, borderRadius: 100,
                background: t.mood === 'midnight' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.25)'
              }} />
            </div>
          )}
          <LaunchOverlay phase={launch} />
        </div>
      </div>
      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(<App />);
