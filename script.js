(function() {
    if (window.zteProDashboardLoaded) {
        $("#zte-pro-dashboard").remove();
    }
    window.zteProDashboardLoaded = true;

    const translations = {
        de: {
            dashboardTitle: "ZTE MC801A-Dashboard",
            initializing: "Initialisiere und lade Daten...",
            errorLoading: "Fehler",
            errorText: "Daten konnten nicht geladen werden. Bist du im Router eingeloggt?",
            simpleOverview: "Einfache Übersicht",
            receptionStrength: "Empfangsstärke",
            signalQuality: "Signalqualität",
            networkType: "Netzwerk-Typ",
            performance: "Leistung",
            excellent: "Exzellent",
            good: "Gut",
            medium: "Mittel",
            weak: "Schwach",
            networkSA: "Modernstes, reines 5G-Netz (SA).",
            networkNSA: "Kombiniertes 4G/5G-Netz für hohe Geschwindigkeit (NSA).",
            networkLTE: "Stabile 4G/LTE Verbindung.",
            performanceOneFreq: "Router nutzt eine Frequenz.",
            performanceMultipleFreq: (n) => `Router bündelt <strong>${n} Frequenzen</strong> für mehr Leistung.`,
            networkDetails: "Netzwerk",
            provider: "Provider",
            connection: "Verbindung",
            wanIP: "WAN IP",
            apn: "APN",
            cell: "Cell",
            sector: "Sektor",
            dnsPrimary: "DNS Primär",
            dnsSecondary: "DNS Sekundär",
            signalDetails: "Signal",
            systemDetails: "System",
            temp4G5G: "Temp 4G/5G",
            firmware: "Firmware",
            configVer: "Config Ver.",
            actions: "Weitere Einstellungen",
            networkMode: "Network Mode",
            bandLock5G: "5G Band Lock",
            bandLock4G: "4G Band Lock",
            configuration: "Konfiguration",
            system: "System",
            changeDNS: "DNS Manuell",
            dnsAuto: "DNS Auto",
            reboot: "Router Neustart",
            rebootConfirm: "Router wirklich neustarten?",
            rebooting: "Router startet neu...",
            patienceWarning: " (Es kann bis zu 60s dauern, bis die Änderung aktiv ist).",
            dnsSuccess: "DNS Einstellungen erfolgreich gespeichert.",
            netModeSuccess: (m) => `Netzwerkmodus auf ${m} gesetzt.`,
            netModeError: "Fehler beim Setzen des Modus.",
            bandsSetSuccess: (type) => `${type} Bänder wurden gesetzt.`,
            save: "Speichern",
            cancel: "Abbrechen",
            success: "Erfolgreich",
            error: "Fehler",
            dnsEditorTitle: "DNS-Server anpassen",
            dnsEditorDesc: "Geben Sie die primäre und sekundäre DNS-Adresse ein. Für Auto-DNS des Providers leer lassen oder 'AUTO' schreiben.",
            lteEditorTitle: "LTE Bänder anpassen",
            lteEditorDesc: "Geben Sie die gewünschten Bänder mit + getrennt ein (z.B. 1+3+20) oder 'AUTO' für alle.",
            nrEditorTitle: "5G Bänder anpassen",
            nrEditorDesc: "Geben Sie die gewünschten Bänder mit + getrennt ein (z.B. 28+78) oder 'AUTO' für alle.",
            reset: "Reset / Auto",
            manual: "Manuell"
        },
        en: {
            dashboardTitle: "ZTE MC801A Dashboard",
            initializing: "Initializing and loading data...",
            errorLoading: "Error",
            errorText: "Could not load data. Are you logged into the router?",
            simpleOverview: "Simple Overview",
            receptionStrength: "Reception Strength",
            signalQuality: "Signal Quality",
            networkType: "Network Type",
            performance: "Performance",
            excellent: "Excellent",
            good: "Good",
            medium: "Medium",
            weak: "Weak",
            networkSA: "State-of-the-art, pure 5G network (SA).",
            networkNSA: "Combined 4G/5G network for high speed (NSA).",
            networkLTE: "Stable 4G/LTE connection.",
            performanceOneFreq: "Router is using one frequency.",
            performanceMultipleFreq: (n) => `Router is bundling <strong>${n} frequencies</strong> for more performance.`,
            networkDetails: "Network",
            provider: "Provider",
            connection: "Connection",
            wanIP: "WAN IP",
            apn: "APN",
            cell: "Cell",
            sector: "Sector",
            dnsPrimary: "DNS Primary",
            dnsSecondary: "DNS Secondary",
            signalDetails: "Signal",
            systemDetails: "System",
            temp4G5G: "Temp 4G/5G",
            firmware: "Firmware",
            configVer: "Config Ver.",
            actions: "More Settings",
            networkMode: "Network Mode",
            bandLock5G: "5G Band Lock",
            bandLock4G: "4G Band Lock",
            configuration: "Configuration",
            system: "System",
            changeDNS: "DNS Manual",
            dnsAuto: "DNS Auto",
            reboot: "Reboot Router",
            rebootConfirm: "Really reboot the router?",
            rebooting: "Router is rebooting...",
            patienceWarning: " (It may take up to 60s for the change to become active).",
            dnsSuccess: "DNS settings saved successfully.",
            netModeSuccess: (m) => `Network mode set to ${m}.`,
            netModeError: "Error setting network mode.",
            bandsSetSuccess: (type) => `${type} bands have been set.`,
            save: "Save",
            cancel: "Cancel",
            success: "Success",
            error: "Error",
            dnsEditorTitle: "Customize DNS Servers",
            dnsEditorDesc: "Enter the primary and secondary DNS addresses. Leave empty or write 'AUTO' for provider's auto DNS.",
            lteEditorTitle: "Customize LTE Bands",
            lteEditorDesc: "Enter the desired bands separated by + (e.g., 1+3+20) or 'AUTO' for all.",
            nrEditorTitle: "Customize 5G Bands",
            nrEditorDesc: "Enter the desired bands separated by + (e.g., 28+78) or 'AUTO' for all.",
            reset: "Reset / Auto",
            manual: "Manual"
        }
    };

    let currentLang = localStorage.getItem('zteDashboardLanguage') || 'de';

    $('body').append(`
        <div id="zte-modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000;"></div>
        <div id="zte-editor-modal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:400px; background:#3c4a60; color:#e2e8f0; border:1px solid #4a5568; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.4); z-index:10001; padding:20px;">
            <h3 id="zte-editor-title" style="margin-top:0; color:#63b3ed; text-align:center;"></h3>
            <p id="zte-editor-desc" style="font-size:13px; color:#a0aec0; text-align:center;"></p>
            <div id="zte-editor-content"></div>
            <div style="display:flex; justify-content:space-between; margin-top:20px;">
                <button id="zte-editor-cancel" style="background:#718096; border:1px solid #a0aec0; color:#e2e8f0; border-radius:5px; padding:8px 15px; cursor:pointer;"></button>
                <button id="zte-editor-save" style="background:#63b3ed; border:1px solid #90cdf4; color:#1a202c; font-weight:bold; border-radius:5px; padding:8px 15px; cursor:pointer;"></button>
            </div>
        </div>
        <div id="zte-status-toast" class="zte-toast"></div>
    `);

    var dashboard = $(
        `<div id="zte-pro-dashboard" style="position: fixed; top: 10px; right: 10px; width: 380px; max-height: 98vh; overflow-y: auto; background: #2d3748; border: 1px solid #4a5568; color: #e2e8f0; padding: 15px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size: 13px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
         <div id="zte-dynamic-content"></div>
        </div>`
    );
    $("body").append(dashboard);

    var siginfo = "wan_active_band,wan_active_channel,wan_lte_ca,wan_apn,wan_ipaddr,cell_id,nr5g_cell_id,dns_mode,prefer_dns_manual,standby_dns_manual,network_type,network_provider_fullname,rmcc,rmnc,lte_rsrq,lte_rssi,lte_rsrp,lte_snr,lte_ca_pcell_band,lte_ca_pcell_bandwidth,lte_multi_ca_scell_info,Z5g_SINR,Z5g_rsrp,nr5g_pci,nr5g_action_channel,nr5g_action_band,pm_sensor_mdm,pm_modem_5g,wa_inner_version,cr_version,RD,BearerPreference,lte_band_mask,nr5g_band_mask";

    function getRating(value, thresholds, labels) {
        value = parseFloat(value);
        for (let i = 0; i < thresholds.length; i++) {
            if (value >= thresholds[i]) return { text: labels[i], color: ['#48bb78', '#a0aec0', '#f6ad55', '#f56565'][i] };
        }
        return { text: labels[3], color: '#f56565' };
    }
    function getRsrpRating() { return getRating(arguments[0], [-85, -95, -105], ['excellent', 'good', 'medium', 'weak']); }
    function getSinrRating() { return getRating(arguments[0], [20, 13, 5], ['excellent', 'good', 'medium', 'weak']); }

    function getStatus() {
        currentLang = localStorage.getItem('zteDashboardLanguage') || 'de';
        const T = translations[currentLang];

        $.ajax({
            type: "GET", url: "/goform/goform_get_cmd_process", data: { cmd: siginfo, multi_data: "1" }, dataType: "json",
            success: function(d) {
                let cellInfo = {};
                if (d.network_type === "SA" && d.nr5g_cell_id) { const id = parseInt(d.nr5g_cell_id, 16); cellInfo = { type: 'gNodeB', id: Math.trunc(id / 4096), sector: (id % 4096) / 16 }; } 
                else if (d.cell_id) { const id = parseInt(d.cell_id, 16); cellInfo = { type: 'eNodeB', id: Math.trunc(id / 256), sector: id % 256 }; }

                let ca_cells = [];
                if (d.lte_multi_ca_scell_info) { d.lte_multi_ca_scell_info.slice(0, -1).split(';').forEach(c => { let p = c.split(','); if (p.length >= 5) ca_cells.push({ pci: p[1], band: p[3], bw: p[5] }); }); }

                let active_rsrp = d.Z5g_rsrp || d.lte_rsrp, active_sinr = d.Z5g_SINR || d.lte_snr;
                let rsrpRating = getRsrpRating(active_rsrp), sinrRating = getSinrRating(active_sinr);
                let netzwerkText = T.networkLTE;
                if (d.network_type === "SA") netzwerkText = T.networkSA;
                if (d.network_type === "ENDC") netzwerkText = T.networkNSA;
                let performanceText = T.performanceOneFreq;
                let freqCount = 1 + ca_cells.length + (d.network_type === "ENDC" && d.nr5g_action_band ? 1 : 0);
                if (freqCount > 1) performanceText = T.performanceMultipleFreq(freqCount);
                
                let content = `
                    <style>
                        #zte-pro-dashboard h2 { margin: 0 0 15px 0; padding-right: 60px; text-align: center; font-size: 18px; color: #63b3ed; }
                        #zte-pro-dashboard .lang-switcher { position: absolute; top: 18px; right: 15px; font-size: 12px; }
                        #zte-pro-dashboard .lang-switcher a { color: #a0aec0; text-decoration: none; padding: 2px 4px; }
                        #zte-pro-dashboard .lang-switcher a.active { color: #fff; font-weight: bold; background: #63b3ed; border-radius: 3px; }
                        #zte-pro-dashboard .zte-section { margin-bottom: 12px; border: 1px solid #4a5568; border-radius: 8px; overflow: hidden; }
                        #zte-pro-dashboard .zte-section-title { font-weight: bold; font-size: 14px; padding: 8px 12px; background: #4a5568; cursor: pointer; user-select: none; }
                        #zte-pro-dashboard .zte-section-title:hover { background: #718096; }
                        #zte-pro-dashboard .zte-section-content { padding: 12px; }
                        #zte-pro-dashboard .zte-button-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
                        #zte-pro-dashboard button { background: #4a5568; border: 1px solid #718096; color: #e2e8f0; border-radius: 5px; padding: 5px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
                        #zte-pro-dashboard button:hover { background: #718096; }
                        #zte-pro-dashboard button.active { background: #63b3ed; color: #1a202c; font-weight: bold; border-color: #63b3ed; }
                        #zte-pro-dashboard .info-table { width: 100%; border-collapse: collapse; }
                        #zte-pro-dashboard .info-table td { padding: 5px 0; border-bottom: 1px solid #4a5568; vertical-align: top; }
                        #zte-pro-dashboard .info-table td:first-child { font-weight: 500; color: #a0aec0; width: 120px; }
                        #zte-pro-dashboard .signal-block { margin-top: 10px; border: 1px solid #4a5568; border-radius: 5px; padding: 8px; }
                        #zte-editor-modal input { width: 100%; background: #2d3748; border: 1px solid #718096; color: #e2e8f0; padding: 8px; border-radius: 5px; box-sizing: border-box; margin-top: 5px; }
                        .zte-toast { visibility: hidden; min-width: 250px; background-color: #333; color: #fff; text-align: center; border-radius: 8px; padding: 16px; position: fixed; z-index: 10002; right: 30px; top: 30px; font-size: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
                        .zte-toast.show { visibility: visible; -webkit-animation: fadein 0.5s, fadeout 0.5s 4.5s; animation: fadein 0.5s, fadeout 0.5s 4.5s; }
                        @-webkit-keyframes fadein { from {top: 0; opacity: 0;} to {top: 30px; opacity: 1;} } @keyframes fadein { from {top: 0; opacity: 0;} to {top: 30px; opacity: 1;} }
                        @-webkit-keyframes fadeout { from {top: 30px; opacity: 1;} to {top: 0; opacity: 0;} } @keyframes fadeout { from {top: 30px; opacity: 1;} to {top: 0; opacity: 0;} }
                    </style>
                    <h2>${T.dashboardTitle}</h2>
                    <div class="lang-switcher">
                        <a href="#" onclick="window.zte_toggleLanguage('de'); return false;" class="${currentLang === 'de' ? 'active' : ''}">DE</a>
                        <a href="#" onclick="window.zte_toggleLanguage('en'); return false;" class="${currentLang === 'en' ? 'active' : ''}">EN</a>
                    </div>
                    <div class="zte-section"><div class="zte-section-title" onclick="$(this).next().slideToggle();">${T.simpleOverview}</div><div class="zte-section-content" style="display: block;"><table class="info-table"><tr><td>${T.receptionStrength}:</td><td style="font-weight:bold; color:${rsrpRating.color};">${T[rsrpRating.text]}</td></tr><tr><td>${T.signalQuality}:</td><td style="font-weight:bold; color:${sinrRating.color};">${T[sinrRating.text]}</td></tr><tr><td>${T.networkType}:</td><td>${netzwerkText}</td></tr><tr><td>${T.performance}:</td><td>${performanceText}</td></tr></table></div></div>
                    <div class="zte-section"><div class="zte-section-title" onclick="$(this).next().slideToggle();">${T.networkDetails}</div><div class="zte-section-content" style="display: block;"><table class="info-table"><tr><td>${T.provider}:</td><td>${d.network_provider_fullname || '-'}</td></tr><tr><td>${T.connection}:</td><td>${d.network_type || '-'}</td></tr><tr><td>${T.wanIP}:</td><td>${d.wan_ipaddr || '-'}</td></tr><tr><td>${T.apn}:</td><td>${d.wan_apn || '-'}</td></tr><tr><td>${cellInfo.type || T.cell}:</td><td>${cellInfo.id || '-'} | ${T.sector}: ${cellInfo.sector || '-'}</td></tr><tr><td>${T.dnsPrimary}:</td><td>${d.prefer_dns_manual || 'Auto'}</td></tr><tr><td>${T.dnsSecondary}:</td><td>${d.standby_dns_manual || 'Auto'}</td></tr></table></div></div>
                    <div class="zte-section"><div class="zte-section-title" onclick="$(this).next().slideToggle();">${T.signalDetails}</div><div class="zte-section-content" style="display: block;"><div class="signal-block"><b>LTE Primary (${d.lte_ca_pcell_band || 'B?'}, ${d.lte_ca_pcell_bandwidth || '?MHz'})</b><table class="info-table"><tr><td>RSRP/RSRQ:</td><td>${d.lte_rsrp || 'N/A'} dBm / ${d.lte_rsrq || 'N/A'} dB</td></tr><tr><td>SINR/RSSI:</td><td>${d.lte_snr || 'N/A'} dB / ${d.lte_rssi || 'N/A'} dBm</td></tr></table></div>${ca_cells.map(c => `<div class="signal-block"><b>LTE CA (${'B'+c.band}, ${c.bw}Mhz)</b><table class="info-table"><tr><td>PCI:</td><td>${c.pci}</td></tr></table></div>`).join('')}<div class="signal-block"><b>5G (${d.nr5g_action_band || 'N?'})</b><table class="info-table"><tr><td>RSRP/SINR:</td><td>${d.Z5g_rsrp || 'N/A'} dBm / ${d.Z5g_SINR || 'N/A'} dB</td></tr><tr><td>PCI/ARFCN:</td><td>${d.nr5g_pci || 'N/A'} / ${d.nr5g_action_channel || 'N/A'}</td></tr></table></div></div></div>
                    <div class="zte-section"><div class="zte-section-title" onclick="$(this).next().slideToggle();">${T.systemDetails}</div><div class="zte-section-content" style="display: block;"><table class="info-table"><tr><td>${T.temp4G5G}:</td><td>${d.pm_sensor_mdm || 'N/A'}°C / ${d.pm_modem_5g || 'N/A'}°C</td></tr><tr><td>${T.firmware}:</td><td>${d.wa_inner_version || '-'}</td></tr><tr><td>${T.configVer}:</td><td>${d.cr_version || '-'}</td></tr></table><div class="zte-button-row" style="margin-top:10px;"><button onclick="window.zte_show_reboot_confirm()">&#10227; ${T.reboot}</button></div></div></div>
                    <div class="zte-section"><div class="zte-section-title" onclick="$(this).next().slideToggle();">${T.actions}</div><div class="zte-section-content" style="display: block;"><b>${T.networkMode}</b><div class="zte-button-row"><button id="btn-mode-auto" onclick="window.zte_set_net_mode('WL_AND_5G')">4G/5G Auto</button><button id="btn-mode-nsa" onclick="window.zte_set_net_mode('LTE_AND_5G')">5G NSA</button><button id="btn-mode-4g" onclick="window.zte_set_net_mode('Only_LTE')">4G</button></div><b style="display:block; margin-top:10px;">${T.bandLock5G}</b><div class="zte-button-row"><button id="btn-5g-auto" onclick="window.zte_nrbandselection('AUTO')">${T.reset}</button><button id="btn-5g-n78" onclick="window.zte_nrbandselection('78')">N78</button><button id="btn-5g-n28" onclick="window.zte_nrbandselection('28')">N28</button><button id="btn-5g-n28-78" onclick="window.zte_nrbandselection('28+78')">N28+78</button><button onclick="window.zte_show_band_editor('5G')">${T.manual}</button></div><b style="display:block; margin-top:10px;">${T.bandLock4G}</b><div class="zte-button-row"><button id="btn-4g-auto" onclick="window.zte_ltebandselection('AUTO')">${T.reset}</button><button id="btn-4g-1-3-7-20" onclick="window.zte_ltebandselection('1+3+7+20')">1+3+7+20</button><button onclick="window.zte_show_band_editor('4G')">${T.manual}</button></div><b style="display:block; margin-top:10px;">${T.configuration}</b><div class="zte-button-row"><button id="btn-dns-change" onclick="window.zte_show_dns_editor('${d.prefer_dns_manual}','${d.standby_dns_manual}')">${T.changeDNS}</button><button id="btn-dns-auto" onclick="window.zte_reset_dns()">${T.dnsAuto}</button></div></div></div>
                `;
                $('#zte-dynamic-content').html(content);
                
                // --- DYNAMIC HIGHLIGHTING ---
                if (d.BearerPreference === "" || d.BearerPreference === 'WL_AND_5G') {
                    $('#btn-mode-auto').addClass('active');
                } else if (d.BearerPreference === 'LTE_AND_5G') {
                    $('#btn-mode-nsa').addClass('active');
                } else if (d.BearerPreference === 'Only_LTE') {
                    $('#btn-mode-4g').addClass('active');
                }

                if (d.dns_mode === 'manual') {
                    $('#btn-dns-change').addClass('active');
                } else {
                    $('#btn-dns-auto').addClass('active');
                }

            },
            error: function() { $('#zte-dynamic-content').html(`<h2>${T.errorLoading}</h2><p>${T.errorText}</p>`); }
        });
    }

    /* --- MODAL AND STATUS FUNCTIONS --- */
    window.zte_show_status_message = function(message, isError) {
        const msgDiv = $('#zte-status-toast');
        msgDiv.text(message);
        msgDiv.css('background-color', isError ? '#f56565' : '#48bb78');
        msgDiv.addClass('show');
        setTimeout(() => { msgDiv.removeClass('show'); }, 5000);
    };

    window.zte_show_editor = function(title, description, contentHtml, onSave) {
        currentLang = localStorage.getItem('zteDashboardLanguage') || 'de';
        const T = translations[currentLang];
        $('#zte-editor-title').text(title);
        $('#zte-editor-desc').text(description);
        $('#zte-editor-content').html(contentHtml);
        $('#zte-editor-save').text(T.save);
        $('#zte-editor-cancel').text(T.cancel);
        
        $('#zte-modal-overlay, #zte-editor-modal').fadeIn(200);
        
        $('#zte-editor-save').off('click').on('click', function() {
            onSave();
            $('#zte-modal-overlay, #zte-editor-modal').fadeOut(200);
        });
    };
    $('#zte-editor-cancel, #zte-modal-overlay').on('click', function() {
        $('#zte-modal-overlay, #zte-editor-modal').fadeOut(200);
    });

    /* --- EDITOR LAUNCHERS --- */
    window.zte_show_dns_editor = function(currentDns1, currentDns2) {
        const T = translations[localStorage.getItem('zteDashboardLanguage') || 'de'];
        const content = `
            <label>${T.dnsPrimary}</label><input type="text" id="dns-input-1" value="${currentDns1 || ''}" placeholder="192.168.0.127">
            <label style="margin-top:10px; display:block;">${T.dnsSecondary}</label><input type="text" id="dns-input-2" value="${currentDns2 || ''}" placeholder="1.1.1.1">
        `;
        zte_show_editor(T.dnsEditorTitle, T.dnsEditorDesc, content, zte_perform_dns_change);
    };
    
    window.zte_show_band_editor = function(type) {
        const T = translations[localStorage.getItem('zteDashboardLanguage') || 'de'];
        const is4G = type === '4G';
        const title = is4G ? T.lteEditorTitle : T.nrEditorTitle;
        const desc = is4G ? T.lteEditorDesc : T.nrEditorDesc;
        const content = `<input type="text" id="band-input" value="" placeholder="${is4G ? '1+3+20' : '28+78'}">`;

        zte_show_editor(title, desc, content, function() {
            const bands = $('#band-input').val();
            if (is4G) { zte_ltebandselection(bands); }
            else { zte_nrbandselection(bands); }
        });
    };
    
    window.zte_show_reboot_confirm = function() {
        const T = translations[localStorage.getItem('zteDashboardLanguage') || 'de'];
        zte_show_editor(T.reboot, T.rebootConfirm, '', zte_reboot);
    };

    /* --- ACTION FUNCTIONS (PERFORMERS) --- */
    window.zte_reboot = function() {
        var T = translations[localStorage.getItem('zteDashboardLanguage') || 'de'];
        $.ajax({type: "GET", url: "/goform/goform_get_cmd_process", data: {cmd: "wa_inner_version,cr_version,RD", multi_data: "1"}, dataType: "json", success: function(a) {
            var ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD);
            $.ajax({type: "POST", url: "/goform/goform_set_cmd_process", data: {isTest: "false", goformId: "REBOOT_DEVICE", AD: ad},
            success: function(){ zte_show_status_message(T.rebooting + T.patienceWarning, false); } });
        }});
    };

    window.zte_reset_dns = function() {
        zte_perform_dns_change('auto', '', '');
    }
    
    window.zte_perform_dns_change = function(mode, primary, secondary) {
        var T = translations[localStorage.getItem('zteDashboardLanguage') || 'de'];
        var dns_mode = mode || 'manual';
        var primary_dns = primary !== undefined ? primary : $('#dns-input-1').val().trim();
        var secondary_dns = secondary !== undefined ? secondary : $('#dns-input-2').val().trim();
        if (primary_dns.toLowerCase() === 'auto' || primary_dns === '') dns_mode = 'auto';
        
        $.ajax({ type: "GET", url: "/goform/goform_get_cmd_process", data: { cmd: "wa_inner_version,cr_version,RD,wan_apn", multi_data: "1" }, dataType: "json",
            success: function(a) {
                var ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD);
                $.ajax({ type: "POST", url: "/goform/goform_set_cmd_process", data: { isTest: "false", goformId: "APN_PROC_EX", wan_apn: a.wan_apn, profile_name: "miononno", apn_action: "save", apn_mode: "manual", pdp_type: "IP", dns_mode: dns_mode, prefer_dns_manual: primary_dns, standby_dns_manual: secondary_dns, index: 1, AD: ad },
                    success: function() {
                        $.ajax({ type: "GET", url: "/goform/goform_get_cmd_process", data: { cmd: "wa_inner_version,cr_version,RD", multi_data: "1" }, dataType: "json",
                             success: function(b) {
                                 var ad2 = hex_md5(hex_md5(b.wa_inner_version + b.cr_version) + b.RD);
                                 $.ajax({ type: "POST", url: "/goform/goform_set_cmd_process", data: { isTest: "false", goformId: "APN_PROC_EX", apn_mode: "manual", apn_action: "set_default", set_default_flag: 1, pdp_type: "IP", pdp_type_roaming: "IP", index: 1, AD: ad2 },
                                     success: function() { zte_show_status_message(T.dnsSuccess + T.patienceWarning, false); getStatus(); },
                                     error: function() { zte_show_status_message(T.error, true); }
                                 });
                             }
                        });
                    }, error: function() { zte_show_status_message(T.error, true); }
                });
            }
        });
    };

    window.zte_set_net_mode = function(mode) { var T = translations[localStorage.getItem('zteDashboardLanguage') || 'de']; $.ajax({type: "GET", url: "/goform/goform_get_cmd_process", data: {cmd: "wa_inner_version,cr_version,RD", multi_data: "1"}, dataType: "json", success: function(a) { var ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD); $.ajax({type: "POST", url: "/goform/goform_set_cmd_process", data: {isTest: "false", goformId: "SET_BEARER_PREFERENCE", BearerPreference: mode, AD: ad}, success: function(r){ if(JSON.parse(r).result === "success") {zte_show_status_message(T.netModeSuccess(mode) + T.patienceWarning, false); getStatus();} else {zte_show_status_message(T.netModeError, true);} }}); }}); };
    window.zte_ltebandselection = function(bands) { var T = translations[localStorage.getItem('zteDashboardLanguage') || 'de']; if(bands === null || bands.trim() === "") return; var band_mask = 0; if (bands.toUpperCase() === 'AUTO') { band_mask = "0xA3E2AB0908DF"; } else { bands.split('+').forEach(function(b) { band_mask += Math.pow(2, parseInt(b) - 1); }); band_mask = "0x" + band_mask.toString(16); } $.ajax({type: "GET", url: "/goform/goform_get_cmd_process", data: {cmd: "wa_inner_version,cr_version,RD", multi_data: "1"}, dataType: "json", success: function(a) { var ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD); $.ajax({type: "POST", url: "/goform/goform_set_cmd_process", data: {isTest: "false", goformId: "BAND_SELECT", is_lte_band: 1, lte_band_mask: band_mask, AD: ad}, success: function(){zte_show_status_message(T.bandsSetSuccess('LTE') + T.patienceWarning, false); getStatus();}}); }}); };
    window.zte_nrbandselection = function(bands) { var T = translations[localStorage.getItem('zteDashboardLanguage') || 'de']; if(bands === null || bands.trim() === "") return; var band_mask = ""; if (bands.toUpperCase() === 'AUTO') { band_mask = "1,2,3,5,7,8,20,28,38,41,50,51,66,70,71,74,75,76,77,78,79,80,81,82,83,84"; } else { band_mask = bands.split('+').join(","); } $.ajax({type: "GET", url: "/goform/goform_get_cmd_process", data: {cmd: "wa_inner_version,cr_version,RD", multi_data: "1"}, dataType: "json", success: function(a) { var ad = hex_md5(hex_md5(a.wa_inner_version + a.cr_version) + a.RD); $.ajax({type: "POST", url: "/goform/goform_set_cmd_process", data: {isTest: "false", goformId: "WAN_PERFORM_NR5G_BAND_LOCK", nr5g_band_mask: band_mask, AD: ad}, success: function(){zte_show_status_message(T.bandsSetSuccess('5G') + T.patienceWarning, false); getStatus();}}); }}); };
    
    window.zte_toggleLanguage = function(lang) {
        localStorage.setItem('zteDashboardLanguage', lang);
        getStatus();
    };

    function check_log_in(logged_in_callback, not_logged_in_callback) { $.ajax({type: "GET", url: "/goform/goform_get_cmd_process", data: {multi_data: "1", cmd: "loginfo"}, dataType: "json", success: function(a) { if (a.loginfo && a.loginfo.toLowerCase() === "ok") { if (logged_in_callback) logged_in_callback(); } else { if (not_logged_in_callback) not_logged_in_callback(); } }, error: not_logged_in_callback}); }

    check_log_in( function() {
        if(typeof hex_md5 !== 'function'){
            var script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js";
            script.onload = function() { getStatus(); setInterval(getStatus, 5000); };
            document.head.appendChild(script);
        } else { getStatus(); setInterval(getStatus, 5000); }
    }, function() { var T = translations[currentLang]; dashboard.html(`<h2>${T.errorLoading}</h2><p>${T.errorText}</p>`); });
})();
