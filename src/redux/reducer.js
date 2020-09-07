/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {createReducer} from "@reduxjs/toolkit";

import {getLocalStorageTheme, saveLocalStorageTheme,} from "./local-storage";

import {
    INIT_COUNTRIES,
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
    countries: []
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

    [INIT_COUNTRIES]: (state, action) => {
        state.countries = action.names.map(name => {
            return {
                name: name,
                status: IgmStatus.ABSENT
            };
        });
    },

    [UPDATE_COUNTRY_STATUS]: (state, action) => {
        const country = state.countries.find(country => country.name === action.name);
        country.status = action.status;
    },

    [RESET_COUNTRIES_STATUS]: (state) => {
        state.countries.forEach(country => {
           country.status = IgmStatus.ABSENT;
        });
    },

    [UPDATE_LAST_DATE]: (state, action) => {
        if (state.lastDate == null) {
            state.lastDate = action.lastDate;
            // also reset country status
            state.countries.forEach(country => {
                country.status = IgmStatus.ABSENT;
            });
        }
    },
});
