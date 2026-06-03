import { useMemo } from 'react'
import './statsPanel.css'

export default function StatsPanel({ tasks, lang }) {
  const { total, done, active } = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.done).length
    const active = total - done
    return { total, done, active }
  }, [tasks])

  const donePct = total ? Math.round((done / total) * 100) : 0
  const activePct = 100 - donePct

  const labelDone = lang === 'en' ? 'Done' : 'הושלם'
  const labelActive = lang === 'en' ? 'Active' : 'פעילות'

  return (
    <div className="statsPanel" aria-label={lang === 'en' ? 'Task statistics' : 'סטטיסטיקות משימות'}>
      <div className="statsTop">
        <div className="statsTitle">{lang === 'en' ? 'Progress' : 'התקדמות'}</div>
        <div className="statsSubtitle">
          {total} {lang === 'en' ? 'tasks' : 'משימות'} · {donePct}% {lang === 'en' ? 'done' : 'מושלמות'}
        </div>
      </div>

      <div className="donutWrap" role="img" aria-label={lang === 'en' ? `${donePct}% done` : `${donePct}% מושלם`}>
        <svg className="donut" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff5ad6" stopOpacity="1" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* track */}
          <circle className="donutTrack" cx="60" cy="60" r="44" />
          {/* progress */}
          <circle
            className="donutProgress"
            cx="60"
            cy="60"
            r="44"
            style={{
              strokeDasharray: 2 * Math.PI * 44,
              strokeDashoffset: (1 - donePct / 100) * 2 * Math.PI * 44,
            }}
          />
        </svg>

        <div className="donutCenter">
          <div className="donutPct">{donePct}%</div>
          <div className="donutLbl">{labelDone}</div>
        </div>

        <div className="donutLegend">
          <div className="legItem">
            <span className="legDot legDotDone" />
            <span className="legTxt">
              {labelDone}: {done}
            </span>
          </div>
          <div className="legItem">
            <span className="legDot legDotActive" />
            <span className="legTxt">
              {labelActive}: {active}
            </span>
          </div>
        </div>

        <div className="donutBg" aria-hidden="true" />
        <div className="donutGlow" aria-hidden="true" />
      </div>

      <div className="barWrap" aria-label={lang === 'en' ? 'Done vs active' : 'מושלם מול פעילות'}>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={donePct}>
          <div className="barDone" style={{ width: `${donePct}%` }} />
          <div className="barActive" style={{ width: `${activePct}%` }} />
        </div>
      </div>
    </div>
  )
}

