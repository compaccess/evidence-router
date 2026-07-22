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

export function InputPanel({ input, setInput, selectedPreset, onPreset, onOptimize }: InputPanelProps) {
  const patch = <K extends keyof RoutingInput>(key: K, value: RoutingInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }))
  const number = (key: keyof Pick<RoutingInput, 'monthlyCalls' | 'inputWordsPerCall' | 'outputWordsPerCall' | 'monthlyBudget'>, value: string) =>
    patch(key, Math.max(0, Number(value)))
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
        <input type="number" min="1" value={input.monthlyCalls} onChange={(event) => number('monthlyCalls', event.target.value)} />
      </label>

      <fieldset className="field wide">
        <legend className="field-index">4. Words per call</legend>
        <span className="field-help">Approximate words per end-to-end call</span>
        <div className="paired-inputs">
          <label><span>Input words</span><input type="number" min="0" value={input.inputWordsPerCall} onChange={(event) => number('inputWordsPerCall', event.target.value)} /></label>
          <label><span>Output words</span><input type="number" min="0" value={input.outputWordsPerCall} onChange={(event) => number('outputWordsPerCall', event.target.value)} /></label>
        </div>
        <span className="field-help word-estimate-note">{WORD_USAGE_ESTIMATE_NOTE}</span>
      </fieldset>

      <div className="paired-inputs major-pair">
        <label className="field">
          <span className="field-index">5. Monthly budget</span>
          <span className="field-help">USD hard limit</span>
          <input type="number" min="1" value={input.monthlyBudget} onChange={(event) => number('monthlyBudget', event.target.value)} />
        </label>
        <label className="field">
          <span className="field-index">6. Min. pass rate</span>
          <span className="field-help">Quality floor (%)</span>
          <input type="number" min="1" max="100" value={Math.round(input.passRateFloor * 100)} onChange={(event) => patch('passRateFloor', Number(event.target.value) / 100)} />
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
