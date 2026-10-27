"""DNS/Erreichbarkeits-Gegenprobe (Phase 3), laeuft direkt in Home Assistant.

Trennt unabhaengige Fragen, um Hypothese 3 (AdGuard/DNS) sauber von
"Leitung insgesamt tot" zu unterscheiden:
  1. Ist die Leitung ueberhaupt da? (TCP-Connect zu einer festen IP,
     kein DNS involviert)
  2. Antwortet jeder eigene DNS-Server (AdGuard Home, Pi-hole, ...) einzeln?
     Direkt per UDP angefragt, Liste in LOCAL_RESOLVERS.
  3. Antwortet der Router-DNS? Das ist der Weg, den alle Clients per DHCP
     bekommen; mit manuell gesetztem DNS (Browser-Dashboard) leitet der
     Router an die eigenen DNS-Server weiter.
  4. Loest ein DIREKT angefragter externer Resolver auf, am lokalen
     Resolver vorbei? (eigene minimale DNS-Anfrage per UDP, kein `dig`
     noetig - der Home-Assistant-Core-Container hat kein dig installiert)

Zusaetzlich bleibt binary_sensor.dns_local_ok (socket.gethostbyname im
HA-Container) erhalten - das geht aber ueber den Resolver von HA selbst,
nicht zwingend ueber Router/AdGuard, und ist deshalb nur noch Nebeninfo.

ICMP-Ping wird bewusst nicht verwendet: auf Anschluessen mit IPv6-only-APN
(464XLAT, z.B. Telekom) ist ICMP blockiert, siehe docs/FIELDS.md - ein
Ping-basierter Check wuerde dort immer "tot" melden.

Gleiche Regel wie bei zte_logger.py: @pyscript_executor-Funktionen duerfen
nur eingebautes/Standardbibliothek-Python aufrufen, keine andere
pyscript-Funktion (siehe docs/FIELDS.md fuer die Begruendung).
"""

import time

# ---- Konfiguration ---------------------------------------------------------
CHECK_IP = "1.1.1.1"
CHECK_HOSTNAME = "www.google.com"
EXTERNAL_RESOLVER = "1.1.1.1"
ROUTER_RESOLVER = "192.168.0.1"

# Eigene DNS-Server: entity-Suffix -> (IP, Anzeigename). Ergibt je Eintrag
# binary_sensor.dns_<suffix>_ok. Leeres Dict = nur Router/extern pruefen.
LOCAL_RESOLVERS = {
    "adguard_1": ("192.168.0.2", "AdGuard 1"),
}

# Push erst, wenn ein DNS-Problem (nicht "Verbindung tot" - das deckt der
# Watchdog in zte_logger.py ab) so lange am Stueck besteht.
NOTIFY_AFTER_SEC = 300
# notify-Service ohne "notify."-Praefix; leer lassen = keine Push-Nachrichten
NOTIFY_TARGET = ""
# -----------------------------------------------------------------------------

_dns_problem = False
_problem_status = None
_problem_since = None
_notified = False
_incident_pushed = False


@pyscript_executor
def _tcp_reachable(host, port=443, timeout=5):
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


@pyscript_executor
def _local_dns_ok(hostname, timeout=5):
    import socket
    socket.setdefaulttimeout(timeout)
    try:
        socket.gethostbyname(hostname)
        return True
    except OSError:
        return False
    finally:
        socket.setdefaulttimeout(None)


@pyscript_executor
def _dns_query_ok(hostname, resolver, timeout=3):
    import socket
    import struct
    qname = b""
    for part in hostname.split("."):
        qname += struct.pack("B", len(part)) + part.encode()
    qname += b"\x00"
    packet = struct.pack(">HHHHHH", 0x1234, 0x0100, 1, 0, 0, 0) + qname + struct.pack(">HH", 1, 1)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        sock.sendto(packet, (resolver, 53))
        response, _ = sock.recvfrom(512)
        ancount = struct.unpack(">H", response[6:8])[0]
        return ancount > 0
    except OSError:
        return False
    finally:
        sock.close()


@time_trigger("period(now, 60 sec)")
def dns_check_poll():
    global _dns_problem, _problem_status, _problem_since, _notified, _incident_pushed

    tcp_ok = _tcp_reachable(CHECK_IP)
    local_ok = _local_dns_ok(CHECK_HOSTNAME) if tcp_ok else False
    external_ok = _dns_query_ok(CHECK_HOSTNAME, EXTERNAL_RESOLVER) if tcp_ok else False
    router_ok = _dns_query_ok(CHECK_HOSTNAME, ROUTER_RESOLVER) if tcp_ok else False
    resolver_ok = {}
    for key, (ip, name) in LOCAL_RESOLVERS.items():
        resolver_ok[key] = _dns_query_ok(CHECK_HOSTNAME, ip) if tcp_ok else False

    state.set("binary_sensor.dns_tcp_reachable", "on" if tcp_ok else "off",
              {"device_class": "connectivity", "friendly_name": "Verbindung (TCP, ohne DNS)"})
    state.set("binary_sensor.dns_local_ok", "on" if local_ok else "off",
              {"device_class": "connectivity", "friendly_name": "DNS ueber HA-Resolver"})
    state.set("binary_sensor.dns_external_ok", "on" if external_ok else "off",
              {"device_class": "connectivity", "friendly_name": "DNS extern (1.1.1.1 direkt)"})
    state.set("binary_sensor.dns_router_ok", "on" if router_ok else "off",
              {"device_class": "connectivity", "friendly_name": "DNS ueber Router (wie Clients)"})
    for key, (ip, name) in LOCAL_RESOLVERS.items():
        state.set(f"binary_sensor.dns_{key}_ok", "on" if resolver_ok[key] else "off",
                  {"device_class": "connectivity", "friendly_name": f"DNS {name}"})

    dead = [LOCAL_RESOLVERS[k][1] for k, ok in resolver_ok.items() if not ok]
    if not tcp_ok:
        status = "Verbindung tot"
    elif dead and len(dead) == len(LOCAL_RESOLVERS):
        status = "Alle eigenen DNS-Server tot" if external_ok else "DNS insgesamt tot"
    elif not LOCAL_RESOLVERS and not router_ok and not external_ok:
        status = "DNS insgesamt tot"
    elif dead:
        status = ", ".join(dead) + " tot"
    elif not router_ok:
        status = "Router-DNS tot"
    else:
        status = "OK"

    state.set("sensor.dns_check_status", status,
              {"friendly_name": "DNS-Diagnose", "icon": "mdi:dns"})

    is_problem = status != "OK"
    if is_problem and status != _problem_status:
        log.warning(f"dns_check: {status}")
    elif not is_problem and _dns_problem:
        log.info("dns_check: wieder OK")
    _dns_problem = is_problem

    # Push nur fuer DNS-Probleme, und erst nach NOTIFY_AFTER_SEC am Stueck
    # mit unveraendertem Status.
    now = time.time()
    if is_problem and status != "Verbindung tot":
        if status != _problem_status:
            _problem_status = status
            _problem_since = now
            _notified = False
        elif not _notified and now - _problem_since >= NOTIFY_AFTER_SEC:
            if NOTIFY_TARGET:
                service.call("notify", NOTIFY_TARGET,
                             message=f"{status} (seit {round((now - _problem_since) / 60)} min).",
                             title="DNS-Diagnose")
            _notified = True
            _incident_pushed = True
    else:
        if _incident_pushed and NOTIFY_TARGET:
            msg = "DNS wieder OK." if not is_problem else f"DNS-Meldung abgeloest: {status}."
            service.call("notify", NOTIFY_TARGET, message=msg, title="DNS-Diagnose")
        _problem_status = status if is_problem else None
        _problem_since = None
        _notified = False
        _incident_pushed = False
