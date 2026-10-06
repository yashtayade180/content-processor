import { useState, useRef, useCallback } from 'react'
import './App.css'

// ── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          '#0a0b0f',
  topNav:      '#0d0f15',
  sidebar:     '#0d0f15',
  card:        '#12141b',
  border:      'rgba(255,255,255,0.07)',
  accent:      '#7c6af7',
  accentBg:    'rgba(124,106,247,0.14)',
  teal:        '#2dd4bf',
  tealBg:      'rgba(45,212,191,0.1)',
  tealBorder:  'rgba(45,212,191,0.25)',
  text:        '#ffffff',
  sub:         '#9ca3af',
  muted:       '#4b5563',
  green:       '#22c55e',
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2"  y="3"  width="9" height="12" rx="2" fill="#8b7cf8" />
    <rect x="7"  y="6"  width="9" height="12" rx="2" fill="#8b7cf8" fillOpacity="0.5" />
    <rect x="13" y="10" width="7" height="9"  rx="2" fill="#8b7cf8" fillOpacity="0.28" />
  </svg>
)

const IconFile = ({ color = '#6b7280' }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

const IconGrid = ({ color = '#6b7280' }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="3"  width="7" height="7"/>
    <rect x="14" y="3"  width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3"  y="14" width="7" height="7"/>
  </svg>
)

const IconTransfer = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={active ? C.accent : '#374151'} strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'stroke 0.3s' }}>
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const IconSideEditor = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

const IconSidePipelines = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6"  cy="12" r="2.2"/>
    <circle cx="18" cy="6"  r="2.2"/>
    <circle cx="18" cy="18" r="2.2"/>
    <line x1="8.1" y1="11" x2="15.9" y2="6.8"/>
    <line x1="8.1" y1="13" x2="15.9" y2="17.2"/>
  </svg>
)

const IconSideSchemas = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
)

const IconSideDeployments = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
)

const IconSideConfig = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6"  x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="9"  cy="6"  r="2" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
    <circle cx="9"  cy="18" r="2" fill="currentColor" stroke="none"/>
  </svg>
)

const IconSideKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)

const IconSpark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const IconReset = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </svg>
)

const IconChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke={C.muted} strokeWidth="2" strokeLinecap="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
)

// ── Helper ────────────────────────────────────────────────────────────────────

function fmt(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ value, onChange, min = 10 }) {
  const btn = {
    width: 30, height: 30,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
    color: C.sub, cursor: 'pointer', fontSize: 15,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button className="stepper-btn" onClick={() => onChange(Math.max(min, value - 10))}
        style={{ ...btn, borderRadius: '6px 0 0 6px' }}>−</button>
      <div style={{
        width: 50, height: 30,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${C.border}`, borderLeft: 'none', borderRight: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.text, fontSize: 13, fontWeight: 500,
      }}>{value}</div>
      <button className="stepper-btn" onClick={() => onChange(value + 10)}
        style={{ ...btn, borderRadius: '0 6px 6px 0' }}>+</button>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11,
      background: checked ? C.accent : 'rgba(255,255,255,0.1)',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2,
        left: checked ? 20 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}/>
    </div>
  )
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────

function DropZone({ label, badge, Icon, file, onFile, dragging, onDragOver, onDragLeave, onDrop, onClear, inputRef, accentColor }) {
  return (
    <div
      className="drop-zone"
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        flex: 1, padding: '36px 28px 30px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        cursor: 'pointer', borderRadius: 14,
        background: dragging ? `${accentColor}0f` : 'transparent',
        outline: dragging ? `1.5px solid ${accentColor}` : '1.5px solid transparent',
        transition: 'background 0.2s, outline 0.2s',
        userSelect: 'none',
      }}
    >
      <input ref={inputRef} type="file" accept=".docx" style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />

      {/* Icon box */}
      <div style={{
        width: 58, height: 58, borderRadius: 14,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 2,
      }}>
        <Icon color={file ? accentColor : '#6b7280'} />
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: C.text, fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{label}</div>
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: accentColor, fontSize: 13, fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <span style={{ color: C.muted, fontSize: 12 }}>{fmt(file.size)}</span>
            <button onClick={e => { e.stopPropagation(); onClear() }}
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        ) : (
          <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.5 }}>
            {label === 'Source Document'
              ? <>Click or drop your reference content <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>.docx</code></>
              : <>Click or drop master destination layout <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' }}>.docx</code></>
            }
          </div>
        )}
      </div>

      {/* Badge */}
      <div style={{
        marginTop: 2, padding: '4px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${C.border}`,
        borderRadius: 6, color: C.muted,
        fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.02em',
      }}>{badge}</div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { label: 'Live Editor',  Icon: IconSideEditor,      active: true  },
  { label: 'Pipelines',    Icon: IconSidePipelines,   active: false },
  { label: 'Type Schemas', Icon: IconSideSchemas,     active: false },
  { label: 'Deployments',  Icon: IconSideDeployments, active: false },
]

const BOTTOM_ITEMS = [
  { label: 'Engine Config', Icon: IconSideConfig },
  { label: 'Tokens & Keys', Icon: IconSideKey    },
]

const TOP_TABS = ['Editor', 'Pipelines', 'Schemas', 'API Access']

export default function App() {
  const [sourceFile, setSourceFile]         = useState(null)
  const [targetFile, setTargetFile]         = useState(null)
  const [minSlot,    setMinSlot]            = useState(100)
  const [minSection, setMinSection]         = useState(200)
  const [reverse,    setReverse]            = useState(false)
  const [status,     setStatus]             = useState('idle')
  const [resultUrl,  setResultUrl]          = useState(null)
  const [errorMsg,   setErrorMsg]           = useState('')
  const [srcDrag,    setSrcDrag]            = useState(false)
  const [tgtDrag,    setTgtDrag]            = useState(false)
  const [activeTab,  setActiveTab]          = useState('Editor')

  const srcRef = useRef()
  const tgtRef = useRef()

  const makeDrop = useCallback((setter, setDrag) => (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.docx')) setter(f)
  }, [])

  const handleProcess = async () => {
    if (!sourceFile || !targetFile) return
    setStatus('processing'); setResultUrl(null); setErrorMsg('')

    const form = new FormData()
    form.append('source',     sourceFile)
    form.append('target',     targetFile)
    form.append('minSlot',    minSlot)
    form.append('minSection', minSection)
    form.append('reverse',    reverse)

    try {
      const res = await fetch('/api/process', { method: 'POST', body: form })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        throw new Error(error || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      setResultUrl(URL.createObjectURL(blob))
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  const handleReset = () => {
    setSourceFile(null); setTargetFile(null)
    setStatus('idle'); setResultUrl(null); setErrorMsg('')
    if (srcRef.current) srcRef.current.value = ''
    if (tgtRef.current) tgtRef.current.value = ''
  }

  const canProcess = !!(sourceFile && targetFile && status !== 'processing')
  const bothLoaded = !!(sourceFile && targetFile)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden' }}>

      {/* ── Top Nav ── */}
      <header style={{
        height: 52, flexShrink: 0,
        background: C.topNav,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 6, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, userSelect: 'none' }}>
          <IconLogo />
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>ContentFlow</span>
          <span style={{ color: C.muted, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Studio</span>
        </div>

        {/* Tabs */}
        {TOP_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none',
            background: activeTab === tab ? C.accent : 'transparent',
            color: activeTab === tab ? '#fff' : C.sub,
            fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>{tab}</button>
        ))}

        <div style={{ flex: 1 }}/>

        {/* Right pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            fontSize: 12, color: C.sub,
          }}>
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block' }}/>
            Ready
          </div>

          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`,
            fontSize: 12, color: C.muted, fontFamily: 'monospace',
          }}>⌘ K</div>

          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6af7, #2dd4bf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Y</div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          padding: '18px 0',
          userSelect: 'none',
        }}>
          {/* Section header */}
          <div style={{
            padding: '0 16px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase' }}>Workspace</span>
            <IconChevron />
          </div>

          {/* Main nav */}
          {SIDEBAR_ITEMS.map(({ label, Icon, active }) => (
            <button key={label} className="nav-btn" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', margin: '1px 8px',
              borderRadius: 8, border: 'none',
              background: active ? C.accentBg : 'transparent',
              color: active ? C.accent : C.sub,
              fontSize: 13, fontWeight: active ? 500 : 400,
              cursor: 'pointer', textAlign: 'left',
              width: 'calc(100% - 16px)',
              transition: 'all 0.15s',
            }}>
              <Icon /> {label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Bottom nav */}
          {BOTTOM_ITEMS.map(({ label, Icon }) => (
            <button key={label} className="nav-btn" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', margin: '1px 8px',
              borderRadius: 8, border: 'none',
              background: 'transparent',
              color: C.muted, fontSize: 13,
              cursor: 'pointer', textAlign: 'left',
              width: 'calc(100% - 16px)',
              transition: 'all 0.15s',
            }}>
              <Icon /> {label}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '40px 48px 0' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              marginBottom: 20,
              padding: '5px 14px', borderRadius: 20,
              background: C.tealBg,
              border: `1px solid ${C.tealBorder}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, display: 'inline-block' }}/>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: C.teal, fontFamily: 'monospace', textTransform: 'uppercase' }}>Neural DOCX Engine v4.2</span>
            </div>

            <h1 style={{
              fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
              margin: '0 0 16px',
              background: 'linear-gradient(160deg, #fff 0%, #d1d5db 70%, #6b7280 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Transform Documents Instantly</h1>

            <p style={{ color: C.sub, fontSize: 14.5, lineHeight: 1.65, maxWidth: 550, margin: '0 auto 26px' }}>
              Merge rich source content into target layout templates — preserving styling, headings, and strict paragraph word envelopes.
            </p>

            {/* Preload row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Preload:</span>
              <button className="action-btn" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 7,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                color: C.sub, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <IconSpark /> Load Sample Documents
              </button>
              <button className="action-btn" onClick={handleReset} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 7,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                color: C.sub, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <IconReset /> Reset
              </button>
            </div>
          </div>

          {/* ── Upload Card ── */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            display: 'flex', alignItems: 'stretch',
            overflow: 'hidden',
          }}>
            <DropZone
              label="Source Document"
              badge="Max payload 64MB"
              Icon={IconFile}
              file={sourceFile}
              onFile={setSourceFile}
              dragging={srcDrag}
              onDragOver={e => { e.preventDefault(); setSrcDrag(true) }}
              onDragLeave={() => setSrcDrag(false)}
              onDrop={makeDrop(setSourceFile, setSrcDrag)}
              onClear={() => setSourceFile(null)}
              inputRef={srcRef}
              accentColor="#7c6af7"
            />

            {/* Center divider + transfer */}
            <div style={{
              width: 130, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: '50%',
                width: 1, background: C.border,
                transform: 'translateX(-50%)',
              }}/>
              {/* Transfer icon floats over the line */}
              <div style={{
                position: 'relative', zIndex: 1,
                background: C.card,
                padding: '10px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                borderRadius: 10,
              }}>
                <IconTransfer active={bothLoaded} />
                <span style={{ fontSize: 9, letterSpacing: '0.14em', color: bothLoaded ? C.accent : C.muted, fontFamily: 'monospace', textTransform: 'uppercase', transition: 'color 0.3s' }}>Transfer</span>
              </div>
            </div>

            <DropZone
              label="Target Template"
              badge="Enforces typography & styles"
              Icon={IconGrid}
              file={targetFile}
              onFile={setTargetFile}
              dragging={tgtDrag}
              onDragOver={e => { e.preventDefault(); setTgtDrag(true) }}
              onDragLeave={() => setTgtDrag(false)}
              onDrop={makeDrop(setTargetFile, setTgtDrag)}
              onClear={() => setTargetFile(null)}
              inputRef={tgtRef}
              accentColor="#2dd4bf"
            />
          </div>

          {/* ── Options Row ── */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap',
            gap: 0, padding: '18px 28px',
            borderBottom: `1px solid ${C.border}`,
          }}>
            {/* Min words / paragraph */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingRight: 28 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 3 }}>Min Words / Paragraph</div>
                <div style={{ fontSize: 11, color: C.muted }}>Re-balances short text blocks</div>
              </div>
              <Stepper value={minSlot} onChange={setMinSlot} />
            </div>

            <div style={{ width: 1, height: 36, background: C.border, marginRight: 28 }}/>

            {/* Min words / section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingRight: 28 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 3 }}>Min Words / Section</div>
                <div style={{ fontSize: 11, color: C.muted }}>Splits undersized units</div>
              </div>
              <Stepper value={minSection} onChange={setMinSection} />
            </div>

            <div style={{ width: 1, height: 36, background: C.border, marginRight: 28 }}/>

            {/* Reverse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 3 }}>Reverse Insertion Order</div>
                <div style={{ fontSize: 11, color: C.muted }}>Append from back to front</div>
              </div>
              <Toggle checked={reverse} onChange={setReverse} />
            </div>
          </div>

          {/* ── Process Button ── */}
          <div style={{ padding: '18px 0 16px' }}>
            <button
              className={canProcess ? 'process-btn' : ''}
              onClick={handleProcess}
              disabled={!canProcess}
              style={{
                width: '100%', height: 56, borderRadius: 28,
                border: 'none',
                background: canProcess
                  ? 'linear-gradient(to right, #6d28d9, #7c3aed, #4f46e5, #2563eb, #0891b2, #06b6d4)'
                  : 'rgba(255,255,255,0.06)',
                color: canProcess ? '#fff' : C.muted,
                fontSize: 15, fontWeight: 600, letterSpacing: '0.01em',
                cursor: canProcess ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s, transform 0.15s',
                opacity: canProcess ? 1 : 0.45,
              }}
            >
              {status === 'processing' ? (
                <>
                  <span className="spinner" style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', display: 'inline-block',
                  }}/>
                  Processing…
                </>
              ) : 'Process Document →'}
            </button>
          </div>

          {/* ── Result / Error ── */}
          {status === 'success' && (
            <div className="fade-up" style={{
              marginBottom: 20, padding: '16px 22px', borderRadius: 12,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: '#86efac' }}>✓</span>
                <span style={{ color: '#86efac', fontWeight: 500, fontSize: 14 }}>Document processed successfully</span>
              </div>
              {resultUrl && resultUrl !== '#' && (
                <a href={resultUrl} download="processed_output.docx" style={{
                  padding: '7px 16px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.28)',
                  color: '#86efac', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>Download Result ↓</a>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="fade-up" style={{
              marginBottom: 20, padding: '14px 18px', borderRadius: 12,
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <span style={{ color: '#fca5a5', fontFamily: 'monospace', fontSize: 13 }}>{errorMsg}</span>
            </div>
          )}

          {/* ── Bottom Bar ── */}
          <div style={{
            marginTop: 'auto',
            borderTop: `1px solid ${C.border}`,
            padding: '13px 0 18px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexWrap: 'wrap',
          }}>
            <span style={{ color: C.muted, fontSize: 12, fontFamily: 'monospace' }}>Interactive Test Harness:</span>

            <button className="action-btn" onClick={() => { setStatus('success'); setResultUrl('#') }} style={{
              padding: '4px 12px', borderRadius: 5,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              color: C.sub, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}>[Simulate Success]</button>

            <button className="action-btn" onClick={() => { setErrorMsg('Simulated: Source contains no 12pt paragraphs.'); setStatus('error') }} style={{
              padding: '4px 12px', borderRadius: 5,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              color: C.sub, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}>[Simulate Error]</button>

            <div style={{ flex: 1 }} />

            <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.muted }}>
              Worker status:&nbsp;<span style={{ color: C.green }}>active</span>
              &nbsp;&nbsp;Engine:&nbsp;<span style={{ color: C.sub }}>v4.2.1-wasm</span>
            </span>
          </div>

        </main>
      </div>
    </div>
  )
}
