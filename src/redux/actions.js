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

export const INIT_COUNTRIES = 'INIT_COUNTRIES';

export function initCountries(names) {
    return { type: INIT_COUNTRIES, names: names };
}

export const UPDATE_COUNTRY_STATUS = 'UPDATE_COUNTRY_STATUS';

export function updateCountryStatus(name, status) {
    return { type: UPDATE_COUNTRY_STATUS, name: name, status: status };
}

export const RESET_COUNTRIES_STATUS = 'RESET_COUNTRIES_STATUS';

export function resetCountriesStatus() {
    return { type: RESET_COUNTRIES_STATUS };
}

export const UPDATE_LAST_DATE = 'UPDATE_LAST_DATE';

export function updateLastDate(lastDate) {
    return { type: UPDATE_LAST_DATE, lastDate: lastDate };
}
