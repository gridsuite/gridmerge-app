/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import LogReportItem from './log-report-item';

export default class LogReport {
    constructor(jsonReporter) {
        this.key = jsonReporter.taskKey;
        this.title = LogReportItem.resolveTemplateMessage(
            jsonReporter.defaultName,
            jsonReporter.taskValues
        );
        this.subReports = [];
        this.reports = [];
        this.init(jsonReporter);
    }

    getTitle() {
        return this.title;
    }

    getSubReports() {
        return this.subReports;
    }

    getReports() {
        return this.reports;
    }

    getAllReports() {
        return this.getReports().concat(
            this.getSubReports().flatMap((r) => r.getAllReports())
        );
    }

    init(jsonReporter) {
        jsonReporter.subReporters.map((value) =>
            this.subReports.push(new LogReport(value))
        );
        jsonReporter.reports.map((value) =>
            this.reports.push(new LogReportItem(value))
        );
    }

    getHighestSeverity(currentSeverity = LogReportItem.SEVERITY.UNKNOWN) {
        let reduceFct = (p, c) => (p.level < c.level ? c : p);

        let highestSeverity = this.getReports()
            .map((r) => r.getSeverity())
            .reduce(reduceFct, currentSeverity);

        return this.getSubReports()
            .map((r) => r.getHighestSeverity(highestSeverity))
            .reduce(reduceFct, highestSeverity);
    }
}
