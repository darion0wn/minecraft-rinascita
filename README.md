# Minecraft: Rinascita — Campaign Control Center

Dashboard statica per la campagna Minecraft Bedrock "Rinascita".

## Cosa contiene

- Dashboard con progresso e stato della run
- Mappa strategica del seed
- Collegamento alla Seed Map completa di Chunkbase
- 20 obiettivi divisi per fasi
- Stato del giorno e della fase
- Coordinate attuali
- Progetti della capitale
- Albero della progressione tecnologica
- Loadout add-on
- Diario di gioco salvato nel browser tramite localStorage
- Layout responsive per iPhone / desktop

## Seed

`7568542259593820684`

Punto chiave:
- Villaggio dei Ciliegi: X 344 / Z -312

Riferimenti seed verificati:
- Villaggio: X 344 / Z -312
- Trial Chamber: X 311 / Y -28 / Z -425
- Portale in rovina: X 344 / Z -584
- Trial Chamber: X 713 / Y -14 / Z -457
- Portale in rovina: X 712 / Z -488
- Villaggio: X 792 / Z -344

## GitHub Pages

1. Crea un repository GitHub, ad esempio `minecraft-rinascita`.
2. Carica tutti i file mantenendo la struttura delle cartelle.
3. Vai in **Settings → Pages**.
4. Scegli **Deploy from a branch**.
5. Branch `main`, cartella `/root`.
6. Salva e apri l'URL GitHub Pages.

### Nota importante

Aprire `index.html` direttamente con `file://` può bloccare i `fetch()` dei file JSON su alcuni browser. Su GitHub Pages funziona normalmente.

## Add-on

I file dei DLC / add-on del Marketplace non sono inclusi nel repository. Il sito tiene solo la configurazione consigliata e i link al Marketplace. Gli add-on del Marketplace si attivano dalle impostazioni del mondo in Minecraft Bedrock.

## Filosofia

Questo sito non deve dirti "clicca qui e fai questa cosa".

Deve rimanere aperto mentre giochi e diventare il **registro del mondo**:
- tu giochi;
- il mondo cambia;
- aggiorni il sito;
- la storia si accumula.

## Prossime evoluzioni

Idee già compatibili con questa struttura:
- upload di screenshot del mondo
- galleria "prima / dopo"
- mappa con marker personalizzati
- inventario delle reliquie e trofei
- registro delle città
- popolazione per insediamento
- economia e moneta del regno
- timeline dei grandi eventi
- sistema "reputazione" delle città
- registro degli add-on realmente attivi
- backup / export della run in JSON
