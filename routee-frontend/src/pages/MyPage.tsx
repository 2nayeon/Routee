import { useState, useEffect } from 'react'
import { folderApi } from '../api'
import type { FolderResponse, FolderPlaceResponse } from '../api'
import { categoryEmoji, catStyle as sharedCatStyle, skyCatColors } from '../utils/category'
import Toast from '../components/common/Toast'
import CreateFolderModal from '../components/common/CreateFolderModal'

const SKY  = '#C8E8F8'
const BLUE = '#1A6AB8'
const DEEP = '#0D2E5A'
const MID  = '#2A5A8A'

const CAT_COLORS = skyCatColors(BLUE)
function catStyle(cat: string) { return sharedCatStyle(cat, CAT_COLORS, { bg: '#F0F0F0', color: '#666' }) }

// ── 폴더 카드 ─────────────────────────────
function FolderCard({ folder, selected, onClick, onDelete }: {
  folder: FolderResponse; selected: boolean
  onClick: () => void; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setConfirmDel(false)}}
      style={{padding:'16px 18px',borderRadius:14,cursor:'pointer',
        border:`1.5px solid ${selected?BLUE:hovered?SKY:'#EBEBEB'}`,
        background:selected?'#F0F8FF':hovered?'#FAFCFF':'#fff',
        transition:'all 0.15s',position:'relative',
        boxShadow:hovered?'0 4px 14px rgba(200,232,248,0.5)':'none'}}>

      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:44,height:44,borderRadius:10,background:SKY,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🗂️</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:DEEP,marginBottom:2}}>{folder.folderName}</div>
          <div style={{fontSize:12,color:BLUE}}>{folder.placeCount}개의 장소</div>
        </div>
        {hovered && (
          <button
            onClick={e=>{e.stopPropagation();if(confirmDel)onDelete();else setConfirmDel(true)}}
            style={{padding:'4px 10px',borderRadius:8,border:'none',
              background:confirmDel?'#D4603A':'rgba(212,96,58,0.12)',
              color:confirmDel?'#fff':'#D4603A',fontSize:11,fontWeight:600,cursor:'pointer',
              flexShrink:0,transition:'all 0.15s'}}>
            {confirmDel?'삭제 확인':'🗑 삭제'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── 장소 아이템 ────────────────────────────
function PlaceItem({ place }: { place: FolderPlaceResponse }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',
      background:'#fff',borderRadius:12,border:'1px solid #F0F0F0',marginBottom:8}}>
      <div style={{width:40,height:40,borderRadius:10,background:'#F0F9FF',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
        {categoryEmoji(place.category)}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,color:DEEP,marginBottom:4}}>{place.placeName}</div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
          <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:600,...catStyle(place.category)}}>
            {place.category}
          </span>
          {place.rating && <span style={{fontSize:11,color:'#D4A853',fontWeight:700}}>★ {place.rating}</span>}
        </div>
        <div style={{fontSize:11,color:'#999',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          📍 {place.address}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// 메인 페이지
// ════════════════════════════════════════
export default function MyPage() {
  const [folders,       setFolders]       = useState<FolderResponse[]>([])
  const [selectedId,    setSelectedId]    = useState<number|null>(null)
  const [folderPlaces,  setFolderPlaces]  = useState<FolderPlaceResponse[]>([])
  const [loading,       setLoading]       = useState(true)
  const [placesLoading, setPlacesLoading] = useState(false)
  const [showCreate,    setShowCreate]    = useState(false)
  const [toast,         setToast]         = useState('')

  // 폴더 목록 로드
  useEffect(() => {
    folderApi.getAll()
      .then(res=>{ setFolders(res.data); if(res.data.length>0) setSelectedId(res.data[0].folderId) })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [])

  // 선택된 폴더 장소 로드
  useEffect(() => {
    if (!selectedId) return
    setPlacesLoading(true)
    folderApi.getPlaces(selectedId)
      .then(res=>setFolderPlaces(res.data))
      .catch(()=>setFolderPlaces([]))
      .finally(()=>setPlacesLoading(false))
  }, [selectedId])

  async function handleCreateFolder(name: string) {
    try {
      const res = await folderApi.create(name)
      setFolders(prev=>[...prev, res.data])
      setSelectedId(res.data.folderId)
      setShowCreate(false)
      setToast(`'${name}' 폴더가 만들어졌어요!`)
    } catch { setToast('폴더 생성에 실패했어요.') }
  }

  async function handleDeleteFolder(folderId: number) {
    try {
      await folderApi.delete(folderId)
      const next = folders.filter(f=>f.folderId!==folderId)
      setFolders(next)
      if (selectedId===folderId) {
        setSelectedId(next.length>0?next[0].folderId:null)
        setFolderPlaces([])
      }
      setToast('폴더가 삭제됐어요.')
    } catch { setToast('폴더 삭제에 실패했어요.') }
  }

  const selectedFolder = folders.find(f=>f.folderId===selectedId)

  return (
    <div style={{minHeight:'100%',background:'#fff',padding:'32px 48px 48px',boxSizing:'border-box'}}>

      {/* 헤더 */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:DEEP,margin:0}}>마이페이지</h1>
          <p style={{fontSize:12,color:'#999',marginTop:4}}>좋아요 폴더 관리</p>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{
          display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:8,
          background:SKY,border:'none',color:BLUE,fontSize:13,fontWeight:600,cursor:'pointer'}}>
          + 새 폴더
        </button>
      </div>

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 0',color:'#AAA',gap:12}}>
          <div style={{width:28,height:28,border:`3px solid ${SKY}`,borderTopColor:BLUE,
            borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <span style={{fontSize:13}}>불러오는 중...</span>
        </div>
      ) : (
        <div style={{display:'flex',gap:28,alignItems:'flex-start'}}>

          {/* 왼쪽: 폴더 목록 */}
          <div style={{width:280,flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:600,color:'#999',marginBottom:12}}>
              폴더 {folders.length}개
            </div>
            {folders.length===0 ? (
              <div style={{textAlign:'center',padding:'40px 20px',border:'1.5px dashed #DDE8F0',
                borderRadius:14,color:'#B0C4D8'}}>
                <div style={{fontSize:36,marginBottom:10}}>🗂️</div>
                <p style={{fontSize:13,fontWeight:600,margin:0}}>폴더가 없어요</p>
                <p style={{fontSize:12,marginTop:6}}>+ 새 폴더 버튼으로 만들어보세요</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {folders.map(f=>(
                  <FolderCard key={f.folderId} folder={f}
                    selected={selectedId===f.folderId}
                    onClick={()=>setSelectedId(f.folderId)}
                    onDelete={()=>handleDeleteFolder(f.folderId)}/>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 선택된 폴더 장소 */}
          <div style={{flex:1,minWidth:0}}>
            {!selectedFolder ? (
              <div style={{textAlign:'center',padding:'60px 0',color:'#B0C4D8'}}>
                <div style={{fontSize:40,marginBottom:12}}>👈</div>
                <p style={{fontSize:14,fontWeight:600,margin:0}}>폴더를 선택하세요</p>
              </div>
            ) : (
              <>
                {/* 폴더 헤더 */}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,
                  paddingBottom:16,borderBottom:'1px solid #F0F0F0'}}>
                  <div style={{width:48,height:48,borderRadius:12,background:SKY,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🗂️</div>
                  <div>
                    <div style={{fontSize:18,fontWeight:700,color:DEEP}}>{selectedFolder.folderName}</div>
                    <div style={{fontSize:12,color:BLUE,marginTop:2}}>{selectedFolder.placeCount}개의 장소</div>
                  </div>
                </div>

                {/* 장소 목록 */}
                {placesLoading ? (
                  <div style={{textAlign:'center',padding:'40px 0',color:'#AAA',fontSize:13}}>불러오는 중...</div>
                ) : folderPlaces.length===0 ? (
                  <div style={{textAlign:'center',padding:'48px 0',border:'1.5px dashed #DDE8F0',
                    borderRadius:14,color:'#B0C4D8'}}>
                    <div style={{fontSize:36,marginBottom:10}}>📍</div>
                    <p style={{fontSize:13,fontWeight:600,margin:0}}>저장된 장소가 없어요</p>
                    <p style={{fontSize:12,marginTop:6}}>여행 탐색에서 ❤️ 눌러서 추가해보세요</p>
                  </div>
                ) : (
                  <div>
                    {folderPlaces.map(p=>(
                      <PlaceItem key={p.placeId} place={p}/>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateFolderModal
          onCreate={handleCreateFolder}
          onClose={() => setShowCreate(false)}
          accent={BLUE}
          accentDark={DEEP}
          border={SKY}
          textDark={DEEP}
          textMid={MID}
          overlay="rgba(13,46,90,0.3)"
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast('')} bg={DEEP} durationMs={2000} />}
    </div>
  )
}
