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

const PREFIX_USER_ADMIN_SERVER_QUERIES =
    process.env.REACT_APP_API_GATEWAY + '/user-admin';
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

function handleResponse(response, expectsJson) {
    if (response.ok) {
        return expectsJson ? response.json() : response;
    } else {
        return response.text().then((text) => {
            return Promise.reject({
                message: text ? text : response.statusText,
                status: response.status,
                statusText: response.statusText,
            });
        });
    }
}

export function backendFetch(url, expectsJson, init, withAuth = true) {
    if (!(typeof init == 'undefined' || typeof init == 'object')) {
        throw new TypeError(
            'Argument 2 of backendFetch is not an object' + typeof init
        );
    }
    const initCopy = Object.assign({}, init);
    initCopy.headers = new Headers(initCopy.headers || {});
    if (withAuth) {
        initCopy.headers.append('Authorization', 'Bearer ' + getToken());
    }

    return fetch(url, initCopy).then((response) =>
        handleResponse(response, expectsJson)
    );
}

export function fetchValidateUser(user) {
    const sub = user?.profile?.sub;
    if (!sub)
        return Promise.reject(
            new Error(
                'Error : Fetching access for missing user.profile.sub : ' + user
            )
        );

    console.info(`Fetching access for user...`);
    const CheckAccessUrl =
        PREFIX_USER_ADMIN_SERVER_QUERIES + `/v1/users/${sub}`;
    console.debug(CheckAccessUrl);

    return backendFetch(
        CheckAccessUrl,
        false,
        {
            method: 'head',
            headers: {
                Authorization: 'Bearer ' + user?.id_token,
            },
        },
        false
    )
        .then((response) => {
            //if the response is ok, the responseCode will be either 200 or 204 otherwise it's an error and it will be caught
            return response.status === 200 ? true : false;
        })
        .catch((error) => {
            if (error.status === 403) return false;
            else throw new Error(error.status + ' ' + error.statusText);
        });
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

    const rws = new ReconnectingWebSocket(
        () => wsadress + '&access_token=' + getToken()
    );
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

    const reconnectingWebSocket = new ReconnectingWebSocket(
        () => webSocketUrl + '&access_token=' + getToken()
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
    return backendFetch(fetchParams, true);
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
    return backendFetch(fetchParams, true);
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
    return backendFetch(updateParams, false, { method: 'put' });
}

export function fetchMergeConfigs() {
    console.info('Fetching merge configs...');
    const fetchConfigsUrl = PREFIX_ORCHESTRATOR_QUERIES + '/v1/configs';
    return backendFetch(fetchConfigsUrl, true);
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
    return backendFetch('env.json', true).then((res) => {
        return backendFetch(
            res.appsMetadataServerUrl + '/apps-metadata.json',
            true,
            undefined,
            false
        );
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
    return backendFetch(fetchConfigsUrl, true);
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
    return backendFetch(addProcessUrl, false, {
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
    return backendFetch(deleteProcessUrl, false, {
        method: 'delete',
    });
}

function getMergeUrl(processUuid, date, uri) {
    const url =
        PREFIX_ORCHESTRATOR_QUERIES +
        '/v1/' +
        processUuid +
        '/' +
        date +
        '/' +
        uri;
    return getUrlWithToken(url);
}

export function replaceIGM(processUuid, date) {
    console.info(
        'replacing igm for process : ' + processUuid + ' at : ' + date
    );
    return backendFetch(getMergeUrl(processUuid, date, 'replace-igms'), true, {
        method: 'put',
    });
}

export function fetchReport(processUuid, date) {
    console.info('get report for process : ' + processUuid + ' at : ' + date);
    return backendFetch(getMergeUrl(processUuid, date, 'report'), true);
}

export function fetchTsosList() {
    console.info('Fetching list of authorized tsos...');
    const fetchTsosListUrl = PREFIX_BOUNDARY_QUERIES + '/v1/tsos';
    return backendFetch(fetchTsosListUrl, true);
}

export function fetchBusinessProcessesList() {
    console.info('Fetching list of authorized business processes...');
    const fetchBusinessProcessesListUrl =
        PREFIX_BOUNDARY_QUERIES + '/v1/business-processes';
    return backendFetch(fetchBusinessProcessesListUrl, true);
}

export function fetchBoundariesList() {
    console.info('Fetching list of boundaries...');
    const fetchBoundariesListUrl =
        PREFIX_BOUNDARY_QUERIES + '/v1/boundaries/infos';
    return backendFetch(fetchBoundariesListUrl, true);
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
