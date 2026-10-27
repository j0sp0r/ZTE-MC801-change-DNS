# ZTE MC801A in Home Assistant

Zwei [pyscript](https://github.com/custom-components/pyscript)-Apps, die direkt
in Home Assistant laufen:

- **`zte_logger.py`**: liest den Router jede Minute aus und stellt die Werte als
  Sensoren bereit (Signal, Zelle, Band, Durchsatz, Temperatur, Throttling,
  Datenvolumen, DNS-/APN-/Band-Konfiguration). Enthält einen Watchdog, der den
  Router neu startet, wenn die Verbindung längere Zeit tot ist, und einen
  Service für einen manuellen Neustart.
- **`dns_check.py`**: trennt „Leitung tot“ von „nur DNS kaputt“. Prüft die
  eigenen DNS-Server (AdGuard Home, Pi-hole, …) einzeln, den Router-DNS und
  einen externen Resolver.

Beide lesen nur. Geschrieben wird ausschließlich beim Neustart des Routers.

> **Nur eine Sitzung:** Der Router erlaubt nur eine angemeldete Sitzung. Meldest
> du dich in der Weboberfläche an, verliert der Logger seine Sitzung. Er erkennt
> das und pausiert seine Logins für 15 Minuten (bei Wiederholung 30, dann 60),
> statt dich sofort wieder rauszuwerfen. Wer länger in der Oberfläche arbeiten
> will, pausiert ihn vorher mit `pyscript.zte_pause_logger`. Der Watchdog läuft
> in der Pause weiter; nur ein automatischer Neustart meldet sich trotzdem an.

## Installation

1. **pyscript installieren** (über HACS) und die Integration hinzufügen.
   In den Optionen der Integration **„Allow All Imports“** einschalten. Die
   Skripte brauchen `urllib`, `hashlib`, `socket` und `struct`.
2. **Router-Passwort ablegen:** eine Datei `/config/zte_router.secret` mit
   genau einer Zeile, dem Passwort der Router-Oberfläche.
3. **Skripte kopieren:** `pyscript/zte_logger.py` und `pyscript/dns_check.py`
   nach `/config/pyscript/`.
4. **Konfiguration anpassen:** jeweils oben im Skript, zwischen den Zeilen
   `---- Konfiguration ----`:

   | Skript | Einstellung | Bedeutung |
   |---|---|---|
   | beide | `NOTIFY_TARGET` | notify-Service ohne `notify.`, z.B. `mobile_app_mein_handy`. Leer = keine Push-Nachrichten. |
   | `zte_logger.py` | `ZTE_HOST` | Router-IP |
   | `zte_logger.py` | `WATCHDOG_ENABLED`, `WATCHDOG_THRESHOLD_SEC`, `WATCHDOG_COOLDOWN_SEC` | Neustart nach 5 min Ausfall, höchstens einmal pro Stunde |
   | `zte_logger.py` | `BROWSER_PAUSE_MIN` | Pause nach einem Login in der Weboberfläche (Standard 15 min) |
   | `dns_check.py` | `LOCAL_RESOLVERS` | eigene DNS-Server, z.B. `{"adguard": ("192.168.0.2", "AdGuard")}` |
   | `dns_check.py` | `ROUTER_RESOLVER` | Router-IP |

5. **Home Assistant komplett neu starten.** Ein `pyscript.reload` reicht nach
   Änderungen oft nicht (siehe `docs/FIELDS.md`).

Nach etwa einer Minute erscheinen die Sensoren. Fehler stehen unter
*Einstellungen → System → Protokolle* (Filter `zte_logger` bzw. `dns_check`).

## Entitäten

**Router (`zte_logger.py`)**

| Entität | Inhalt |
|---|---|
| `sensor.zte_logger_status` | `aktiv` oder `pausiert` (Attribute `bis`, `grund`) |
| `binary_sensor.zte_reachable` | Internet per TCP erreichbar (kein ICMP) |
| `binary_sensor.zte_download_dead` | Upload läuft, Download nicht |
| `sensor.zte_watchdog_problem_seconds` | laufende Ausfalldauer |
| `sensor.zte_lte_rsrp`, `_rsrq`, `_snr`, `sensor.zte_5g_rsrp`, `sensor.zte_5g_sinr` | Signal |
| `sensor.zte_cell_id`, `sensor.zte_lte_pci`, `sensor.zte_nr5g_pci`, `sensor.zte_wan_active_band`, `sensor.zte_nr5g_action_band`, `sensor.zte_wan_lte_ca` | Zelle und Band |
| `sensor.zte_download_bps`, `sensor.zte_upload_bps` | Durchsatz |
| `sensor.zte_monthly_rx_gb`, `_tx_gb`, `_total_gb` | Datenvolumen im Monat |
| `sensor.zte_pm_sensor_mdm`, `sensor.zte_pm_modem_5g`, `sensor.zte_therm_*` | Temperatur und Throttling |
| `sensor.zte_dns_*`, `sensor.zte_apn_*`, `sensor.zte_pdp_type`, `sensor.zte_net_select`, `sensor.zte_lte_band_lock_bands`, `sensor.zte_nr5g_band_lock`, `sensor.zte_mtu`, … | Konfiguration. Jede Änderung steht als `KONFIG-WECHSEL` im Log. |

**DNS (`dns_check.py`)**

| Entität | Inhalt |
|---|---|
| `binary_sensor.dns_tcp_reachable` | Leitung da (ohne DNS) |
| `binary_sensor.dns_<name>_ok` | je Eintrag in `LOCAL_RESOLVERS` |
| `binary_sensor.dns_router_ok` | DNS über den Router, wie ihn die Clients nutzen |
| `binary_sensor.dns_external_ok` | 1.1.1.1 direkt |
| `binary_sensor.dns_local_ok` | DNS über den Resolver von Home Assistant selbst |
| `sensor.dns_check_status` | `OK`, `<Name> tot`, `Alle eigenen DNS-Server tot`, `DNS insgesamt tot`, `Router-DNS tot`, `Verbindung tot` |

## Services

| Service | Zweck |
|---|---|
| `pyscript.zte_reboot_router` | Router neu starten |
| `pyscript.zte_pause_logger` | Logins pausieren, z.B. `minutes: 30`; `minutes: 0` setzt fort |
| `pyscript.zte_read_fields` | beliebige Felder lesen, z.B. `fields: "mtu,tcp_mss"`. Ergebnis als Attribute von `sensor.zte_debug_read` und im Log. Nur lesend. |

## Beispiel-Dashboardkarte

```yaml
type: entities
title: ZTE Router
entities:
  - entity: binary_sensor.zte_reachable
  - entity: sensor.dns_check_status
  - entity: sensor.zte_lte_rsrp
  - entity: sensor.zte_5g_sinr
  - entity: sensor.zte_download_bps
  - entity: sensor.zte_watchdog_problem_seconds
  - type: button
    name: Router neu starten
    icon: mdi:restart
    action_name: Neustart
    tap_action:
      action: perform-action
      perform_action: pyscript.zte_reboot_router
      confirmation:
        text: Router wirklich neu starten?
```
