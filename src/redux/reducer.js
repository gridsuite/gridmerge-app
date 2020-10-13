/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {createReducer} from '@reduxjs/toolkit';

import {getLocalStorageTheme, saveLocalStorageTheme} from './local-storage';

import {INIT_PROCESSES, SELECT_THEME, UPDATE_MERGES, UPDATE_PROCESS_DATE,} from './actions';

import {SIGNIN_CALLBACK_ERROR, USER} from '@gridsuite/commons-ui';

const initialState = {
    theme: getLocalStorageTheme(),
    user: null,
    signInCallbackError: null,
    configs: [],
    processes: [],
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
        console.info(action.configs);
        state.configs = action.configs;
        // by default set date to current day
        state.processes = state.configs.map((config) => {
           return {
               name: config.process,
               date: new Date(new Date().toDateString()),
               merges: [],
           };
        });
    },

    [UPDATE_MERGES]: (state, action) => {
        const process = state.processes[action.processIndex];
        process.merges = action.merges;
    },

    [UPDATE_PROCESS_DATE]: (state, action) => {
        const process = state.processes[action.processIndex];
        process.date = action.date;
    },
});
