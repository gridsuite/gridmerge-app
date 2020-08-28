/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { store } from '../redux/store';
import ReconnectingWebSocket from 'reconnecting-websocket';

let PREFIX_CASE_QUERIES = process.env.REACT_APP_API_GATEWAY + '/case';
let PREFIX_MERGE_QUERIES = process.env.REACT_APP_API_GATEWAY + '/study';
let PREFIX_NOTIFICATION_WS = process.env.REACT_APP_WS_GATEWAY + '/notification';

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

export function fetchStudies() {
    console.info('Fetching studies...');
    const fetchStudiesUrl = PREFIX_MERGE_QUERIES + '/v1/studies';
    console.debug(fetchStudiesUrl);
    return backendFetch(fetchStudiesUrl).then((response) => response.json());
}

export function fetchCases() {
    console.info('Fetching cases...');
    const fetchCasesUrl = PREFIX_CASE_QUERIES + '/v1/cases';
    console.debug(fetchCasesUrl);
    return backendFetch(fetchCasesUrl).then((response) => response.json());
}

export function getVoltageLevelSingleLineDiagram(
    mergeName,
    voltageLevelId,
    useName,
    centerLabel,
    diagonalLabel
) {
    console.info(
        `Getting url of voltage level diagram '${voltageLevelId}' of merge '${mergeName}'...`
    );
    return (
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/network/voltage-levels/' +
        encodeURIComponent(voltageLevelId) +
        '/svg-and-metadata?' +
        new URLSearchParams({
            useName: useName,
            centerLabel: centerLabel,
            diagonalLabel: diagonalLabel,
            topologicalColoring: true,
        }).toString()
    );
}

export function fetchSvg(svgUrl) {
    console.debug(svgUrl);
    return backendFetch(svgUrl).then((response) =>
        response.ok
            ? response.json()
            : response
                  .json()
                  .then((error) => Promise.reject(new Error(error.error)))
    );
}

export function fetchSubstations(mergeName) {
    console.info(`Fetching substations of merge '${mergeName}'...`);
    const fetchSubstationsUrl =
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/network-map/substations';
    console.debug(fetchSubstationsUrl);
    return backendFetch(fetchSubstationsUrl).then((response) =>
        response.json()
    );
}

export function fetchSubstationPositions(mergeName) {
    console.info(`Fetching substation positions of merge '${mergeName}'...`);
    const fetchSubstationPositionsUrl =
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/geo-data/substations';
    console.debug(fetchSubstationPositionsUrl);
    return backendFetch(fetchSubstationPositionsUrl).then((response) =>
        response.json()
    );
}

export function fetchLines(mergeName) {
    console.info(`Fetching lines of merge '${mergeName}'...`);
    const fetchLinesUrl =
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/network-map/lines';
    console.debug(fetchLinesUrl);
    return backendFetch(fetchLinesUrl).then((response) => response.json());
}

export function fetchLinePositions(mergeName) {
    console.info(`Fetching line positions of merge '${mergeName}'...`);
    const fetchLinePositionsUrl =
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/geo-data/lines';
    console.debug(fetchLinePositionsUrl);
    return backendFetch(fetchLinePositionsUrl).then((response) =>
        response.json()
    );
}

export function createMerge(
    caseExist,
    mergeName,
    mergeDescription,
    caseName,
    selectedFile
) {
    console.info('Creating a new merge...');
    if (caseExist) {
        const createMergeWithExistingCaseUrl =
            PREFIX_MERGE_QUERIES +
            '/v1/studies/' +
            encodeURIComponent(mergeName) +
            '/cases/' +
            encodeURIComponent(caseName) +
            '?' +
            new URLSearchParams({ description: mergeDescription }).toString();
        console.debug(createMergeWithExistingCaseUrl);
        return backendFetch(createMergeWithExistingCaseUrl, {
            method: 'post',
        });
    } else {
        const createMergeWithNewCaseUrl =
            PREFIX_MERGE_QUERIES +
            '/v1/studies/' +
            encodeURIComponent(mergeName) +
            '?' +
            new URLSearchParams({ description: mergeDescription }).toString();
        const formData = new FormData();
        formData.append('caseFile', selectedFile);
        console.debug(createMergeWithNewCaseUrl);
        return backendFetch(createMergeWithNewCaseUrl, {
            method: 'post',
            body: formData,
        });
    }
}

export function deleteMerge(mergeName) {
    console.info('Deleting merge ' + mergeName + ' ...');
    const deleteMergeUrl =
        PREFIX_MERGE_QUERIES + '/v1/studies/' + encodeURIComponent(mergeName);
    console.debug(deleteMergeUrl);
    return backendFetch(deleteMergeUrl, {
        method: 'delete',
    });
}

export function updateSwitchState(mergeName, switchId, open) {
    console.info('updating switch ' + switchId + ' ...');
    const updateSwitchUrl =
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/network-modification/switches/' +
        encodeURIComponent(switchId) +
        '?' +
        new URLSearchParams({ open: open }).toString();
    console.debug(updateSwitchUrl);
    return backendFetch(updateSwitchUrl, { method: 'put' });
}

export function renameMerge(mergeName, newMergeName) {
    console.info('Renaming merge ' + mergeName);
    const renameStudiesUrl =
        process.env.REACT_APP_API_STUDY_SERVER +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/rename';
    console.debug(renameStudiesUrl);
    return backendFetch(renameStudiesUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newMergeName: newMergeName }),
    }).then((response) => response.json());
}

export function startLoadFlow(mergeName) {
    console.info('Running loadflow on ' + mergeName + '...');
    const startLoadFlowUrl =
        PREFIX_MERGE_QUERIES +
        '/v1/studies/' +
        encodeURIComponent(mergeName) +
        '/loadflow/run';
    console.debug(startLoadFlowUrl);
    return backendFetch(startLoadFlowUrl, { method: 'put' });
}

export function connectNotificationsWebsocket(mergeName) {
    // The websocket API doesn't allow relative urls
    const wsbase = document.baseURI
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
    const wsadress =
        wsbase +
        PREFIX_NOTIFICATION_WS +
        '/notify?mergeName=' +
        encodeURIComponent(mergeName);
    let wsaddressWithToken;
    wsaddressWithToken = wsadress + '&access_token=' + getToken();

    const rws = new ReconnectingWebSocket(wsaddressWithToken);
    // don't log the token, it's private
    rws.onopen = function (event) {
        console.info('Connected Websocket ' + wsadress + ' ...');
    };
    return rws;
}

export function getAvailableExportFormats() {
    console.info('get export formats');
    const getExportFormatsUrl =
        process.env.REACT_APP_API_STUDY_SERVER + '/v1/export-network-formats';
    console.debug(getExportFormatsUrl);
    return backendFetch(getExportFormatsUrl, {
        method: 'get',
    }).then((response) => response.json());
}
