/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect } from 'react';

import PropTypes from 'prop-types';

import { useDispatch, useSelector } from 'react-redux';

import MergeMap from './merge-map';
import {
    connectNotificationsWebsocket,
    fetchMergesByProcessAndDate,
    removeTime,
} from '../utils/api';
import {
    updateMerges,
    updateProcessDate,
    updateSelectedMergeDate,
} from '../redux/actions';
import Timeline from './timeline';
import DownloadButton from './stepper';
import CountryStatesList from './country-state-list';
import Grid from '@material-ui/core/Grid';
import {
    KeyboardDatePicker,
    MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';

const Process = (props) => {
    const config = useSelector((state) => state.configs[props.index]);

    const date = useSelector((state) => state.processes[props.index].date);

    const merges = useSelector((state) => state.processes[props.index].merges);

    const selectedMergeDate = useSelector(
        (state) => state.processes[props.index].selectedMergeDate
    );

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.index, date]);

    const handleDateChange = (date) => {
        dispatch(updateProcessDate(props.index, removeTime(date)));
    };

    const mergeIndexChangeHandler = (newMergeIndex) => {
        dispatch(
            updateSelectedMergeDate(
                props.index,
                new Date(merges[newMergeIndex].date)
            )
        );
    };

    let mergeIndex;
    if (merges.length > 0 && selectedMergeDate) {
        mergeIndex = merges.findIndex(
            (merge) =>
                new Date(merge.date).getTime() === selectedMergeDate.getTime()
        );
    }
    if (!mergeIndex) {
        mergeIndex = 0;
    }
    const merge = merges[mergeIndex];

    return (
        <Grid container direction="row" justify="space-around">
            <Grid item xs={12} md={10} key="map">
                <Grid container justify="space-around">
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <KeyboardDatePicker
                            disableToolbar
                            variant="inline"
                            format="MM/dd/yyyy"
                            margin="normal"
                            value={date}
                            onChange={handleDateChange}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                            inputProps={{ readOnly: true }}
                        />
                    </MuiPickersUtilsProvider>
                </Grid>
                <Timeline
                    merges={merges}
                    mergeIndex={mergeIndex}
                    onMergeIndexChange={mergeIndexChangeHandler}
                />
                <MergeMap tsos={config.tsos} merge={merge} />
                <DownloadButton merge={merge} />
            </Grid>
            <Grid item xs={12} md={2} key="list">
                <CountryStatesList tsos={config.tsos} merge={merge} />
            </Grid>
        </Grid>
    );
};

Process.propTypes = {
    index: PropTypes.number.isRequired,
};

export default Process;
