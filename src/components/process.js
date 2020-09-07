/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useRef, useState} from "react";

import PropTypes from "prop-types";

import MergeMap, {IgmStatus} from "./merge-map";
import {connectNotificationsWebsocket} from "./api";

const countries = ['be', 'nl'];

const Process = (props) => {

    const websocketExpectedCloseRef = useRef();

    const [lastDate, setLastDate] = useState(null);

    const [config, setConfig] = useState(initConfig());

    function initConfig() {
        let config = {};
        countries.forEach(country => {
            config[country] = {
                status: IgmStatus.ABSENT
            };
        });
        return config;
    }

    function update(message) {
        const date = message.headers.date;

        // reinit map in case of new date
        if (lastDate == null) {
            setLastDate(new Date(date));
            setConfig(initConfig());
        }
        if (message.headers.type === "TSO_IGM") {
            const tso = message.headers.tso.toLowerCase();
            config[tso].status = IgmStatus.IMPORTED_VALID;
            setConfig(config);
        } else if (message.headers.type === "MERGE_PROCESS_FINISHED") {
            const tso = message.headers.tso;
            const tsos = tso.substr(1, tso.length - 2).split(', '); // FIXME beurk...
            tsos.forEach(tso => {
                config[tso.toLowerCase()].status = IgmStatus.MERGED;
            })
            setConfig(config);
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
        <MergeMap countries={countries} config={config}>
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
