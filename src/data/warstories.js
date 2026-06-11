// Short, sanitized engagement anecdotes shown on /war-stories.
//   title:  the hook
//   date:   YYYY-MM-DD
//   tags:   for flavour
//   body:   2-4 sentences. Keep it sanitized — no client names or real data.
export const warStories = [
  {
    title: 'The printer that owned the domain',
    date: '2026-05-02',
    tags: ['Internal', 'Active Directory'],
    body: 'A multifunction printer had LDAP credentials configured for "scan to folder" — stored in cleartext in its web panel, reachable with default creds. Those creds turned out to be a service account with replication rights. From a printer to DCSync in about twenty minutes.',
  },
  {
    title: 'Password in the JS bundle',
    date: '2026-03-18',
    tags: ['Web', 'Recon'],
    body: 'The login page bragged about "no hardcoded secrets." The minified vendor bundle disagreed: an API key and a fallback admin password sat in a comment block, shipped to every visitor. Always read the JavaScript.',
  },
  {
    title: 'The "internal only" subdomain',
    date: '2026-01-09',
    tags: ['OSINT', 'Web'],
    body: 'Certificate transparency logs leaked a staging subdomain that was supposedly firewalled off. It was not — and it ran a months-old build with a known RCE. The fix was already deployed in production; nobody redeployed staging.',
  },
]
