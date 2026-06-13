import { useState } from 'react'
import ReverseShellGenerator from '../components/ReverseShellGenerator'
import SubnetCalculator from '../components/SubnetCalculator'
import CvssCalculator from '../components/CvssCalculator'
import Encoder from '../components/Encoder'
import JwtDecoder from '../components/JwtDecoder'

const TABS = [
  { id: 'rsg', label: 'Reverse Shell' },
  { id: 'subnet', label: 'Subnet Calculator' },
  { id: 'cvss', label: 'CVSS' },
  { id: 'encoder', label: 'Encoder' },
  { id: 'jwt', label: 'JWT' },
]

const TOOLS = {
  rsg: ReverseShellGenerator,
  subnet: SubnetCalculator,
  cvss: CvssCalculator,
  encoder: Encoder,
  jwt: JwtDecoder,
}

export default function Toolbox() {
  const [tab, setTab] = useState('rsg')

  return (
    <div className="page">
      <h1 className="page-title">Toolbox</h1>
      <p className="page-subtitle">
        Quick in-browser utilities — everything runs locally, nothing leaves
        your machine.
      </p>

      <div className="track-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`track-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tool-pane" key={tab}>
        {(() => {
          const Tool = TOOLS[tab]
          return <Tool />
        })()}
      </div>
    </div>
  )
}
