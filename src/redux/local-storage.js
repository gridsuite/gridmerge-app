/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { DARK_THEME } from './actions';

const LOCAL_STORAGE_THEME_KEY = process.env.REACT_APP_NAME + '_THEME';

export const getLocalStorageTheme = () => {
    return localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || DARK_THEME;
};

export const saveLocalStorageTheme = (theme) => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
};

const LOCAL_STORAGE_DATE_BY_PROCESS = 'GRIDMERGE_PROCESS_BY_DATE';

export const saveLocalStorageDateByProcess = (date, process, data) => {
    const dataFromLocalStorage = getLocalStorageDateByProcess();
    let object = [{ name: process, date: date }];
    if (dataFromLocalStorage) {
        let processFromLocalStorage = JSON.parse(dataFromLocalStorage).find(
            (item) => item.name === process
        );
        if (processFromLocalStorage) {
            const array = JSON.parse(dataFromLocalStorage);
            const objIndex = array.findIndex((item) => item.name === process);
            array[objIndex].date = date;
            localStorage.setItem(
                LOCAL_STORAGE_DATE_BY_PROCESS,
                JSON.stringify(array)
            );
        } else {
            const AllDateByProcess = JSON.parse(dataFromLocalStorage).concat(
                object
            );
            localStorage.setItem(
                LOCAL_STORAGE_DATE_BY_PROCESS,
                JSON.stringify(AllDateByProcess)
            );
        }
    } else {
        localStorage.setItem(
            LOCAL_STORAGE_DATE_BY_PROCESS,
            JSON.stringify(object)
        );
    }
};

export const getLocalStorageDateByProcess = () => {
    return localStorage.getItem(LOCAL_STORAGE_DATE_BY_PROCESS);
};
