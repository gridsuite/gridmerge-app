/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createReducer } from '@reduxjs/toolkit';

import {
    INIT_PROCESSES,
    SELECT_THEME,
    SELECT_LANGUAGE,
    SELECT_COMPUTED_LANGUAGE,
    UPDATE_MERGES,
    UPDATE_PROCESS_DATE,
    UPDATE_SELECTED_MERGE_DATE,
    TIMELINE_DIAGONAL_LABELS,
} from './actions';

import { SIGNIN_CALLBACK_ERROR, USER } from '@gridsuite/commons-ui';
import { removeTime } from '../utils/rest-api';
import {
    getLocalStorageTheme,
    saveLocalStorageTheme,
    getLocalStorageLanguage,
    saveLocalStorageLanguage,
    getLocalStorageComputedLanguage,
} from './local-storage';
import {
    PARAM_THEME,
    PARAM_TIMELINE_DIAGONAL_LABELS,
} from '../utils/config-params';

const paramsInitialState = {
    [PARAM_THEME]: getLocalStorageTheme(),
    [PARAM_TIMELINE_DIAGONAL_LABELS]: true,
};

const initialState = {
    language: getLocalStorageLanguage(),
    computedLanguage: getLocalStorageComputedLanguage(),
    user: null,
    signInCallbackError: null,
    configs: [],
    processes: [],
    ...paramsInitialState,
};

export const reducer = createReducer(initialState, {
    [SELECT_THEME]: (state, action) => {
        state[PARAM_THEME] = action[PARAM_THEME];
        saveLocalStorageTheme(state[PARAM_THEME]);
    },

    [SELECT_LANGUAGE]: (state, action) => {
        state.language = action.language;
        saveLocalStorageLanguage(state.language);
    },

    [SELECT_COMPUTED_LANGUAGE]: (state, action) => {
        state.computedLanguage = action.computedLanguage;
    },

    [USER]: (state, action) => {
        state.user = action.user;
    },

    [SIGNIN_CALLBACK_ERROR]: (state, action) => {
        state.signInCallbackError = action.signInCallbackError;
    },

    [INIT_PROCESSES]: (state, action) => {
        state.configs = action.configs;
        // by default set date to current day
        state.processes = state.configs.map(() => {
            return {
                date: removeTime(new Date()),
                merges: [],
                selectedMergeDate: null,
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

    [UPDATE_SELECTED_MERGE_DATE]: (state, action) => {
        const process = state.processes[action.processIndex];
        process.selectedMergeDate = action.selectedMergeDate;
    },

    [TIMELINE_DIAGONAL_LABELS]: (state, action) => {
        state[PARAM_TIMELINE_DIAGONAL_LABELS] =
            action[PARAM_TIMELINE_DIAGONAL_LABELS];
    },
});
