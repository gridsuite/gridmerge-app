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
    SELECT_THEME,
    UPDATE_ALL_IGMS_STATUS,
    UPDATE_IGM_STATUS,
    UPDATE_MERGE_DATE,
} from "./actions";

import {SIGNIN_CALLBACK_ERROR, USER,} from "@gridsuite/commons-ui";
import {IgmStatus} from "../components/merge-map";

const initialState = {
    theme: getLocalStorageTheme(),
    user : null,
    signInCallbackError : null,
    configs: [],
    merge: {
        process: null,
        date: null,
        igms: []
    }
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
        state.configs = action.configs;
    },

    [UPDATE_IGM_STATUS]: (state, action) => {
        const igm = state.merge.igms.find(igm => igm.tso === action.tso);
        igm.status = action.status;
    },

    [UPDATE_ALL_IGMS_STATUS]: (state, action) => {
        state.merge.igms.forEach(igm => {
            igm.status = action.status;
        });
    },

    [UPDATE_MERGE_DATE]: (state, action) => {
        if (state.merge.date == null || (action.date != null && action.date.getTime() !== state.merge.date.getTime()) || action.process !== state.merge.process) {
            const config = state.configs.find(config => config.process === action.process);
            state.merge = {
                process: action.process,
                date: action.date,
                igms: config.tsos.map(tso => {
                    return {
                        tso: tso.toLowerCase(),
                        status: IgmStatus.ABSENT
                    }
                }),
            }
        }
    },
});
