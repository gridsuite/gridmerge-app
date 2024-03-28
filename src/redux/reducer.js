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

import {
    USER,
    SIGNIN_CALLBACK_ERROR,
    UNAUTHORIZED_USER_INFO,
    LOGOUT_ERROR,
    USER_VALIDATION_ERROR,
    RESET_AUTHENTICATION_ROUTER_ERROR,
    SHOW_AUTH_INFO_LOGIN,
} from '@gridsuite/commons-ui';
import { removeTime } from '../utils/rest-api';
import {
    getLocalStorageTheme,
    saveLocalStorageTheme,
    getLocalStorageLanguage,
    saveLocalStorageLanguage,
    getLocalStorageComputedLanguage,
} from './local-storage';
import {
    PARAM_LANGUAGE,
    PARAM_THEME,
    PARAM_TIMELINE_DIAGONAL_LABELS,
} from '../utils/config-params';

const paramsInitialState = {
    [PARAM_THEME]: getLocalStorageTheme(),
    [PARAM_LANGUAGE]: getLocalStorageLanguage(),
    [PARAM_TIMELINE_DIAGONAL_LABELS]: true,
};

const initialState = {
    computedLanguage: getLocalStorageComputedLanguage(),
    user: null,
    signInCallbackError: null,
    authenticationRouterError: null,
    showAuthenticationRouterLogin: false,
    configs: [],
    processes: [],
    ...paramsInitialState,
};

export const reducer = createReducer(initialState, (builder) => {
    builder.addCase(SELECT_THEME, (state, action) => {
        state[PARAM_THEME] = action[PARAM_THEME];
        saveLocalStorageTheme(state[PARAM_THEME]);
    });

    builder.addCase(SELECT_LANGUAGE, (state, action) => {
        state[PARAM_LANGUAGE] = action[PARAM_LANGUAGE];
        saveLocalStorageLanguage(state[PARAM_LANGUAGE]);
    });

    builder.addCase(SELECT_COMPUTED_LANGUAGE, (state, action) => {
        state.computedLanguage = action.computedLanguage;
    });

    builder.addCase(USER, (state, action) => {
        state.user = action.user;
    });

    builder.addCase(SIGNIN_CALLBACK_ERROR, (state, action) => {
        state.signInCallbackError = action.signInCallbackError;
    });

    builder.addCase(UNAUTHORIZED_USER_INFO, (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(LOGOUT_ERROR, (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(USER_VALIDATION_ERROR, (state, action) => {
        state.authenticationRouterError = action.authenticationRouterError;
    });

    builder.addCase(RESET_AUTHENTICATION_ROUTER_ERROR, (state, action) => {
        state.authenticationRouterError = null;
    });

    builder.addCase(SHOW_AUTH_INFO_LOGIN, (state, action) => {
        state.showAuthenticationRouterLogin =
            action.showAuthenticationRouterLogin;
    });

    builder.addCase(INIT_PROCESSES, (state, action) => {
        state.configs = action.configs;
        // by default set date to current day
        state.processes = state.configs.map(() => {
            return {
                date: removeTime(new Date()),
                merges: [],
                selectedMergeDate: null,
            };
        });
    });

    builder.addCase(UPDATE_MERGES, (state, action) => {
        const process = state.processes[action.processIndex];
        process.merges = action.merges;
    });

    builder.addCase(UPDATE_PROCESS_DATE, (state, action) => {
        const process = state.processes[action.processIndex];
        process.date = action.date;
    });

    builder.addCase(UPDATE_SELECTED_MERGE_DATE, (state, action) => {
        const process = state.processes[action.processIndex];
        process.selectedMergeDate = action.selectedMergeDate;
    });

    builder.addCase(TIMELINE_DIAGONAL_LABELS, (state, action) => {
        state[PARAM_TIMELINE_DIAGONAL_LABELS] =
            action[PARAM_TIMELINE_DIAGONAL_LABELS];
    });
});
