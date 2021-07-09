/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ReconnectingWebSocket from 'reconnecting-websocket';

import { store } from '../redux/store';
import PropTypes from 'prop-types';
import { APP_NAME, getAppName } from './config-params';

const PREFIX_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/merge-notification';
const PREFIX_ORCHESTRATOR_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/merge';
const PREFIX_CONFIG_NOTIFICATION_WS =
    process.env.REACT_APP_WS_GATEWAY + '/config-notification';
const PREFIX_CONFIG_QUERIES = process.env.REACT_APP_API_GATEWAY + '/config';
const PREFIX_BOUNDARY_QUERIES = process.env.REACT_APP_API_GATEWAY + '/boundary';

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

export function connectNotificationsWebsocket(processUuid, businessProcess) {
    // The websocket API doesn't allow relative urls
    const wsbase = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const wsadress =
        wsbase +
        PREFIX_NOTIFICATION_WS +
        '/notify?processUuid=' +
        encodeURIComponent(processUuid) +
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
        webSocketBaseUrl +
        PREFIX_CONFIG_NOTIFICATION_WS +
        '/notify?appName=' +
        APP_NAME;

    let webSocketUrlWithToken;
    webSocketUrlWithToken = webSocketUrl + '&access_token=' + getToken();

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

export function fetchConfigParameters(appName) {
    console.info('Fetching UI configuration params for app : ' + appName);
    const fetchParams =
        PREFIX_CONFIG_QUERIES + `/v1/applications/${appName}/parameters`;
    return backendFetch(fetchParams).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function fetchConfigParameter(name) {
    const appName = getAppName(name);
    console.info(
        "Fetching UI config parameter '%s' for app '%s' ",
        name,
        appName
    );
    const fetchParams =
        PREFIX_CONFIG_QUERIES +
        `/v1/applications/${appName}/parameters/${name}`;
    return backendFetch(fetchParams).then((response) =>
        response.ok
            ? response.json()
            : response.text().then((text) => Promise.reject(text))
    );
}

export function updateConfigParameter(name, value) {
    const appName = getAppName(name);
    console.info(
        "Updating config parameter '%s=%s' for app '%s' ",
        name,
        value,
        appName
    );
    const updateParams =
        PREFIX_CONFIG_QUERIES +
        `/v1/applications/${appName}/parameters/${name}?value=` +
        encodeURIComponent(value);
    return backendFetch(updateParams, { method: 'put' }).then((response) =>
        response.ok
            ? response
            : response.text().then((text) => Promise.reject(text))
    );
}

export function fetchMergeConfigs() {
    console.info('Fetching merge configs...');
    const fetchConfigsUrl = PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs';
    return backendFetch(fetchConfigsUrl).then((response) => response.json());
}

function getUrlWithToken(baseUrl) {
    return baseUrl + '?access_token=' + getToken();
}

export function getExportMergeUrl(processUuid, date, format) {
    const url =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        processUuid +
        '/' +
        date +
        '/export/' +
        format;
    return getUrlWithToken(url);
}

export function fetchAppsAndUrls() {
    console.info(`Fetching apps and urls...`);
    return fetch('env.json')
        .then((res) => res.json())
        .then((res) => {
            return fetch(
                res.appsMetadataServerUrl + '/apps-metadata.json'
            ).then((response) => {
                return response.json();
            });
        });
}

/**
 * Function return list of merges by process uuid, date min and date max
 */
export function fetchMergesByProcessUuidAndDate(processUuid, minDate, maxDate) {
    console.info(
        `Fetching merges from '${minDate.toISOString()}' to '${maxDate.toISOString()}'...`
    );
    const fetchConfigsUrl =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        encodeURIComponent(processUuid) +
        '/merges?minDate=' +
        minDate.toISOString() +
        '&maxDate=' +
        maxDate.toISOString();
    return backendFetch(fetchConfigsUrl).then((response) => response.json());
}

export function removeTime(date) {
    return new Date(date.toDateString());
}

export const CgmStatus = {
    VALID: 'valid',
    VALID_WITH_WARNING: 'valid_with_warnings',
    INVALID: 'invalid',
};

export const IgmStatus = {
    ABSENT: 'absent',
    AVAILABLE: 'available',
    VALID: 'valid',
    INVALID: 'invalid',
    MERGED: 'merged',
};

export function getIgmStatus(tso, merge) {
    const igm = merge && tso ? merge.igms.find((igm) => igm.tso === tso) : null;
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
                return {
                    status: IgmStatus.MERGED,
                    cgmStatus: CgmStatus.VALID,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            case 'FIRST_LOADFLOW_SUCCEED':
            case 'LOADFLOW_SUCCEED': // for backward compatibility
                return {
                    status: IgmStatus.MERGED,
                    cgmStatus: CgmStatus.VALID,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            case 'SECOND_LOADFLOW_SUCCEED':
            case 'THIRD_LOADFLOW_SUCCEED':
                return {
                    status: IgmStatus.MERGED,
                    cgmStatus: CgmStatus.VALID_WITH_WARNING,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

            case 'LOADFLOW_FAILED':
                return {
                    status: IgmStatus.MERGED,
                    cgmStatus: CgmStatus.INVALID,
                    replacingDate: igm.replacingDate,
                    replacingBusinessProcess: igm.replacingBusinessProcess,
                };

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

export function deleteProcess(processUuid) {
    console.info('Deleting Process', processUuid, ' ...');
    const deleteProcessUrl =
        PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs/' + processUuid;
    return backendFetch(deleteProcessUrl, {
        method: 'delete',
    });
}

export function getReplaceIGMUrl(processUuid, date) {
    const url =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        processUuid +
        '/' +
        date +
        '/replace-igms';
    return getUrlWithToken(url);
}

export function replaceIGM(processUuid, date) {
    console.info(
        'replacing igm for process : ' + processUuid + ' at : ' + date
    );
    return backendFetch(getReplaceIGMUrl(processUuid, date), {
        method: 'put',
    }).then((response) => (response ? response.json() : null));
}

export function fetchTsosList() {
    console.info('Fetching list of authorized tsos...');
    const fetchTsosListUrl = PREFIX_BOUNDARY_QUERIES + '/v1/tsos';
    return backendFetch(fetchTsosListUrl).then((response) => response.json());
}

export function fetchBusinessProcessesList() {
    console.info('Fetching list of authorized business processes...');
    const fetchBusinessProcessesListUrl =
        PREFIX_BOUNDARY_QUERIES + '/v1/business-processes';
    return backendFetch(fetchBusinessProcessesListUrl).then((response) =>
        response.json()
    );
}

export function fetchBoundariesList() {
    console.info('Fetching list of boundaries...');
    const fetchBoundariesListUrl =
        PREFIX_BOUNDARY_QUERIES + '/v1/boundaries/infos';
    return backendFetch(fetchBoundariesListUrl).then((response) =>
        response.json()
    );
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
