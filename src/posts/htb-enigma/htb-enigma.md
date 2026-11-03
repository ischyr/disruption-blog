---
title: HackTheBox - Enigma
date: 2026-11-03
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2026-06-27
ip: 10.129.239.191
boxAvatar: htb-cover.png
excerpt: An easy Linux box built around a company mail server. A world-readable NFS export leaks onboarding credentials for Roundcube and, thanks to root escape, the rest of the file system too. Reused passwords open a second mailbox that hands over admin access to an OpenSTAManager instance, whose file upload gives a shell. Cracked application hashes pivot to a real user, and a root-owned OliveTin service on localhost finishes the box through command injection.
active: "Password123!"
---

# Enigma

Enigma is an easy-rated Linux machine for "Enigma Corp," with a mail stack, a web front end and an NFS server all on one host. The interesting part is how much a single misconfigured NFS export gives away: onboarding documents with live credentials, and - because the export allows escaping to the root of the file system - the configuration of every web application on the box. From there the path runs through a mailbox, an outdated OpenSTAManager install, a cracked password hash, and a root-owned automation tool listening on localhost. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

The certificate bodies below are trimmed to their metadata; all four mail ports present the same self-signed `enigma` certificate.

```bash
PORT      STATE SERVICE  REASON         VERSION
22/tcp    open  ssh      syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
80/tcp    open  http     syn-ack ttl 63 nginx 1.24.0 (Ubuntu)
|_http-title: Did not follow redirect to http://enigma.htb/
|_http-server-header: nginx/1.24.0 (Ubuntu)
110/tcp   open  pop3     syn-ack ttl 63 Dovecot pop3d
| ssl-cert: Subject: commonName=enigma
| Not valid before: 2026-02-18T20:33:33
| Not valid after:  2036-02-16T20:33:33
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
111/tcp   open  rpcbind  syn-ack ttl 63 2-4 (RPC #100000)
| rpcinfo:
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100003  3,4         2049/tcp   nfs
|   100005  1,2,3      54793/tcp   mountd
|   100021  1,3,4      36943/tcp   nlockmgr
|   100024  1          39871/tcp   status
|_  100227  3           2049/tcp   nfs_acl
143/tcp   open  imap     syn-ack ttl 63 Dovecot imapd (Ubuntu)
993/tcp   open  ssl/imap syn-ack ttl 63 Dovecot imapd (Ubuntu)
995/tcp   open  ssl/pop3 syn-ack ttl 63 Dovecot pop3d
2049/tcp  open  nfs_acl  syn-ack ttl 63 3 (RPC #100227)
36721/tcp open  mountd   syn-ack ttl 63 1-3 (RPC #100005)
36943/tcp open  nlockmgr syn-ack ttl 63 1-4 (RPC #100021)
39871/tcp open  status   syn-ack ttl 63 1 (RPC #100024)
54793/tcp open  mountd   syn-ack ttl 63 1-3 (RPC #100005)
59087/tcp open  mountd   syn-ack ttl 63 1-3 (RPC #100005)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Three groups of services stand out: a website on port 80, a full Dovecot mail server (POP3 and IMAP, plain and TLS), and an NFS server with its RPC helpers.

### SSH - Banner Grabbing

→ Command: `nc -vn 10.129.239.191 22`

{% image %}

```bash
➜  enigma nc -vn 10.129.239.191 22
(UNKNOWN) [10.129.239.191] 22 (ssh) open
SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.16
```

### Web Server Enumeration

The site redirects to `enigma.htb`, so we add it to `/etc/hosts`:

```bash
➜  enigma cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.239.191	enigma.htb
```

→ WhatWeb enumeration:

{% image2 %}

A vhost scan with `ffuf` turns up a `mail001` subdomain:

```bash
ffuf -u http://enigma.htb/ -H 'Host: FUZZ.enigma.htb' -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt --fw 4
```

{% image3 %}

We add it to `/etc/hosts` as well:

```bash
➜  enigma cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.239.191	enigma.htb mail001.enigma.htb
```

It hosts a Roundcube webmail login:

{% image4 %}

### Roundcube Enumeration

Roundcube embeds its version as an `rcversion` value in the login page, which we can pull out directly:

```bash
curl -sk http://mail001.enigma.htb/ | grep -Eio 'roundcube|rcversion[^,;<]+'
```

{% image5 %}

That value corresponds to **Roundcube Webmail 1.6.16**:

{% image6 %}

Before attacking the webmail, we look at the NFS server.

### NFS Enumeration

`showmount` lists a single export, `/srv/nfs/onboarding`, open to everyone (`*`):

{% image7 %}

We mount it locally:

```bash
sudo mount -t nfs 10.129.239.191:/srv/nfs/onboarding ./onboarding
```

{% image8 %}

It contains a new-employee onboarding PDF from Enigma Corp's IT department, complete with webmail credentials that were supposed to be changed on first login:

{% image9 %}

→ Credentials:

```bash
kevin : Enigma2024!
```

The export has a bigger problem than one PDF. NetExec reports `root escape: True` for this share, meaning a file handle can be walked out of the exported directory to the root of the file system - and listing `/` confirms it:

{% image10 %}

With read access to the whole disk, we start with `/etc/exports`, which defines every export and its options and is world-readable:

{% image11 %}

The same trick pulls Roundcube's `config.inc.php`, including its database connection string:

```bash
/var/www/html/roundcube/config/config.inc.php
```

{% image12 %}

Logging into Roundcube, the password from the onboarding PDF also works for another user, `sarah`. Her inbox holds a reply from IT provisioning her access to an OpenSTAManager instance on a new subdomain, `support_001.enigma.htb`, with admin credentials:

{% image13 %}

```bash
admin : Ne3s4rtars78s
```

### OpenSTAManager - Reverse Shell

The NFS escape also lets us read the application's `VERSION` file directly, which shows **OpenSTAManager 2.9.8**:

{% image14 %}

Versions up to 2.9.8 are affected by several critical issues, including `CVE-2025-69212` (OS command injection) and `CVE-2026-38751` (arbitrary file upload leading to remote code execution):

{% image15 %}

With admin credentials in hand, we use a public PoC for the file-upload issue, [b0ySie7e/OpenSTAManager-RCE-Exploit-CVE-2026-38751](https://github.com/b0ySie7e/OpenSTAManager-RCE-Exploit-CVE-2026-38751). It logs in, uploads a module containing a web shell, and turns it into a reverse shell as `www-data`:

{% image16 %}

### Pivoting to haris

OpenSTAManager's own `config.inc.php` holds its database credentials:

{% image17 %}

We use them to connect to MySQL:

```bash
mysql -u brollin -h localhost -p
```

{% image18 %}

The application's `zz_users` table stores password hashes for its users:

{% image19 %}

One of them cracks - `haris`, with the password `bestfriends`:

{% image20 %}

SSH with that password is refused, but `su - haris` from the existing shell works:

{% image21 %}

To get a stable session, we add our SSH public key to `haris`'s `authorized_keys` and reconnect over SSH:

{% image22 %}

### Privilege Escalation

Listing sockets as `haris` shows several services bound to localhost only:

{% image23 %}

Port `1337` stands out. A quick `nc -vn` shows it speaks HTTP:

{% image24 %}

So we switch to `curl`. The page's assets reference "olive":

{% image25 %}

Searching the process list for it finds **OliveTin** - a tool that exposes predefined shell commands as buttons in a web UI - running as `root`:

```bash
ps -aux --forest | grep -i olive
```

{% image26 %}

The binary reports version `3000.10.0`:

{% image27 %}

This version is vulnerable to OS command injection through the arguments of its configured actions. Because OliveTin runs as root, anything injected into an action runs as root too. Here one of the actions wraps `mysqldump`; the action itself fails, but the injected command - copying `bash` to `/tmp` and setting the SUID bit - runs first:

```bash
python3 xpl.py -u http://localhost -p 1337 -x 'cp /bin/bash /tmp/bash && chmod 6755 /tmp/bash'
```

{% image28 %}

`/tmp/bash` is now owned by root with the SUID bit set, so `/tmp/bash -p` drops us into a root shell:

{% image29 %}

Enigma's whole chain starts from one export option. A read-only NFS share should only ever expose the directory it names, but with root escape possible it exposed onboarding credentials, every web application's configuration, and the versions needed to pick the right exploits. Add password reuse across mailboxes and a root-owned automation tool that trusts its inputs, and an anonymous NFS mount turns into full root.
