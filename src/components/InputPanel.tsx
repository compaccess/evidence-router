import { useEffect, useId, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { RoutingInput, Workflow } from '../types'
import { PRESETS } from '../data/presets'
import { WORD_USAGE_ESTIMATE_NOTE } from '../lib/usage'

interface InputPanelProps {
  input: RoutingInput
  setInput: Dispatch<SetStateAction<RoutingInput>>
  selectedPreset: string
  onPreset: (id: string) => void
  onOptimize: () => void
}

interface BoundedNumberInputProps {
  value: number
  onValueChange: (value: number) => void
  ariaLabel: string
  min: number
  max?: number
  prefix?: string
  suffix: string
}

function BoundedNumberInput({
  value,
  onValueChange,
  ariaLabel,
  min,
  max,
  prefix,
  suffix,
}: BoundedNumberInputProps) {
  const [draft, setDraft] = useState(String(value))
  const errorId = useId()
  const parsed = Number(draft)
  const isEmpty = draft.trim() === ''
  const isFinite = Number.isFinite(parsed)
  const isBelowMin = isFinite && parsed < min
  const isAboveMax = isFinite && max !== undefined && parsed > max
  const isInvalid = isEmpty || !isFinite || isBelowMin || isAboveMax
  const error = isEmpty || !isFinite
    ? 'Enter a number.'
    : isBelowMin
      ? `Use ${min} or more.`
      : isAboveMax
        ? `Use ${max} or less.`
        : ''

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const update = (nextDraft: string) => {
    setDraft(nextDraft)
    const nextValue = Number(nextDraft)
    if (
      nextDraft.trim() !== '' &&
      Number.isFinite(nextValue) &&
      nextValue >= min &&
      (max === undefined || nextValue <= max)
    ) {
      onValueChange(nextValue)
    }
  }

  return (
    <>
      <span className={`number-control${isInvalid ? ' invalid' : ''}`}>
        {prefix && <span className="number-affix" aria-hidden="true">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          step="1"
          inputMode="numeric"
          value={draft}
          aria-label={ariaLabel}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? errorId : undefined}
          onChange={(event) => update(event.target.value)}
          onBlur={() => {
            if (isInvalid) setDraft(String(value))
          }}
        />
        <span className="number-affix suffix" aria-hidden="true">{suffix}</span>
      </span>
      {isInvalid && <span className="field-error" id={errorId} role="alert">{error}</span>}
    </>
  )
}

export function InputPanel({ input, setInput, selectedPreset, onPreset, onOptimize }: InputPanelProps) {
  const patch = <K extends keyof RoutingInput>(key: K, value: RoutingInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }))
  const priority = (key: keyof RoutingInput['priorities'], value: string) =>
    setInput((current) => ({ ...current, priorities: { ...current.priorities, [key]: Number(value) } }))

  return (
    <aside className="input-panel">
      <div className="panel-heading">
        <h1>Routing brief</h1>
        <div className="preset-tabs" aria-label="Demo presets">
          {PRESETS.map((preset) => (
            <button key={preset.id} className={selectedPreset === preset.id ? 'active' : ''} onClick={() => onPreset(preset.id)}>{preset.label}</button>
          ))}
        </div>
      </div>

      <label className="field wide">
        <span className="field-index">1. Use case</span>
        <span className="field-help">Describe the task or goal</span>
        <textarea value={input.useCase} onChange={(event) => patch('useCase', event.target.value)} rows={3} />
      </label>

      <label className="field wide">
        <span className="field-index">2. Agent workflow</span>
        <span className="field-help">Select the closest evaluation profile</span>
        <select value={input.workflow} onChange={(event) => patch('workflow', event.target.value as Workflow)}>
          <option value="support">Customer support agent</option>
          <option value="research">Research + synthesis agent</option>
          <option value="coding">Coding agent workflow</option>
          <option value="extraction">Structured data extraction</option>
        </select>
      </label>

      <label className="field wide">
        <span className="field-index">3. Monthly volume</span>
        <span className="field-help">Estimated calls per month</span>
        <BoundedNumberInput
          value={input.monthlyCalls}
          onValueChange={(value) => patch('monthlyCalls', value)}
          ariaLabel="Monthly volume, calls per month"
          min={1}
          suffix="calls / month"
        />
      </label>

      <fieldset className="field wide">
        <legend className="field-index">4. Words per call</legend>
        <span className="field-help">Approximate request and response size</span>
        <div className="paired-inputs">
          <label>
            <span className="subfield-label">Input</span>
            <BoundedNumberInput
              value={input.inputWordsPerCall}
              onValueChange={(value) => patch('inputWordsPerCall', value)}
              ariaLabel="Input words per call"
              min={1}
              suffix="words / call"
            />
          </label>
          <label>
            <span className="subfield-label">Output</span>
            <BoundedNumberInput
              value={input.outputWordsPerCall}
              onValueChange={(value) => patch('outputWordsPerCall', value)}
              ariaLabel="Output words per call"
              min={1}
              suffix="words / call"
            />
          </label>
        </div>
        <span className="field-help word-estimate-note">{WORD_USAGE_ESTIMATE_NOTE}</span>
      </fieldset>

      <div className="paired-inputs major-pair">
        <label className="field">
          <span className="field-index">5. Monthly budget</span>
          <span className="field-help">USD hard limit</span>
          <BoundedNumberInput
            value={input.monthlyBudget}
            onValueChange={(value) => patch('monthlyBudget', value)}
            ariaLabel="Monthly budget, US dollars per month"
            min={1}
            prefix="$"
            suffix="/ month"
          />
        </label>
        <label className="field">
          <span className="field-index">6. Min. pass rate</span>
          <span className="field-help">Quality floor (%)</span>
          <BoundedNumberInput
            value={Math.round(input.passRateFloor * 100)}
            onValueChange={(value) => patch('passRateFloor', value / 100)}
            ariaLabel="Minimum pass rate, percent"
            min={1}
            max={100}
            suffix="%"
          />
        </label>
      </div>

      <fieldset className="priorities">
        <legend className="field-index">7. Decision priorities</legend>
        {(['quality', 'cost', 'speed'] as const).map((key) => (
          <label className="priority-row" key={key}>
            <span>{key === 'speed' ? 'Latency' : key[0].toUpperCase() + key.slice(1)}</span>
            <input type="range" min="0" max="100" value={input.priorities[key]} onChange={(event) => priority(key, event.target.value)} />
            <output>{input.priorities[key]}</output>
          </label>
        ))}
      </fieldset>

      <button className="optimize-button" onClick={onOptimize}>Optimize route</button>
      <p className="button-note">Runs constrained multi-objective optimization against dated fixtures.</p>
    </aside>
  )
}
