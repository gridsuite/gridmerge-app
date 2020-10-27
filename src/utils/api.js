/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ReconnectingWebSocket from 'reconnecting-websocket';

import { store } from '../redux/store';
import PropTypes from 'prop-types';

const PREFIX_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/merge-notification';
const PREFIX_ORCHESTRATOR_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/merge';

const APPS_METADATA_SERVER_URL = fetch('env.json');

function getToken() {
    const state = store.getState();
    return state.user.id_token;
}

function backendFetch(url, init) {
    if (!(typeof init == 'undefined' || typeof init == 'object')) {
        throw new TypeError(
            'Argument 2 of backendFetch is not an object' + typeof init
        );
    }
    const initCopy = Object.assign({}, init);
    initCopy.headers = new Headers(initCopy.headers || {});
    initCopy.headers.append('Authorization', 'Bearer ' + getToken());
    return fetch(url, initCopy);
}

export function connectNotificationsWebsocket(process) {
    // The websocket API doesn't allow relative urls
    const wsbase = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const wsadress =
        wsbase +
        PREFIX_NOTIFICATION_WS +
        '/notify?process=' +
        encodeURIComponent(process);
    const wsaddressWithToken = wsadress + '&access_token=' + getToken();

    const rws = new ReconnectingWebSocket(wsaddressWithToken);
    // don't log the token, it's private
    rws.onopen = function (event) {
        console.info('Connected Websocket ' + wsadress + ' ...');
    };
    return rws;
}

export function fetchMergeConfigs() {
    console.info('Fetching merge configs...');
    const fetchConfigsUrl = PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs';
    return backendFetch(fetchConfigsUrl).then((response) => response.json());
}

export function fetchMerges(process) {
    console.info(`Fetching merges of process ${process}...`);
    const url = PREFIX_ORCHESTRATOR_QUERIES + '/v1/' + process + '/merges';
    return backendFetch(url).then((response) => response.json());
}

function getUrlWithToken(baseUrl) {
    return baseUrl + '?access_token=' + getToken();
}

export function getExportMergeUrl(process, date, timeZoneoffset) {
    const url =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        process +
        '/' +
        date +
        '/export/XIIDM';
    return getUrlWithToken(url) + '&timeZoneOffset=' + timeZoneoffset;
}

export function fetchAppsAndUrls() {
    console.info(`Fetching apps and urls...`);
    return APPS_METADATA_SERVER_URL.then((res) => res.json()).then((res) => {
        return backendFetch(
            res.appsMetadataServerUrl + '/apps-metadata.json'
        ).then((response) => {
            return response.json();
        });
    });
}

/**
 * Function return list of merges by process name, date min and date max
 */
export function fetchMergesByProcessAndDate(process, minDate, maxDate) {
    console.info('Fetching merge configs...');
    const fetchConfigsUrl =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        encodeURIComponent(process) +
        '/merges?minDate=' +
        minDate.toISOString() +
        '&maxDate=' +
        maxDate.toISOString();
    return backendFetch(fetchConfigsUrl).then((response) => response.json());
}

export function removeTime(date) {
    return new Date(date.toDateString());
}

export const IgmStatus = {
    ABSENT: 'absent',
    AVAILABLE: 'available',
    VALID: 'valid',
    INVALID: 'invalid',
    MERGED: 'merged',
};

export function getIgmStatus(tso, merge) {
    const igm = merge ? merge.igms.find((igm) => igm.tso === tso) : null;
    if (!igm) {
        return IgmStatus.ABSENT;
    }
    if (merge.status) {
        switch (merge.status) {
            case 'BALANCE_ADJUSTMENT_SUCCEED':
            case 'LOADFLOW_SUCCEED':
                return IgmStatus.MERGED;

            case 'BALANCE_ADJUSTMENT_FAILED':
            case 'LOADFLOW_FAILED':
            default:
                throw Error('Status not supported');
        }
    } else {
        switch (igm.status) {
            case 'AVAILABLE':
                return IgmStatus.AVAILABLE;

            case 'VALIDATION_SUCCEED':
                return IgmStatus.VALID;

            case 'VALIDATION_FAILED':
                return IgmStatus.INVALID;

            default:
                throw Error('Status not supported');
        }
    }
}

export const MergeType = PropTypes.shape({
    status: PropTypes.string.isRequired,
    igms: PropTypes.arrayOf(
        PropTypes.shape({
            status: PropTypes.string.isRequired,
            tso: PropTypes.string.isRequired,
        })
    ),
});
