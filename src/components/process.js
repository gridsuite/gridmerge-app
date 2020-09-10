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
import {updateProcessLastDate, updateTsoStatus} from "../redux/actions";

const Process = (props) => {

    const websocketExpectedCloseRef = useRef();

    const dispatch = useDispatch();

    function update(message) {
        const date = message.headers.date;

        dispatch(updateProcessLastDate(props.name, new Date(date)));

        if (message.headers.type === "TSO_IGM") {
            const tso = message.headers.tso.toLowerCase();
            dispatch(updateTsoStatus(props.name, tso, IgmStatus.IMPORTED_VALID));
        } else if (message.headers.type === "MERGE_PROCESS_FINISHED") {
            const headersTso = message.headers.tso;
            const tsos = headersTso.substr(1, headersTso.length - 2).split(', '); // FIXME beurk...
            tsos.forEach(tso => {
                dispatch(updateTsoStatus(props.name, tso.toLowerCase(), IgmStatus.MERGED));
            })
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
        <MergeMap tsos={props.tsos}>
            <div style={{ position: 'absolute', left: 8, top: 50, zIndex: 1 }} >
                <h2>{props.date ? props.date.toLocaleString() : ""}</h2>
            </div>
        </MergeMap>
    );
};

Process.propTypes = {
    process: PropTypes.shape({
        name: PropTypes.string.isRequired,
        date: PropTypes.object.isRequired,
        tsos: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired
        })),
    })
}

export default Process;
