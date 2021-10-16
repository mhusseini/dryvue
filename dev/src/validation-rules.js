(function(dryv) {
  if (!dryv.v) {
    dryv.v = {};
  }
  dryv.v["form1"] = {
    validators: {
      firstName: [
        {
          annotations: { required: true },
          validate: function($m, $ctx) {
            return !/\S/.test($m.firstName || "")
              ? {
                  type: "error",
                  text: "Bitte geben Sie Ihren Vornamen an.",
                  group: null,
                }
              : null;
          },
        },
        {
          validate: function($m, $ctx) {
            return /[^\u0020-\u00ff]/.test($m.firstName)
              ? {
                  type: "error",
                  text:
                    "Bitte nutzen Sie nur die Zeichen aus dem westeuropäischen Zeichensatz.",
                  group: null,
                }
              : null;
          },
        },
      ],
      lastName: [
        {
          annotations: { required: true },
          validate: function($m, $ctx) {
            return !/\S/.test($m.lastName || "")
              ? {
                  type: "error",
                  text: "Bitte geben Sie Ihren Nachnamen an.",
                  group: null,
                }
              : null;
          },
        },
        {
          validate: function($m, $ctx) {
            return /[^\u0020-\u00ff]/.test($m.lastName)
              ? {
                  type: "error",
                  text:
                    "Bitte nutzen Sie nur die Zeichen aus dem westeuropäischen Zeichensatz.",
                  group: null,
                }
              : null;
          },
        },
      ],
      dateOfBirth: [
        {
          validate: function($m, $ctx) {
            return !$m.dateOfBirth ||
              /^\s*\d\d\.\d\d\.\d\d\d\d\s*$/.test($m.dateOfBirth.toString())
              ? null
              : {
                  type: "error",
                  text:
                    "Bitte geben Sie Ihr Geburtsdatum im Format TT.MM.JJJJ an.",
                  group: null,
                };
          },
        },
        {
          validate: function($m, $ctx) {
            return $m.dateOfBirth &&
              $ctx.dryv.valueOfDate(
                $m.dateOfBirth,
                "de-DE",
                "DD.MM.YYYY HH:mm:ss"
              ) >
                $ctx.dryv.valueOfDate(
                  "15.10.2003 00:00:00",
                  "de-DE",
                  "DD.MM.YYYY HH:mm:ss"
                )
              ? {
                  type: "error",
                  text:
                    "Sie sind noch nicht volljährig? Dann können Sie hier im Internet leider keinen Vertrag mit Yello abschließen. Bitte rufen Sie uns zum Ortstarif an unter 0221 – 27 11 7777 - wir helfen Ihnen dann gerne weiter.",
                  group: null,
                }
              : null;
          },
        },
        {
          validate: function($m, $ctx) {
            return $m.dateOfBirth &&
              $ctx.dryv.valueOfDate(
                $m.dateOfBirth,
                "de-DE",
                "DD.MM.YYYY HH:mm:ss"
              ) <
                $ctx.dryv.valueOfDate(
                  "15.10.1901 00:00:00",
                  "de-DE",
                  "DD.MM.YYYY HH:mm:ss"
                )
              ? {
                  type: "error",
                  text: "Bitte prüfen Sie Ihr Geburtsdatum.",
                  group: null,
                }
              : null;
          },
        },
      ],
    },
    disablers: {},
    parameters: {
      maxDateOfBirth: "15.10.2003 00:00:00",
      minDateOfBirth: "15.10.1901 00:00:00"
    },
  };
})(window.dryv || (window.dryv = {}));
