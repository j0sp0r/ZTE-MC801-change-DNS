# Changelog

## 2.1.0 – 2026-10-27

### Home Assistant

- **Behoben: Der Logger warf Nutzer aus der Weboberfläche.** Der Router erlaubt nur eine Sitzung; der Logger meldete sich nach dem Verlust seiner Sitzung beim nächsten Poll sofort neu an. Jetzt erkennt er die Übernahme und pausiert seine Logins für 15 Minuten (bei Wiederholung 30, dann 60). Einstellbar über `BROWSER_PAUSE_MIN`.
- Neu: `sensor.zte_logger_status` (`aktiv`/`pausiert`) und Service `pyscript.zte_pause_logger`.

## 2.0.0 – 2026-10-27

**Umstieg:** Das Dashboard liegt jetzt unter `browser/zte-dashboard.js` (vorher `script.js`). Wer es per Konsole nutzt, kopiert ab jetzt diese Datei.

### Dashboard

- **Behoben: DNS-Änderung stufte IPv4v6-Profile auf IPv4 herab.** Das Skript setzte fest `pdp_type: "IP"` und den Profilnamen `miononno`. Jetzt werden PDP-Typ, APN, IPv6-APN, Zugangsdaten und Profilname des aktiven Profils übernommen und nur die DNS-Server geändert. Betroffen waren z.B. Telekom-Anschlüsse mit `internet.v6.telekom`.
- **Behoben: Netzmodus stand immer auf „Auto“.** Das gelesene Feld `BearerPreference` ist beim Lesen immer leer; jetzt wird `net_select` verwendet.
- **Behoben: Ungenaue LTE-Bandmaske** für Bänder über 53 (z.B. B66, B71). Ungültige Bandangaben werden abgelehnt.
- **Behoben: Zugeklappte Abschnitte** klappten beim Aktualisieren alle 5 Sekunden wieder auf.
- **Behoben: md5-Fallback** stellte `hex_md5` nicht bereit.
- Neu: Anzeige der aktuellen LTE- und 5G-Band-Sperre.
- Neu: Werte vom Router werden vor der Anzeige escaped.
- Neu: Userscript `browser/zte-dashboard.user.js` für Tampermonkey/Violentmonkey.

### Home Assistant (neu)

- `home-assistant/pyscript/zte_logger.py`: Sensoren für Signal, Zelle, Band, Durchsatz, Datenvolumen, Temperatur, Throttling und Router-Konfiguration; Watchdog mit automatischem Neustart; Services `zte_reboot_router` und `zte_read_fields`.
- `home-assistant/pyscript/dns_check.py`: DNS-Check je eigenem DNS-Server, über den Router und extern, mit optionaler Push-Nachricht.

### Dokumentation

- `docs/FIELDS.md`: Referenz der goform-API.
- `LICENSE` (AGPL-3.0) ergänzt.

## 1.x

Ursprüngliches Konsolen-Skript `script.js`.
