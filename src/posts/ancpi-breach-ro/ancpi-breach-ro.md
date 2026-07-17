---
title: Breșa ANCPI
date: 2026-07-18
image: cover.png
tags: [Investigation]
excerpt: O analiză a breșei din iulie 2026 suferite de ANCPI, agenția națională de cadastru și publicitate imobiliară, provocată de actorul bytetobreach. Reconstituie întregul lanț de atac, de la un RCE în ForgeRock OpenAM până la compromiterea aproape totală a domeniului, compară dovezile cu negările publice ale instituției, creionează profilul atacatorului și se încheie cu un set exhaustiv de recomandări de remediere.
---

# Breșa ANCPI

> Această analiză se bazează pe informații din surse deschise (OSINT): materiale publicate de atacator ca dovadă a compromiterii, declarațiile publice ale ANCPI și interviuri de presă. Artefactele furnizate de atacator nu pot fi verificate independent în întregime și sunt tratate ca afirmații, coroborate acolo unde este posibil. Citatele în limba engleză au fost traduse în română, iar detaliile sensibile din capturile de ecran au fost cenzurate.

La mijlocul lunii iulie 2026, ANCPI, instituția română care administrează cadastrul național și cartea funciară, a suferit ceea ce a descris ulterior drept cel mai mare atac cibernetic din istoria sa. Un singur atacator, care operează sub pseudonimul **bytetobreach**, a publicat dovezi ale unei compromiteri profunde: codul sursă al unor sisteme naționale esențiale, baze de date exfiltrate, recunoaștere a Active Directory și dovezi ale desfășurării unui ransomware. Această lucrare reconstituie incidentul pornind de la dovezile publice, îl compară cu comunicarea instituției și arată ce ar fi făcut diferit un program de securitate matur.

## Context: Ce este ANCPI

ANCPI (Agenția Națională de Cadastru și Publicitate Imobiliară) este instituția publică centrală din România responsabilă cu înregistrarea și evidența tuturor proprietăților imobiliare: terenuri, case și apartamente. Aceasta operează sistemul național de cadastru și carte funciară, care stă la baza garanției legale a dreptului de proprietate și a transparenței tranzacțiilor imobiliare. O compromitere a ANCPI are, prin urmare, consecințe cu mult peste nivelul unei singure instituții, întrucât datele pe care le deține privesc majoritatea proprietarilor din țară.

{% image %}

## Prima dezvăluire

Pe 15 iulie 2026, bytetobreach a publicat un fir de discuție pe forum cu titlul *"[RO] Thy arss shall be spanked, Romania ! [ANCPI]"*. Postarea conținea dovezi ale breșei și informații legate de ANCPI.

{% image2 %}

Introducerea firului de discuție suna astfel:

> "Pe lângă datele cetățenilor României, din diversele baze de date adunate din rețelele ANCPI, există și o copie a serverelor GitLab care conțin codul sursă pentru toate sistemele lor, precum eterra, renns, precum și o desfășurare a micului meu ransomware. Site-ul oficial guvernamental a anunțat o oprire a sistemelor IT din cauza unor 'aspecte tehnice', dar asta e cam un eufemism. A fost făcută o ofertă de asistență, dar fără forță sau insistență." *(tradus din engleză)*

Dovezile arată că un număr mare de proiecte de cod sursă au fost exfiltrate, inclusiv depozite critice precum `eterra`, `epay` și altele.

{% image3 %}

Captura de ecran de mai sus a fost furnizată de atacator ca dovadă.

## Răspunsul public al ANCPI

Comunicarea inițială a ANCPI pe Facebook a minimalizat evenimentul, descriindu-l drept un incident tehnic aflat în investigare și precizând că accesul la unele aplicații ar putea fi limitat pentru o perioadă.

Aceasta este postarea din 14 iulie 2026:

{% image4 %}

Mai târziu în aceeași zi, instituția a postat din nou, de această dată recunoscând un incident tehnic major și afirmând că platforma e-Terra nu va fi disponibilă până la sfârșitul săptămânii. Această estimare s-a dovedit optimistă: la momentul redactării (18 iulie 2026), platforma este în continuare indisponibilă.

{% image5 %}

Captura de ecran de mai jos, realizată pe 18 iulie 2026, arată că e-Terra este încă inaccesibilă, cu un mesaj afișat pe pagina principală. Această cercetare a fost începută pe 17 iulie 2026.

{% image6 %}

## Amploarea și impactul

În ziua în care bytetobreach a publicat dovezile și dump-urile, ANCPI a postat din nou, descriind evenimentul drept cel mai mare atac cibernetic din istoria instituției. Cel mai discutabil element al acelei declarații este asigurarea că datele nu au fost compromise:

> "Precizăm că datele administrate prin sistemele informatice gestionate de ANCPI sunt în siguranță și nu au fost compromise în urma acestui incident." *(declarația originală a ANCPI)*

După cum arată secțiunile următoare, dovezile disponibile nu susțin această afirmație. Restul lucrării parcurge diferența dintre comunicarea publică a ANCPI și ceea ce atacatorul a reușit să demonstreze.

{% image7 %}

## De ce contează e-Terra

e-Terra este platforma software centrală a ANCPI. Ea rulează sistemul integrat de cadastru și carte funciară al României, iar prin intermediul ei cetățenii, notarii și persoanele fizice autorizate depun și verifică cereri, obțin documente online și consultă limitele imobilelor și ale construcțiilor. Indisponibilitatea ei blochează o parte considerabilă din administrarea imobiliară a țării.

{% image8 %}

Întreruperea a survenit într-un moment deosebit de dăunător. Așa cum a fost semnalat în reacția publică, unii solicitanți ar putea fi în imposibilitatea de a depune documente înainte de termenul-limită de 1 august, după care se aplică un TVA suplimentar de 21%. Un organism profesional a rezumat problema:

> "Considerăm complet inacceptabil ca disfuncționalitățile tehnice ale unei aplicații gestionate de o instituție a statului român să blocheze proceduri esențiale precum apartamentarea și intabularea, proceduri de care depind direct cetățenii și companiile. Termenul limită de 1 august este critic, iar depășirea lui înseamnă automat aplicarea unui TVA de 21%, cost suplimentar care nu este generat de noi, ci exclusiv de incapacitatea sistemului public de a-și îndeplini atribuțiile. Facem un apel ferm și responsabil către autoritățile statului - Guvern, Ministerul Dezvoltării și ANCPI - să își asume situația și să adopte măsuri legislative urgente pentru prelungirea termenelor legale. Nu este normal ca cetățenii să fie penalizați financiar pentru erori, blocaje sau lipsa de funcționalitate a platformelor publice. Solicităm intervenție imediată, transparență și soluții concrete. Când statul nu își poate îndeplini obligațiile, nu contribuabilii trebuie să suporte consecințele."

{% image9 %}

## Profilul atacatorului: bytetobreach

Înainte de a examina neconcordanțele din relatarea ANCPI, merită conturat profilul atacatorului și intențiile sale.

Atacatorul deține un site personal, legat din „bio-ul de hacker": [https://bytetobreach.com/](https://bytetobreach.com/).

{% image10 %}

Pagina principală conține următorul mesaj, care îi definește persona:

> "Fie ca exploit-urile noastre să lovească veninos în tăcerea moartă a nopții, shell-urile noastre să se strecoare prin cele mai sofisticate IDS-uri, iar gustul dulce al compromiterii totale să inunde venele țintelor noastre! Când calendarul ajunge la întâi aprilie, priviți cum echipa blue se destramă într-o confuzie nedemnă, fiecare alertă arzând cu minciuni frumoase și haos, iar cei mai iscusiți dintre eroii noștri taie tot mai adânc în liniile inamice - și să știți că așa-zisa acțiune a FBI de închidere a site-ului nu a fost nimic mai mult decât o simplă păcăleală de 1 aprilie, un raid-fantomă teatral care nu a atins niciodată cu adevărat umbrele.
>
> Iisus este și va fi pentru totdeauna REGE!" *(tradus din engleză)*

Derulând mai jos apare o listă a victimelor, cu ANCPI drept cea mai recentă intrare.

{% image11 %}

### Istoricul victimelor

Lista completă publicată pe site-ul atacatorului este extinsă:

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

Aceasta înseamnă cel puțin 52 de breșe de-a lungul carierei atacatorului, și probabil mai multe, întrucât acestea sunt doar cele listate public.

Imediat după secțiunea de breșe, site-ul listează canalele de contact ale atacatorului.

{% image12 %}

Postarea pentru breșa pădurilor de stat ale Letoniei urmează același format ca cea a ANCPI.

{% image13 %}

Pentru fiecare victimă, atacatorul publică dovezi alături de o relatare pas cu pas a modului în care ținta a fost compromisă. Publicarea unor astfel de walkthrough-uri în timpul sau după o intruziune este relativ neobișnuită, iar simplul fapt că aceste relatări pot fi produse indică cât de slabe erau apărările vizate.

Istoricul atacatorului poate fi urmărit până în perioada în care forumurile acum defuncte BreachForums și RaidForums încă funcționau.

{% image14 %}

Atribuirea între aceste identități poate fi coroborată prin validarea session ID-ului și a numelui de utilizator de pe Signal.

{% image15 %}

Exemplul de mai sus se referă la incidentul Nokia, în care atacatorul oferea spre vânzare un reverse shell interactiv pe una dintre gazdele Nokia. Pentru mai multe informații despre atacator, consultați acest articol: [https://www.darksignal.co/p/bytetobreach-a-threat-actor-revealed](https://www.darksignal.co/p/bytetobreach-a-threat-actor-revealed).

### Interviul

Potrivit unui interviu publicat de SecurityPatch, atacatorul a realizat operațiunea împotriva ANCPI de unul singur. Link: [https://securitypatch.ro/atacul-cibernetic-asupra-ancpi-interviu-cu-bytetobreach/](https://securitypatch.ro/atacul-cibernetic-asupra-ancpi-interviu-cu-bytetobreach/).

{% image16 %}

Atacatorul afirmă că nu mai este activ în grupuri, că a început acum 16 ani și că își petrece acum cea mai mare parte a timpului analizând malware și făcând exerciții pe HackTheBox, una dintre cele mai mari platforme de instruire în securitate cibernetică:

> "Sunt prea bătrân ca să mai fac parte din grupuri. Am început acum 16 ani să îmi petrec cea mai mare parte a timpului analizând malware sau făcând exerciții pe HackTheBox."

Esențial, atacatorul afirmă că nu a alterat datele, dar confirmă că a exfiltrat totul și apoi a criptat, o afirmație care contrazice direct asigurarea ANCPI că datele nu au fost compromise.

{% image17 %}

> "ByteToBreach: Datele au fost copiate din surse diverse din rețea. Nu s-a făcut nicio modificare, cu excepția celei de criptare. Multe fișiere au fost criptate, dar bazele de date principale nu au fost criptate, ci doar exfiltrate."

## Analiza tehnică a lanțului de atac

Arhiva publicată pe forum conține trei foldere și două fișiere la nivelul rădăcinii.

{% image18 %}

Cel mai instructiv este folderul cu capturi de ecran, care este practic o consemnare pas cu pas a modului în care atacatorul a compromis mediul.

### Acces inițial - ForgeRock OpenAM (CVE-2021-35464)

{% image19 %}

Accesul inițial a fost obținut printr-un exploit pentru ForgeRock OpenAM, o vulnerabilitate dezvăluită pentru prima dată în 2021.

**CVE-2021-35464** este o vulnerabilitate critică de execuție de cod la distanță (RCE), neautentificată, în ForgeRock Access Manager (AM) și OpenAM. Ea provine dintr-o deserializare Java nesigură în framework-ul Jato, permițând unui atacator să execute comenzi arbitrare prin trimiterea unui singur obiect serializat malițios către un endpoint expus. Faptul că un RCE vechi de patru ani și bine documentat a rămas exploatabil pe un sistem de identitate expus în internet este prima și cea mai importantă constatare a acestei analize.

ForgeRock OpenAM (acum parte din Ping Identity sub numele ForgeRock Access Manager) este o platformă de management al accesului, open-source și enterprise, care oferă autentificare centralizată, single sign-on (SSO), autorizare și federalizare a identității pentru aplicații, API-uri și servicii. Compromiterea ei plasează atacatorul chiar în inima stratului de identitate.

Atacatorul a folosit Metasploit, un framework open-source de exploatare, pentru a ataca direct aplicația vulnerabilă, obținând acces la serverul ForgeRock AM și citind fișierul `/etc/passwd`.

{% image20 %}

### Acces la credențiale - OpenDJ LDAP

OpenDJ este un server de directoare LDAP open-source, scris în Java, care oferă servicii de directoare pentru managementul identității, controlul accesului și autentificare în medii enterprise. Referință: [https://github.com/OpenIdentityPlatform/OpenDJ/](https://github.com/OpenIdentityPlatform/OpenDJ/).

{% image21 %}

Cu un punct de acces pe serverul OpenAM, atacatorul a recuperat parola de bind folosită pentru conectarea la directorul LDAP OpenDJ și a interogat conținutul acestuia. Aproximativ două milioane de înregistrări de utilizatori au fost expuse în această etapă.

{% image22 %}

### Mișcare laterală - Oracle EMCC / WebLogic

Atacatorul a pivotat apoi către o instanță Oracle Enterprise Manager Cloud Control (EMCC) bazată pe WebLogic, obținând și acolo execuție de cod la distanță. Pentru persistență, a desfășurat Sliver, un framework cross-platform de emulare a adversarilor și comandă-și-control.

{% image23 %}

După ce a ajuns pe serverul Oracle EMCC, atacatorul a forțat serverul de aplicații să încarce o clasă Java controlată de el, obținând un reverse shell.

{% image24 %}

### Furtul codului sursă - GitLab (CVE-2021-22205)

În continuare, atacatorul a identificat o instanță GitLab neactualizată și a exploatat binecunoscutul RCE bazat pe ExifTool (CVE-2021-22205), o vulnerabilitate în procesarea imaginilor de către GitLab care permite execuție de cod la distanță neautentificată. A urmat același tipar: compromiterea gazdei, apoi desfășurarea unui implant Sliver pentru persistență și pentru gestionarea mai ușoară a operațiunii.

{% image25 %}

În partea dreaptă a dovezilor, atacatorul a extras un set mare de înregistrări de utilizatori și tabelul cu parolele criptate, pe care apoi a încercat să le spargă.

Cu acces la GitLab, atacatorul a exfiltrat cele mai valoroase depozite, inclusiv e-Terra.

{% image26 %}

### Puncte de acces suplimentare - Zabbix

Zabbix nu a fost o țintă prioritară, dar, în cuvintele atacatorului, era "extrem de util pentru un beacon", o cale de rezervă pentru revenirea în rețea în cazul în care un alt punct de acces ar fi fost descoperit și închis.

{% image27 %}

Atacatorul a executat un script Zabbix care conținea un reverse shell simplu. Aceasta este una dintre cele mai frecvente căi de abuz pe o instanță Zabbix compromisă, odată obținut accesul administrativ.

Până în acest punct, tehnicile folosite au fost de nivel scăzut și ar fi trebuit să fie detectate de orice echipă SOC sau unealtă de securitate configurată și monitorizată corespunzător.

### FortiSIEM

{% image28 %}

Unele detalii au fost cenzurate, însă dovezile trebuie prezentate. După cum se vede aici și în secțiunile următoare, mediul intern prezenta o igienă operațională deficitară: stocare de fișiere nestructurată și, cel mai important, parole slabe și reutilizate pe scară largă. Prezența unui SIEM care nu a prevenit și nu a scos la iveală această activitate sugerează că jurnalizarea exista, dar nu era monitorizată sau valorificată efectiv.

### Veeam și virtualizare

{% image29 %}

Același tipar se repetă în stratul de backup și virtualizare: credențiale slabe pe contul de administrator Veeam, pe stocarea Synology și în alte locuri. Deosebit de îngrijorător este un controler de domeniu Windows Server vechi, ieșit din suport (hostname `DC1`), fără vreun indiciu de actualizare curentă. O infrastructură de backup slab protejată este cu atât mai gravă, întrucât subminează ultima linie de apărare împotriva ransomware-ului. La nivelul întregului parc virtual, atacatorul a reușit să compromită peste 1.000 de mașini virtuale.

### Către compromiterea totală a domeniului

{% image30 %}

Atacatorul a afirmat că lipsa timpului l-a împiedicat să obțină acces complet de administrator de Active Directory, deși scanările și fișierele colectate sugerează că acest rezultat era la îndemână.

În dovezi este vizibil BloodHound, o unealtă open-source care mapează relațiile din mediile Active Directory și Azure pentru a dezvălui căi de atac și configurări greșite. Este folosită de echipele red pentru a găsi rute de escaladare a privilegiilor și de echipele blue pentru managementul căilor de atac.

### Active Directory - Datele BloodHound

Folderul `ACTIVE_DIRECTORY` din dump conține colecția BloodHound necesară pentru a analiza domeniul ANCPI.

{% image31 %}

Cu aceste fișiere, oricine le-ar putea importa în propria instanță BloodHound pentru a mapa structura domeniului și căile de atac, reducând dramatic efortul necesar unei intruziuni ulterioare.

### Enumerarea rețelei

Folderul `NETWORK` conține cinci fișiere, fiecare denumit după un interval de adrese diferit.

{% image32 %}

Fiecare fișier conține o scanare Nmap completă a intervalului său, incluzând porturi deschise, servicii și informații de versiune.

{% image33 %}

Majoritatea acestor fișiere depășesc 300 KB. Fiind rezultat text simplu, aceasta implică cel puțin câteva mii de linii per fișier, fișierul `NEW_NMAP` depășind 25.000 de linii la aproximativ 1,6 MB, un indiciu al cât de temeinic a fost mapată rețeaua internă.

### Fișierele de recon și de credențiale

Fișierul de recon documentează modul în care atacatorul și-a structurat recunoașterea: parole slabe, endpoint-uri de aplicații și de infrastructură precum controlere de domeniu, conturi de domeniu de mare valoare, hostname-uri și multe altele.

Fișierul de credențiale consolidează utilizatorii, endpoint-urile, hash-urile și parolele recoltate în timpul recunoașterii. Eșantionul prezentat ilustrează utilizarea sistemică a unor parole slabe, ușor de ghicit, în întregul mediu.

{% image34 %}

Aici se încheie porțiunea din dump pe care atacatorul a publicat-o. Important, acestea nu sunt singurele fișiere; au fost furnizate ca dovadă. După cum arată această analiză, exfiltrarea reală a acoperit mult mai mult: depozite, credențiale, baze de date și fișiere. Materialul publicat este doar o fracțiune din ce a fost sustras.

## Evaluare

Această breșă ar trebui să fie un semnal clar pentru instituțiile publice și private deopotrivă că securitatea nu este un exercițiu de bifat și nici o sarcină care poate fi amânată.

Din cauza deficiențelor din postura de securitate a ANCPI, datele personale ale unui număr mare de persoane, împreună cu informații confidențiale aparținând unor terți care s-au bazat pe infrastructura ANCPI, au fost expuse. Aceste date pot alimenta atacuri ulterioare împotriva persoanelor, a altor instituții și a companiilor ale căror informații se aflau în acest mediu.

Dovezile indică eșecuri sistemice, nu un simplu eveniment nefericit: aplicații expuse în internet rămase în urmă cu actualizările de ani de zile, servere ieșite din suport, parole slabe și reutilizate pe scară largă, o rețea aparent plată, cu segmentare redusă, și o monitorizare care nu s-a transformat în detecție sau răspuns.

Există un mic aspect pozitiv în faptul că un atacator care se autopromovează a expus breșa rapid, în loc să rămână ascuns. Aceleași slăbiciuni, însă, ar permite unui adversar răbdător, motivat financiar sau susținut statal, să rămână dormant, să exfiltreze continuu și să stabilească persistență pe termen lung, un rezultat mult mai grav. Având în vedere cât de accesibil era mediul, nu poate fi exclusă posibilitatea ca alți actori să fi fost, sau să fie încă, prezenți.

Cea mai gravă concluzie este că tehnicile folosite nu au fost avansate. Compromiterea s-a bazat pe vulnerabilități cunoscute public și neremediate și pe parole slabe, ceea ce înseamnă că bariera de intrare a fost scăzută, iar același rezultat era la îndemâna unui atacator relativ neexperimentat.

## Recomandări: Ce ar fi trebuit ANCPI să facă și ce poate face în continuare

Recomandările următoare sunt organizate pe domenii. Ele acoperă de la acțiuni imediate de răspuns la incident până la schimbările structurale necesare pentru a preveni o repetare. Niciuna nu este exotică; incidentul a fost posibil din cauza absenței unor controale standard, bine stabilite în industrie.

### Răspuns imediat la incident și recuperare

- **Activarea unui plan formal de răspuns la incident** cu roluri definite, autoritate decizională și căi de escaladare, și contractarea unui furnizor specializat de DFIR pe bază de retainer.
- **Notificarea și coordonarea cu autoritățile relevante**: Directoratul Național de Securitate Cibernetică (DNSC), Autoritatea de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) conform cerinței GDPR de notificare a breșei în 72 de ore, și partenerii CERT-RO/UE, după caz, în baza NIS2.
- **Containerizarea înainte de reconstruire**: izolarea segmentelor afectate, revocarea și rotația tuturor credențialelor, cheilor, certificatelor, token-urilor de API și parolelor conturilor de serviciu, și invalidarea sesiunilor active și a tichetelor Kerberos (inclusiv dubla resetare eșalonată a `krbtgt`).
- **Presupunerea compromiterii totale a domeniului**: reconstruirea controlerelor de domeniu și a serverelor critice din medii sigure, cunoscute ca fiind curate, în loc de curățarea „pe loc", având în vedere prezența implanturilor C2 (Sliver) și riscul de persistență.
- **Conservarea probelor digitale** (memorie, disc, jurnale) înainte de remediere, pentru a sprijini analiza cauzei-rădăcină, atribuirea și eventualele proceduri judiciare.
- **Vânarea persistenței și a backdoor-urilor** în întregul parc: task-uri programate, servicii, conturi locale/de domeniu noi, tichete golden/silver, GPO-uri malițioase, web shell-uri și relații de încredere OAuth sau de federalizare frauduloase pe platforma de identitate.

### Comunicare de criză și transparență

- **Comunicare corectă și promptă.** Declarațiile publice nu ar trebui să afirme că datele sunt în siguranță înainte ca investigația să susțină această concluzie. Asigurările exagerate, ulterior contrazise, erodează încrederea publică și pot atrage consecințe de reglementare.
- **Oferirea de îndrumări concrete cetățenilor afectați** (ce date au fost expuse, măsuri de precauție împotriva furtului de identitate și a fraudei) și coordonarea prelungirii termenelor cu guvernul acolo unde întreruperile serviciilor publice îi împiedică pe cetățeni să își îndeplinească obligațiile legale.

### Managementul vulnerabilităților și al actualizărilor

- **Instituirea unui program de management al actualizărilor bazat pe risc**, cu SLA-uri definite (de exemplu, vulnerabilitățile critice expuse în internet remediate în câteva zile) și conformitate măsurată.
- **Prioritizarea sistemelor expuse în internet și a celor de identitate.** Cauza-rădăcină aici a fost un RCE din 2021 (CVE-2021-35464) pe un server OpenAM expus, agravat de un GitLab neactualizat (CVE-2021-22205) și de alt software învechit. Monitorizarea continuă a suprafeței externe de atac ar fi semnalat aceste probleme.
- **Abonarea la informații despre amenințări și vulnerabilități** (CISA KEV, avize de la producători) și tratarea vulnerabilităților cunoscute ca exploatate drept urgențe.

### Managementul activelor și al ciclului de viață

- **Menținerea unui inventar de active complet și de referință** (hardware, software, versiuni, proprietari, expunere), astfel încât niciun sistem, precum controlerul de domeniu vechi `DC1`, să nu rămână neactualizat și neobservat.
- **Scoaterea din uz a sistemelor ieșite din suport.** Sistemele de operare și aplicațiile fără suport trebuie actualizate, înlocuite sau izolate în spatele unor controale compensatorii, niciodată lăsate accesibile.

### Managementul suprafeței de atac și al expunerii

- **Minimizarea expunerii în internet.** Interfețele administrative (consolele OpenAM, WebLogic/Oracle EMCC, GitLab, Zabbix, FortiSIEM, Veeam, Synology) nu ar trebui să fie niciodată accesibile direct din internet. Ele trebuie plasate în spatele unui VPN, al unui proxy de acces zero-trust sau al unor liste de IP permise.
- **Rularea de scanări externe și interne recurente** și validarea expunerii din perspectiva atacatorului, nu doar pe baza presupunerilor interne.

### Managementul identității și al accesului

- **Impunerea autentificării multifactor peste tot**, în special pe platforma SSO/de identitate, pe VPN, pe accesul de la distanță și pe toate conturile administrative.
- **Aplicarea privilegiului minim necesar** și a controlului accesului bazat pe roluri; eliminarea drepturilor administrative permanente și a conturilor inactive.
- **Adoptarea unei soluții de management al accesului privilegiat (PAM)** cu stocarea securizată a credențialelor, înregistrarea sesiunilor și elevarea „just-in-time" pentru administratori.
- **Securizarea credențialelor de bind ale directorului.** Parola de bind LDAP recuperată din OpenAM a deblocat aproximativ două milioane de înregistrări; astfel de credențiale trebuie stocate securizat, rotate și limitate la strictul necesar.
- **Guvernanța conturilor de serviciu**: parole unice, puternice și stocate securizat sau conturi gMSA (group Managed Service Accounts), fără logare interactivă și cu privilegii restrânse.

### Igiena credențialelor și managementul secretelor

- **Impunerea unei politici de parole puternice** (lungime, complexitate și verificare față de listele de parole compromise) și interzicerea reutilizării. Parolele slabe și reutilizate erau omniprezente și au facilitat concret mișcarea laterală.
- **Eliminarea secretelor în text clar.** Stocarea secretelor într-un manager dedicat de secrete (de exemplu, HashiCorp Vault), nu în fișiere, scripturi sau depozite de cod.
- **Trecerea către autentificare fără parolă și rezistentă la phishing** (chei FIDO2/hardware) pentru utilizatorii privilegiați.

### Segmentarea și arhitectura rețelei

- **Segmentarea rețelei** în zone de securitate (utilizatori, servere, management, backup, OT/DMZ) cu controale stricte est-vest, astfel încât un singur punct de acces să nu poată atinge întregul parc.
- **Izolarea planurilor de management** (hypervizoare, backup, monitorizare, servicii de directoare) pe rețele administrative dedicate, accesibile doar de pe stații de lucru cu acces privilegiat.
- **Adoptarea principiilor zero-trust**: autentificarea și autorizarea fiecărei cereri de acces și blocarea implicită între zone.

### Securitatea Active Directory

- **Implementarea unui model de administrare pe niveluri** (Tier 0/1/2) cu credențiale separate pe fiecare nivel și stații de lucru cu acces privilegiat pentru Tier 0.
- **Desfășurarea LAPS** pentru parole unice de administrator local, dezactivarea protocoalelor vechi (NTLMv1, LDAP nesemnat, SMBv1) și impunerea semnării SMB și LDAP.
- **Întărirea și monitorizarea continuă a AD**: rularea BloodHound și a unor unelte precum PingCastle/Purple Knight în scop defensiv pentru a găsi și închide chiar căile de atac mapate de atacator, și alertarea la DCSync, Kerberoasting și replicare anormală.
- **Protejarea și monitorizarea controlerelor de domeniu** ca active de maximă valoare, cu actualizare strictă și control al modificărilor.

### Detecție, răspuns și monitorizare

- **Operarea unui SOC funcțional** (intern sau externalizat) cu monitorizare continuă, cazuri de utilizare definite și timpi de răspuns măsurați. Jurnalizarea fără monitorizare nu a oferit nicio protecție aici.
- **Desfășurarea EDR/XDR** pe toate stațiile și serverele pentru a detecta implanturi, reverse shell-uri și framework-uri C2 precum Sliver, și detecție la nivel de rețea (NDR) pentru mișcare laterală și beaconing.
- **Ajustarea SIEM-ului (FortiSIEM) în detecții acționabile** aliniate la MITRE ATT&CK, cu alertare pentru tentative de exploatare, conturi de administrator noi, acces masiv la fișiere și interogări de directoare.
- **Desfășurarea unei vânători proactive de amenințări** în loc de a te baza exclusiv pe alerte, și rularea periodică a exercițiilor de validare a detecției.
- **Centralizarea și protejarea jurnalelor** cu controale de integritate și retenție off-host, rezistentă la manipulare, astfel încât un atacator să nu își poată șterge pur și simplu urmele.

### Protecția datelor și confidențialitatea

- **Clasificarea și minimizarea datelor**, păstrând doar ce este necesar și cunoscând exact unde se află înregistrările sensibile.
- **Criptarea datelor în repaus și în tranzit**, cu protejarea cheilor independent de date.
- **Desfășurarea unei soluții de prevenire a pierderii de date (DLP)** și monitorizarea traficului de ieșire pentru a detecta și încetini exfiltrarea la scară largă, plus monitorizarea activității bazelor de date pentru sistemele centrale.

### Dezvoltare software securizată și protecția codului sursă

- **Nu expuneți niciodată sistemul de management al codului sursă în internet** fără autentificare puternică și restricții de rețea; mențineți GitLab actualizat și în spatele controalelor de acces.
- **Scanarea depozitelor pentru secrete hardcodate** și rotația oricăror credențiale expuse; adoptarea scanării secretelor la pre-commit și în CI.
- **Impunerea practicilor de SDLC securizat**: protecția branch-urilor, revizuirea obligatorie a codului, commit-uri semnate, SAST/DAST/SCA în pipeline și runnere CI/CD cu privilegii minime.
- **Tratarea codului sursă scurs ca un risc continuu**: revizuirea depozitelor exfiltrate (e-Terra, epay și altele) pentru credențiale încorporate și logică exploatabilă, cu remediere corespunzătoare.

### Backup și reziliență la ransomware

- **Aplicarea unei strategii de backup întărite 3-2-1-1**, cu cel puțin o copie imutabilă, offline sau air-gapped, pe care o compromitere a domeniului nu o poate atinge sau șterge.
- **Izolarea și protejarea cu MFA a infrastructurii de backup** (Veeam, echipamente de stocare); credențialele slabe recuperate pentru Veeam și Synology ar fi neutralizat recuperarea într-un atac distructiv.
- **Testarea regulată a restaurării** față de obiective RTO/RPO definite, și menținerea unui plan de recuperare în caz de dezastru și de continuitate a activității, documentat și exersat.

### Întărirea stațiilor și serverelor

- **Aplicarea unor baseline-uri de întărire recunoscute** (CIS Benchmarks, DISA STIGs) pe sistemele de operare și aplicații, cu monitorizarea abaterilor de configurare.
- **Implementarea unei liste de aplicații permise (allowlisting)** pe servere pentru a bloca binarele neautorizate și abuzul de tip „living-off-the-land".
- **Eliminarea sau restricționarea uneltelor și serviciilor inutile** pe gazdele de producție.

### Guvernanță, testare și oameni

- **Instituirea guvernanței de securitate** aliniate la un cadru recunoscut (ISO 27001, NIST CSF), cu asumare la nivel executiv, management al riscului și buget adecvat, alocat distinct.
- **Comandarea de testări de securitate independente și regulate**: teste de penetrare externe și interne cel puțin anual și după modificări majore, angajamente periodice de tip red-team și exerciții purple-team pentru validarea detecției. Un test anual de bază ar fi scos, foarte probabil, la iveală sistemele OpenAM și GitLab expuse.
- **Luarea în considerare a unui program de dezvăluire a vulnerabilităților sau a unui bug bounty**, astfel încât cercetătorii bine intenționați să raporteze problemele înainte ca adversarii să le exploateze.
- **Investiția în personal și competențe**: echipe de inginerie și operațiuni de securitate cu resurse adecvate, instruire continuă și programe de conștientizare a securității la nivelul întregii organizații.
- **Gestionarea riscului legat de terți și de lanțul de aprovizionare**, dat fiind că date ale altor instituții și companii se aflau în mediul ANCPI; acele părți trebuie notificate, iar expunerea lor evaluată.

### Obligații de conformitate și legale

- **Îndeplinirea obligațiilor GDPR** privind notificarea breșei către autoritatea de supraveghere și, unde este cazul, către persoanele afectate, alături de menținerea unei evidențe apărabile a incidentului și a răspunsului.
- **Îndeplinirea obligațiilor NIS2** aplicabile entităților esențiale/importante, inclusiv măsuri de management al riscului și raportarea incidentelor către CSIRT-ul național.
- **Pregătirea pentru scrutinul autorităților și potențiala răspundere**, cu documentarea remedierii pentru a demonstra diligența cuvenită.

Luate împreună, aceste măsuri nu reprezintă altceva decât un program de securitate competent și modern. Semnificația acestui incident nu constă în sofisticarea atacatorului, ci în absența aproape totală a apărărilor care i-ar fi oprit, i-ar fi încetinit sau, cel puțin, i-ar fi detectat.
