import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { scheduleApi } from '../api/index'
import { catStyle as sharedCatStyle, indigoCatColors } from '../utils/category'

const INDIGO       = '#4F46E5'
const INDIGO_DARK  = '#4338CA'
const INDIGO_LIGHT = '#EEF2FF'
const CHAR         = '#18181B'
const GRAY         = '#71717A'
const BORDER       = '#E4E4E7'

interface DayPlan {
  day: number
  date: string
  theme: string
  places: {
    name: string
    category: string
    startTime: string
    endTime: string
    memo: string
    emoji: string
  }[]
}

interface TripPlan {
  title: string
  destination: string
  startDate: string
  endDate: string
  memberCount: number
  days: DayPlan[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  plan?: TripPlan
}

const CAT_COLORS = indigoCatColors(INDIGO, INDIGO_LIGHT)
function catStyle(cat: string) {
  return sharedCatStyle(cat, CAT_COLORS, { bg: '#F4F4F5', color: GRAY })
}

const SUGGESTIONS = [
  '도쿄 3박 4일, 2명, 관광 + 맛집 위주로 추천해줘',
  '제주도 2박 3일, 4명 가족 여행 일정 짜줘',
  '방콕 5박 6일, 커플 여행, 문화 체험 중심으로',
  '부산 당일치기, 1명, 해산물 맛집 + 바다 뷰 코스',
]

function TimelinePlan({ plan, onSave, saving }: {
  plan: TripPlan
  onSave: () => void
  saving: boolean
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`,
      borderRadius: 16, overflow: 'hidden', marginTop: 12 }}>

      {/* 헤더 */}
      <div style={{ background: INDIGO, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
            {plan.title}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            {plan.destination} · {plan.days.length}일 · {plan.memberCount}명
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          style={{ background: '#fff', color: INDIGO, border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}>
          {saving ? '저장 중...' : '내 일정으로 저장'}
        </button>
      </div>

      {/* 타임라인 */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {plan.days.map((day, di) => (
          <div key={di}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: INDIGO, color: '#fff', borderRadius: 20,
                padding: '4px 14px', fontSize: 12, fontWeight: 600 }}>
                Day {day.day}
              </div>
              <span style={{ fontSize: 13, color: GRAY }}>{day.date}</span>
              {day.theme && (
                <span style={{ fontSize: 11, color: INDIGO, background: INDIGO_LIGHT,
                  padding: '2px 8px', borderRadius: 20 }}>{day.theme}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
              {day.places.map((place, pi) => (
                <div key={pi} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* 시간 */}
                  <div style={{ minWidth: 80, flexShrink: 0, paddingTop: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: CHAR }}>{place.startTime}</div>
                    <div style={{ width: 1, height: 16, background: '#C7D2FE',
                      margin: '3px 0 3px 5px' }} />
                    <div style={{ fontSize: 11, color: GRAY }}>{place.endTime}</div>
                  </div>
                  {/* 내용 */}
                  <div style={{ flex: 1, background: '#FAFAFA', borderRadius: 10,
                    padding: '10px 14px', border: `1px solid ${BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{place.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: CHAR }}>{place.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20,
                        fontWeight: 600, marginLeft: 'auto', ...catStyle(place.category) }}>
                        {place.category}
                      </span>
                    </div>
                    {place.memo && (
                      <div style={{ fontSize: 12, color: GRAY, lineHeight: 1.5 }}>{place.memo}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RecommendPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 여행 일정을 추천해드릴게요 ✈️\n여행지, 날짜, 인원수를 알려주시면 맞춤 일정을 짜드릴게요.',
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const userText = text ?? input.trim()
    if (!userText || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: userText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `당신은 여행 일정 전문가입니다. 사용자가 여행지, 날짜, 인원수를 알려주면 상세한 여행 일정을 JSON 형태로 반환하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 반환하세요:

{
  "message": "사용자에게 전달할 친근한 메시지",
  "plan": {
    "title": "여행 제목",
    "destination": "여행지",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "memberCount": 2,
    "days": [
      {
        "day": 1,
        "date": "MM월 DD일",
        "theme": "오전 관광 · 오후 맛집",
        "places": [
          {
            "name": "장소명",
            "category": "관광지",
            "startTime": "09:00",
            "endTime": "11:00",
            "memo": "추천 이유나 팁",
            "emoji": "🏛️"
          }
        ]
      }
    ]
  }
}

카테고리는 반드시 관광지, 식당, 카페, 쇼핑, 숙박 중 하나만 사용하세요.
날짜 정보가 없으면 오늘부터 시작하는 일정을 만들어주세요.
일정이 요청이 아닌 일반 대화라면 plan을 null로 하고 message만 반환하세요.`,
          messages: history,
        }),
      })

      const data = await res.json()
      const rawText = data.content?.[0]?.text ?? ''

      let parsed: { message: string; plan: TripPlan | null }
      try {
        parsed = JSON.parse(rawText)
      } catch {
        parsed = { message: rawText, plan: null }
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: parsed.message,
        plan: parsed.plan ?? undefined,
      }
      setMessages(prev => [...prev, assistantMsg])

    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송해요, 일정 생성에 실패했어요. 다시 시도해주세요.',
      }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePlan(plan: TripPlan) {
    setSaving(true)
    try {
      const res = await scheduleApi.create({
        title: plan.title,
        destination: plan.destination,
        startDate: plan.startDate,
        endDate: plan.endDate,
        memberCount: plan.memberCount,
      })
      const scheduleId = res.data
      navigate(`/schedule/${scheduleId}`)
    } catch {
      alert('일정 저장에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff',
      flexDirection: 'column', overflow: 'hidden' }}>

      {/* 상단 헤더 */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: INDIGO_LIGHT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✈️</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: CHAR }}>AI 여행 플래너</div>
          <div style={{ fontSize: 12, color: GRAY }}>여행지, 날짜, 인원을 알려주세요</div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16 }}>

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 8,
          }}>
            {/* 말풍선 */}
            <div style={{
              maxWidth: msg.plan ? '100%' : '72%',
              width: msg.plan ? '100%' : undefined,
              background: msg.role === 'user' ? INDIGO : '#F4F4F5',
              color: msg.role === 'user' ? '#fff' : CHAR,
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              padding: '12px 16px',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>

            {/* 타임라인 플랜 */}
            {msg.plan && (
              <div style={{ width: '100%' }}>
                <TimelinePlan
                  plan={msg.plan}
                  onSave={() => handleSavePlan(msg.plan!)}
                  saving={saving}
                />
              </div>
            )}
          </div>
        ))}

        {/* 로딩 */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ background: '#F4F4F5', borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: GRAY,
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* 추천 질문 (첫 메시지만) */}
        {messages.length === 1 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: GRAY }}>이렇게 물어보세요</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10,
                    border: `1px solid ${BORDER}`, background: '#fff',
                    fontSize: 13, color: CHAR, cursor: 'pointer',
                    transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = INDIGO; e.currentTarget.style.background = INDIGO_LIGHT }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = '#fff' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* 입력창 */}
      <div style={{ padding: '16px 24px 20px', borderTop: `1px solid ${BORDER}`,
        flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="여행지, 날짜, 인원수를 입력해주세요... (Shift+Enter로 줄바꿈)"
            rows={4}
            style={{ flex: 1, padding: '14px 16px', borderRadius: 12,
              border: `1.5px solid ${BORDER}`, fontSize: 14, color: CHAR,
              outline: 'none', resize: 'none', fontFamily: 'inherit',
              lineHeight: 1.5, transition: 'border-color 0.15s',
              background: '#FAFAFA' }}
            onFocus={e => (e.currentTarget.style.borderColor = INDIGO)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{ width: 44, height: 44, borderRadius: '50%',
              background: INDIGO,
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
              opacity: !input.trim() || loading ? 0.5 : 1 }}
            onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = INDIGO_DARK }}
            onMouseLeave={e => { e.currentTarget.style.background = INDIGO }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
