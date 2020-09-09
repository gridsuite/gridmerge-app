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

export const UPDATE_COUNTRY_STATUS = 'UPDATE_COUNTRY_STATUS';

export function updateCountryStatus(process, country, status) {
    return { type: UPDATE_COUNTRY_STATUS, process: process, country: country, status: status };
}

export const RESET_COUNTRIES_STATUS = 'RESET_COUNTRIES_STATUS';

export function resetCountriesStatus(process) {
    return { type: RESET_COUNTRIES_STATUS, process: process };
}

export const UPDATE_LAST_DATE = 'UPDATE_LAST_DATE';

export function updateLastDate(process, lastDate) {
    return { type: UPDATE_LAST_DATE, process: process, lastDate: lastDate };
}
