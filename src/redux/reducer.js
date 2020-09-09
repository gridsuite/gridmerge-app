/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {createReducer} from "@reduxjs/toolkit";

import {getLocalStorageTheme, saveLocalStorageTheme,} from "./local-storage";

import {
    INIT_PROCESSES,
    RESET_COUNTRIES_STATUS,
    SELECT_THEME,
    UPDATE_COUNTRY_STATUS,
    UPDATE_LAST_DATE,
} from "./actions";

import {SIGNIN_CALLBACK_ERROR, USER,} from "@gridsuite/commons-ui";
import {IgmStatus} from "../components/merge-map";

const initialState = {
    theme: getLocalStorageTheme(),
    user : null,
    signInCallbackError : null,
    lastDate: null,
    processes: []
};

export const reducer = createReducer(initialState, {
    [SELECT_THEME]: (state, action) => {
        state.theme = action.theme;
        saveLocalStorageTheme(state.theme);
    },

    [USER]: (state, action) => {
        state.user = action.user;
    },

    [SIGNIN_CALLBACK_ERROR]: (state, action) => {
        state.signInCallbackError = action.signInCallbackError;
    },

    [INIT_PROCESSES]: (state, action) => {
        state.processes = action.configs.map(config => {
            return {
                name: config.process,
                lastDate: null,
                countries: config.tsos.map(tso => {
                    return {
                        name: tso.toLowerCase(),
                        status: IgmStatus.ABSENT
                    }
                }),
            }
        });
    },

    [UPDATE_COUNTRY_STATUS]: (state, action) => {
        const process = state.processes.find(process => process.name === action.process);
        const country = process.countries.find(country => country.name === action.country);
        country.status = action.status;
    },

    [RESET_COUNTRIES_STATUS]: (state, action) => {
        const process = state.processes.find(process => process.name === action.process);
        process.countries.forEach(country => {
           country.status = IgmStatus.ABSENT;
        });
    },

    [UPDATE_LAST_DATE]: (state, action) => {
        const process = state.processes.find(process => process.name === action.process);
        if (process.lastDate == null) {
            process.lastDate = action.lastDate;
            // also reset country status
            process.countries.forEach(country => {
                country.status = IgmStatus.ABSENT;
            });
        }
    },
});
