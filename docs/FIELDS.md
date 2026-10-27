# ZTE MC801A – goform-API-Referenz

Gilt für Firmware `MC801AV1.0.0B16` (Telekom). Ermittelt aus den Router-eigenen
JS-Dateien (`js/service.js`, `js/config/config.js`) und Live-Abfragen. Jeder
Feldname unten steht entweder in einer `cmd="..."`-Zeichenkette der Firmware
oder wurde live mit einem echten Wert bestätigt; Ausnahmen sind markiert.

Lesen: `GET /goform/goform_get_cmd_process?isTest=false&multi_data=1&cmd=feld1,feld2`
Schreiben: `POST /goform/goform_set_cmd_process` mit `isTest=false&goformId=...`

Header für Skripte außerhalb des Browsers: `Referer: http://192.168.0.1/`
und `X-Requested-With: XMLHttpRequest`.

## Login

Ohne Login sind nur wenige Felder lesbar (`network_type`,
`wa_inner_version`, `LD`, `loginfo`). Alles andere kommt leer zurück.

Verfahren SHA256 mit Challenge (`WEB_ATTR_IF_SUPPORT_SHA256:2` steht fest
im JS-Bundle, nicht Base64):

```
LD    = GET cmd=LD                          (64 Hex-Zeichen)
inner = SHA256(passwort)                    (Hex, GROSSBUCHSTABEN)
final = SHA256(inner + LD)                  (Hex, GROSSBUCHSTABEN)
POST  goformId=LOGIN, password=final        -> {"result":"0"} = Erfolg
```

- **Es gibt nur eine Sitzung.** Ein neuer Login (z.B. in der Weboberfläche)
  beendet die bestehende Sitzung eines Skripts und umgekehrt. Ein Skript, das
  sich nach einem Sitzungsverlust sofort neu anmeldet, wirft den Nutzer im
  Browser innerhalb einer Minute raus.
- Die Sitzung läuft nach etwa 10 Minuten Inaktivität ab. Erkennbar daran,
  dass loginpflichtige Felder (`lte_rsrp`, `Z5g_rsrp`) leer zurückkommen.
  `network_type` taugt dafür **nicht**, das ist immer lesbar.
- `goformId=LOGOUT` lieferte im Test `failure`; die Sitzung läuft einfach ab.

## AD-Token für Schreibbefehle

Fast alle `goform_set_cmd_process`-Aufrufe brauchen ein Feld `AD`:

```
GET cmd=wa_inner_version,cr_version,RD
AD = md5( md5(wa_inner_version + cr_version) + RD )      (md5 als Hex, klein)
```

`cr_version` ist bei dieser Firmware leer; das ist richtig so. `RD` ändert
sich bei jedem Abruf, deshalb vor jedem Schreibbefehl neu holen.

## Verbindung

| Feld | Beispiel | Bedeutung |
|---|---|---|
| `network_type` | `ENDC` | `ENDC` = 5G NSA mit LTE-Anker, `SA`, `LTE` |
| `network_provider` | `Telekom.de` | |
| `ppp_status` | `ipv4_ipv6_connected` | WAN-Status |
| `wan_ipaddr` | `192.0.0.2` | bei 464XLAT die CLAT-Adresse, nicht die öffentliche IP |
| `ipv6_wan_ipaddr` | `2a01:…` | WAN-IPv6 |
| `wan_apn` | `internet.v6.telekom` | aktiver APN |
| `modem_main_state` | `modem_init_complete` | |
| `simcard_roam` | `Home` | Roaming-Status |

## LTE

| Feld | Beispiel | Bedeutung |
|---|---|---|
| `lte_rsrp` / `lte_rsrq` / `lte_snr` | `-97` / `-11` / `0.8` | dBm / dB / dB |
| `lte_rssi` | `-62` | `rssi` ohne Präfix ist leer |
| `lte_pci`, `cell_id` | `123`, `1a2b3c4` | `cell_id` als Hex |
| `wan_active_band`, `wan_active_channel` | `LTE BAND 3`, `1300` | Band im Klartext, EARFCN |
| `wan_lte_ca`, `lte_multi_ca_scell_info`, `lte_ca_*` | | Carrier Aggregation, leer ohne aktive CA |

## 5G (NR)

| Feld | Beispiel | Bedeutung |
|---|---|---|
| `Z5g_rsrp` | `-89` | dBm |
| `Z5g_SINR` | `13.5` | **Großbuchstaben** – `Z5g_snr` ist leer |
| `nr5g_pci`, `nr5g_action_band`, `nr5g_action_channel` | `1f`, `n78`, `…` | |
| `Z5g_CELL_ID`, `nr5g_cell_id` | *(leer)* | im NSA-Betrieb nicht befüllt |

## Durchsatz und Volumen

| Feld | Bedeutung |
|---|---|
| `realtime_rx_thrpt` / `realtime_tx_thrpt` | aktueller Down-/Upload in bit/s |
| `realtime_rx_bytes` / `realtime_tx_bytes` / `realtime_time` | Zähler und Sekunden seit Sitzungsstart |
| `monthly_rx_bytes` / `monthly_tx_bytes` | Monatszähler in Byte |

## Temperatur und Throttling

| Feld | Bedeutung |
|---|---|
| `pm_sensor_mdm`, `pm_modem_5g` | Modem-Temperaturen in °C |
| `pm_sensor_pa1` | Wert unklar (oft `-40`), vermutlich keine Temperatur |
| `therm_pa_level`, `therm_tj_level`, `therm_pa_frl_level` | Throttling-Stufen, `0` = kein Throttling |

## Konfiguration (lesbar mit Login)

| Feld | Beispiel | Bedeutung |
|---|---|---|
| `dns_mode` | `manual` / `auto` | DNS des APN-Profils |
| `prefer_dns_manual` / `standby_dns_manual` | `192.168.0.2` | manuelle DNS-Server (IPv4) |
| `ipv6_dns_mode`, `ipv6_prefer_dns_manual`, `ipv6_standby_dns_manual` | | dito IPv6 |
| `apn_mode` | `auto` / `manual` | |
| `m_profile_name`, `Current_index` | `Internet`, `1` | aktives Profil |
| `pdp_type` / `ipv6_pdp_type` | `IPv4v6` | **Beim Ändern des DNS übernehmen**, sonst wird z.B. ein IPv4v6-Profil auf IPv4 herabgestuft |
| `ppp_auth_mode`, `ppp_username`, `ppp_passwd`, `ipv6_*` | | Zugangsdaten des Profils |
| `net_select` | `WL_AND_5G` | Netzmodus. `BearerPreference` ist nur Schreib-Parameter und beim Lesen immer leer. |
| `net_select_mode` | `auto_select` | automatische/manuelle Netzwahl |
| `lte_band_lock` | `0x20880800c5` | LTE-Band-Maske (Bit 0 = Band 1). `lte_band_mask` ist beim Lesen leer. |
| `nr5g_nsa_band_lock` | `1,3,7,28,38,78` | 5G-Bandliste. *Nicht im JS-Bundle, durch Ausprobieren gefunden.* `nr5g_band_mask` ist beim Lesen leer. |
| `mtu` / `tcp_mss` | `1500` / `1460` | |
| `ps_no_service_restart_flag` | `1` | vermutlich: Neustart, wenn kein Datendienst verfügbar ist |
| `net_link_detect_enable`, `net_link_detect_url`, `net_link_detect_ping_times`, … | `0` | Router-eigener Link-Watchdog (siehe unten) |
| `watch_dog_reboot_enable` | `1` | |
| `ant_switch_enable` | `0` | Antennen-Umschaltung |

## Schreibbefehle (`goformId`)

Die Weboberfläche nutzt nur einen Teil davon. Parameter jeweils wie in
`js/service.js`; alle brauchen `AD`.

| goformId | Parameter | Zweck |
|---|---|---|
| `REBOOT_DEVICE` | – | Neustart |
| `APN_PROC_EX` | `apn_action=save`, `apn_mode=manual`, `profile_name`, `pdp_type`, `pdp_type_roaming`, `wan_apn`, `dns_mode`, `prefer_dns_manual`, `standby_dns_manual`, (IPv6-Gegenstücke), `index` | APN-Profil speichern, danach `apn_action=set_default`, `set_default_flag=1` |
| `SET_BEARER_PREFERENCE` | `BearerPreference` = `WL_AND_5G` / `LTE_AND_5G` / `Only_LTE` | Netzmodus |
| `BAND_SELECT` | `is_lte_band=1`, `lte_band_mask=0x…` | LTE-Bänder |
| `WAN_PERFORM_NR5G_BAND_LOCK` | `nr5g_band_mask=78,28` | 5G-Bänder |
| `PS_NO_SERVICE_RESTART_SET` | `ps_no_service_restart_flag` | siehe oben |
| `WATCH_DOG_SWITCH` | `net_link_detect_*`, `watch_dog_reboot_enable` | Router-Watchdog |
| `SET_DEVICE_MTU` | `mtu`, `tcp_mss` | |
| `WAN_ANT_SWITCH_SET` / `BSP_ANTENNA_STATE_SET` | `ant_switch_enable` / `antenna_name`, `state` | Antennen |
| `SIGNAL_QUALITY_DETECT_START` / `_CANCEL` | – | eingebaute Hilfe zur Positionierung |
| `SetUpgAutoSetting` | `UpgMode`, `UpgIntervalDay`, `UpgRoamPermission` | automatische Firmware-Updates |
| `SET_THERMAL_CONTROL` | `thermal_control_enable`, `thermal_led_enable` | |

Weitere im Bundle: `TR069_MODULE_SET`, `RF_MMW_DISABLE_SET`,
`SET_CONNECTION_MODE`, `DMZ_SETTING`, `UPNP_SETTING`, `DHCP_SETTING`,
`IPV6_ROUTER_SETTINGS`, `SCAN_NETWORK`, `USSD_PROCESS`, `SHUTDOWN_DEVICE`,
`RESTORE_FACTORY_SETTINGS`.

## Stolperfallen

- **ICMP ist auf Telekom-Anschlüssen mit `internet.v6.telekom` (464XLAT)
  blockiert.** `ping 1.1.1.1` liefert 100 % Verlust, während TCP/UDP
  funktionieren. Erreichbarkeit deshalb per TCP-Connect prüfen (z.B.
  `1.1.1.1:443`). Den Router-eigenen Watchdog (`WATCH_DOG_SWITCH`) nicht
  einschalten: `net_link_detect_ping_times` deutet auf einen Ping-Check, der
  dort dauerhaft fehlschlagen und eine Reboot-Schleife auslösen würde.
- **Die Router-Seite hat eine strenge Content-Security-Policy**
  (`connect-src 'self'`, Skripte nur von `self`). Im Browser lassen sich
  keine externen Skripte nachladen. `hex_md5` bringt die Seite selbst mit.
  Userscripts funktionieren trotzdem.
- `config.js` blendet manche Funktionen bewusst aus, z.B. `SHOW_APN_DNS: !1`
  (daher kein DNS-Feld in der Oberfläche) und `IS_SHOW_SINR: !1`.

## Home Assistant / pyscript

- `@pyscript_executor`-Funktionen laufen in einem echten Thread. Ruft so eine
  Funktion eine andere pyscript-Funktion auf, bekommt sie nur ein nie
  ausgeführtes Coroutine-Objekt zurück, ohne Fehlermeldung. Jede
  Executor-Funktion muss deshalb vollständig in sich geschlossen sein
  (eigene Imports, keine Hilfsfunktionen).
- Nach mehrfachem schnellen Speichern blieb ein `@time_trigger("period(...)")`
  nach einem Durchlauf stehen; nur ein kompletter Home-Assistant-Neustart half.
  Änderungen deshalb einmal fertig speichern und dann HA neu starten.
- Die Skripte brauchen die pyscript-Option **Allow All Imports**
  (`urllib`, `hashlib`, `socket`, `struct`).
