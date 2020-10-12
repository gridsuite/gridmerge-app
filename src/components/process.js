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
import { connectNotificationsWebsocket, fetchMerges } from '../utils/api';
import {
    updateAllIgmsStatus,
    updateIgmStatus,
    updateMergeDate,
} from '../redux/actions';
import CountryStatesList from './country-state-list';

const Process = (props) => {
    const merge = useSelector((state) => state.merge);

    const websocketExpectedCloseRef = useRef();

    const dispatch = useDispatch();

    function updateIgm(tso, status) {
        dispatch(updateIgmStatus(props.name, tso.toLowerCase(), status));
    }

    function updateAllIgms(status) {
        dispatch(updateAllIgmsStatus(props.name, status));
    }

    function toIgmStatus(status) {
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
                // TODO
                break;
        }
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
        }
    }

    function connectNotifications(processName) {
        console.info(`Connecting to notifications '${processName}'...`);

        const ws = connectNotificationsWebsocket(processName);
        ws.onmessage = function (event) {
            const message = JSON.parse(event.data);
            update(message);
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
                lastMerge.igms.forEach((igm) => {
                    const status = lastMerge.status
                        ? lastMerge.status
                        : igm.status;
                    updateIgm(igm.tso, toIgmStatus(status));
                });
            } else {
                dispatch(updateMergeDate(props.name, null));
            }
        });

        websocketExpectedCloseRef.current = false;

        const ws = connectNotifications(props.name);

        return function () {
            websocketExpectedCloseRef.current = true;
            ws.close();
        };
    }, [props.name]);

    return (
        <MergeMap igms={merge.igms}>
            <div style={{ position: 'absolute', left: 8, top: 50, zIndex: 1 }}>
                <h2>{merge.date ? merge.date.toLocaleString() : ''}</h2>
            </div>
            <div
                style={{
                    position: 'absolute',
                    right: 8,
                    top: 66,
                    zIndex: 1,
                    width: 250,
                    height: 'calc( 100% - 66px )',
                    overflow: 'auto',
                }}
            >
                <CountryStatesList igms={merge.igms} />
            </div>
        </MergeMap>
    );
};

Process.propTypes = {
    name: PropTypes.string.isRequired,
};

export default Process;
