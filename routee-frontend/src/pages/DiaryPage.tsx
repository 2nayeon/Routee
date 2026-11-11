import { useState, useEffect, useRef } from 'react'
import { scheduleApi, diaryApi } from '../api/index'
import type { ScheduleResponse, DiaryResponse } from '../api/index'
import { formatDate, getStatus } from '../utils/format'

const INDIGO       = '#4F46E5'
const INDIGO_DARK  = '#4338CA'
const INDIGO_LIGHT = '#EEF2FF'
const CHAR         = '#18181B'
const GRAY         = '#71717A'
const BORDER       = '#E4E4E7'

const COVER_COLORS = [
  'linear-gradient(135deg, #4F46E5, #7C3AED)',
  'linear-gradient(135deg, #F43F5E, #EC4899)',
  'linear-gradient(135deg, #0EA5E9, #06B6D4)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #1E293B, #334155)',
]

const EMOJIS = ['✈️','🌏','🏖️','🗼','🌸','🍜','🎡','🏔️','🌊','🗺️','🎒','📸']

// ── 커버 피커 ───────────────────────────────────────────
function CoverPicker({ current, onChange, onClose }: {
  current: string; onChange: (v: string) => void; onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 140, left: 40,
        background: '#fff', borderRadius: 12, padding: '16px',
        border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex', gap: 10, zIndex: 11,
      }}>
        {COVER_COLORS.map(c => (
          <div key={c} onClick={() => { onChange(c); onClose() }}
            style={{ width: 40, height: 40, borderRadius: 8, background: c,
              cursor: 'pointer',
              border: current === c ? '3px solid #fff' : '2px solid transparent',
              outline: current === c ? `2px solid ${INDIGO}` : 'none',
              transition: 'all 0.15s' }} />
        ))}
      </div>
    </div>
  )
}

// ── 이모지 피커 ─────────────────────────────────────────
function EmojiPicker({ onChange, onClose }: {
  onChange: (e: string) => void; onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: 230, left: 40,
        background: '#fff', borderRadius: 12, padding: '16px',
        border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex', flexWrap: 'wrap', gap: 8, width: 240, zIndex: 11,
      }}>
        {EMOJIS.map(e => (
          <div key={e} onClick={() => { onChange(e); onClose() }}
            style={{ fontSize: 28, cursor: 'pointer', padding: 4, borderRadius: 8,
              transition: 'background 0.1s' }}
            onMouseEnter={ev => (ev.currentTarget.style.background = INDIGO_LIGHT)}
            onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
            {e}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 전체 페이지 에디터 ──────────────────────────────────
function DiaryEditorPage({ trip, diary, onSave, onDelete, onBack }: {
  trip: ScheduleResponse
  diary?: DiaryResponse
  onSave: (data: { content: string; emoji: string; coverColor: string; photos: string[] }) => Promise<void>
  onDelete?: () => Promise<void>
  onBack: () => void
}) {
  const [content,    setContent]    = useState(diary?.content ?? '')
  const [emoji,      setEmoji]      = useState(diary?.emoji ?? '✈️')
  const [coverColor, setCoverColor] = useState(diary?.coverColor ?? COVER_COLORS[0])
  const [photos,     setPhotos]     = useState<string[]>(() => {
    try { return diary?.photosJson ? JSON.parse(diary.photosJson) : [] } catch { return [] }
  })
  const [saving,     setSaving]     = useState(false)
  const [showCover,  setShowCover]  = useState(false)
  const [showEmoji,  setShowEmoji]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isPast  = getStatus(trip.startDate, trip.endDate) === 'past'

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  async function handleSave() {
    setSaving(true)
    try { await onSave({ content, emoji, coverColor, photos }) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {showCover && <CoverPicker current={coverColor} onChange={setCoverColor} onClose={() => setShowCover(false)} />}
      {showEmoji && <EmojiPicker onChange={setEmoji} onClose={() => setShowEmoji(false)} />}

      {/* 커버 */}
      <div style={{ height: 200, background: coverColor, position: 'relative', flexShrink: 0 }}>
        {/* 상단 버튼들 */}
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 14px', fontSize: 13,
              cursor: 'pointer', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', gap: 6 }}>
            ‹ 목록으로
          </button>
        </div>
        {isPast && (
          <button onClick={() => setShowCover(true)}
            style={{ position: 'absolute', bottom: 16, left: 40,
              background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 14px', fontSize: 12,
              cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            커버 변경
          </button>
        )}
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto',
        padding: '0 48px 60px', boxSizing: 'border-box' }}>

        {/* 제목 + 메타 */}
        <div style={{ marginTop: 24, fontSize: 28, fontWeight: 700, color: CHAR, marginBottom: 8 }}>
          {trip.title}
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: GRAY }}>📍 {trip.destination}</span>
          <span style={{ fontSize: 13, color: GRAY }}>📅 {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}</span>
          <span style={{ fontSize: 13, color: GRAY }}>👥 {trip.memberCount}명</span>
          {!isPast && (
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20,
              background: '#FFF7ED', color: '#C2410C', fontWeight: 600 }}>
              여행이 끝난 후 작성할 수 있어요
            </span>
          )}
        </div>

        <div style={{ height: 1, background: BORDER, marginBottom: 28 }} />

        {/* 본문 텍스트 */}
        {isPast ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="여행의 추억을 자유롭게 기록해보세요. 어디를 갔는지, 무엇을 먹었는지, 어떤 순간이 특별했는지..."
            style={{ width: '100%', minHeight: 280, border: 'none', outline: 'none',
              fontSize: 15, color: CHAR, lineHeight: 1.9, resize: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box', background: 'transparent' }}
          />
        ) : (
          <div style={{ fontSize: 15, color: '#A1A1AA', lineHeight: 1.9, fontStyle: 'italic' }}>
            여행이 끝나면 이곳에 기록을 남길 수 있어요 ✈️
          </div>
        )}

        {/* 사진 그리드 */}
        {photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10, marginTop: 24 }}>
            {photos.map((src, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%',
                  objectFit: 'cover', borderRadius: 10 }} />
                {isPast && (
                  <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24,
                      borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none',
                      color: '#fff', fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 사진 추가 */}
        {isPast && (
          <>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', border: `1px dashed ${BORDER}`, borderRadius: 8,
                background: 'none', fontSize: 13, color: GRAY, cursor: 'pointer',
                marginTop: 20, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.color = INDIGO }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = GRAY }}>
              📷 사진 추가
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*"
              onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </>
        )}

        {/* 저장 버튼 */}
        {isPast && (
          <div style={{ display: 'flex', gap: 8, marginTop: 40, paddingTop: 24,
            borderTop: `1px solid ${BORDER}` }}>
            {diary && (
              <button
                onClick={() => confirmDel ? onDelete?.() : setConfirmDel(true)}
                style={{ padding: '11px 18px', borderRadius: 10,
                  border: `1px solid #FECACA`, background: '#fff',
                  color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s' }}>
                {confirmDel ? '정말 삭제할게요' : '삭제'}
              </button>
            )}
            <button onClick={onBack}
              style={{ flex: 1, padding: '11px 0', borderRadius: 10,
                border: `1px solid ${BORDER}`, background: '#fff',
                fontSize: 13, fontWeight: 600, color: GRAY, cursor: 'pointer' }}>
              취소
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                background: saving ? '#A5B4FC' : INDIGO, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
                transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = INDIGO_DARK }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = INDIGO }}>
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 일정 카드 ───────────────────────────────────────────
function TripCard({ trip, diary, onClick }: {
  trip: ScheduleResponse; diary?: DiaryResponse; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const status = getStatus(trip.startDate, trip.endDate)
  const isPast = status === 'past'

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${hovered ? INDIGO : BORDER}`,
        boxShadow: hovered ? '0 4px 20px rgba(79,70,229,0.10)' : 'none',
        cursor: 'pointer', transition: 'all 0.15s', background: '#fff' }}>

      {/* 왼쪽 색상 바 */}
      <div style={{ width: 5, background: diary ? diary.coverColor : (isPast ? '#FCD34D' : BORDER), flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
        {/* 이모지/아이콘 */}
        <div style={{ width: 48, height: 48, borderRadius: 12,
          background: diary?.coverColor ?? (isPast ? '#FFF7ED' : '#F4F4F5'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0 }}>
          {diary?.emoji ?? (isPast ? '📔' : '✈️')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: CHAR }}>{trip.title}</span>
            {diary && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: INDIGO_LIGHT, color: INDIGO, fontWeight: 600 }}>작성완료</span>
            )}
            {!diary && isPast && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: '#FFF7ED', color: '#C2410C', fontWeight: 600 }}>미작성</span>
            )}
            {status === 'ongoing' && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: '#F0FDF4', color: '#16A34A', fontWeight: 600 }}>진행 중</span>
            )}
            {status === 'upcoming' && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: '#F4F4F5', color: GRAY, fontWeight: 600 }}>진행 예정</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: GRAY, marginBottom: diary?.content ? 5 : 0 }}>
            {trip.destination} · {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
          </div>
          {diary?.content && (
            <div style={{ fontSize: 13, color: GRAY, lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {diary.content}
            </div>
          )}
          {!diary && isPast && (
            <div style={{ fontSize: 12, color: '#A1A1AA', fontStyle: 'italic' }}>여행 기록을 남겨보세요</div>
          )}
          {!isPast && (
            <div style={{ fontSize: 12, color: '#A1A1AA' }}>클릭해서 미리 보기</div>
          )}
        </div>

        {/* 사진 미리보기 */}
        {diary?.photosJson && (() => {
          try {
            const ps = JSON.parse(diary.photosJson) as string[]
            if (!ps.length) return null
            return (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {ps.slice(0, 3).map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: 40, height: 40,
                    objectFit: 'cover', borderRadius: 6 }} />
                ))}
                {ps.length > 3 && (
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: '#F4F4F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: GRAY }}>+{ps.length - 3}</div>
                )}
              </div>
            )
          } catch { return null }
        })()}

        <span style={{ color: hovered ? INDIGO : '#D4D4D8', fontSize: 18, flexShrink: 0 }}>›</span>
      </div>
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────
export default function DiaryPage() {
  const [trips,   setTrips]   = useState<ScheduleResponse[]>([])
  const [diaries, setDiaries] = useState<DiaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ScheduleResponse | null>(null)
  const [filter,  setFilter]  = useState<'all' | 'written' | 'unwritten'>('all')

  useEffect(() => {
    Promise.all([scheduleApi.getAll(), diaryApi.getAll()])
      .then(([tripRes, diaryRes]) => {
        setTrips(tripRes.data)
        setDiaries(diaryRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  function getDiary(scheduleId: number) {
    return diaries.find(d => d.scheduleId === scheduleId)
  }

  async function handleSave(trip: ScheduleResponse, data: {
    content: string; emoji: string; coverColor: string; photos: string[]
  }) {
    const existing = getDiary(trip.scheduleId)
    const photosJson = JSON.stringify(data.photos)
    try {
      if (existing) {
        const res = await diaryApi.update(existing.diaryId, {
          content: data.content, emoji: data.emoji,
          coverColor: data.coverColor, photosJson,
        })
        setDiaries(prev => prev.map(d => d.diaryId === existing.diaryId ? res.data : d))
      } else {
        const res = await diaryApi.create({
          scheduleId: trip.scheduleId,
          content: data.content, emoji: data.emoji,
          coverColor: data.coverColor, photosJson,
        })
        setDiaries(prev => [...prev, res.data])
      }
      setEditing(null)
    } catch { alert('저장에 실패했어요.') }
  }

  async function handleDelete(diary: DiaryResponse) {
    try {
      await diaryApi.delete(diary.diaryId)
      setDiaries(prev => prev.filter(d => d.diaryId !== diary.diaryId))
      setEditing(null)
    } catch { alert('삭제에 실패했어요.') }
  }

  const sorted   = [...trips].sort((a, b) => b.startDate.localeCompare(a.startDate))
  const filtered = sorted.filter(t => {
    const has    = !!getDiary(t.scheduleId)
    const isPast = getStatus(t.startDate, t.endDate) === 'past'
    if (filter === 'written')   return has
    if (filter === 'unwritten') return !has && isPast
    return true
  })

  const writtenCount   = trips.filter(t => !!getDiary(t.scheduleId)).length
  const unwrittenCount = trips.filter(t => !getDiary(t.scheduleId) && getStatus(t.startDate, t.endDate) === 'past').length

  // 에디터 페이지 보여주기
  if (editing) {
    return (
      <DiaryEditorPage
        trip={editing}
        diary={getDiary(editing.scheduleId)}
        onSave={(data) => handleSave(editing, data)}
        onDelete={getDiary(editing.scheduleId)
          ? () => handleDelete(getDiary(editing.scheduleId)!)
          : undefined}
        onBack={() => setEditing(null)}
      />
    )
  }

  // 목록 페이지
  return (
    <div style={{ minHeight: '100%', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px 60px', boxSizing: 'border-box' }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: INDIGO,
            letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>
            Travel Diary
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: CHAR, margin: '0 0 8px' }}>
            여행 다이어리
          </h1>
          <p style={{ fontSize: 14, color: GRAY, margin: 0 }}>
            여행의 순간을 기록하고 사진으로 남겨보세요
          </p>
        </div>

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: '전체 여행', value: trips.length,   color: CHAR },
            { label: '기록 완료', value: writtenCount,   color: INDIGO },
            { label: '미작성',   value: unwrittenCount, color: '#C2410C' },
          ].map(s => (
            <div key={s.label} style={{ padding: '18px 20px', background: '#FAFAFA',
              border: `1px solid ${BORDER}`, borderRadius: 12 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: GRAY }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 필터 탭 */}
        <div style={{ display: 'flex', borderBottom: `2px solid #F4F4F5`, marginBottom: 20 }}>
          {([
            { key: 'all',       label: '전체' },
            { key: 'written',   label: '작성 완료' },
            { key: 'unwritten', label: '미작성' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: filter === t.key ? 600 : 400,
                color: filter === t.key ? CHAR : '#A1A1AA',
                borderBottom: filter === t.key ? `2px solid ${INDIGO}` : '2px solid transparent',
                marginBottom: -2, transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 0', color: GRAY, gap: 12 }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${INDIGO_LIGHT}`,
              borderTopColor: INDIGO, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: 13 }}>불러오는 중...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📔</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: GRAY, margin: 0 }}>
              {filter === 'written' ? '작성된 다이어리가 없어요' : '미작성 여행이 없어요'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(trip => (
              <TripCard
                key={trip.scheduleId}
                trip={trip}
                diary={getDiary(trip.scheduleId)}
                onClick={() => {
                  if (getStatus(trip.startDate, trip.endDate) === 'past') setEditing(trip)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
