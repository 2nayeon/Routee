import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { scheduleApi, folderApi, placeApi } from '../api/index'
import type { ScheduleDetailResponse, TmpPlaceResponse, TimelineItemResponse, FolderResponse } from '../api/index'
import { getDayList, formatDayLabel, toMin, toLocalTime, fromLocalTime } from '../utils/format'
import { categoryEmoji, catStyle as sharedCatStyle, indigoCatColors } from '../utils/category'

const INDIGO      = '#4F46E5'
const INDIGO_DARK = '#4338CA'
const INDIGO_LIGHT= '#EEF2FF'
const CHAR        = '#18181B'
const GRAY        = '#71717A'
const BORDER      = '#E4E4E7'

const CONFLICT_BG     = '#FFF7ED'
const CONFLICT_BORDER = '#FB923C'
const CONFLICT_TEXT   = '#C2410C'

interface Place {
  id: string; tmpPlaceId?: number; placeId?: number
  name: string; category: string; address: string
  hours?: string; rating?: number; emoji: string
}
interface ScheduleItem {
  id: string; timelineItemId?: number; tmpPlaceId?: number
  place: Place; startTime: string; endTime: string; memo: string
  visitDate: string; visitOrder: number; conflictWarning: boolean
}
interface DayPlan { day: number; date: string; items: ScheduleItem[] }
interface ConflictWarn {
  dayIdx: number
  itemA: ScheduleItem
  itemB: ScheduleItem
  type: 'overlap' | 'hours'
}

function isConflict(a: ScheduleItem, b: ScheduleItem) {
  return a.id !== b.id && toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime)
}
function findConflicts(items: ScheduleItem[]): [ScheduleItem, ScheduleItem][] {
  const pairs: [ScheduleItem, ScheduleItem][] = []
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (isConflict(items[i], items[j])) pairs.push([items[i], items[j]])
  return pairs
}
function calcNextTime(items: ScheduleItem[]) {
  if (!items.length) return { start: '09:00', end: '10:00' }
  const last = [...items].sort((a, b) => toMin(b.endTime) - toMin(a.endTime))[0]
  const m = toMin(last.endTime), n = m + 60
  const pad = (x: number) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
  return { start: pad(m), end: pad(Math.min(n, 23 * 60 + 59)) }
}

const CAT_COLORS = indigoCatColors(INDIGO, INDIGO_LIGHT)
function catStyle(cat: string) { return sharedCatStyle(cat, CAT_COLORS, { bg: '#F4F4F5', color: GRAY }) }

function tmpToPlace(t: TmpPlaceResponse): Place {
  let hours: string | undefined
  if (t.openingHoursJson) {
    try { const h = JSON.parse(t.openingHoursJson); hours = Array.isArray(h) ? h[0] : h.weekday_text?.[0] } catch {}
  }
  return { id: String(t.tmpPlaceId), tmpPlaceId: t.tmpPlaceId, placeId: t.placeId,
    name: t.placeName, category: t.category ?? '장소', address: t.address,
    hours, rating: t.rating ?? undefined, emoji: categoryEmoji(t.category) }
}
function timelineToItem(t: TimelineItemResponse, visitDate: string): ScheduleItem {
  return {
    id: String(t.timelineItemId), timelineItemId: t.timelineItemId,
    place: { id: String(t.placeId), placeId: t.placeId, name: t.placeName,
      category: t.category ?? '장소', address: t.address, rating: t.rating ?? undefined, emoji: categoryEmoji(t.category) },
    startTime: fromLocalTime(t.visitTime), endTime: fromLocalTime(t.endTime),
    memo: t.memo ?? '', visitDate, visitOrder: t.visitOrder, conflictWarning: t.conflictWarning,
  }
}

// ── 검색바 ──────────────────────────────────────────────
function SearchBar({ scheduleId, onAdded }: { scheduleId: number; onAdded: (p: TmpPlaceResponse) => void }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try { const r = await placeApi.search(q); setResults(r.data); setOpen(true) }
    catch { setResults([]); setOpen(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { const t = setTimeout(() => search(query), 350); return () => clearTimeout(t) }, [query, search])

  async function handleSelect(p: any) {
    setQuery(''); setOpen(false)
    try {
      await placeApi.save(p.googlePlaceId)
      const res = await scheduleApi.addTmpPlace(scheduleId, {
        googlePlaceId: p.googlePlaceId, placeName: p.placeName, address: p.address,
        latitude: p.latitude, longitude: p.longitude, category: p.category,
        rating: p.rating, openingHoursJson: p.openingHoursJson,
      })
      onAdded(res.data)
    } catch { alert('장소 추가에 실패했어요.') }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAFA',
        border: `1.5px solid ${open ? INDIGO : BORDER}`, borderRadius: 10, padding: '8px 12px',
        transition: 'border-color 0.15s' }}>
        <span style={{ fontSize: 14, color: GRAY }}>🔍</span>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="장소, 주소 검색"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: CHAR }} />
        {loading && <span style={{ fontSize: 11, color: GRAY }}>...</span>}
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#D4D4D8', padding: 0 }}>✕</button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', borderRadius: 10, border: `1px solid ${BORDER}`,
          boxShadow: '0 8px 24px rgba(79,70,229,0.10)', overflow: 'hidden' }}>
          {results.map((p, i) => (
            <div key={i} onMouseDown={() => handleSelect(p)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                cursor: 'pointer', borderBottom: `1px solid #F4F4F5` }}
              onMouseEnter={e => (e.currentTarget.style.background = INDIGO_LIGHT)}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <span style={{ fontSize: 18 }}>{categoryEmoji(p.category)}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: CHAR }}>{p.placeName}</div>
                <div style={{ fontSize: 11, color: GRAY }}>{p.address}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 20, ...catStyle(p.category) }}>{p.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 폴더 모달 ───────────────────────────────────────────
function FolderModal({ current, folders, onSelect, onClose }: {
  current: number | null; folders: FolderResponse[]; onSelect: (id: number) => void; onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px',
        width: 440, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(79,70,229,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: CHAR, margin: 0 }}>폴더 선택</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#D4D4D8', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: GRAY, marginBottom: 20 }}>불러올 장소 폴더를 선택하세요</p>
        {!folders.length
          ? <p style={{ fontSize: 13, color: '#D4D4D8', textAlign: 'center', padding: '20px 0' }}>폴더가 없어요</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {folders.map(f => (
                <div key={f.folderId} onClick={() => { onSelect(f.folderId); onClose() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                    cursor: 'pointer', border: `1.5px solid ${current === f.folderId ? INDIGO : BORDER}`,
                    background: current === f.folderId ? INDIGO_LIGHT : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: INDIGO_LIGHT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🗂️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: CHAR }}>{f.folderName}</span>
                      {current === f.folderId && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                          background: INDIGO_LIGHT, color: INDIGO, fontWeight: 600 }}>현재 선택</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: INDIGO }}>{f.placeCount}개의 장소</div>
                  </div>
                  <span style={{ color: '#D4D4D8', fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}

// ── 시간/메모 모달 ──────────────────────────────────────
function TimeModal({ item, onSave, onClose, onRemove }: {
  item: ScheduleItem; onSave: (u: ScheduleItem) => void; onClose: () => void; onRemove: () => void
}) {
  const [startTime, setStart] = useState(item.startTime)
  const [endTime,   setEnd]   = useState(item.endTime)
  const [memo,      setMemo]  = useState(item.memo)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${BORDER}`, fontSize: 14, color: CHAR,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 32px',
        width: 460, boxShadow: '0 20px 60px rgba(79,70,229,0.15)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20,
          paddingBottom: 20, borderBottom: `1px solid #F4F4F5` }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: INDIGO_LIGHT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {item.place.emoji}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: CHAR, marginBottom: 4 }}>{item.place.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, ...catStyle(item.place.category) }}>{item.place.category}</span>
              {item.place.rating && <span style={{ fontSize: 11, color: '#F5A623' }}>★ {item.place.rating}</span>}
              <span style={{ fontSize: 11, color: GRAY }}>{item.place.address}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#D4D4D8' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, display: 'block', marginBottom: 8 }}>방문 시작</label>
            <input type="time" value={startTime} onChange={e => setStart(e.target.value)} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
          </div>
          <span style={{ fontSize: 18, color: '#D4D4D8', marginTop: 20 }}>→</span>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, display: 'block', marginBottom: 8 }}>방문 종료</label>
            <input type="time" value={endTime} onChange={e => setEnd(e.target.value)} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, display: 'block', marginBottom: 8 }}>메모 (선택)</label>
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="예약 번호, 특이사항, 준비물 등을 메모해두세요" rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${BORDER}`,
              fontSize: 13, color: CHAR, outline: 'none', background: '#FAFAFA', resize: 'none',
              boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'inherit' }}
            onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onRemove} style={{ padding: '11px 16px', borderRadius: 10,
            border: '1px solid #FECACA', background: '#fff', color: '#DC2626',
            fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>삭제</button>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10,
            border: `1.5px solid ${BORDER}`, background: '#fff',
            fontSize: 13, fontWeight: 600, color: GRAY, cursor: 'pointer' }}>취소</button>
          <button onClick={() => onSave({ ...item, startTime, endTime, memo })}
            style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: INDIGO,
              fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = INDIGO_DARK)}
            onMouseLeave={e => (e.currentTarget.style.background = INDIGO)}>저장</button>
        </div>
      </div>
    </div>
  )
}

// ── 좌측 장소 카드 ──────────────────────────────────────
function PlaceCard({ place, onDragStart }: { place: Place; onDragStart: (p: Place) => void }) {
  return (
    <div draggable onDragStart={() => onDragStart(place)}
      style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12,
        padding: '12px 14px', cursor: 'grab', marginBottom: 8, userSelect: 'none', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>{place.emoji}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: CHAR, marginBottom: 4 }}>{place.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, ...catStyle(place.category) }}>{place.category}</span>
              {place.rating && <span style={{ fontSize: 11, color: '#F5A623' }}>★ {place.rating}</span>}
            </div>
            {place.hours && <div style={{ fontSize: 11, color: GRAY }}>{place.hours}</div>}
            <div style={{ fontSize: 11, color: GRAY }}>{place.address}</div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#D4D4D8', flexShrink: 0, marginTop: 2 }}>⠿</span>
      </div>
    </div>
  )
}

// ── 충돌 배너 ───────────────────────────────────────────
function ConflictBanner({ conflicts, dayPlans, onDismiss }: {
  conflicts: ConflictWarn[]; dayPlans: DayPlan[]; onDismiss: () => void
}) {
  if (!conflicts.length) return null
  return (
    <div style={{ background: CONFLICT_BG, border: `1.5px solid ${CONFLICT_BORDER}`, borderRadius: 12,
      padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CONFLICT_TEXT, marginBottom: 6 }}>
          일정 충돌이 {conflicts.length}건 발견됐어요
        </div>
        {conflicts.map((c, i) => (
          <div key={i} style={{ fontSize: 12, color: CHAR, marginBottom: 3 }}>
            {c.type === 'hours'
              ? `· Day ${dayPlans[c.dayIdx].day} — ${c.itemA.place.name} 영업시간 외 방문`
              : <>· Day {dayPlans[c.dayIdx].day} — <b>{c.itemA.place.name}</b> {c.itemA.startTime}~{c.itemA.endTime} &amp;&nbsp;<b>{c.itemB.place.name}</b> {c.itemB.startTime}~{c.itemB.endTime} 시간 겹침</>
            }
          </div>
        ))}
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#D4D4D8' }}>✕</button>
    </div>
  )
}

// ── 일정 아이템 카드 ────────────────────────────────────
function ScheduleItemCard({ item, hasConflict, conflictType, onClick, onMemoSave, onDragStart, onDragEnd }: {
  item: ScheduleItem; hasConflict: boolean
  conflictType: 'overlap' | 'hours' | null
  onClick: () => void
  onMemoSave: (memo: string) => void
  onDragStart: (item: ScheduleItem) => void; onDragEnd: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [memo,    setMemo]    = useState(item.memo)
  const memoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setMemo(item.memo) }, [item.memo])

  return (
    <div draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(item) }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{ background: '#fff',
        border: `1.5px solid ${hasConflict ? CONFLICT_BORDER : hovered ? INDIGO : BORDER}`,
        borderRadius: 12, overflow: 'hidden', marginBottom: 8, transition: 'all 0.15s',
        boxShadow: hasConflict ? `0 0 0 2px rgba(251,146,60,0.2)` : hovered ? '0 4px 14px rgba(79,70,229,0.10)' : 'none',
        cursor: 'pointer' }}>

      {hasConflict && (
        <div style={{ background: CONFLICT_BG, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>⚠️</span>
          <span style={{ fontSize: 11, color: CONFLICT_TEXT, fontWeight: 600 }}>
            {conflictType === 'hours'
              ? '영업시간 외 방문 — 시간을 조정해주세요'
              : '시간 충돌 — 클릭해서 수정해주세요'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
          padding: '12px 14px', background: '#FAFAFA', borderRight: `1px solid #F4F4F5`,
          minWidth: 90, flexShrink: 0, gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: INDIGO, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: CHAR, letterSpacing: '0.02em' }}>{item.startTime}</span>
          </div>
          <div style={{ width: 1, height: 12, background: '#C7D2FE', marginLeft: 3 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A1A1AA', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: GRAY, letterSpacing: '0.02em' }}>{item.endTime}</span>
          </div>
        </div>
        <div style={{ width: 3, background: hasConflict ? CONFLICT_BORDER : INDIGO_LIGHT, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{item.place.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: CHAR }}>{item.place.name}</span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onClick() }}
              style={{ fontSize: 12, color: INDIGO, fontWeight: 600, background: INDIGO_LIGHT,
                border: `1px solid #C7D2FE`, borderRadius: 8, padding: '5px 12px',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E0E7FF' }}
              onMouseLeave={e => { e.currentTarget.style.background = INDIGO_LIGHT }}>
              시간 수정
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, ...catStyle(item.place.category) }}>{item.place.category}</span>
            {item.place.rating && <span style={{ fontSize: 11, color: '#F5A623' }}>★ {item.place.rating}</span>}
          </div>
          <textarea
            ref={memoRef}
            value={memo}
            onChange={e => setMemo(e.target.value)}
            onBlur={e => onMemoSave(e.target.value)}
            onClick={e => e.stopPropagation()}
            onDragStart={e => e.stopPropagation()}
            placeholder="메모 추가 (예약번호, 준비물, 특이사항...)"
            rows={2}
            style={{ width: '100%', border: 'none', borderTop: `1px solid #F4F4F5`,
              outline: 'none', background: '#FAFAFA', fontSize: 12, color: CHAR,
              resize: 'none', lineHeight: 1.6, fontFamily: 'inherit',
              boxSizing: 'border-box', padding: '6px 0 2px', cursor: 'text' }}
          />
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: GRAY }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${INDIGO_LIGHT}`, borderTopColor: INDIGO,
        borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 13 }}>일정 불러오는 중...</span>
    </div>
  )
}

export default function TripDetailPage() {
  const navigate   = useNavigate()
  const { id }     = useParams<{ id: string }>()
  const scheduleId = Number(id)

  const [trip,      setTrip]      = useState<ScheduleDetailResponse | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [apiError,  setApiError]  = useState('')
  const [dayPlans,  setDayPlans]  = useState<DayPlan[]>([])
  const [tmpPlaces, setTmpPlaces] = useState<Place[]>([])

  const [folders,         setFolders]         = useState<FolderResponse[]>([])
  const [folderId,        setFolderId]        = useState<number | null>(null)
  const [folderPlaces,    setFolderPlaces]    = useState<Place[]>([])
  const [filterCat,       setFilterCat]       = useState('전체')
  const [showFolderModal, setShowFolderModal] = useState(false)

  // 드래그 상태 — place: 좌측 라이브러리에서, item: 일정 카드 자체
  const [dragPlace,   setDragPlace]   = useState<Place | null>(null)
  const [dragItem,    setDragItem]    = useState<{ dayIdx: number; item: ScheduleItem } | null>(null)
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)
  // 같은 Day 내 순서 변경용
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

  const [conflicts,    setConflicts]    = useState<ConflictWarn[]>([])
  const [showConflict, setShowConflict] = useState(false)
  const [modalItem,    setModalItem]    = useState<{ dayIdx: number; item: ScheduleItem } | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())

  function toggleDay(day: number) {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      next.has(day) ? next.delete(day) : next.add(day)
      return next
    })
  }

  useEffect(() => {
    if (!scheduleId) return
    Promise.all([scheduleApi.getDetail(scheduleId), folderApi.getAll()])
      .then(([detailRes, foldersRes]) => {
        const detail = detailRes.data
        setTrip(detail)
        setFolders(foldersRes.data)
        setTmpPlaces(detail.tmpPlaces.map(tmpToPlace))
        const days = getDayList(detail.startDate, detail.endDate)
        const plans: DayPlan[] = days.map((date, i) => ({
          day: i + 1, date,
          items: (detail.timeline[date] ?? []).map(t => timelineToItem(t, date))
        }))
        setDayPlans(plans)
        recheckConflicts(plans)
      })
      .catch(() => setApiError('일정을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [scheduleId])

  // 폴더 선택 중에도 검색으로 추가한 장소(tmpPlaces)가 항상 같이 보이도록 병합합니다.
  // placeId가 있으면 placeId로, 없으면 id(tmpPlaceId 기반)로 중복을 제거합니다.
  const baseList = (() => {
    if (!folderId) return tmpPlaces
    const merged = [...folderPlaces, ...tmpPlaces]
    const seen = new Set<string>()
    const result: Place[] = []
    for (const p of merged) {
      const key = p.placeId != null ? `pid:${p.placeId}` : `id:${p.id}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(p)
    }
    return result
  })()
  const cats     = ['전체', ...Array.from(new Set(baseList.map(p => p.category)))]
  const visible  = filterCat === '전체' ? baseList : baseList.filter(p => p.category === filterCat)
  const usedPlaceIds = new Set(dayPlans.flatMap(d => d.items.map(it => it.place.placeId).filter((v): v is number => v != null)))
  const visibleFiltered = visible.filter(p => p.placeId == null || !usedPlaceIds.has(p.placeId))

  function recheckConflicts(plans: DayPlan[]) {
    const all: ConflictWarn[] = []

    plans.forEach((dp, dayIdx) => {
      // 1. 시간 겹침 충돌 (프론트에서 계산)
      findConflicts(dp.items).forEach(([a, b]) =>
        all.push({ dayIdx, itemA: a, itemB: b, type: 'overlap' })
      )
      // 2. 영업시간 충돌 (백엔드 conflictWarning 값 사용)
      dp.items
        .filter(item => item.conflictWarning)
        .forEach(item =>
          all.push({ dayIdx, itemA: item, itemB: item, type: 'hours' })
        )
    })

    setConflicts(all)
    setShowConflict(all.length > 0)
  }

  function handleSearchAdded(t: TmpPlaceResponse) {
    const p = tmpToPlace(t)
    setTmpPlaces(prev => [p, ...prev.filter(x => x.tmpPlaceId !== t.tmpPlaceId)])
  }

  async function handleSelectFolder(newFolderId: number) {
    setFolderId(newFolderId)
    try {
      const placesRes = await folderApi.getPlaces(newFolderId)
      const placeIds  = placesRes.data.map(p => p.placeId)
      const res       = await scheduleApi.addTmpFromFolder(scheduleId, newFolderId, placeIds)
      const added     = res.data.map(tmpToPlace)
      setFolderPlaces(added)
      setTmpPlaces(prev => { const ids = new Set(prev.map(p => p.tmpPlaceId)); return [...prev, ...added.filter(p => !ids.has(p.tmpPlaceId))] })
    } catch {
      setFolderPlaces([])
    }
  }

  // ── 좌측 라이브러리 → Day 드롭 ──────────────────────
  async function handleDropFromLibrary(dayIdx: number) {
    if (!dragPlace || !dragPlace.tmpPlaceId) return
    const dp   = dayPlans[dayIdx]
    const next = calcNextTime(dp.items)
    const tmpPlaceId = dragPlace.tmpPlaceId
    try {
      const res = await scheduleApi.addTimelineItem(scheduleId, { tmpPlaceId, visitDate: dp.date })
      await scheduleApi.updateTimelineItem(scheduleId, res.data.timelineItemId, {
        visitTime: toLocalTime(next.start), endTime: toLocalTime(next.end),
      })
      const newItem: ScheduleItem = { ...timelineToItem(res.data, dp.date), startTime: next.start, endTime: next.end, tmpPlaceId }
      const updated = dayPlans.map((d, i) => i === dayIdx ? { ...d, items: [...d.items, newItem] } : d)
      setDayPlans(updated)
      recheckConflicts(updated)
    } catch (e) { console.error(e); alert('일정 추가에 실패했어요.') }
    setDragPlace(null); setDragOverDay(null)
  }

  // ── 다른 Day로 이동 ─────────────────────────────────
  async function handleDropItemToDay(toDayIdx: number) {
    if (!dragItem) return
    const { dayIdx: fromIdx, item } = dragItem
    if (fromIdx === toDayIdx) {
      // 같은 Day → 순서 변경 처리 (dragOverItemId 기준)
      if (dragOverItemId) {
        const dp = dayPlans[fromIdx]
        const fromPos = dp.items.findIndex(it => it.id === item.id)
        const toPos   = dp.items.findIndex(it => it.id === dragOverItemId)
        if (fromPos !== -1 && toPos !== -1 && fromPos !== toPos) {
          const newItems = [...dp.items]
          newItems.splice(fromPos, 1)
          newItems.splice(toPos, 0, item)
          const reordered = newItems.map((it, idx) => ({ ...it, visitOrder: idx + 1 }))
          const updated = dayPlans.map((d, i) => i === fromIdx ? { ...d, items: reordered } : d)
          setDayPlans(updated)
          recheckConflicts(updated)
          // 백엔드 순서 반영
          try {
            await scheduleApi.reorderTimeline(scheduleId, {
              orders: reordered
                .filter(it => it.timelineItemId)
                .map(it => ({ timelineItemId: it.timelineItemId!, visitOrder: it.visitOrder }))
            })
          } catch { console.error('순서 저장 실패') }
        }
      }
      setDragItem(null); setDragOverDay(null); setDragOverItemId(null)
      return
    }

    if (!item.timelineItemId) return
    const next   = calcNextTime(dayPlans[toDayIdx].items)
    const toDate = dayPlans[toDayIdx].date
    try {
      await scheduleApi.updateTimelineItem(scheduleId, item.timelineItemId, {
        visitTime: toLocalTime(next.start), endTime: toLocalTime(next.end),
      })
      const movedItem: ScheduleItem = { ...item, startTime: next.start, endTime: next.end, visitDate: toDate }
      const updated = dayPlans.map((d, i) => {
        if (i === fromIdx)  return { ...d, items: d.items.filter(it => it.id !== item.id) }
        if (i === toDayIdx) return { ...d, items: [...d.items, movedItem] }
        return d
      })
      setDayPlans(updated)
      recheckConflicts(updated)
    } catch { alert('일정 이동에 실패했어요.') }
    setDragItem(null); setDragOverDay(null); setDragOverItemId(null)
  }

  function handleDrop(dayIdx: number) {
    if (dragItem) handleDropItemToDay(dayIdx)
    else if (dragPlace) handleDropFromLibrary(dayIdx)
    setDragOverDay(null)
  }

  async function handleMemoSave(dayIdx: number, item: ScheduleItem, memo: string) {
    if (!item.timelineItemId) return
    try {
      await scheduleApi.updateTimelineItem(scheduleId, item.timelineItemId, {
        visitTime: toLocalTime(item.startTime), endTime: toLocalTime(item.endTime), memo,
      })
      const plans = dayPlans.map((d, i) =>
        i === dayIdx ? { ...d, items: d.items.map(it => it.id === item.id ? { ...it, memo } : it) } : d
      )
      setDayPlans(plans)
    } catch { alert('메모 저장에 실패했어요.') }
  }

  async function handleModalSave(updated: ScheduleItem) {
    if (!updated.timelineItemId || !modalItem) return
    try {
      const res = await scheduleApi.updateTimelineItem(scheduleId, updated.timelineItemId, {
        visitTime: toLocalTime(updated.startTime),
        endTime:   toLocalTime(updated.endTime),
        memo:      updated.memo,
      })
      // 백엔드 응답의 conflictWarning 반영
      const savedItem = { ...updated, conflictWarning: res.data.conflictWarning }
      const plans = dayPlans.map((d, i) =>
        i === modalItem.dayIdx ? { ...d, items: d.items.map(it => it.id === updated.id ? savedItem : it) } : d
      )
      setDayPlans(plans)
      recheckConflicts(plans)
    } catch { alert('저장에 실패했어요.') }
    setModalItem(null)
  }

  async function handleRemoveItem(dayIdx: number, itemId: string) {
    const target = dayPlans[dayIdx]?.items.find(it => it.id === itemId)
    setModalItem(null)

    // 백엔드에 아직 저장되지 않은(timelineItemId가 없는) 항목은 API 호출 없이 로컬에서만 제거
    if (!target?.timelineItemId) {
      const plans = dayPlans.map((d, i) => i === dayIdx ? { ...d, items: d.items.filter(it => it.id !== itemId) } : d)
      setDayPlans(plans)
      recheckConflicts(plans)
      return
    }

    try {
      await scheduleApi.deleteTimelineItem(scheduleId, target.timelineItemId)
      const plans = dayPlans.map((d, i) => i === dayIdx ? { ...d, items: d.items.filter(it => it.id !== itemId) } : d)
      setDayPlans(plans)
      recheckConflicts(plans)
    } catch {
      alert('삭제에 실패했어요. 다시 시도해주세요.')
    }
  }

  // ── 저장하기 — 전체 아이템 저장 후 /schedule 이동 ──
  async function handleSaveAll() {
    setSaving(true)
    try {
      await Promise.all(
        dayPlans.flatMap(dp =>
          dp.items
            .filter(item => item.timelineItemId)
            .map(item =>
              scheduleApi.updateTimelineItem(scheduleId, item.timelineItemId!, {
                visitTime: toLocalTime(item.startTime),
                endTime:   toLocalTime(item.endTime),
                memo:      item.memo,
              })
            )
        )
      )
      navigate('/schedule')
    } catch {
      alert('저장에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const conflictIds     = new Set(conflicts.flatMap(c => [c.itemA.id, c.itemB.id]))
  const hoursConflictIds   = new Set(conflicts.filter(c => c.type === 'hours').map(c => c.itemA.id))
  const overlapConflictIds = new Set(conflicts.filter(c => c.type === 'overlap').flatMap(c => [c.itemA.id, c.itemB.id]))

  if (loading) return <LoadingSpinner />
  if (!trip) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: GRAY, flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 32 }}>⚠️</span>
      <span style={{ fontSize: 14 }}>{apiError || '일정을 찾을 수 없어요.'}</span>
      <button onClick={() => navigate('/schedule')} style={{ padding: '8px 20px', borderRadius: 8,
        background: INDIGO_LIGHT, border: 'none', color: INDIGO, fontWeight: 600, cursor: 'pointer' }}>돌아가기</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff', overflow: 'hidden' }}>

      {/* ── 좌측 패널 ── */}
      <div style={{ width: 360, flexShrink: 0, borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid #F4F4F5` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <button onClick={() => navigate('/schedule')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: GRAY, padding: 0 }}>‹</button>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: CHAR, margin: 0 }}>{trip.title}</h2>
          </div>
          <div style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>
            {formatDayLabel(trip.startDate)} ~ {formatDayLabel(trip.endDate)}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: GRAY }}>
            <span>👤 {trip.memberCount}명</span>
            <span>📍 {trip.destination}</span>
          </div>
        </div>

        <div style={{ padding: '14px 16px', borderBottom: `1px solid #F4F4F5` }}>
          <SearchBar scheduleId={scheduleId} onAdded={handleSearchAdded} />
        </div>

        <div style={{ padding: '12px 16px', borderBottom: `1px solid #F4F4F5` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: CHAR }}>불러올 폴더</span>
            <button onClick={() => setShowFolderModal(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: INDIGO, fontWeight: 600 }}>변경 ›</button>
          </div>
          <div onClick={() => setShowFolderModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${BORDER}`,
              background: '#FAFAFA', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = INDIGO)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: INDIGO_LIGHT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗂️</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: CHAR }}>
                  임시보관함{folderId ? ` · ${folders.find(f => f.folderId === folderId)?.folderName ?? ''}` : ''}
                </div>
                <div style={{ fontSize: 11, color: INDIGO }}>{visibleFiltered.length}개의 장소</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: INDIGO, fontWeight: 600 }}>선택 ›</span>
          </div>
        </div>

        <div style={{ padding: '10px 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid #F4F4F5` }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filterCat === c ? INDIGO : '#F4F4F5',
                color: filterCat === c ? '#fff' : GRAY,
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>{c}</button>
          ))}
        </div>

        <div style={{ padding: '8px 16px 4px' }}>
          <p style={{ fontSize: 11, color: '#A1A1AA', margin: 0 }}>드래그해서 일정 추가 · 일정 간 드래그로 요일 이동</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 16px' }}>
          {visibleFiltered.length === 0
            ? <p style={{ fontSize: 12, color: '#D4D4D8', textAlign: 'center', marginTop: 24 }}>
                {visible.length > 0 ? '모든 장소가 일정에 추가됐어요 ✅' : '장소가 없어요'}
              </p>
            : visibleFiltered.map(p => <PlaceCard key={p.id} place={p} onDragStart={setDragPlace} />)
          }
        </div>
      </div>

      {/* ── 우측 일정 영역 ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', background: '#FAFAFA' }}>

        {/* 상단 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => alert('구글 캘린더 연동 후 사용 가능합니다.')}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${BORDER}`, background: '#fff',
              fontSize: 13, fontWeight: 500, color: GRAY, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.color = INDIGO }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = GRAY }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            공유하기
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, cursor: saving ? 'wait' : 'pointer',
              border: 'none', background: saving ? '#A5B4FC' : INDIGO,
              fontSize: 13, fontWeight: 600, color: '#fff', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = INDIGO_DARK }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = INDIGO }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>

        {showConflict && (
          <ConflictBanner conflicts={conflicts} dayPlans={dayPlans} onDismiss={() => setShowConflict(false)} />
        )}

        {dayPlans.map((dp, dayIdx) => {
          const isCollapsed = collapsedDays.has(dp.day)
          return (
            <div key={dp.day} style={{ marginBottom: 28 }}>
              <div
                onClick={() => toggleDay(dp.day)}
                style={{ display: 'flex', alignItems: 'center', gap: 14,
                  marginBottom: isCollapsed ? 0 : 12, cursor: 'pointer' }}>
                <div style={{ padding: '6px 16px', borderRadius: 20, background: INDIGO,
                  color: '#fff', fontSize: 13, fontWeight: 700 }}>Day {dp.day}</div>
                <span style={{ fontSize: 13, color: GRAY }}>{formatDayLabel(dp.date)}</span>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
                <span style={{ fontSize: 11, color: '#A1A1AA' }}>{dp.items.length}개 장소</span>
                <span style={{ fontSize: 13, color: GRAY, display: 'inline-block',
                  transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
              </div>

              {!isCollapsed && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverDay(dayIdx) }}
                  onDragLeave={e => {
                    // 자식 요소로 이동 시 오버 해제 방지
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDay(null)
                  }}
                  onDrop={() => handleDrop(dayIdx)}
                  style={{ minHeight: dp.items.length === 0 ? 90 : 'auto', borderRadius: 12,
                    border: dragOverDay === dayIdx && !dragItem ? `2px dashed ${INDIGO}` : dp.items.length === 0 ? `1.5px dashed ${BORDER}` : 'none',
                    background: dragOverDay === dayIdx && !dragItem ? INDIGO_LIGHT : dp.items.length === 0 ? '#FAFAFA' : 'transparent',
                    display: 'flex', flexDirection: 'column',
                    alignItems: dp.items.length === 0 ? 'center' : 'stretch',
                    justifyContent: dp.items.length === 0 ? 'center' : 'flex-start',
                    transition: 'all 0.15s', padding: dp.items.length > 0 ? '4px 0' : 0 }}>
                  {dp.items.length === 0
                    ? <span style={{ fontSize: 12, color: '#A1A1AA' }}>왼쪽에서 장소를 드래그해 놓으세요</span>
                    : <>
                        {dp.items.map(item => (
                          <div
                            key={item.id}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverItemId(item.id) }}
                            onDragLeave={() => setDragOverItemId(null)}
                            style={{
                              outline: dragOverItemId === item.id && dragItem?.item.id !== item.id
                                ? `2px dashed ${INDIGO}` : 'none',
                              borderRadius: 12,
                            }}
                          >
                            <ScheduleItemCard
                              item={item}
                              hasConflict={conflictIds.has(item.id)}
                              conflictType={
                                hoursConflictIds.has(item.id) ? 'hours'
                                : overlapConflictIds.has(item.id) ? 'overlap'
                                : null
                              }
                              onClick={() => setModalItem({ dayIdx, item })}
                              onMemoSave={memo => handleMemoSave(dayIdx, item, memo)}
                              onDragStart={item => { setDragItem({ dayIdx, item }); setDragOverDay(dayIdx) }}
                              onDragEnd={() => { setDragItem(null); setDragOverItemId(null) }}
                            />
                          </div>
                        ))}
                        <div style={{ border: dragOverDay === dayIdx && dragItem ? `1.5px dashed ${INDIGO}` : `1.5px dashed ${BORDER}`,
                          borderRadius: 10, padding: '10px', textAlign: 'center', fontSize: 11,
                          color: '#A1A1AA', marginTop: 4,
                          background: dragOverDay === dayIdx && dragItem ? INDIGO_LIGHT : 'transparent', transition: 'all 0.15s' }}>
                          + 장소를 드래그해서 추가
                        </div>
                      </>
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showFolderModal && (
        <FolderModal current={folderId} folders={folders}
          onSelect={handleSelectFolder} onClose={() => setShowFolderModal(false)} />
      )}

      {modalItem && (
        <TimeModal
          item={modalItem.item}
          onSave={handleModalSave}
          onClose={() => setModalItem(null)}
          onRemove={() => handleRemoveItem(modalItem.dayIdx, modalItem.item.id)}
        />
      )}
    </div>
  )
}
