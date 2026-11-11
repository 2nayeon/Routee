import { useState, useEffect, useCallback, useRef } from 'react'
import { placeApi, folderApi } from '../api/index'
import type { PlaceSearchResponse, FolderResponse } from '../api/index'
import { categoryEmoji, catStyle as sharedCatStyle, indigoCatColors } from '../utils/category'
import Toast from '../components/common/Toast'
import CreateFolderModal from '../components/common/CreateFolderModal'

const INDIGO       = '#4F46E5'
const INDIGO_LIGHT = '#EEF2FF'
const CHAR         = '#18181B'
const GRAY         = '#71717A'
const BORDER       = '#E4E4E7'

interface Place extends PlaceSearchResponse {
  emoji: string
  placeId?: number
}

const CAT_COLORS = indigoCatColors(INDIGO, INDIGO_LIGHT)
function catStyle(cat: string) { return sharedCatStyle(cat, CAT_COLORS, { bg: '#F4F4F5', color: GRAY }) }

// ── 폴더 선택 모달 ──────────────────────────────────────
function FolderPickModal({ folders, onSelect, onCreateNew, onClose }: {
  folders: FolderResponse[]
  onSelect: (folderId: number) => void
  onCreateNew: () => void
  onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px',
        width: 380, maxHeight: '70vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(79,70,229,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: CHAR, margin: 0 }}>폴더에 저장</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#D4D4D8', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: GRAY, marginBottom: 16 }}>저장할 폴더를 선택하세요</p>

        <button onClick={onCreateNew}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12,
            border: `1.5px dashed ${INDIGO}`, background: INDIGO_LIGHT,
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
          <span style={{ fontSize: 18, color: INDIGO }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: INDIGO }}>새 폴더 만들기</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {folders.map(f => (
            <div key={f.folderId} onClick={() => onSelect(f.folderId)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: `1px solid ${BORDER}`, background: '#fff',
                cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.background = INDIGO_LIGHT }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#fff' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: INDIGO_LIGHT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🗂️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: CHAR }}>{f.folderName}</div>
                <div style={{ fontSize: 11, color: GRAY }}>{f.placeCount}개 장소</div>
              </div>
              <span style={{ color: '#D4D4D8' }}>›</span>
            </div>
          ))}
          {folders.length === 0 && (
            <p style={{ fontSize: 12, color: '#D4D4D8', textAlign: 'center', padding: '12px 0' }}>폴더가 없어요</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 장소 카드 ───────────────────────────────────────────
function PlaceCard({ place, selected, isLiked, onClick, onLike }: {
  place: Place
  selected: boolean
  isLiked: boolean
  onClick: () => void
  onLike: (place: Place) => void
}) {

  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12,
      background: selected ? INDIGO_LIGHT : '#fff',
      border: `1.5px solid ${selected ? INDIGO : BORDER}`,
      cursor: 'pointer', transition: 'all 0.15s', marginBottom: 8,
      boxShadow: selected ? '0 0 0 2px rgba(79,70,229,0.1)' : 'none',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: selected ? '#E0E7FF' : '#F4F4F5',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
        {place.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: CHAR,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {place.placeName}
          </span>
          {/* 하트 버튼 */}
          <button
            onClick={e => { e.stopPropagation(); onLike(place) }}
            style={{ background: isLiked ? '#FFF0F0' : '#F4F4F5',
              border: `1px solid ${isLiked ? '#FECACA' : BORDER}`,
              borderRadius: 8, cursor: 'pointer',
              width: 30, height: 30, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={isLiked ? '#EF4444' : 'none'}
              stroke={isLiked ? '#EF4444' : '#A1A1AA'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        <div style={{ fontSize: 11, color: GRAY, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {place.address}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {place.category && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
              fontWeight: 600, ...catStyle(place.category) }}>
              {place.category}
            </span>
          )}
          {place.rating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3,
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 6, padding: '2px 7px' }}>
              <span style={{ fontSize: 11, color: '#F59E0B' }}>★</span>
              <span style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>{place.rating}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── 구글맵 타입 선언 ────────────────────────────────────
declare global {
  interface Window {
    google: any
    initGoogleMap?: () => void
  }
}

// ── 구글맵 컴포넌트 ─────────────────────────────────────
function MapArea({ selectedPlace }: { selectedPlace: Place | null }) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef   = useRef<any>(null)
  const infoRef     = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)

  // 구글맵 스크립트 로드
  useEffect(() => {
    if (window.google?.maps) { setMapReady(true); return }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) { setMapError(true); return }

    window.initGoogleMap = () => setMapReady(true)

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&language=ko`
    script.async = true
    script.defer = true
    script.onerror = () => setMapError(true)
    document.head.appendChild(script)

    return () => {
      window.initGoogleMap = () => {}
    }
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 37.5665, lng: 126.9780 }, // 서울 기본값
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    })
  }, [mapReady])

  // 선택된 장소로 지도 이동 + 마커 표시
  useEffect(() => {
    if (!mapInstance.current || !window.google?.maps) return

    // 기존 마커/인포윈도우 제거
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null }
    if (infoRef.current)   { infoRef.current.close(); infoRef.current = null }

    if (!selectedPlace) return

    const lat = selectedPlace.latitude
    const lng = selectedPlace.longitude

    if (!lat || !lng) return

    const pos = { lat, lng }

    // 지도 이동
    mapInstance.current.panTo(pos)
    mapInstance.current.setZoom(16)

    // 마커
    markerRef.current = new window.google.maps.Marker({
      position: pos,
      map: mapInstance.current,
      title: selectedPlace.placeName,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: INDIGO,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      animation: window.google.maps.Animation.DROP,
    })

    // 인포윈도우
    infoRef.current = new window.google.maps.InfoWindow({
      content: `
        <div style="padding:8px 4px;min-width:160px;">
          <div style="font-size:14px;font-weight:700;color:#18181B;margin-bottom:4px;">
            ${selectedPlace.emoji} ${selectedPlace.placeName}
          </div>
          <div style="font-size:11px;color:#71717A;margin-bottom:4px;line-height:1.4;">
            ${selectedPlace.address}
          </div>
          ${selectedPlace.rating ? `<div style="font-size:12px;color:#F59E0B;font-weight:600;">★ ${selectedPlace.rating}</div>` : ''}
        </div>
      `,
    })

    infoRef.current.open(mapInstance.current, markerRef.current)
    markerRef.current.addListener('click', () => {
      infoRef.current.open(mapInstance.current, markerRef.current)
    })
  }, [selectedPlace])

  // 에러 상태
  if (mapError) {
    return (
      <div style={{ flex: 1, background: '#F8F8FF', borderRadius: 16,
        border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <p style={{ fontSize: 14, color: GRAY, margin: 0 }}>지도를 불러올 수 없어요</p>
        <p style={{ fontSize: 12, color: '#A1A1AA', margin: 0 }}>
          .env의 VITE_GOOGLE_MAPS_API_KEY를 확인해주세요
        </p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, borderRadius: 16, border: `1px solid ${BORDER}`,
      overflow: 'hidden', position: 'relative', background: '#F4F4F5' }}>

      {/* 로딩 오버레이 */}
      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, background: '#F8F8FF',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, zIndex: 10 }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${INDIGO_LIGHT}`,
            borderTopColor: INDIGO, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{ fontSize: 13, color: GRAY }}>지도 불러오는 중...</span>
        </div>
      )}

      {/* 지도 div */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* 장소 선택 안내 — 마커 없을 때만 */}
      {mapReady && !selectedPlace && (
        <div style={{ position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none',
          background: 'rgba(255,255,255,0.92)', borderRadius: 12,
          padding: '14px 20px', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(79,70,229,0.10)',
          border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🗺️</div>
          <p style={{ fontSize: 13, fontWeight: 600, color: CHAR, margin: '0 0 4px' }}>
            장소를 선택하면 지도에 표시돼요
          </p>
          <p style={{ fontSize: 11, color: GRAY, margin: 0 }}>왼쪽에서 장소를 검색해보세요</p>
        </div>
      )}
    </div>
  )
}

// ── 메인 ────────────────────────────────────────────────
export default function ExplorePage() {
  const [query,           setQuery]           = useState('')
  const [results,         setResults]         = useState<Place[]>([])
  const [searching,       setSearching]       = useState(false)
  const [selectedPlace,   setSelectedPlace]   = useState<Place | null>(null)

  const [folders,         setFolders]         = useState<FolderResponse[]>([])
  // googlePlaceId → { folderId, placeId } 매핑
  const [likedMap,        setLikedMap]        = useState<Map<string, { folderId: number; placeId: number }>>(new Map())
  const [likeTarget,      setLikeTarget]      = useState<Place | null>(null)
  const [showFolderPick,  setShowFolderPick]  = useState(false)
  const [showCreateFolder,setShowCreateFolder]= useState(false)
  const [toast,           setToast]           = useState('')

  useEffect(() => {
    folderApi.getAll().then(async res => {
      setFolders(res.data)
      const newLikedMap = new Map<string, { folderId: number; placeId: number }>()
      await Promise.all(
        res.data.map(async folder => {
          try {
            const placesRes = await folderApi.getPlaces(folder.folderId)
            placesRes.data.forEach(place => {
              // key: googlePlaceId 로 저장 — 검색 결과의 placeId가 null인 경우에도 항상 매칭 가능
              newLikedMap.set(place.googlePlaceId, {
                folderId: folder.folderId,
                placeId: place.placeId,
              })
            })
          } catch {}
        })
      )
      setLikedMap(newLikedMap)
    }).catch(() => {})
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await placeApi.search(q)
      setResults(res.data.map(p => ({ ...p, emoji: categoryEmoji(p.category ?? '') })))
    } catch { setResults([]) }
    finally { setSearching(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 400)
    return () => clearTimeout(t)
  }, [query, doSearch])

  function handleLike(place: Place) {
    const placeKey = place.googlePlaceId

    // 이미 좋아요한 장소면 → 취소
    if (likedMap.has(placeKey)) {
      const { folderId, placeId } = likedMap.get(placeKey)!
      folderApi.removePlace(folderId, placeId).catch(() => {})
      setLikedMap(prev => {
        const next = new Map(prev)
        next.delete(placeKey)
        return next
      })
      setFolders(prev => prev.map(f =>
        f.folderId === folderId ? { ...f, placeCount: Math.max(0, f.placeCount - 1) } : f
      ))
      setToast('💔 좋아요가 취소됐어요')
      return
    }
    // 좋아요 안 한 장소 → 폴더 선택 모달
    setLikeTarget(place)
    setShowFolderPick(true)
  }

  async function handleSelectFolder(folderId: number) {
    if (!likeTarget) return
    setShowFolderPick(false)
    try {
      const saveRes = await placeApi.save(likeTarget.googlePlaceId)
      const placeId = saveRes.data
      await folderApi.addPlace(folderId, placeId)
      setLikedMap(prev => {
        const next = new Map(prev)
        next.set(likeTarget.googlePlaceId, { folderId, placeId })
        return next
      })
      setFolders(prev => prev.map(f =>
        f.folderId === folderId ? { ...f, placeCount: f.placeCount + 1 } : f
      ))
      setToast('❤️ 폴더에 저장됐어요!')
    } catch { setToast('저장에 실패했어요.') }
    setLikeTarget(null)
  }

  async function handleCreateFolder(name: string) {
    try {
      const res = await folderApi.create(name)
      setFolders(prev => [...prev, res.data])
      setShowCreateFolder(false)
      setShowFolderPick(true)
      setToast(`'${name}' 폴더가 만들어졌어요!`)
    } catch { setToast('폴더 생성에 실패했어요.') }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff',
      padding: '20px 24px', gap: 20, boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ── 왼쪽 패널 ── */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

        {/* 검색바 */}
        <div style={{ position: 'relative', background: '#FAFAFA',
          border: `1.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden',
          transition: 'border-color 0.15s' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: GRAY }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={e => (e.currentTarget.parentElement!.style.borderColor = INDIGO)}
            onBlur={e => (e.currentTarget.parentElement!.style.borderColor = BORDER)}
            placeholder="장소명, 주소, 카테고리 검색..."
            style={{ width: '100%', padding: '12px 44px', border: 'none', outline: 'none',
              fontSize: 13, color: CHAR, background: 'transparent', boxSizing: 'border-box' }} />
          {searching && (
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: GRAY }}>검색 중...</span>
          )}
          {query && !searching && (
            <button onClick={() => { setQuery(''); setResults([]) }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#A1A1AA' }}>✕</button>
          )}
        </div>

        {/* 결과 수 */}
        <div style={{ fontSize: 12, color: GRAY, paddingLeft: 2 }}>
          {query ? `${results.length}개의 장소를 찾았어요` : '장소명을 검색해보세요'}
        </div>

        {/* 장소 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          {!query ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: '#A1A1AA' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: INDIGO_LIGHT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, margin: '0 auto 14px' }}>🔍</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: GRAY, margin: '0 0 6px' }}>검색으로 장소를 찾아보세요</p>
              <p style={{ fontSize: 12, margin: 0 }}>❤️ 누르면 폴더에 저장할 수 있어요</p>
            </div>
          ) : results.length === 0 && !searching ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#A1A1AA' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 14, margin: 0 }}>검색 결과가 없어요</p>
            </div>
          ) : (
            results.map(place => (
              <PlaceCard
                key={place.googlePlaceId}
                place={place}
                selected={selectedPlace?.googlePlaceId === place.googlePlaceId}
                isLiked={likedMap.has(place.googlePlaceId)}
                onClick={() => setSelectedPlace(place)}
                onLike={handleLike}
              />
            ))
          )}
        </div>
      </div>

      {/* ── 오른쪽 지도 ── */}
      <MapArea selectedPlace={selectedPlace} />

      {showFolderPick && (
        <FolderPickModal
          folders={folders}
          onSelect={handleSelectFolder}
          onCreateNew={() => { setShowFolderPick(false); setShowCreateFolder(true) }}
          onClose={() => { setShowFolderPick(false); setLikeTarget(null) }}
        />
      )}

      {showCreateFolder && (
        <CreateFolderModal
          onCreate={handleCreateFolder}
          onClose={() => { setShowCreateFolder(false); setShowFolderPick(true) }}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  )
}
