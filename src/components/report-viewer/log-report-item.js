/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export default class LogReportItem {
    static SEVERITY = {
        UNKNOWN: { name: 'UNKNOWN', level: 0, color: 'blue' },
        INFO: { name: 'INFO', level: 1, color: 'green' },
        WARN: { name: 'WARN', level: 2, color: 'orange' },
        ERROR: { name: 'ERROR', level: 3, color: 'red' },
        FATAL: { name: 'FATAL', level: 4, color: 'purple' },
    };

    static resolveTemplateMessage(templateMessage, templateValues) {
        const templateVars = {};
        for (const [key, value] of Object.entries(templateValues)) {
            templateVars[key] = value.value;
        }
        return templateMessage.replace(/\${([^{}]*)}/g, function (a, b) {
            let r = templateVars[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        });
    }

    constructor(jsonReport) {
        this.key = jsonReport.reportKey;
        this.log = LogReportItem.resolveTemplateMessage(
            jsonReport.defaultMessage,
            jsonReport.values
        );
        this.severity = this.initSeverity(jsonReport.values.reportSeverity);
    }

    getLog() {
        return this.log;
    }

    getSeverity() {
        return this.severity;
    }

    getSeverityName() {
        return this.severity.name;
    }

    getColorName() {
        return this.severity.color;
    }

    initSeverity(jsonSeverity) {
        let severity = LogReportItem.SEVERITY.UNKNOWN;
        if (!jsonSeverity) return severity;

        Object.values(LogReportItem.SEVERITY).some((value) => {
            let severityFound = jsonSeverity.value.includes(value.name);
            if (severityFound) severity = value;
            return severityFound;
        });

        return severity;
    }
}
