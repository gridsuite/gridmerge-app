/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import VirtualizedTable from './virtualized-table';
import { useIntl } from 'react-intl';

const SEVERITY_COLUMN_FIXED_WIDTH = 100;

export const LogTable = ({ logs }) => {
    const intl = useIntl();

    const COLUMNS_DEFINITIONS = [
        {
            label: intl.formatMessage({ id: 'severity' }),
            id: 'severity',
            dataKey: 'severity',
            width: SEVERITY_COLUMN_FIXED_WIDTH,
        },
        {
            label: intl.formatMessage({ id: 'message' }),
            id: 'message',
            dataKey: 'message',
        },
    ];

    const generateTableColumns = () => {
        return Object.values(COLUMNS_DEFINITIONS).map((c) => {
            c.headerStyle = { display: '' };
            c.style = { display: '' };
            return c;
        });
    };

    const generateTableRows = () => {
        return logs.map((log) => {
            return {
                severity: log.getSeverityName(),
                message: log.getLog(),
                backgroundColor: log.getColorName(),
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
