// Quiz questions for /quiz. Each: question, options[], answer (index of the
// correct option), explanation, and an optional category.
export const quiz = [
  {
    category: 'Web',
    question: 'Which JWT attack swaps RS256 for HS256 to forge tokens?',
    options: ['Algorithm confusion', 'JKU injection', 'Replay attack', 'Padding oracle'],
    answer: 0,
    explanation:
      'Algorithm confusion tricks a server into verifying an RS256 token as HS256, using the public key bytes as the HMAC secret.',
  },
  {
    category: 'Web',
    question: 'A reflected value rendered without encoding most directly enables…',
    options: ['CSRF', 'XSS', 'SSRF', 'IDOR'],
    answer: 1,
    explanation:
      'Unencoded reflection of attacker input into HTML is the classic precondition for cross-site scripting.',
  },
  {
    category: 'Active Directory',
    question: 'Kerberoasting targets accounts that have…',
    options: [
      'A configured SPN',
      'Delegation disabled',
      'The DONT_REQ_PREAUTH flag',
      'An expired password',
    ],
    answer: 0,
    explanation:
      'Any account with a Service Principal Name can be Kerberoasted: you request a service ticket and crack its RC4/AES blob offline.',
  },
  {
    category: 'Active Directory',
    question: 'AS-REP roasting is possible when an account has…',
    options: [
      'Unconstrained delegation',
      'Kerberos pre-authentication disabled',
      'A weak SPN',
      'Admin rights',
    ],
    answer: 1,
    explanation:
      'With pre-auth disabled, the KDC returns an AS-REP encrypted with the user’s key, which can be cracked offline.',
  },
  {
    category: 'Network',
    question: 'Which Nmap flag performs a TCP SYN (half-open) scan?',
    options: ['-sT', '-sS', '-sU', '-sn'],
    answer: 1,
    explanation:
      '-sS sends SYN and never completes the handshake — faster and stealthier than the full-connect -sT.',
  },
  {
    category: 'Crypto',
    question: 'A padding oracle attack typically targets which mode?',
    options: ['AES-GCM', 'CBC with PKCS#7', 'CTR', 'ChaCha20'],
    answer: 1,
    explanation:
      'CBC mode with PKCS#7 padding can leak plaintext when the server reveals whether padding is valid.',
  },
]
