/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const SELECT_THEME = 'SELECT_THEME';
export const DARK_THEME = 'Dark';
export const LIGHT_THEME = 'Light';

export function selectTheme(theme) {
    return { type: SELECT_THEME, theme: theme };
}

export const INIT_PROCESSES = 'INIT_PROCESSES';

export function initProcesses(configs) {
    return { type: INIT_PROCESSES, configs: configs };
}

export const UPDATE_IGM_STATUS = 'UPDATE_IGM_STATUS';

export function updateIgmStatus(process, tso, status) {
    return { type: UPDATE_IGM_STATUS, process: process, tso: tso, status: status };
}

export const UPDATE_ALL_IGMS_STATUS = 'UPDATE_ALL_IGMS_STATUS';

export function updateAllIgmsStatus(process, status) {
    return { type: UPDATE_ALL_IGMS_STATUS, process: process, status: status };
}

export const UPDATE_PROCESS_LAST_DATE = 'UPDATE_PROCESS_LAST_DATE';

export function updateProcessLastDate(process, lastDate) {
    return { type: UPDATE_PROCESS_LAST_DATE, process: process, lastDate: lastDate };
}
