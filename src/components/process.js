/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useRef} from "react";

import PropTypes from "prop-types";

import {useDispatch} from 'react-redux';

import MergeMap, {IgmStatus} from "./merge-map";
import {connectNotificationsWebsocket} from "../utils/api";
import {updateAllIgmsStatus, updateProcessLastDate, updateIgmStatus} from "../redux/actions";

const Process = (props) => {

    const websocketExpectedCloseRef = useRef();

    const dispatch = useDispatch();

    function updateIgm(tso, status) {
        dispatch(updateIgmStatus(props.name, tso.toLowerCase(), status));
    }

    function updateAllIgms(status) {
        dispatch(updateAllIgmsStatus(props.name, status));
    }

    function update(message) {
        const date = message.headers.date;

        dispatch(updateProcessLastDate(props.name, new Date(date)));

        switch (message.headers.status) {
            case 'AVAILABLE':
                updateIgm(message.headers.tso, IgmStatus.AVAILABLE);
                break;

            case 'VALIDATION_SUCCEED':
                updateIgm(message.headers.tso, IgmStatus.VALID);
                break;

            case 'VALIDATION_FAILED':
                updateIgm(message.headers.tso, IgmStatus.INVALID);
                break;

            case 'BALANCE_ADJUSTMENT_SUCCEED':
            case 'LOADFLOW_SUCCEED':
                updateAllIgms(IgmStatus.MERGED);
                break;

            case 'BALANCE_ADJUSTMENT_FAILED':
            case 'LOADFLOW_FAILED':
                // TODO
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
        websocketExpectedCloseRef.current = false;

        const ws = connectNotifications(props.name);

        return function () {
            websocketExpectedCloseRef.current = true;
            ws.close();
        };
    }, []);

    return (
        <MergeMap igms={props.igms}>
            <div style={{ position: 'absolute', left: 8, top: 50, zIndex: 1 }} >
                <h2>{props.date ? props.date.toLocaleString() : ""}</h2>
            </div>
        </MergeMap>
    );
};

Process.propTypes = {
    name: PropTypes.string.isRequired,
    date: PropTypes.object.isRequired,
    igms: PropTypes.arrayOf(PropTypes.shape({
        tso: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired
    }))
}

export default Process;
