"""ZTE MC801A Logger als pyscript-App, laeuft direkt in Home Assistant.

Feldnamen und Login-Methode (SHA256/LD-Challenge) gegen die echte Firmware
(MC801AV1.0.0B16) verifiziert - siehe docs/FIELDS.md im Repository
https://github.com/j0sp0r/ZTE-MC801-change-DNS. Installation und
Konfiguration: home-assistant/README.md.

Wichtig: @pyscript_executor-Funktionen laufen in einem echten Thread ueber
task.executor, ausserhalb von pyscripts Event-Loop. Sie duerfen deshalb
NUR eingebautes/Standardbibliothek-Python aufrufen - kein Aufruf einer
anderen pyscript-Funktion (die wird sonst zur Coroutine kompiliert und
liefert nur das Coroutine-Objekt zurueck, nicht ihr Ergebnis). Deshalb ist
alles, was eine Executor-Funktion braucht (Header-Dict, Imports), direkt
in ihr eigenes Funktionsinneres kopiert statt in Hilfsfunktionen
ausgelagert.

Das Router-Passwort liegt in CREDS_PATH (eine Zeile, sonst nichts) - diese
Datei wird nur gelesen, nie geloggt oder ausgegeben.

Watchdog: der Router hat zwar eine eigene "Network Link Detect"-Funktion
mit Auto-Reboot (goformId WATCH_DOG_SWITCH), aber deren Feldname
"net_link_detect_ping_times" deutet stark auf einen ICMP-Ping-Check hin -
und ICMP ist z.B. auf Telekom-Anschluessen mit IPv6-only-APN (464XLAT)
komplett blockiert (siehe docs/FIELDS.md). Ein aktivierter Router-Watchdog
wuerde die Leitung dort fuer staendig tot halten und in eine Reboot-Schleife
laufen. Der Watchdog hier im Skript nutzt stattdessen einen TCP-Connect-Check.
"""

import time

# ---- Konfiguration ---------------------------------------------------------
ZTE_HOST = "192.168.0.1"
CREDS_PATH = "/config/zte_router.secret"

# Erreichbarkeits-Check per TCP-Connect (kein ICMP, kein DNS)
CHECK_HOST = "1.1.1.1"
CHECK_PORT = 443

# Watchdog: wie lange die Verbindung am Stueck tot sein muss, bevor
# automatisch neu gestartet wird, und Mindestabstand zwischen zwei
# automatischen Reboots (gegen Reboot-Schleifen).
WATCHDOG_ENABLED = True
WATCHDOG_THRESHOLD_SEC = 300
WATCHDOG_COOLDOWN_SEC = 3600

# notify-Service ohne "notify."-Praefix, z.B. "mobile_app_mein_handy";
# leer lassen = keine Push-Nachrichten
NOTIFY_TARGET = ""
# -----------------------------------------------------------------------------

ZTE_BASE = f"http://{ZTE_HOST}"

FIELDS = [
    "network_type", "network_provider", "ppp_status", "wan_ipaddr",
    "ipv6_wan_ipaddr", "wan_apn", "modem_main_state", "simcard_roam",
    "lte_rsrp", "lte_rsrq", "lte_snr", "rssi", "rscp", "lte_rssi",
    "lte_pci", "cell_id", "lte_ca_pcell_band", "lte_ca_scell_band",
    "lte_ca_pcell_arfcn", "lte_ca_scell_arfcn", "wan_lte_ca",
    "lte_multi_ca_scell_info", "wan_active_band", "wan_active_channel",
    "Z5g_rsrp", "Z5g_SINR", "Z5g_snr", "Z5g_CELL_ID", "nr5g_pci",
    "nr5g_action_band", "nr5g_action_channel", "nr5g_cell_id",
    "Z5g_dlEarfcn", "ZCELLINFO_band", "ecio",
    "realtime_rx_thrpt", "realtime_tx_thrpt",
    "realtime_rx_bytes", "realtime_tx_bytes", "realtime_time",
    "monthly_rx_bytes", "monthly_tx_bytes",
    "pm_sensor_mdm", "pm_sensor_pa1", "pm_modem_5g", "wifi_chip_temp",
    "therm_pa_level", "therm_tj_level", "therm_pa_frl_level",
    "wa_inner_version", "cr_version", "hardware_version",
]

# Konfiguration (DNS, APN, Netzmodus, Band-Lock, Router-Schutzfunktionen) -
# nur gelesen, nie geschrieben. Feldnamen aus den cmd-Strings in
# js/service.js der Firmware, ausser nr5g_nsa_band_lock (durch Probieren
# gefunden, liefert die 5G-Bandliste). Die Schreib-Parameter
# BearerPreference/lte_band_mask/nr5g_band_mask sind beim Lesen immer leer,
# deshalb hier net_select bzw. lte_band_lock/nr5g_nsa_band_lock.
CONFIG_SENSORS = {
    "sensor.zte_dns_mode": ("dns_mode", "ZTE DNS-Modus"),
    "sensor.zte_dns_manual_primary": ("prefer_dns_manual", "ZTE DNS manuell primaer"),
    "sensor.zte_dns_manual_secondary": ("standby_dns_manual", "ZTE DNS manuell sekundaer"),
    "sensor.zte_dns_auto_primary": ("prefer_dns_auto", "ZTE DNS Provider primaer"),
    "sensor.zte_dns_auto_secondary": ("standby_dns_auto", "ZTE DNS Provider sekundaer"),
    "sensor.zte_ipv6_dns_mode": ("ipv6_dns_mode", "ZTE IPv6 DNS-Modus"),
    "sensor.zte_ipv6_dns_manual_primary": ("ipv6_prefer_dns_manual", "ZTE IPv6 DNS manuell primaer"),
    "sensor.zte_ipv6_dns_manual_secondary": ("ipv6_standby_dns_manual", "ZTE IPv6 DNS manuell sekundaer"),
    "sensor.zte_apn_mode": ("apn_mode", "ZTE APN-Modus"),
    "sensor.zte_apn_profile": ("m_profile_name", "ZTE APN-Profil"),
    "sensor.zte_apn_current_index": ("Current_index", "ZTE APN-Profilindex"),
    "sensor.zte_wan_apn": ("wan_apn", "ZTE APN"),
    "sensor.zte_ipv6_wan_apn": ("ipv6_wan_apn", "ZTE IPv6 APN"),
    "sensor.zte_pdp_type": ("pdp_type", "ZTE PDP-Typ"),
    "sensor.zte_ipv6_pdp_type": ("ipv6_pdp_type", "ZTE IPv6 PDP-Typ"),
    "sensor.zte_net_select": ("net_select", "ZTE Netzmodus"),
    "sensor.zte_net_select_mode": ("net_select_mode", "ZTE Netzauswahl"),
    "sensor.zte_lte_band_lock": ("lte_band_lock", "ZTE LTE Band-Sperre (Maske)"),
    "sensor.zte_nr5g_band_lock": ("nr5g_nsa_band_lock", "ZTE 5G Band-Sperre"),
    "sensor.zte_ps_no_service_restart": ("ps_no_service_restart_flag", "ZTE Neustart ohne Datendienst"),
    "sensor.zte_watch_dog_reboot": ("watch_dog_reboot_enable", "ZTE Watchdog-Reboot (Router)"),
    "sensor.zte_net_link_detect": ("net_link_detect_enable", "ZTE Link-Detect (Router)"),
    "sensor.zte_mtu": ("mtu", "ZTE MTU"),
    "sensor.zte_tcp_mss": ("tcp_mss", "ZTE TCP MSS"),
    "sensor.zte_ant_switch": ("ant_switch_enable", "ZTE Antennen-Umschaltung"),
}

FIELDS = FIELDS + [f for f, _ in CONFIG_SENSORS.values() if f not in FIELDS]

WATCH = [
    "cell_id", "lte_pci", "nr5g_pci", "wan_active_band", "nr5g_action_band",
    "network_type", "wan_ipaddr", "ipv6_wan_ipaddr", "ppp_status",
    "wan_lte_ca", "therm_pa_level", "therm_tj_level", "therm_pa_frl_level",
    "modem_main_state", "simcard_roam",
]

HA_SENSORS = {
    "sensor.zte_download_bps": ("realtime_rx_thrpt", {"unit_of_measurement": "bit/s", "friendly_name": "ZTE Download"}),
    "sensor.zte_upload_bps": ("realtime_tx_thrpt", {"unit_of_measurement": "bit/s", "friendly_name": "ZTE Upload"}),
    "sensor.zte_lte_rsrp": ("lte_rsrp", {"unit_of_measurement": "dBm", "friendly_name": "ZTE LTE RSRP"}),
    "sensor.zte_lte_rsrq": ("lte_rsrq", {"unit_of_measurement": "dB", "friendly_name": "ZTE LTE RSRQ"}),
    "sensor.zte_lte_snr": ("lte_snr", {"unit_of_measurement": "dB", "friendly_name": "ZTE LTE SNR"}),
    "sensor.zte_lte_pci": ("lte_pci", {"friendly_name": "ZTE LTE PCI"}),
    "sensor.zte_cell_id": ("cell_id", {"friendly_name": "ZTE Cell ID"}),
    "sensor.zte_wan_active_band": ("wan_active_band", {"friendly_name": "ZTE Aktives Band"}),
    "sensor.zte_wan_lte_ca": ("wan_lte_ca", {"friendly_name": "ZTE Carrier Aggregation"}),
    "sensor.zte_5g_rsrp": ("Z5g_rsrp", {"unit_of_measurement": "dBm", "friendly_name": "ZTE 5G RSRP"}),
    "sensor.zte_5g_sinr": ("Z5g_SINR", {"unit_of_measurement": "dB", "friendly_name": "ZTE 5G SINR"}),
    "sensor.zte_nr5g_pci": ("nr5g_pci", {"friendly_name": "ZTE 5G PCI"}),
    "sensor.zte_nr5g_action_band": ("nr5g_action_band", {"friendly_name": "ZTE 5G Band"}),
    "sensor.zte_pm_sensor_mdm": ("pm_sensor_mdm", {"unit_of_measurement": "C", "friendly_name": "ZTE Modem Temp"}),
    "sensor.zte_pm_sensor_pa1": ("pm_sensor_pa1", {"friendly_name": "ZTE PA Sensor (Einheit unklar)"}),
    "sensor.zte_pm_modem_5g": ("pm_modem_5g", {"unit_of_measurement": "C", "friendly_name": "ZTE 5G Modem Temp"}),
    "sensor.zte_therm_pa_level": ("therm_pa_level", {"friendly_name": "ZTE Throttle PA"}),
    "sensor.zte_therm_tj_level": ("therm_tj_level", {"friendly_name": "ZTE Throttle TJ"}),
    "sensor.zte_therm_pa_frl_level": ("therm_pa_frl_level", {"friendly_name": "ZTE Throttle PA FRL"}),
    "sensor.zte_ppp_status": ("ppp_status", {"friendly_name": "ZTE PPP Status"}),
    "sensor.zte_modem_main_state": ("modem_main_state", {"friendly_name": "ZTE Modem Status"}),
}

_opener = None
_prev = {}
_prev_temp = {}
_prev_config = {}
_download_dead = False
_problem_since = None
_last_auto_reboot = 0.0
_started = False


@pyscript_executor
def _read_password():
    with open(CREDS_PATH, encoding="utf-8") as f:
        return f.read().strip()


@pyscript_executor
def _ensure_opener():
    global _opener
    if _opener is None:
        import http.cookiejar
        import urllib.request
        cj = http.cookiejar.CookieJar()
        _opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


@pyscript_executor
def _http_get(fields):
    import json
    import urllib.parse
    import urllib.request
    headers = {
        "Referer": f"{ZTE_BASE}/",
        "Host": ZTE_HOST,
        "User-Agent": "ha-pyscript-zte/1.0",
        "X-Requested-With": "XMLHttpRequest",
    }
    params = {"isTest": "false", "multi_data": "1", "cmd": ",".join(fields)}
    url = f"{ZTE_BASE}/goform/goform_get_cmd_process?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=headers)
    with _opener.open(req, timeout=8) as r:
        return json.loads(r.read().decode())


@pyscript_executor
def _http_post_login(final_hash):
    import json
    import urllib.parse
    import urllib.request
    headers = {
        "Referer": f"{ZTE_BASE}/",
        "Host": ZTE_HOST,
        "User-Agent": "ha-pyscript-zte/1.0",
        "X-Requested-With": "XMLHttpRequest",
    }
    body = urllib.parse.urlencode({
        "isTest": "false", "goformId": "LOGIN", "password": final_hash,
    }).encode()
    req = urllib.request.Request(
        f"{ZTE_BASE}/goform/goform_set_cmd_process", data=body,
        headers=headers, method="POST",
    )
    with _opener.open(req, timeout=8) as r:
        return json.loads(r.read().decode())


@pyscript_executor
def _http_post_reboot(ad_token):
    import json
    import urllib.parse
    import urllib.request
    headers = {
        "Referer": f"{ZTE_BASE}/",
        "Host": ZTE_HOST,
        "User-Agent": "ha-pyscript-zte/1.0",
        "X-Requested-With": "XMLHttpRequest",
    }
    body = urllib.parse.urlencode({
        "isTest": "false", "goformId": "REBOOT_DEVICE", "AD": ad_token,
    }).encode()
    req = urllib.request.Request(
        f"{ZTE_BASE}/goform/goform_set_cmd_process", data=body,
        headers=headers, method="POST",
    )
    with _opener.open(req, timeout=8) as r:
        return r.read().decode()


@pyscript_executor
def _tcp_reachable(host, port=443, timeout=5):
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


@pyscript_executor
def _sha256_upper(text):
    import hashlib
    return hashlib.sha256(text.encode()).hexdigest().upper()


@pyscript_executor
def _md5_hex(text):
    import hashlib
    return hashlib.md5(text.encode()).hexdigest()


def _to_number(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _login():
    _ensure_opener()
    pw = _read_password()
    ld = _http_get(["LD"]).get("LD", "")
    if not ld:
        return False
    inner = _sha256_upper(pw)
    final = _sha256_upper(inner + ld.upper())
    resp = _http_post_login(final)
    return str(resp.get("result")) in ("0", "success")


def _reboot_router():
    """Meldet sich an und startet den Router neu (AD-Token-Verfahren)."""
    _ensure_opener()
    if not _login():
        log.warning("zte_logger: Reboot abgebrochen - Login fehlgeschlagen")
        return False
    d = _http_get(["wa_inner_version", "cr_version", "RD"])
    inner = _md5_hex(d.get("wa_inner_version", "") + d.get("cr_version", ""))
    ad = _md5_hex(inner + d.get("RD", ""))
    resp = _http_post_reboot(ad)
    log.warning(f"zte_logger: Reboot ausgeloest, Antwort: {resp}")
    return True


@service
def zte_reboot_router():
    """Startet den ZTE-Router manuell neu (pyscript.zte_reboot_router)."""
    log.warning("zte_logger: manueller Reboot angefordert")
    if _reboot_router() and NOTIFY_TARGET:
        service.call("notify", NOTIFY_TARGET,
                      message="ZTE-Router wurde manuell neu gestartet.",
                      title="ZTE Router")


@service
def zte_read_fields(fields=None):
    """Liest beliebige goform-Felder (kommagetrennt) mit angemeldeter Sitzung,
    nur lesend. Ergebnis als Attribute von sensor.zte_debug_read und im Log
    (pyscript.zte_read_fields, fields: "mtu,tcp_mss")."""
    names = [f.strip() for f in str(fields or "").split(",") if f.strip()]
    if not names:
        log.warning("zte_logger: zte_read_fields ohne Felder aufgerufen")
        return
    _ensure_opener()
    if not _login():
        log.warning("zte_logger: zte_read_fields - Login fehlgeschlagen")
        return
    data = _http_get(names)
    log.warning(f"zte_logger: zte_read_fields {data}")
    attrs = {k: str(v) for k, v in data.items()}
    attrs["friendly_name"] = "ZTE Debug-Abfrage"
    state.set("sensor.zte_debug_read", len(names), attrs)


@time_trigger("period(now, 60 sec)")
def zte_logger_poll():
    global _download_dead, _problem_since, _last_auto_reboot, _started
    _ensure_opener()

    # Erster Durchlauf nach dem Start: erst anmelden. Ein eigener
    # startup-Trigger lief parallel zu diesem Poll und erzeugte bei jedem
    # HA-Start einmal "Re-Login fehlgeschlagen".
    if not _started:
        _started = True
        if _login():
            log.info("zte_logger: Login ok")
        else:
            log.warning("zte_logger: Login fehlgeschlagen - /config/zte_router.secret pruefen")

    try:
        data = _http_get(FIELDS)
    except Exception as e:
        log.warning(f"zte_logger: Router nicht erreichbar: {e}")
        return

    if data and not data.get("lte_rsrp") and not data.get("Z5g_rsrp"):
        if _login():
            log.info("zte_logger: Sitzung abgelaufen, neu angemeldet")
            try:
                data = _http_get(FIELDS)
            except Exception:
                pass
        else:
            log.warning("zte_logger: Re-Login fehlgeschlagen")

    for entity_id, (field, attrs) in HA_SENSORS.items():
        v = data.get(field)
        if v not in (None, ""):
            state.set(entity_id, v, attrs)

    # Konfigurationsfelder duerfen legitim leer sein (z.B. manueller DNS bei
    # dns_mode=auto), daher "leer" statt Ueberspringen - aber nur bei gueltiger
    # Sitzung, sonst liefert der Router fuer alles "" und es gaebe
    # Schein-Wechsel.
    if data.get("lte_rsrp") or data.get("Z5g_rsrp"):
        for entity_id, (field, name) in CONFIG_SENSORS.items():
            v = data.get(field)
            if v is None:
                continue
            v = v if v != "" else "leer"
            old = _prev_config.get(field)
            if old is not None and old != v:
                log.warning(f"zte_logger: KONFIG-WECHSEL {field}: {old} -> {v}")
            _prev_config[field] = v
            state.set(entity_id, v, {"friendly_name": name, "icon": "mdi:router-network"})

        # LTE-Bandmaske (z.B. 0x20880800c5) als lesbare Bandliste
        mask = data.get("lte_band_lock") or ""
        try:
            m = int(mask, 16)
            bands = ",".join([str(i + 1) for i in range(128) if (m >> i) & 1])
            state.set("sensor.zte_lte_band_lock_bands", bands or "leer",
                      {"friendly_name": "ZTE LTE Band-Sperre", "icon": "mdi:router-network"})
        except ValueError:
            pass

    mrx = _to_number(data.get("monthly_rx_bytes"))
    mtx = _to_number(data.get("monthly_tx_bytes"))
    if mrx is not None:
        state.set("sensor.zte_monthly_rx_gb", round(mrx / 1e9, 2),
                  {"unit_of_measurement": "GB", "device_class": "data_size",
                   "state_class": "total_increasing", "friendly_name": "ZTE Download (Monat)"})
    if mtx is not None:
        state.set("sensor.zte_monthly_tx_gb", round(mtx / 1e9, 2),
                  {"unit_of_measurement": "GB", "device_class": "data_size",
                   "state_class": "total_increasing", "friendly_name": "ZTE Upload (Monat)"})
    if mrx is not None and mtx is not None:
        state.set("sensor.zte_monthly_total_gb", round((mrx + mtx) / 1e9, 2),
                  {"unit_of_measurement": "GB", "device_class": "data_size",
                   "state_class": "total_increasing", "friendly_name": "ZTE Datenvolumen (Monat)"})

    tcp_ok = _tcp_reachable(CHECK_HOST, CHECK_PORT)
    state.set("binary_sensor.zte_reachable", "on" if tcp_ok else "off",
              {"device_class": "connectivity", "friendly_name": "ZTE TCP erreichbar"})

    rx = _to_number(data.get("realtime_rx_thrpt"))
    tx = _to_number(data.get("realtime_tx_thrpt"))
    is_dead = False
    if rx is not None and tx is not None:
        is_dead = tx >= 5000 and rx <= 500
        if is_dead and not _download_dead:
            log.warning(f"zte_logger: VERDACHT DOWNLOAD TOT rx={rx:.0f} tx={tx:.0f}")
        elif not is_dead and _download_dead:
            log.info(f"zte_logger: Download wieder da rx={rx:.0f} tx={tx:.0f}")
    _download_dead = is_dead
    state.set("binary_sensor.zte_download_dead", "on" if is_dead else "off",
              {"device_class": "problem", "friendly_name": "ZTE Download tot"})

    # Watchdog: reagiert auf die eigene, TCP-basierte Erreichbarkeit (kein
    # ICMP) - siehe Modul-Docstring, warum der Router-eigene Watchdog dafuer
    # nicht genutzt wird.
    now = time.time()
    if not tcp_ok:
        if _problem_since is None:
            _problem_since = now
        duration = now - _problem_since
        state.set("sensor.zte_watchdog_problem_seconds", round(duration),
                  {"unit_of_measurement": "s", "friendly_name": "ZTE Watchdog Problemdauer"})
        if (WATCHDOG_ENABLED
                and duration >= WATCHDOG_THRESHOLD_SEC
                and now - _last_auto_reboot >= WATCHDOG_COOLDOWN_SEC):
            log.warning(
                f"zte_logger: WATCHDOG - Verbindung seit {duration:.0f}s tot, "
                "loese automatischen Reboot aus"
            )
            if _reboot_router():
                _last_auto_reboot = now
                if NOTIFY_TARGET:
                    service.call("notify", NOTIFY_TARGET,
                                 message=f"Verbindung war {duration:.0f}s tot - Router wurde automatisch neu gestartet.",
                                 title="ZTE Router Watchdog")
            _problem_since = now
    else:
        _problem_since = None
        state.set("sensor.zte_watchdog_problem_seconds", 0,
                  {"unit_of_measurement": "s", "friendly_name": "ZTE Watchdog Problemdauer"})

    for k in WATCH:
        new = data.get(k)
        if new is None:
            continue
        old = _prev.get(k)
        if old is not None and old != new:
            log.info(f"zte_logger: WECHSEL {k}: {old} -> {new}")
    _prev.update({k: v for k, v in data.items() if k in WATCH})
