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

export const UPDATE_MERGES = 'UPDATE_MERGES';

export function updateMerges(processIndex, merges) {
    return { type: UPDATE_MERGES, processIndex, merges };
}

export const UPDATE_PROCESS_DATE = 'UPDATE_PROCESS_DATE';

export function updateProcessDate(processIndex, date) {
    return { type: UPDATE_PROCESS_DATE, processIndex, date };
}

export const UPDATE_SELECTED_MERGE_DATE = 'UPDATE_SELECTED_MERGE_DATE';

export function updateSelectedMergeDate(processIndex, selectedMergeDate) {
    return {
        type: UPDATE_SELECTED_MERGE_DATE,
        processIndex,
        selectedMergeDate,
    };
}

export const CURRENT_MERGES_LIST = 'CURRENT_MERGES_LIST';

export function currentMergesList(merges) {
    return { type: CURRENT_MERGES_LIST, merges: merges };
}

export const CURRENT_SEARCH_DATE_BY_PROCESS = 'CURRENT_SEARCH_DATE_BY_PROCESS';

export function currentSearchDateByProcess(date, process) {
    return {
        type: CURRENT_SEARCH_DATE_BY_PROCESS,
        date: date,
        process: process,
    };
}
