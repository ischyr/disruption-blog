---
title: HackTheBox - Reactor
date: 2026-10-27
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2026-05-23
ip: 10.129.245.214
boxAvatar: htb-cover.png
excerpt: An easy Linux box fronting a fictional nuclear plant monitoring dashboard built on an outdated Next.js release. A public pre-auth RCE PoC for the version gives a low-privileged shell, and an .env file next to a leaked SQLite database cracks a password for a real system user. From there, a root-owned Node.js process left listening on the V8 Inspector's unauthenticated debug port hands over full root through the Chrome DevTools Protocol.
---

# Reactor

Reactor is an easy-rated Linux machine built around "ReactorWatch," a fictional nuclear-plant monitoring dashboard running on a vulnerable release of Next.js. The path starts with a known pre-authentication RCE in the framework itself, pivots through an `.env` file and a downloaded SQLite database to a real user account, and finishes by abusing a root-owned Node.js process that was left listening on its debugger port with no authentication at all. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

```bash
PORT     STATE SERVICE REASON         VERSION
22/tcp   open  ssh     syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 ce:fd:0d:82:c0:23:ed:6e:4b:ea:13:fa:4f:ea:ef:b7 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBIoh32XcLYi0Kdad12SajqVyUVXfkDPaB7zZCDCMIJc+fv8JUJwyQRoqX/91+p6uD75Ggdp4VNzA7WasIkyo/4U=
|   256 f8:44:c6:46:58:7a:39:21:ef:16:44:e9:58:c2:f3:62 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPws9RyzoCW2cXzOFxeZCCt8rWcNu2umX2kqLLK6T+7H
3000/tcp open  ppp?    syn-ack ttl 63
| fingerprint-strings:
|   FourOhFourRequest:
|     HTTP/1.1 404 Not Found
|     Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
|     X-Powered-By: Next.js
|     Content-Type: text/html; charset=utf-8
|_    Connection: close
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Nmap doesn't fingerprint port 3000 by name, but the `X-Powered-By: Next.js` header in its probe response gives it away immediately.

### SSH - Banner Grabbing

→ Command: `nc -vn 10.129.245.214 22`

{% image %}

### Web Server Enumeration

Port 3000 serves "ReactorWatch," a core monitoring dashboard for a (fictional) nuclear plant - reactor power, coolant flow, turbine output, and a live system log:

{% image2 %}

The response headers and a `whatweb` scan both confirm it's built on Next.js:

{% image3 %}

Searching the Debugger tab's bundled sources for `version` turns up `15.0.3`:

{% image4 %}

That release is vulnerable to **React2Shell**, a pre-authentication RCE affecting this Next.js version, with a public PoC available at [xalgord/React2Shell](https://github.com/xalgord/React2Shell). Running it against the target drops straight into an interactive shell:

{% image5 %}

```bash
ubuntu@target:/opt/reactor-app$ id
uid=999(node) gid=988(node) groups=988(node)
```

### Pillaging and Situational Awareness

The application's working directory holds an `.env` file:

```bash
ubuntu@target:/opt/reactor-app$ cat .env
# ReactorWatch Configuration
# Database connection for sensor data

DB_PATH=/opt/reactor-app/reactor.db
DB_TYPE=sqlite3

# API Keys
SENSOR_API_KEY=rw_sk_7f8a9b2c3d4e5f6g7h8i9j0k
ALERT_WEBHOOK=https://alerts.internal.reactor.htb/webhook

# Node environment
NODE_ENV=production
```

{% image6 %}

It points at a SQLite database, `reactor.db`, sitting in the same folder. The React2Shell PoC has a built-in `.download` helper for pulling files out through the shell, so we grab a copy:

{% image7 %}

`file` confirms it's a SQLite 3.x database, which `sqlite3` opens directly:

{% image8 %}

Among its tables is a user table with password hashes. Cracking them, only the hash for the user `engineer` resolves:

```bash
sudo john --wordlist=/usr/share/wordlists/rockyou.txt engineer.hash --format=Raw-MD5
```

{% image9 %}

With the cracked password, a `su - engineer` from the shell (or an SSH login with the same credentials) gets us onto the account directly:

{% image10 %}

### Privilege Escalation

Checking local listeners as `engineer` shows a port we haven't seen yet, bound to loopback only:

{% image11 %}

`ps -aux --forest` against that port shows it belongs to a Node.js process running as `root`:

{% image12 %}

### Node.js Inspector

The `--inspect` flag is Node's built-in debugger, exposing the V8 engine's debug interface over the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) (CDP) on a WebSocket. Any CDP-capable client - Chrome DevTools, VS Code, or Node's own `node inspect` - can attach to a process that has this flag set, and once attached can issue `Runtime.evaluate` ([docs](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate)) to run arbitrary JavaScript inside it.

None of this requires authentication. The only thing standing between an attacker and the debugger is that it's bound to `localhost` - so whoever can reach port 9229 can run code inside the process, which here happens to be running as root.

The `/json/list` endpoint on the debug port enumerates the available targets:

{% image13 %}

Connecting with the `node` binary itself gives us an interactive debugger session, from which a single `child_process.execSync` call confirms code execution as root:

```bash
node inspect 127.0.0.1:9229
```

{% image14 %}

Reactor is a short, two-stage box, but each stage teaches a distinct lesson: a public framework-level RCE is only as dangerous as what's reachable from the shell it drops you into, and a debugging flag left on in production - even bound to loopback - is a direct root-equivalent backdoor for anyone who can reach that port. Neither step needed a kernel exploit or a complex chain; both came from configuration that should never have shipped.
