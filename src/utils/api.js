/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ReconnectingWebSocket from 'reconnecting-websocket';

import { store } from '../redux/store';

const PREFIX_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/merge-notification';
const PREFIX_ORCHESTRATOR_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/merge';

const PREFIX_APPS_URLS_QUERIES = process.env.REACT_APP_APPS_URLS;
const REACT_APP_DEV_MODE = process.env.REACT_APP_DEV_MODE;

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

export function getExportMergeUrl(process, date) {
    const url = PREFIX_ORCHESTRATOR_QUERIES + '/v1/' + process + '/' + date + '/export/XIIDM';
    return getUrlWithToken(url);
}

export function fetchAppsAndUrls() {
    console.info(`Fetching apps and urls...`);
    let url;
    if (REACT_APP_DEV_MODE) {
        url = PREFIX_APPS_URLS_QUERIES + '/dev-urls.json';
    } else {
        url = PREFIX_APPS_URLS_QUERIES + '/prod-urls.json';
    };

    return backendFetch(url).then((response) => {
        return response.json();
    });
}
