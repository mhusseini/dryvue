(function (dryv) {
    if (!dryv.v) {
        dryv.v = {};
    }
    dryv.v["person"] = {
        validators: {
            "anrede": [{
                annotations: {"required": true}, validate: function ($m, $ctx) {
                    return (!$m.anrede) ? {type: "error", text: "Bitte geben Sie die Anrede an.", group: null} : null
                }
            }], "vorname": [{
                annotations: {"required": true}, validate: function ($m, $ctx) {
                    return !/\S/.test($m.vorname || "") ? {
                        type: "error",
                        text: "Bitte geben Sie Ihren Vornamen an.",
                        group: null
                    } : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return /[^\u0020-\u00ff]/.test($m.vorname) ? {
                        type: "error",
                        text: "Bitte nutzen Sie nur die Zeichen aus dem westeuropäischen Zeichensatz.",
                        group: null
                    } : null
                }
            }, {
                async: true, validate: function ($m, $ctx) {
                    return $ctx.dryv.callServer('/_v/ctlqnr6j8', 'POST', {"vorname": $m.vorname}).then(function ($r) {
                        return $ctx.dryv.handleResult($ctx, $m, "vorname", null, $r);
                    }).then(function ($p30) {
                        return ($p30 || {}).errorMessage;
                    })
                }
            }], "nachname": [{
                annotations: {"required": true}, validate: function ($m, $ctx) {
                    return !/\S/.test($m.nachname || "") ? {
                        type: "error",
                        text: "Bitte geben Sie Ihren Nachnamen an.",
                        group: null
                    } : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return /[^\u0020-\u00ff]/.test($m.nachname) ? {
                        type: "error",
                        text: "Bitte nutzen Sie nur die Zeichen aus dem westeuropäischen Zeichensatz.",
                        group: null
                    } : null
                }
            }, {
                async: true, validate: function ($m, $ctx) {
                    return $ctx.dryv.callServer('/_v/czhjijo27', 'POST', {"nachname": $m.nachname}).then(function ($r) {
                        return $ctx.dryv.handleResult($ctx, $m, "nachname", null, $r);
                    }).then(function ($p32) {
                        return ($p32 || {}).errorMessage;
                    })
                }
            }], "geburtsdatum": [{
                validate: function ($m, $ctx) {
                    return ((!$m.geburtsdatum) || /^\s*\d\d\.\d\d\.\d\d\d\d\s*$/.test($m.geburtsdatum.toString())) ? null : {
                        type: "error",
                        text: "Bitte geben Sie Ihr Geburtsdatum im Format TT.MM.JJJJ an.",
                        group: null
                    }
                }
            }, {
                validate: function ($m, $ctx) {
                    return (($m.geburtsdatum) && ($ctx.dryv.valueOfDate($m.geburtsdatum, "de-DE", "DD.MM.YYYY HH:mm:ss") > $ctx.dryv.valueOfDate("31.10.2003 00:00:00", "de-DE", "DD.MM.YYYY HH:mm:ss"))) ? {
                        type: "error",
                        text: "Sie müssen volljährig sein.",
                        group: null
                    } : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return (($m.geburtsdatum) && ($ctx.dryv.valueOfDate($m.geburtsdatum, "de-DE", "DD.MM.YYYY HH:mm:ss") < $ctx.dryv.valueOfDate("31.10.1901 00:00:00", "de-DE", "DD.MM.YYYY HH:mm:ss"))) ? {
                        type: "error",
                        text: "Bitte prüfen Sie Ihr Geburtsdatum.",
                        group: null
                    } : null
                }
            }], "emailAdresse": [{
                annotations: {"required": true}, validate: function ($m, $ctx) {
                    return !/\S/.test($m.emailAdresse || "") ? {
                        type: "error",
                        text: "Bitte geben Sie Ihre E-Mail-Adresse an.",
                        group: null
                    } : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return /[^\u0020-\u00ff]/.test($m.emailAdresse) ? {
                        type: "error",
                        text: "Bitte nutzen Sie nur die Zeichen aus dem westeuropäischen Zeichensatz.",
                        group: null
                    } : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return ($m.emailAdresse.length < 6) ? {
                        type: "error",
                        text: "Bitte prüfen Sie die E-Mail-Adresse. Sie muss mindestens 6 Zeichen lang sein.",
                        group: null
                    } : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return ($m.emailAdresse.length > 100) ? {
                        type: "error",
                        text: "Bitte prüfen Sie die E-Mail-Adresse. Sie darf maximal 100 Zeichen lang sein.",
                        group: null
                    } : null
                }
            }, {
                async: true, validate: function ($m, $ctx) {
                    return /\S/.test($m.emailAdresse || "") ? $ctx.dryv.callServer('/_v/cynrfjria', 'POST', {"emailAdresse": $m.emailAdresse}).then(function ($r) {
                        return $ctx.dryv.handleResult($ctx, $m, "emailAdresse", null, $r);
                    }).then(function ($p35) {
                        return ($p35 || {}).errorMessage;
                    }) : null
                }
            }, {
                validate: function ($m, $ctx) {
                    return /\S/.test($m.emailAdresse || "") ? $ctx.dryv.callServer('/_v/cmrtdlmkp', 'POST', {"emailAdresse": $m.emailAdresse}).then(function ($r) {
                        return $ctx.dryv.handleResult($ctx, $m, "emailAdresse", null, $r);
                    }) : null
                }
            }], "telefonNummer": [{
                async: true, validate: function ($m, $ctx) {
                    return $ctx.dryv.callServer('/_v/chx3x6x6s', 'POST', {"telefonNummer": $m.telefonNummer}).then(function ($r) {
                        return $ctx.dryv.handleResult($ctx, $m, "telefonNummer", null, $r);
                    })
                }
            }]
        },
        disablers: {},
        parameters: {
            "maxgeburtstag": "31.10.2003 00:00:00",
            "mingeburtstag": "31.10.1901 00:00:00",
            "istAuftragMitSpedition": false,
            "istGewerbekunde": false
        }
    };
})(window.dryv || (window.dryv = {}));