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
import {
    updateMerges,
    updateProcessDate,
    updateSelectedMergeDate,
} from '../redux/actions';
import Timeline from './timeline';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/styles';
import moment from 'moment';
import DownloadButton from './stepper';
import CountryStatesList from './country-state-list';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
    datePicker: {
        textAlign: 'center',
        padding: '20px 0px 10px 0px',
        width: '100%',
        zIndex: 99,
    },
}));

const Process = (props) => {
    const classes = useStyles();

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
    }, [props.index, date]);

    const onDateChange = (e) => {
        dispatch(
            updateProcessDate(props.index, removeTime(new Date(e.target.value)))
        );
    };

    const formatDate = (date) => {
        return moment(date).format('YYYY-MM-DD');
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
        <Grid container direction="row" className={classes.main}>
            <Grid item xs={12} md={10} key="map">
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
