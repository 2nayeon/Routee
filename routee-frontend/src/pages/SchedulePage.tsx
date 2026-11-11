import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { scheduleApi } from '../api/index'
import type { ScheduleResponse } from '../api/index'
import { getStatus, formatDate, nightsLabel } from '../utils/format'

const INDIGO = '#4F46E5'
const INDIGO_DARK = '#4338CA'
const INDIGO_LIGHT = '#EEF2FF'
const CHAR = '#18181B'
const GRAY = '#71717A'
const GRAY_LIGHT = '#F4F4F5'

const THUMB_BG: Record<string, string> = {
  '오사카': 'linear-gradient(160deg,#C4C8E8,#7880C4)',
  '제주':   'linear-gradient(160deg,#A8DFC4,#5AAD8A)',
  '방콕':   'linear-gradient(160deg,#F5D89A,#D4A040)',
  '도쿄':   'linear-gradient(160deg,#C4C8E8,#7880C4)',
  '파리':   'linear-gradient(160deg,#E8C4D8,#C47090)',
  '다낭':   'linear-gradient(160deg,#A8E8E8,#40A8C4)',
}
const THUMB_EMOJI: Record<string, string> = {
  '오사카': '⛩️', '제주': '🌿', '방콕': '🏖️', '도쿄': '🗼', '파리': '🗺️', '다낭': '🌊',
}
function thumbBg(dest: string) {
  const key = Object.keys(THUMB_BG).find(k => dest.includes(k))
  return key ? THUMB_BG[key] : 'linear-gradient(160deg,#C7D2FE,#818CF8)'
}
function thumbEmoji(dest: string) {
  const key = Object.keys(THUMB_EMOJI).find(k => dest.includes(k))
  return key ? THUMB_EMOJI[key] : '✈️'
}

const DEST_IMAGES: Record<string, string> = {
  '오사카':    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  '제주':      'https://images.unsplash.com/photo-1598524374912-3a0ece4b6492?w=600&q=80',
  '방콕':      'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
  '도쿄':      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  '파리':      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  '다낭':      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
  '런던':      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  '뉴욕':      'https://images.unsplash.com/photo-1499092346302-2e2cf3d41e0b?w=600&q=80',
  '싱가포르':  'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
  '바르셀로나':'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
}
function getDestImage(dest: string) {
  const key = Object.keys(DEST_IMAGES).find(k => dest.includes(k))
  return key ? DEST_IMAGES[key] : null
}

// ── 여행 카드 ──────────────────────────────────────────
function TripCard({ trip, onDelete, onNavigate }: {
  trip: ScheduleResponse
  onDelete: (id: number) => void
  onNavigate: () => void
}) {
  const [hovered,    setHovered]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [imgError,   setImgError]   = useState(false)
  const status = getStatus(trip.startDate, trip.endDate)
  const isPast = status === 'past'
  const imgUrl = getDestImage(trip.destination)

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDel(false) }}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: '#fff',
        border: hovered ? `1px solid ${INDIGO}` : '1px solid #E4E4E7',
        cursor: 'pointer',
        transform: hovered && !isPast ? 'translateY(-3px)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: hovered ? '0 8px 24px rgba(79,70,229,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* 썸네일 */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: thumbBg(trip.destination) }}>
        {imgUrl && !imgError && (
          <img
            src={imgUrl}
            alt={trip.destination}
            onError={() => setImgError(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        )}
        {(!imgUrl || imgError) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 64, opacity: 0.35, userSelect: 'none' }}>{thumbEmoji(trip.destination)}</span>
          </div>
        )}

        {/* 완료 오버레이 */}
        {isPast && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 20,
              padding: '6px 18px', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, color: '#555' }}>
              ✓ 진행 완료
            </div>
          </div>
        )}

        {/* 진행중 dot */}
        {status === 'ongoing' && (
          <div style={{ position: 'absolute', top: 14, right: 14,
            width: 12, height: 12, borderRadius: '50%', background: '#E84040',
            boxShadow: '0 0 0 3px rgba(232,64,64,0.25)' }} />
        )}

        {/* 삭제 버튼 */}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); if (confirmDel) onDelete(trip.scheduleId); else setConfirmDel(true) }}
            style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 20,
              border: 'none', background: confirmDel ? 'rgba(220,50,50,0.88)' : 'rgba(0,0,0,0.45)',
              color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', zIndex: 2 }}>
            {confirmDel ? '삭제 확인' : '🗑 삭제'}
          </button>
        )}
      </div>

      {/* 카드 하단 */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: CHAR, marginBottom: 4 }}>
          {trip.title}
        </div>
        <div style={{ fontSize: 12, color: GRAY, marginBottom: 12 }}>
          {trip.destination} · {nightsLabel(trip.startDate, trip.endDate)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #F4F4F5', paddingTop: 10 }}>
          <span style={{ fontSize: 12, color: '#A1A1AA' }}>
            {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
          </span>
          <span style={{ fontSize: 12, color: isPast ? '#A1A1AA' : INDIGO, fontWeight: 600 }}>{trip.placeCount ?? 0}곳</span>
        </div>
      </div>
    </div>
  )
}

// ── 새 일정 모달 ────────────────────────────────────────
interface NewTripForm { title: string; destination: string; startDate: string; endDate: string; memberCount: number }

function NewTripModal({ onClose, onSubmit, loading }: {
  onClose: () => void; onSubmit: (f: NewTripForm) => void; loading: boolean
}) {
  const [form, setForm] = useState<NewTripForm>({ title: '', destination: '', startDate: '', endDate: '', memberCount: 2 })
  const [step, setStep] = useState(1)
  const can = step === 1 ? form.title.trim() && form.destination.trim() : form.startDate && form.endDate && form.memberCount > 0

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #E4E4E7', fontSize: 14, color: CHAR,
    outline: 'none', background: '#FAFAFA', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: GRAY, marginBottom: 6, display: 'block' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '32px 36px',
        width: 460, boxShadow: '0 20px 60px rgba(79,70,229,0.15)' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, color: INDIGO, fontWeight: 600, marginBottom: 4 }}>{step}/2단계</p>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: CHAR, margin: 0 }}>
                {step === 1 ? '여행 정보 입력' : '날짜 & 인원 설정'}
              </h2>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#A1A1AA' }}>✕</button>
          </div>
          {/* 프로그레스 바 */}
          <div style={{ height: 3, background: '#E4E4E7', borderRadius: 2, marginTop: 16 }}>
            <div style={{ height: '100%', width: step === 1 ? '50%' : '100%',
              background: INDIGO, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={lbl}>여행 이름</label>
              <input style={inp} placeholder="예: 오사카 봄 여행" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
                onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')} />
            </div>
            <div>
              <label style={lbl}>여행지</label>
              <input style={inp} placeholder="예: 오사카" value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
                onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>출발일</label>
                <input type="date" style={inp} value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')} />
              </div>
              <div>
                <label style={lbl}>귀국일</label>
                <input type="date" style={inp} value={form.endDate} min={form.startDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E4E4E7')} />
              </div>
            </div>
            <div>
              <label style={lbl}>인원</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => setForm({ ...form, memberCount: Math.max(1, form.memberCount - 1) })}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #E4E4E7',
                    background: '#fff', fontSize: 16, cursor: 'pointer', color: INDIGO,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 600, color: CHAR, minWidth: 32, textAlign: 'center' }}>
                  {form.memberCount}명
                </span>
                <button onClick={() => setForm({ ...form, memberCount: Math.min(20, form.memberCount + 1) })}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #E4E4E7',
                    background: '#fff', fontSize: 16, cursor: 'pointer', color: INDIGO,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
            <div style={{ background: INDIGO_LIGHT, borderRadius: 8, padding: '10px 14px', border: `1px solid #C7D2FE` }}>
              <p style={{ fontSize: 12, color: INDIGO, margin: 0 }}>✈️ <strong>{form.title}</strong> · {form.destination}</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
          {step === 2 && (
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: '11px 0', borderRadius: 8,
              border: '1.5px solid #E4E4E7', background: '#fff', fontSize: 13,
              fontWeight: 600, color: GRAY, cursor: 'pointer' }}>← 이전</button>
          )}
          <button
            disabled={!can || loading}
            onClick={() => { if (step === 1) setStep(2); else onSubmit(form) }}
            style={{ flex: 2, padding: '11px 0', borderRadius: 8, border: 'none',
              background: (can && !loading) ? INDIGO : '#C7D2FE',
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: (can && !loading) ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
            onMouseEnter={e => { if (can && !loading) e.currentTarget.style.background = INDIGO_DARK }}
            onMouseLeave={e => { if (can && !loading) e.currentTarget.style.background = INDIGO }}
          >
            {loading ? '생성 중...' : step === 1 ? '다음 →' : '일정 만들기 🎉'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────
export default function SchedulePage() {
  const navigate    = useNavigate()
  const [trips,     setTrips]     = useState<ScheduleResponse[]>([])
  const [loading,   setLoading]   = useState(true)
  const [apiError,  setApiError]  = useState('')
  const [showModal, setShowModal] = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [tab,       setTab]       = useState<'all' | 'ongoing' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    scheduleApi.getAll()
      .then(res => setTrips(res.data))
      .catch(() => setApiError('일정을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: number) {
    try { await scheduleApi.delete(id); setTrips(prev => prev.filter(t => t.scheduleId !== id)) }
    catch { alert('삭제에 실패했어요.') }
  }

  async function handleCreate(form: NewTripForm) {
    setCreating(true)
    try {
      const res  = await scheduleApi.create(form)
      const list = await scheduleApi.getAll()
      setTrips(list.data); setShowModal(false)
      navigate(`/schedule/${res.data}`)
    } catch { alert('일정 생성에 실패했어요.') }
    finally { setCreating(false) }
  }

  const all      = trips
  const ongoing  = trips.filter(t => getStatus(t.startDate, t.endDate) === 'ongoing')
  const upcoming = trips.filter(t => getStatus(t.startDate, t.endDate) === 'upcoming')
  const past     = trips.filter(t => getStatus(t.startDate, t.endDate) === 'past')
  const tabMap   = { all, ongoing, upcoming, past }
  const shown    = tabMap[tab]

  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: 'all',      label: '전체',    count: all.length },
    { key: 'ongoing',  label: '진행 중', count: ongoing.length },
    { key: 'upcoming', label: '진행 예정', count: upcoming.length },
    { key: 'past',     label: '진행 완료', count: past.length },
  ]

  return (
    <div style={{ minHeight: '100%', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px 60px', boxSizing: 'border-box' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: INDIGO, letterSpacing: '0.08em',
              marginBottom: 6, textTransform: 'uppercase' }}>
              My Schedule
            </p>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: CHAR, margin: 0 }}>나의 일정</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px',
              borderRadius: 100, background: INDIGO, border: 'none', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(79,70,229,0.25)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = INDIGO_DARK)}
            onMouseLeave={e => (e.currentTarget.style.background = INDIGO)}
          >
            + 새 여행
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F4F4F5', marginBottom: 28 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? CHAR : '#A1A1AA',
                borderBottom: tab === t.key ? `2px solid ${INDIGO}` : '2px solid transparent',
                marginBottom: -2, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, fontWeight: 600,
                  background: tab === t.key ? INDIGO : GRAY_LIGHT,
                  color: tab === t.key ? '#fff' : GRAY }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 에러 */}
        {apiError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 10,
            padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#DC2626' }}>
            ⚠️ {apiError}
          </div>
        )}

        {/* 로딩 */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 0', color: '#A1A1AA', gap: 12 }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${INDIGO_LIGHT}`,
              borderTopColor: INDIGO, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: 13 }}>불러오는 중...</span>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#A1A1AA' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>✈️</div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: GRAY }}>
              {tab === 'all' ? '아직 여행 일정이 없어요' : '해당하는 일정이 없어요'}
            </p>
            <p style={{ fontSize: 13, marginTop: 8, color: '#A1A1AA' }}>새 여행 버튼으로 첫 여행을 계획해보세요!</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ marginTop: 20, padding: '10px 24px', borderRadius: 100,
                background: INDIGO, border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = INDIGO_DARK)}
              onMouseLeave={e => (e.currentTarget.style.background = INDIGO)}
            >
              + 새 여행 만들기
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {shown.map(t => (
              <TripCard key={t.scheduleId} trip={t}
                onDelete={handleDelete}
                onNavigate={() => navigate(`/schedule/${t.scheduleId}`)} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewTripModal onClose={() => setShowModal(false)} onSubmit={handleCreate} loading={creating} />
      )}
    </div>
  )
}
