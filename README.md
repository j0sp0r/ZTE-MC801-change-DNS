<a name="english"></a>

## ZTE MC801A Dashboard Script (English)

A JavaScript-based dashboard for advanced control and monitoring of the ZTE MC801A 5G router. This script runs directly in the browser and overlays a powerful user interface on top of the router's default web page.

It solves the problem that many routers provided by ISPs (like Telekom, O2, etc.) are heavily restricted in their functionality, preventing access to important settings like DNS servers or band locking.

<img width="222" height="944" alt="Screenshot 1" src="https://github.com/user-attachments/assets/9ef2941b-0717-457c-b18a-a160949ffc39" />
<img width="287" height="229" alt="Screenshot 2" src="https://github.com/user-attachments/assets/aadfb2c8-a018-47ed-96cc-83259bbe2c53" />


### Features

* **Live Dashboard:** Detailed real-time information on network, signal values (RSRP, SINR, etc.), temperatures, and system.
* **Simple Overview:** A beginner-friendly summary of the most important status indicators, which evaluates reception and performance in easy-to-understand terms.
* **Advanced Control:** Network Mode, Band Locking, and router reboot. DNS settings can be changed directly via the UI, ideal for use with **AdGuard Home** or **Pi-hole**.
* **Multilingual:** The entire interface can be switched between German and English with a click (selection is saved).
* **No Installation Needed:** Runs temporarily in the browser without modifying the router's firmware.
* **Home Assistant integration:** Sensors, connection watchdog with automatic reboot, reboot button and a DNS check per AdGuard/Pi-hole instance, see [`home-assistant/`](home-assistant/README.md).

### Repository layout

| Path | Content |
|---|---|
| [`browser/zte-dashboard.js`](browser/zte-dashboard.js) | the dashboard |
| [`browser/zte-dashboard.user.js`](browser/zte-dashboard.user.js) | userscript that loads the dashboard automatically |
| [`home-assistant/`](home-assistant/README.md) | pyscript apps for Home Assistant (German docs) |
| [`docs/FIELDS.md`](docs/FIELDS.md) | goform API reference: verified field names, login, AD token, pitfalls (German) |

### Usage

**Option 1 – Userscript (recommended):** Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/), then open [`browser/zte-dashboard.user.js`](https://raw.githubusercontent.com/j0sp0r/ZTE-MC801-change-DNS/main/browser/zte-dashboard.user.js) and install it. The dashboard appears automatically after logging in at `http://192.168.0.1`. For a different router IP, adjust the `@match` line.

**Option 2 – Browser console:**

1.  Log in to the web interface of your ZTE MC801A router.
2.  Open your browser's developer console (usually with the `F12` key, then select the "Console" tab).
3.  Copy the entire content of [`browser/zte-dashboard.js`](browser/zte-dashboard.js).
4.  Paste the code into the console and press `Enter`.

The dashboard will immediately appear in the top right corner of the page.

**Note on changing DNS:** The script keeps the PDP type, APN and credentials of the active APN profile and only changes the DNS servers. The profile is saved as a manual APN profile.

### Acknowledgements & Credits

This script is a further development and combination of ideas and code fragments compiled over the years by dedicated members of various online communities. Special thanks to the original authors for their pioneering work in analyzing the router's `goform` API.

The development of this script was significantly inspired by:
* The original code snippet for changing the DNS in the [Magenta Community](https://community.magenta.at/topic/7342-zte-mc801-dns-server-%C3%A4ndern/).
* The advanced userscripts from [tpoechtrager (ZTE-Script-NG)](https://raw.githubusercontent.com/tpoechtrager/ZTE-Web-Script/refs/heads/main/ng/zte-script-ng.js) and other developers, whose logic served as a model.

### License

This project is licensed under the **AGPL-3.0 License**. See the `LICENSE` file for more details.

### Disclaimer

Use of this script is entirely at **your own risk**. The author of this repository is **not responsible for any technical problems, connection failures, or potential defects to the router** that may arise from using the script. You are changing advanced settings not intended for end-user access by the manufacturer.

---
## ZTE MC801A Dashboard Skript (Deutsch)

Ein JavaScript-basiertes Dashboard zur erweiterten Steuerung und Überwachung des ZTE MC801A 5G Routers. Dieses Skript wird direkt im Browser ausgeführt und blendet eine leistungsstarke Benutzeroberfläche über die Standard-Webseite des Routers.

Es löst das Problem, dass viele von Providern (wie Telekom, o2, etc.) bereitgestellte Router in ihren Funktionen stark eingeschränkt sind und wichtige Einstellungen wie DNS-Server oder Band-Locking nicht zugänglich machen.

### Features

* **Live-Dashboard:** Detaillierte Echtzeit-Informationen zu Netzwerk, Signalwerten (RSRP, SINR, etc.), Temperaturen und System.
* **Einfache Übersicht:** Eine anfängerfreundliche Zusammenfassung der wichtigsten Status-Indikatoren, die den Empfang und die Leistung in verständlichen Worten bewertet.
* **Erweiterte Steuerung:** Network Mode, Band Locking und Neustart des Routers. Die DNS-Einstellungen können direkt über die Oberfläche geändert werden, ideal für die Nutzung mit **AdGuard Home** oder **Pi-hole**.
* **Mehrsprachig:** Die gesamte Oberfläche ist per Klick zwischen Deutsch und Englisch umschaltbar (Auswahl wird gespeichert).
* **Keine Installation nötig:** Läuft temporär im Browser, ohne die Router-Firmware zu verändern.
* **Home Assistant:** Sensoren, Verbindungs-Watchdog mit automatischem Neustart, Neustart-Button und DNS-Check pro AdGuard-/Pi-hole-Instanz, siehe [`home-assistant/`](home-assistant/README.md).

### Aufbau des Repositorys

| Pfad | Inhalt |
|---|---|
| [`browser/zte-dashboard.js`](browser/zte-dashboard.js) | das Dashboard |
| [`browser/zte-dashboard.user.js`](browser/zte-dashboard.user.js) | Userscript, das das Dashboard automatisch lädt |
| [`home-assistant/`](home-assistant/README.md) | pyscript-Apps für Home Assistant |
| [`docs/FIELDS.md`](docs/FIELDS.md) | Referenz der goform-API: geprüfte Feldnamen, Login, AD-Token, Stolperfallen |

### Anwendung

**Variante 1 – Userscript (empfohlen):** [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/) installieren, dann [`browser/zte-dashboard.user.js`](https://raw.githubusercontent.com/j0sp0r/ZTE-MC801-change-DNS/main/browser/zte-dashboard.user.js) öffnen und installieren. Das Dashboard erscheint nach dem Login auf `http://192.168.0.1` automatisch. Bei einer anderen Router-IP die `@match`-Zeile anpassen.

**Variante 2 – Browser-Konsole:**

1.  Logge dich in die Weboberfläche deines ZTE MC801A Routers ein.
2.  Öffne die Entwicklerkonsole deines Browsers (meist mit der Taste `F12` und dann den Reiter "Konsole" auswählen).
3.  Kopiere den gesamten Inhalt der Datei [`browser/zte-dashboard.js`](browser/zte-dashboard.js).
4.  Füge den Code in die Konsole ein und drücke `Enter`.

Das Dashboard erscheint sofort oben rechts auf der Seite.

**Hinweis zur DNS-Änderung:** Das Skript übernimmt PDP-Typ, APN und Zugangsdaten des aktiven APN-Profils und ändert nur die DNS-Server. Das Profil wird dabei als manuelles APN-Profil gespeichert.

### Danksagung & Credits

Dieses Skript ist eine Weiterentwicklung und Kombination aus Ideen und Code-Fragmenten, die von engagierten Mitgliedern verschiedener Online-Communitys zusammengetragen wurden. Besonderer Dank gilt den ursprünglichen Autoren für ihre Pionierarbeit bei der Analyse der `goform`-API des Routers.

Die Entwicklung dieses Skripts wurde maßgeblich inspiriert durch:
* Den ursprünglichen Code-Schnipsel zum Ändern des DNS in der [Magenta Community](https://community.magenta.at/topic/7342-zte-mc801-dns-server-%C3%A4ndern/).
* Die fortschrittlichen Userscripte von [tpoechtrager (ZTE-Script-NG)](https://raw.githubusercontent.com/tpoechtrager/ZTE-Web-Script/refs/heads/main/ng/zte-script-ng.js) und anderen Entwicklern, deren Logik als Vorbild diente.

### Lizenz

Dieses Projekt steht unter der **AGPL-3.0 Lizenz**. Siehe die `LICENSE`-Datei für weitere Details.

### Haftungsausschluss

Die Nutzung dieses Skripts erfolgt ausschließlich auf **eigene Gefahr**. Der Autor dieses Repositorys ist **nicht für technische Probleme, Verbindungsausfälle oder eventuelle Defekte am Router verantwortlich**, die durch die Verwendung des Skripts entstehen könnten. Sie ändern erweiterte Einstellungen, die vom Hersteller nicht für den Endanwender vorgesehen sind.
