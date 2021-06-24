/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import VirtualizedTable from './virtualized-table';

const SEVERITY_COLUMN_FIXED_WIDTH = 100;

const COLUMNS_DEFINITIONS = [
    {
        label: 'Severity',
        id: 'severity',
        dataKey: 'severity',
        width: SEVERITY_COLUMN_FIXED_WIDTH,
    },
    {
        label: 'Message',
        id: 'message',
        dataKey: 'message',
    },
];

export const LogTable = ({ logs }) => {
    const generateTableColumns = () => {
        return Object.values(COLUMNS_DEFINITIONS).map((c) => {
            return c;
        });
    };

    const generateTableRows = () => {
        return logs.map((log) => {
            return {
                severity: log.getSeverityName(),
                message: log.getLog(),
            };
        });
    };

    return (
        <VirtualizedTable
            columns={generateTableColumns()}
            rows={generateTableRows()}
            sortable={false}
        />
    );
};
