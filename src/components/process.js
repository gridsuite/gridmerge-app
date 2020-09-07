/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useRef} from "react";

import PropTypes from "prop-types";

import {useDispatch, useSelector} from 'react-redux';

import MergeMap, {IgmStatus} from "./merge-map";
import {connectNotificationsWebsocket} from "./api";
import {updateCountryStatus, updateLastDate} from "../redux/actions";

const Process = (props) => {

    const websocketExpectedCloseRef = useRef();

    const lastDate = useSelector((state) => state.lastDate);

    const countries = useSelector((state) => state.countries);

    const dispatch = useDispatch();

    function update(message) {
        const date = message.headers.date;

        dispatch(updateLastDate(new Date(date)));

        if (message.headers.type === "TSO_IGM") {
            const countryName = message.headers.tso.toLowerCase();
            dispatch(updateCountryStatus(countryName, IgmStatus.IMPORTED_VALID));
        } else if (message.headers.type === "MERGE_PROCESS_FINISHED") {
            const headersTso = message.headers.tso;
            const countryNames = headersTso.substr(1, headersTso.length - 2).split(', '); // FIXME beurk...
            countryNames.forEach(countryName => {
                dispatch(updateCountryStatus(countryName.toLowerCase(), IgmStatus.MERGED));
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
        <MergeMap countries={countries}>
            <div style={{ position: 'absolute', left: 8, top: 50, zIndex: 1 }} >
                <h2>{lastDate ? lastDate.toLocaleString() : ""}</h2>
            </div>
        </MergeMap>
    );
};

Process.propTypes = {
    name: PropTypes.string.isRequired
}

export default Process;
