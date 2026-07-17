---
title: ANCPI Breach
date: 2026-07-18
image: cover.png
tags: [Investigation]
excerpt: An investigation into the July 2026 breach of ANCPI, Romania's national cadastre and land-registry agency, by the threat actor bytetobreach. It reconstructs the full attack chain from a ForgeRock OpenAM RCE to near-total domain compromise, weighs the evidence against the agency's public denials, profiles the actor, and closes with an exhaustive set of remediation recommendations.
---

# ANCPI Breach

> This analysis is based on open-source intelligence: material published by the threat actor as proof of compromise, ANCPI's own public statements, and press interviews. Attacker-supplied artifacts cannot be independently verified in full, and are treated as claims corroborated where possible. Romanian-language sources have been translated into English, and sensitive details in screenshots have been redacted.

In mid-July 2026, ANCPI, the Romanian institution that maintains the national cadastre and land registry, suffered what it later described as the largest cyber-attack in its history. A single threat actor, operating under the handle **bytetobreach**, published proof of a deep compromise: source code for core national systems, exfiltrated databases, Active Directory reconnaissance, and evidence of ransomware deployment. This paper reconstructs the incident from the public evidence, contrasts it with the agency's messaging, and sets out what a mature security program would have done differently.

## Background: What ANCPI Is

ANCPI (Agenția Națională de Cadastru și Publicitate Imobiliară) is Romania's central public institution responsible for registering and maintaining records of all real estate: land, houses, and apartments. It operates the national cadastre and land-registry system, underpinning the legal guarantee of property rights and the transparency of property transactions. A compromise of ANCPI therefore has consequences well beyond a single agency, since the data it holds touches most property owners in the country.

{% image %}

## Initial Disclosure

On 15 July 2026, bytetobreach published a forum thread titled *"[RO] Thy arss shall be spanked, Romania ! [ANCPI]"*. The post contained proof of the breach and information relating to ANCPI.

{% image2 %}

The introduction to the thread read:

> "In addition to the data of the citizens of Romania, from the diverse databases gathered throughout the networks of the ANCPI, there is also a copy of the gitlab servers which contain a the source code for all their systems, like eterra, renns, as well as a deployment of my small ransomware. The official gov website announced a shutdown of the IT systems due to 'technicalities', but that's a bit of an under statement. An offer of assistance was made, but without force or insistence."

The evidence shows that a large number of source-code projects were exfiltrated, including critical repositories such as `eterra`, `epay`, and others.

{% image3 %}

The screenshot above was supplied by the actor as proof.

## ANCPI's Public Response

ANCPI's initial Facebook communication downplayed the event, describing it as a technical incident under investigation and noting that access to some applications might be limited for a period.

This is the post from 14 July 2026:

{% image4 %}

Later the same day, the agency posted again, this time acknowledging a major technical incident and stating that the e-Terra platform would be unavailable until the end of the week. That estimate proved optimistic: at the time of writing (18 July 2026), the platform remains offline.

{% image5 %}

The screenshot below, captured on 18 July 2026, shows that e-Terra is still unreachable, with a notice displayed on the landing page. This research was begun on 17 July 2026.

{% image6 %}

## Impact and Magnitude

On the day bytetobreach published the proof and dumps, ANCPI posted again, describing the event as the largest cyber-attack in the institution's history. The most contentious element of that statement is the assurance that the data was not compromised:

> "We state that the data managed through the IT systems operated by ANCPI is safe and was not compromised as a result of this incident." *(translated from the original Romanian statement)*

As the following sections demonstrate, the available evidence does not support this claim. The remainder of this paper walks through the gap between ANCPI's public messaging and what the actor was able to prove.

{% image7 %}

## Why e-Terra Matters

e-Terra is ANCPI's core software platform. It runs Romania's integrated cadastre and land-registry system, and through it citizens, notaries, and authorized professionals submit and check applications, obtain documents online, and consult property and building boundaries. Its unavailability halts a large share of the country's real-estate administration.

{% image8 %}

The outage arrived at a particularly damaging moment. As raised in the public reaction, some applicants may be unable to file documents before the 1 August deadline, after which a 21% VAT surcharge applies. A professional body summarized the concern:

> "We consider it entirely unacceptable that the technical malfunctions of an application managed by an institution of the Romanian state should block essential procedures such as apartment registration and land-title registration, procedures on which citizens and companies directly depend. The 1 August deadline is critical, and missing it automatically triggers a 21% VAT, an additional cost generated not by us but solely by the public system's inability to perform its duties. We make a firm and responsible appeal to the state authorities - the Government, the Ministry of Development, and ANCPI - to take ownership of the situation and adopt urgent legislative measures to extend the legal deadlines. It is not acceptable for citizens to be financially penalized for errors, blockages, or the lack of functionality of public platforms. We request immediate intervention, transparency, and concrete solutions. When the state cannot fulfil its obligations, the taxpayers should not bear the consequences." *(translated from Romanian)*

{% image9 %}

## Threat Actor Profile: bytetobreach

Before examining the discrepancies in ANCPI's account, it is worth profiling the actor and their intentions.

The actor maintains a personal site linked from their "hacker bio": [https://bytetobreach.com/](https://bytetobreach.com/).

{% image10 %}

The landing page carries the following message, which characterizes the actor's persona:

> "May our exploits be granted a venomous strike in the dead silence of the night, our shells sneak through the most sophisticated IDS, and the sweet taste of total compromise flood the veins of our targets! When the calendar flips to the first of April, watch the blue-team unravel in undignified confusion, every alert blaze with beautiful lies and chaos, and the sharpest of our heroes slice deeper into enemy lines - and know that the FBI's so-called takedown of the website was nothing more than a simple April Fools' jest, a theatrical phantom raid that never truly touched the shadows.
>
> Jesus will and forever be KING!"

Scrolling down reveals a victim list, with ANCPI as the most recent entry.

{% image11 %}

### Victim history

The full list published on the actor's site is extensive:

- ANCPI
- LATVIJAS VALSTS MEZI
- IKEJA ELECTRIC
- CORPORATE AFFAIRS COMMISSION - NIGERIA GOVERNMENT
- VUMI - INTERNATIONAL INSURANCE
- REMITA
- STERLING BANK
- CARDINAL STONE FINANCE
- NATIONAL OIL ETHIOPIA
- CGI
- VIKING LINE
- SLAVIA POJISTOVNA
- UNIMED PONTA GROSSA
- STRAUMANN
- MOBIUZ MOBILE
- VALNET - COMPARA E POUPA
- O'ZBEKISTON
- MUNDIVAX COMMUNICATIONS
- UNIMED - MARQUES DE VALENCA
- UNIVERSIDAD NACIONAL AUTONOMA DE MEXICO
- GOBIERNO DE MEXICO - SERVICIO DE ADMINISTRACION TRIBUTARIA
- IFX NETWORKS
- UFINET
- BBT - BROAD BAND TOWER INC
- EUROFIBER - CLOUD INFRA
- ALTRUIST
- STEPPING STONE
- INVOLTA
- YAS TAKAFUL
- SMS TRAFFIC
- SYMBOL - TRANSPORT
- CYPRUS POST
- AVATEL TELECOM
- TELEFONICA
- EURO ATLANTIC AIRWAYS
- UZBEKISTAN AIRWAYS
- LIVE NATION ENTERTAINMENT
- BANK POLSKI
- SEYCHELLES COMMERCIAL BANK
- NOKIA
- BERKELEY UNIVERSITY OF CALIFORNIA
- CORREOS CHILE
- REPUBLICA DE PANAMA - GOBIERNO NACIONAL
- CONSTELLIS - ADVISORS AND TRAINING
- RDP - A PAYU COMPANY
- UNIBAIL-RODAMCO-WESTFIELD
- GRUPPO MEDIOCREDITO CENTRALE
- CLEARWATER ANALYTICS
- BD
- ICICI PRUDENTIAL MUTUAL FUND
- ANUVU
- FINAM

That is at least 52 breaches over the actor's career, and likely more, since these are only the ones listed publicly.

Immediately after the breaches section, the site lists the actor's contact channels.

{% image12 %}

The post for the Latvia state forests breach follows the same format as the ANCPI one.

{% image13 %}

For each victim, the actor publishes proof alongside a step-by-step account of how the target was breached. Publishing walkthroughs during or after an intrusion is relatively unusual, and the fact that these writeups can be produced at all points to how weak the targeted defenses were.

The actor's history can be traced back to the era when the now-defunct BreachForums and RaidForums were still operating.

{% image14 %}

Attribution across these identities can be corroborated by validating the session ID and Signal username.

{% image15 %}

The example above relates to the Nokia incident, in which the actor advertised an interactive reverse shell on one of Nokia's hosts. For further background on the actor, see this write-up: [https://www.darksignal.co/p/bytetobreach-a-threat-actor-revealed](https://www.darksignal.co/p/bytetobreach-a-threat-actor-revealed).

### Interview

According to an interview published by SecurityPatch, the actor carried out the ANCPI operation alone. Link: [https://securitypatch.ro/atacul-cibernetic-asupra-ancpi-interviu-cu-bytetobreach/](https://securitypatch.ro/atacul-cibernetic-asupra-ancpi-interviu-cu-bytetobreach/).

{% image16 %}

The actor states that they are no longer active in groups, having started 16 years ago, and now spend most of their time analyzing malware and practicing on HackTheBox, one of the largest cyber-security training platforms:

> "I'm too old to be part of groups any more. I started 16 years ago, and I now spend most of my time analyzing malware or doing exercises on HackTheBox." *(translated from Romanian)*

Crucially, the actor states that no data was altered, but confirms that everything was exfiltrated and then encrypted, a claim that directly contradicts ANCPI's assurance that the data was not compromised.

{% image17 %}

> "ByteToBreach: The data was copied from various sources across the network. No modification was made other than encryption. Many files were encrypted, but the main databases were not encrypted, only exfiltrated." *(translated from Romanian)*

## Technical Analysis of the Attack Chain

The archive published on the forum contains three folders and two files at the root level.

{% image18 %}

The most instructive is the screenshots folder, which is effectively a step-by-step record of how the actor compromised the environment.

### Initial Access - ForgeRock OpenAM (CVE-2021-35464)

{% image19 %}

Initial access was achieved through an exploit for ForgeRock OpenAM, a vulnerability first disclosed in 2021.

**CVE-2021-35464** is a critical, unauthenticated remote code execution vulnerability in ForgeRock Access Manager (AM) and OpenAM. It stems from unsafe Java deserialization in the Jato framework, allowing an attacker to run arbitrary commands by sending a single crafted serialized object to an exposed endpoint. That a four-year-old, well-documented RCE remained exploitable on an internet-facing identity system is the first and most consequential finding of this analysis.

ForgeRock OpenAM (now part of Ping Identity as ForgeRock Access Manager) is an open-source and enterprise access-management platform providing centralized authentication, single sign-on (SSO), authorization, and identity federation across applications, APIs, and services. Compromising it places the attacker at the heart of the identity layer.

The actor used Metasploit, an open-source exploitation framework, to attack the vulnerable application directly, gaining access to the ForgeRock AM server and reading `/etc/passwd`.

{% image20 %}

### Credential Access - OpenDJ LDAP

OpenDJ is an open-source, Java-based LDAP directory server that provides directory services for identity management, access control, and authentication in enterprise environments. Reference: [https://github.com/OpenIdentityPlatform/OpenDJ/](https://github.com/OpenIdentityPlatform/OpenDJ/).

{% image21 %}

With a foothold on the OpenAM server, the actor recovered the bind password used to connect to the OpenDJ LDAP directory and queried its contents. Approximately two million user records were exposed at this stage.

{% image22 %}

### Lateral Movement - Oracle EMCC / WebLogic

The actor then pivoted to a WebLogic-based Oracle Enterprise Manager Cloud Control (EMCC) instance, achieving remote code execution there as well. For persistence, they deployed Sliver, a cross-platform adversary-emulation and command-and-control framework.

{% image23 %}

Having reached the Oracle EMCC server, the actor coerced the application server into loading an attacker-controlled Java class, yielding a reverse shell.

{% image24 %}

### Source Code Theft - GitLab (CVE-2021-22205)

Next, the actor identified an unpatched GitLab instance and exploited the well-known ExifTool-based RCE (CVE-2021-22205), a vulnerability in GitLab's image-parsing path that allows unauthenticated remote code execution. The same pattern followed: compromise the host, then deploy a Sliver implant for persistence and easier tasking.

{% image25 %}

On the right side of the evidence, the actor extracted a large set of user records and the table of encrypted passwords, which they then attempted to crack.

With access to GitLab, the actor exfiltrated the most valuable repositories, including e-Terra.

{% image26 %}

### Additional Footholds - Zabbix

Zabbix was not a priority target, but, in the actor's words, it was "extremely useful for a beacon", a fallback route back into the network in case another foothold was discovered and closed.

{% image27 %}

The actor executed a Zabbix script containing a simple reverse shell. This is one of the most common abuse paths on a compromised Zabbix instance once administrative access is obtained.

Up to this point, the tradecraft was low in sophistication and should have been detected by any adequately configured and monitored SOC or security tooling.

### FortiSIEM

{% image28 %}

Some details have been redacted, but the evidence needs to be shown. As is visible here and in the sections that follow, the internal environment showed poor operational hygiene: unstructured file storage and, most significantly, widespread weak and reused passwords. The presence of a SIEM that did not prevent or surface this activity suggests logging was in place but not effectively monitored or actioned.

### Veeam and Virtualization

{% image29 %}

The same pattern repeats across the backup and virtualization stack: weak credentials on the Veeam administrator account, on Synology storage, and elsewhere. Of particular concern is a legacy, out-of-support Windows Server domain controller (hostname `DC1`), with no indication of current patching. Weakly protected backup infrastructure is especially serious, because it undermines the last line of defense against ransomware. Across the virtual estate, the actor was able to compromise more than 1,000 virtual machines.

### Toward Full Domain Compromise

{% image30 %}

The actor stated that time constraints prevented them from obtaining full Active Directory administrator access, though the scans and files they collected suggest that outcome was within reach.

Visible in the evidence is BloodHound, an open-source tool that maps relationships within Active Directory and Azure environments to reveal attack paths and misconfigurations. It is used by red teams to find privilege-escalation routes and by blue teams for attack-path management.

### Active Directory - BloodHound Data

The `ACTIVE_DIRECTORY` folder in the dump contains the BloodHound collection needed to analyze the ANCPI domain.

{% image31 %}

With these files, anyone could import them into their own BloodHound instance and map the domain's structure and attack paths, dramatically lowering the effort required for a follow-on intrusion.

### Network Enumeration

The `NETWORK` folder contains five files, each named after a different address range.

{% image32 %}

Each file holds a full Nmap scan of its range, including open ports, services, and version information.

{% image33 %}

Most of these files exceed 300 KB. Since they are plain-text output, that implies at least several thousand lines each, with the `NEW_NMAP` file exceeding 25,000 lines at roughly 1.6 MB, an indication of how thoroughly the internal network was mapped.

### Recon and Credentials Files

The recon file documents how the actor structured reconnaissance: weak passwords, application and infrastructure endpoints such as domain controllers, high-value domain accounts, hostnames, and more.

The credentials file consolidates the users, endpoints, hashes, and passwords harvested during reconnaissance. The sample shown illustrates the systemic use of weak, easily guessable passwords across the environment.

{% image34 %}

This concludes the portion of the dump the actor released. Importantly, these are not the only files; they were provided as proof. As this analysis shows, the actual exfiltration covered far more: repositories, credentials, databases, and files. The published material is only a fraction of what was taken.

## Assessment

This breach should serve as a clear signal to public and private institutions alike that security is not a checkbox exercise or a task to be deferred.

Because of shortcomings in ANCPI's security posture, the personal data of a large number of people, along with confidential information belonging to third parties who relied on ANCPI's infrastructure, has been exposed. That data can seed further attacks against individuals, other institutions, and companies whose information was present in the environment.

The evidence points to systemic failings rather than a single unlucky event: internet-facing applications years behind on patches, out-of-support servers, pervasive weak and reused credentials, an apparently flat network with little segmentation, and monitoring that did not translate into detection or response.

There is a narrow silver lining in the fact that a self-publicizing actor exposed the breach quickly rather than remaining hidden. The same weaknesses, however, would allow a patient, financially or state-motivated adversary to stay dormant, exfiltrate continuously, and establish long-term persistence, a far worse outcome. Given how accessible the environment was, the possibility that other actors were, or still are, present cannot be excluded.

The most sobering conclusion is that the techniques used were not advanced. The compromise relied on unremediated, publicly known vulnerabilities and weak credentials, which means the barrier to entry was low and the same result was within reach of a relatively unskilled attacker.

## Recommendations: What ANCPI Should Have Done, and Could Still Do

The following recommendations are organized by domain. They range from immediate incident actions to the structural changes needed to prevent a recurrence. None of them are exotic; the incident was enabled by the absence of well-established, industry-standard controls.

### Immediate incident response and recovery

- **Activate a formal incident-response plan** with defined roles, decision authority, and escalation paths, and engage a specialized DFIR provider under an incident-response retainer.
- **Notify and coordinate with the relevant authorities**: Romania's national cyber-security directorate (DNSC), the data-protection authority (ANSPDCP) under GDPR's 72-hour breach-notification requirement, and CERT-RO/EU counterparts as applicable under NIS2.
- **Contain before rebuilding**: isolate affected segments, revoke and rotate all credentials, keys, certificates, API tokens, and service-account passwords, and invalidate active sessions and Kerberos tickets (including a staged `krbtgt` double reset).
- **Assume full domain compromise**: rebuild domain controllers and critical servers from known-good media rather than cleaning in place, given the presence of C2 implants (Sliver) and the risk of persistence.
- **Preserve forensic evidence** (memory, disk, logs) before remediation, to support root-cause analysis, attribution, and legal proceedings.
- **Hunt for persistence and backdoors** across the estate: scheduled tasks, services, new local/domain accounts, golden/silver tickets, malicious GPOs, web shells, and rogue OAuth or federation trusts on the identity platform.

### Crisis communications and transparency

- **Communicate accurately and promptly.** Public statements should not assert that data is safe before an investigation supports that conclusion. Overstated assurances that are later contradicted erode public trust and can carry regulatory consequences.
- **Provide actionable guidance to affected citizens** (what data was exposed, identity-theft and fraud precautions) and coordinate deadline relief with the government where public-service outages prevent citizens from meeting legal obligations.

### Vulnerability and patch management

- **Establish a risk-based patch-management program** with defined SLAs (for example, critical internet-facing vulnerabilities remediated within days) and measured compliance.
- **Prioritize internet-facing and identity systems.** The root cause here was a 2021 RCE (CVE-2021-35464) on an exposed OpenAM server, compounded by an unpatched GitLab (CVE-2021-22205) and other dated software. Continuous external attack-surface monitoring would have flagged these.
- **Subscribe to threat and vulnerability intelligence** (CISA KEV, vendor advisories) and treat known-exploited vulnerabilities as emergencies.

### Asset and lifecycle management

- **Maintain a complete, authoritative asset inventory** (hardware, software, versions, owners, exposure) so that no system, such as the legacy `DC1` domain controller, sits unpatched and unnoticed.
- **Retire end-of-life systems.** Out-of-support operating systems and applications must be upgraded, replaced, or isolated behind compensating controls, never left reachable.

### Attack-surface and exposure management

- **Minimize internet exposure.** Administrative interfaces (OpenAM admin consoles, WebLogic/Oracle EMCC, GitLab, Zabbix, FortiSIEM, Veeam, Synology) should never be directly reachable from the internet. Place them behind VPN, a zero-trust access proxy, or IP allowlists.
- **Run recurring external and internal scans** and validate exposure from an attacker's perspective, not just from internal assumptions.

### Identity and access management

- **Enforce multi-factor authentication everywhere**, especially on the SSO/identity platform, VPN, remote access, and all administrative accounts.
- **Apply least privilege** and role-based access control; remove standing administrative rights and stale accounts.
- **Adopt privileged access management (PAM)** with credential vaulting, session recording, and just-in-time elevation for administrators.
- **Secure directory bind credentials.** The LDAP bind password recovered from OpenAM unlocked roughly two million records; such credentials must be vaulted, rotated, and scoped to the minimum necessary.
- **Govern service accounts**: unique, strong, vaulted passwords or group Managed Service Accounts (gMSA), no interactive logon, and constrained privileges.

### Credential hygiene and secrets management

- **Enforce a strong password policy** (length, complexity, and screening against breached-password lists) and ban reuse. Weak, reused passwords were pervasive and materially enabled lateral movement.
- **Eliminate plaintext secrets.** Store secrets in a dedicated secrets manager (for example, HashiCorp Vault) rather than in files, scripts, or repositories.
- **Move toward passwordless and phishing-resistant authentication** (FIDO2/hardware keys) for privileged users.

### Network segmentation and architecture

- **Segment the network** into security zones (user, server, management, backup, OT/DMZ) with strict east-west controls, so that a single foothold cannot reach the entire estate.
- **Isolate management planes** (hypervisors, backup, monitoring, directory services) on dedicated administrative networks reachable only from privileged access workstations.
- **Adopt zero-trust principles**: authenticate and authorize every access request, and default-deny between zones.

### Active Directory security

- **Implement a tiered administration model** (Tier 0/1/2) with separate credentials per tier and privileged access workstations for Tier 0.
- **Deploy LAPS** for unique local administrator passwords, disable legacy protocols (NTLMv1, unsigned LDAP, SMBv1), and enforce SMB and LDAP signing.
- **Harden and monitor AD** continuously: run BloodHound and tools such as PingCastle/Purple Knight defensively to find and close the very attack paths the actor mapped, and alert on DCSync, Kerberoasting, and abnormal replication.
- **Protect and monitor domain controllers** as the crown jewels, with strict patching and change control.

### Detection, response, and monitoring

- **Operate a functioning SOC** (in-house or managed) with continuous monitoring, defined use cases, and measured response times. Logging without monitoring provided no protection here.
- **Deploy EDR/XDR** on all endpoints and servers to detect implants, reverse shells, and C2 frameworks such as Sliver, and network detection (NDR) for lateral movement and beaconing.
- **Tune the SIEM (FortiSIEM) into actionable detections** aligned to MITRE ATT&CK, with alerting on exploitation attempts, new admin accounts, mass file access, and directory queries.
- **Conduct proactive threat hunting** rather than relying solely on alerts, and run regular detection-validation exercises.
- **Centralize and protect logs** with integrity controls and off-host, tamper-resistant retention, so an attacker cannot simply delete their tracks.

### Data protection and privacy

- **Classify and minimize data**, retaining only what is necessary and knowing precisely where sensitive records live.
- **Encrypt data at rest and in transit**, and protect the keys independently of the data.
- **Deploy data loss prevention (DLP)** and egress monitoring to detect and slow large-scale exfiltration, and apply database activity monitoring to core systems.

### Secure software development and source-code protection

- **Never expose source-code management to the internet** without strong authentication and network restrictions; keep GitLab patched and behind access controls.
- **Scan repositories for hardcoded secrets** and rotate any exposed credentials; adopt pre-commit and CI secret scanning.
- **Enforce secure SDLC practices**: branch protection, mandatory code review, signed commits, SAST/DAST/SCA in the pipeline, and least-privilege CI/CD runners.
- **Treat leaked source code as an ongoing risk**: review the exfiltrated repositories (e-Terra, epay, and others) for embedded credentials and exploitable logic, and remediate accordingly.

### Backup and ransomware resilience

- **Follow a hardened 3-2-1-1 backup strategy** with at least one immutable, offline, or air-gapped copy that a domain compromise cannot reach or delete.
- **Isolate and MFA-protect the backup infrastructure** (Veeam, storage appliances); the recovered weak Veeam and Synology credentials would have neutralized recovery in a destructive attack.
- **Test restoration regularly** against defined RTO/RPO targets, and maintain a documented, exercised disaster-recovery and business-continuity plan.

### Endpoint and server hardening

- **Apply recognized hardening baselines** (CIS Benchmarks, DISA STIGs) across operating systems and applications, with configuration drift monitoring.
- **Implement application allowlisting** on servers to block unauthorized binaries and living-off-the-land abuse.
- **Remove or restrict unnecessary tooling and services** on production hosts.

### Governance, testing, and people

- **Establish security governance** aligned to a recognized framework (ISO 27001, NIST CSF) with executive ownership, risk management, and adequate, ring-fenced budget.
- **Commission regular independent security testing**: external and internal penetration tests at least annually and after major changes, periodic red-team engagements, and purple-team exercises to validate detection. A basic annual test would likely have surfaced the exposed OpenAM and GitLab systems.
- **Consider a vulnerability-disclosure program or bug bounty** so that friendly researchers report issues before adversaries exploit them.
- **Invest in staffing and skills**: adequately resourced security engineering and operations teams, ongoing training, and organization-wide security-awareness programs.
- **Manage third-party and supply-chain risk**, given that other institutions' and companies' data resided in ANCPI's environment; those parties must be notified and their exposure assessed.

### Compliance and legal obligations

- **Meet GDPR obligations** for breach notification to the supervisory authority and, where required, to affected individuals, along with maintaining a defensible record of the incident and response.
- **Address NIS2 duties** applicable to essential/important entities, including risk-management measures and incident reporting to the national CSIRT.
- **Prepare for regulatory scrutiny and potential liability**, and document remediation to demonstrate due diligence.

Taken together, these measures reflect nothing more than a competent, modern security program. The significance of this incident is not the sophistication of the attacker, but the near-total absence of the defenses that would have stopped, slowed, or at minimum detected them.
