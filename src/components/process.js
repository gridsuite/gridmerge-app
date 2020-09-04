/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import MergeMap, {IgmStatus} from "./merge-map";
import React, {useEffect, useRef} from "react";
import {connectNotificationsWebsocket} from "./api";
import PropTypes from "prop-types";

const Process = (props) => {

    const websocketExpectedCloseRef = useRef();

    function connectNotifications(processName) {
        console.info(`Connecting to notifications '${processName}'...`);

        const ws = connectNotificationsWebsocket(processName);
        ws.onmessage = function (event) {
            console.info(event);
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
        <MergeMap countries={['fr', 'be', 'es', 'pt']} config={{
            'fr':  {
                status: IgmStatus.ABSENT
            },
            'be': {
                status: IgmStatus.IMPORTED_VALID
            },
            'es': {
                status: IgmStatus.RECEIVED
            },
            'pt': {
                status: IgmStatus.MERGED
            }
        }}/>
    );
};

Process.propTypes = {
    name: PropTypes.string.isRequired
}

export default Process;
