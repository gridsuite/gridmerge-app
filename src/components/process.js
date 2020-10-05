/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useRef } from 'react';

import PropTypes from 'prop-types';

import { useDispatch, useSelector } from 'react-redux';

import MergeMap, { IgmStatus } from './merge-map';
import Timeline, {
    mergesForTimeline,
    currentDateFormat,
    convertSearchDate,
} from './timeline';
import {
    connectNotificationsWebsocket,
    fetchMerges,
    fetchMergesByProcessAndDate,
} from '../utils/api';
import {
    currentMergesList,
    updateAllIgmsStatus,
    updateIgmStatus,
    updateMergeDate,
} from '../redux/actions';
import { getLocalStorageDateByProcess } from '../redux/local-storage';

export function toIgmStatus(status) {
    switch (status) {
        case 'AVAILABLE':
            return IgmStatus.AVAILABLE;

        case 'VALIDATION_SUCCEED':
            return IgmStatus.VALID;

        case 'VALIDATION_FAILED':
            return IgmStatus.INVALID;

        case 'BALANCE_ADJUSTMENT_SUCCEED':
        case 'LOADFLOW_SUCCEED':
            return IgmStatus.MERGED;

        case 'BALANCE_ADJUSTMENT_FAILED':
        case 'LOADFLOW_FAILED':
        default:
            break;
    }
}

const Process = (props) => {
    const merge = useSelector((state) => state.merge);

    const websocketExpectedCloseRef = useRef();

    const dispatch = useDispatch();

    const minHour = 'T00:00:00Z';

    const maxHour = 'T23:59:59Z';

    function updateIgm(tso, status) {
        dispatch(updateIgmStatus(props.name, tso.toLowerCase(), status));
    }

    function updateAllIgms(status) {
        dispatch(updateAllIgmsStatus(props.name, status));
    }

    function update(message) {
        const date = message.headers.date;

        dispatch(updateMergeDate(props.name, new Date(date)));

        // message.headers.status could be a server side IGM status or a merge status
        // here we convert to front IGM status for individual TSO map coloration
        const status = toIgmStatus(message.headers.status);

        switch (message.headers.status) {
            case 'AVAILABLE':
            case 'VALIDATION_SUCCEED':
            case 'VALIDATION_FAILED':
                updateIgm(message.headers.tso, status);
                break;
            case 'BALANCE_ADJUSTMENT_SUCCEED':
            case 'LOADFLOW_SUCCEED':
            case 'BALANCE_ADJUSTMENT_FAILED':
            case 'LOADFLOW_FAILED':
                updateAllIgms(status);
                break;
            default:
                break;
        }
    }

    function connectNotifications(processName) {
        console.info(`Connecting to notifications '${processName}'...`);

        const ws = connectNotificationsWebsocket(processName);
        ws.onmessage = function (event) {
            const message = JSON.parse(event.data);
            update(message);
            let minDate = '';
            let maxDate = '';
            const getProcessFromLocalStorage = getLocalStorageDateByProcess();
            if (getProcessFromLocalStorage) {
                let currentProcessExist = JSON.parse(
                    getProcessFromLocalStorage
                ).find((item) => item.name === props.name);
                if (currentProcessExist) {
                    minDate =
                        convertSearchDate(currentProcessExist.date) + minHour;
                    maxDate =
                        convertSearchDate(currentProcessExist.date) + maxHour;
                }
            } else {
                minDate = currentDateFormat() + minHour;
                maxDate = currentDateFormat() + maxHour;
            }

            fetchMergesByProcessAndDate(processName, minDate, maxDate).then(
                (merges) => {
                    if (merges.length > 0) {
                        mergesForTimeline(merges);
                        dispatch(currentMergesList(merges));
                    }
                }
            );
        };
        ws.onclose = function (event) {
            if (!websocketExpectedCloseRef.current) {
                console.error('Unexpected Notification WebSocket closed');
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }

    useEffect(() => {
        fetchMerges(props.name).then((merges) => {
            if (merges.length > 0) {
                const lastMerge = merges[merges.length - 1];
                dispatch(updateMergeDate(props.name, new Date(lastMerge.date)));
            } else {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                dispatch(updateMergeDate(props.name, null));
            }
        });

        websocketExpectedCloseRef.current = false;
        connectNotifications(props.name);
        return function () {
            websocketExpectedCloseRef.current = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.name]);

    return (
        <>
            <Timeline name={props.name} />
            <MergeMap igms={merge.igms}></MergeMap>
        </>
    );
};

Process.propTypes = {
    name: PropTypes.string.isRequired,
};

export default Process;
