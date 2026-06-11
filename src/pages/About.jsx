import { site } from '../config'
import { certs } from '../data/certs'
import CertBadge from '../components/CertBadge'

const skills = [
  'Web Application Pentesting',
  'Network Penetration Testing',
  'Active Directory',
  'Red Teaming',
  'Exploit Development',
  'OSINT',
  'Malware Analysis',
  'Cloud Security',
]

export default function About() {
  return (
    <div className="page page-narrow">
      <h1 className="page-title">About</h1>
      <p className="page-subtitle">{site.role}</p>

      <div className="prose">
        {site.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <h2 className="section-title">Certifications</h2>
      <div className="cert-grid">
        {certs.map((cert) => (
          <CertBadge key={cert.name} cert={cert} />
        ))}
      </div>

      <h2 className="section-title">Skills</h2>
      <div className="tag-row tag-row-lg">
        {skills.map((skill) => (
          <span key={skill} className="tag">
            {skill}
          </span>
        ))}
      </div>

      <h2 className="section-title">Disruption Academy</h2>
      <p className="prose">
        • I run hands-on offensive security training at{' '}
        <a
          className="academy-link"
          href={site.academy}
          target="_blank"
          rel="noreferrer"
        >
          disruption-academy.com
        </a>
        .
      </p>
    </div>
  )
}
