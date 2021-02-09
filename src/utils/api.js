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
const PREFIX_CONFIG_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/config-notification';
const PREFIX_CONFIG_QUERIES = process.env.REACT_APP_API_GATEWAY + '/config';

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

export function connectNotificationsWebsocket(process, businessProcess) {
    // The websocket API doesn't allow relative urls
    const wsbase = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const wsadress =
        wsbase +
        PREFIX_NOTIFICATION_WS +
        '/notify?process=' +
        encodeURIComponent(process) +
        '&businessProcess=' +
        encodeURIComponent(businessProcess);
    const wsaddressWithToken = wsadress + '&access_token=' + getToken();

    const rws = new ReconnectingWebSocket(wsaddressWithToken);
    // don't log the token, it's private
    rws.onopen = function (event) {
        console.info('Connected Websocket ' + wsadress + ' ...');
    };
    return rws;
}

export function connectNotificationsWsUpdateConfig() {
    const webSocketBaseUrl = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const webSocketUrl =
        webSocketBaseUrl + PREFIX_CONFIG_NOTIFICATION_WS + '/notify';

    let webSocketUrlWithToken;
    webSocketUrlWithToken = webSocketUrl + '?access_token=' + getToken();

    const reconnectingWebSocket = new ReconnectingWebSocket(
        webSocketUrlWithToken
    );
    reconnectingWebSocket.onopen = function (event) {
        console.info(
            'Connected Websocket update config ' + webSocketUrl + ' ...'
        );
    };
    return reconnectingWebSocket;
}

export function fetchConfigParameters() {
    console.info('Fetching UI configuration params ...');
    const fetchParams = PREFIX_CONFIG_QUERIES + '/v1/parameters';
    return backendFetch(fetchParams).then((res) => {
        return res.json();
    });
}

export function updateConfigParameters(name, value) {
    console.info('updating parameters : ' + name + ' : ' + value);
    const updateParams = PREFIX_CONFIG_QUERIES + '/v1/parameters';
    backendFetch(updateParams, {
        method: 'put',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([
            {
                name: name,
                value: value,
            },
        ]),
    }).then();
}

export function fetchMergeConfigs() {
    console.info('Fetching merge configs...');
    const fetchConfigsUrl = PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs';
    return backendFetch(fetchConfigsUrl).then((response) => response.json());
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
        return fetch(res.appsMetadataServerUrl + '/apps-metadata.json').then(
            (response) => {
                return response.json();
            }
        );
    });
}

/**
 * Function return list of merges by process name, date min and date max
 */
export function fetchMergesByProcessAndDate(process, minDate, maxDate) {
    console.info(
        `Fetching merges from '${minDate.toISOString()}' to '${maxDate.toISOString()}'...`
    );
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
    const igm =
        merge && tso
            ? merge.igms.find((igm) => igm.tso === tso.sourcingActor)
            : null;
    if (!igm) {
        return {
            status: IgmStatus.ABSENT,
            replacingDate: null,
            replacingBusinessProcess: null,
        };
    }

    if (merge.status) {
        switch (merge.status) {
            case 'BALANCE_ADJUSTMENT_SUCCEED':
            case 'LOADFLOW_SUCCEED':
                return {
                    status: IgmStatus.MERGED,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            case 'BALANCE_ADJUSTMENT_FAILED':
            case 'LOADFLOW_FAILED':
            default:
                throw Error('Status not supported');
        }
    } else {
        switch (igm.status) {
            case 'AVAILABLE':
                return {
                    status: IgmStatus.AVAILABLE,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            case 'VALIDATION_SUCCEED':
                return {
                    status: IgmStatus.VALID,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            case 'VALIDATION_FAILED':
                return {
                    status: IgmStatus.INVALID,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            default:
                throw Error('Status not supported');
        }
    }
}

export function createProcess(json) {
    console.info('Saving Process', json.process, ' ...');
    const addProcessUrl = PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs';
    return backendFetch(addProcessUrl, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
    });
}

export function deleteProcess(process) {
    console.info('Deleting Process', process, ' ...');
    const deleteProcessUrl =
        PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs/' + process;
    return backendFetch(deleteProcessUrl, {
        method: 'delete',
    });
}

export function getReplaceIGMUrl(process, date) {
    const url =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        process +
        '/' +
        date +
        '/replace-igms';
    return getUrlWithToken(url);
}

export function replaceIGM(process, date) {
    console.info('replacing igm for process : ' + process + ' at : ' + date);
    return backendFetch(getReplaceIGMUrl(process, date), {
        method: 'put',
    }).then((response) => (response ? response.json() : null));
}

export const MergeType = PropTypes.shape({
    status: PropTypes.string,
    igms: PropTypes.arrayOf(
        PropTypes.shape({
            status: PropTypes.string.isRequired,
            tso: PropTypes.string.isRequired,
        })
    ),
});
