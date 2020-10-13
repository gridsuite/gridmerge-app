/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { useDispatch, useSelector } from 'react-redux';

import MergeMap from './merge-map';
import {
    connectNotificationsWebsocket,
    fetchMergesByProcessAndDate,
    removeTime,
} from '../utils/api';
import { updateMerges, updateProcessDate } from '../redux/actions';
import Timeline from './timeline';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/styles';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
    datePicker: {
        textAlign: 'center',
        margin: '15px 0',
        position: 'absolute',
        top: 75,
        width: '100%',
        zIndex: 99,
    },
}));

const Process = (props) => {
    const classes = useStyles();

    const config = useSelector((state) => state.configs[props.index]);

    const date = useSelector((state) => state.processes[props.index].date);

    const merges = useSelector((state) => state.processes[props.index].merges);

    const [mergeIndex, setMergeIndex] = useState(0);

    const dispatch = useDispatch();

    function update(message, processDate) {
        const headers = message.headers;
        const mergeDate = new Date(headers.date);
        // if same day as selected, reload merges from server
        if (removeTime(mergeDate).getTime() === processDate.getTime()) {
            loadMerges();
        }
    }

    function connectNotifications(processName, processDate) {
        console.info(`Connecting to notifications '${processName}'...`);

        const ws = connectNotificationsWebsocket(processName);
        ws.onmessage = function (event) {
            const message = JSON.parse(event.data);
            update(message, processDate);
        };
        ws.onclose = function (event) {
            console.info(
                `Disconnecting from notifications '${processName}'...`
            );
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }

    function loadMerges() {
        // load merges for the whole day so from 00:00 to 23:59
        const maxDate = new Date(date);
        maxDate.setMinutes(maxDate.getMinutes() + 60 * 24 - 1);
        fetchMergesByProcessAndDate(config.process, date, maxDate).then(
            (newMerges) => {
                if (mergeIndex >= newMerges.length) {
                    setMergeIndex(0);
                }
                dispatch(updateMerges(props.index, newMerges));
            }
        );
    }

    useEffect(() => {
        loadMerges();

        const ws = connectNotifications(config.process, date);

        return function () {
            ws.close();
        };
    }, [props.index, date]);

    const onDateChange = (e) => {
        dispatch(
            updateProcessDate(props.index, removeTime(new Date(e.target.value)))
        );
    };

    const formatDate = (date) => {
        return moment(date).format('YYYY-MM-DD');
    };

    const merge = merges.length > 0 ? merges[mergeIndex] : null;

    return (
        <>
            <div className={classes.datePicker}>
                <TextField
                    id="date"
                    type="date"
                    onChange={onDateChange}
                    value={formatDate(date)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
            <Timeline
                merges={merges}
                mergeIndex={mergeIndex}
                onMergeIndexChange={(newMergeIndex) =>
                    setMergeIndex(newMergeIndex)
                }
            />
            <MergeMap tsos={config.tsos} merge={merge} />
        </>
    );
};

Process.propTypes = {
    index: PropTypes.number.isRequired,
};

export default Process;
