import { useState } from 'react'
import { quiz } from '../data/quiz'

function verdict(pct) {
  if (pct >= 80) return 'Sharp. You know your stuff.'
  if (pct >= 50) return 'Solid — a few gaps to close.'
  return 'Keep grinding — review and retry.'
}

export default function Quiz() {
  const [i, setI] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const total = quiz.length
  const q = quiz[i]
  const revealed = selected !== null

  if (!total) {
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Quiz</h1>
        <p className="page-subtitle">No questions yet — add some in src/data/quiz.js.</p>
      </div>
    )
  }

  const choose = (idx) => {
    if (revealed) return
    setSelected(idx)
    if (idx === q.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (i + 1 < total) {
      setI(i + 1)
      setSelected(null)
    } else {
      setFinished(true)
    }
  }

  const restart = () => {
    setI(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((score / total) * 100)
    return (
      <div className="page page-narrow">
        <h1 className="page-title">Quiz</h1>
        <div className="quiz-result">
          <div className="quiz-score">
            {score}
            <span>/{total}</span>
          </div>
          <p className="quiz-verdict">
            {pct}% — {verdict(pct)}
          </p>
          <button type="button" className="btn btn-primary" onClick={restart}>
            ./retry
          </button>
        </div>
      </div>
    )
  }

  const progress = (i + (revealed ? 1 : 0)) / total

  return (
    <div className="page page-narrow">
      <h1 className="page-title">Quiz</h1>
      <p className="page-subtitle">
        Test your offensive-security knowledge. Pick an answer to reveal the
        explanation.
      </p>

      <div className="quiz-meta">
        <span>
          Question {i + 1} / {total}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="quiz-progress">
        <div style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="quiz-card">
        {q.category && <span className="quiz-cat">{q.category}</span>}
        <h2 className="quiz-question">{q.question}</h2>

        <div className="quiz-options">
          {q.options.map((opt, idx) => {
            let cls = 'quiz-option'
            if (revealed && idx === q.answer) cls += ' correct'
            else if (revealed && idx === selected) cls += ' wrong'
            return (
              <button
                key={idx}
                type="button"
                className={cls}
                onClick={() => choose(idx)}
                disabled={revealed}
              >
                <span className="quiz-key">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className="quiz-explain">
            <strong>
              {selected === q.answer ? '✓ Correct.' : '✗ Not quite.'}
            </strong>{' '}
            {q.explanation}
          </div>
        )}
      </div>

      {revealed && (
        <button type="button" className="btn btn-primary quiz-next" onClick={next}>
          {i + 1 < total ? 'Next →' : 'See score'}
        </button>
      )}
    </div>
  )
}
