/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect } from 'react';

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
import { store } from '../redux/store';
import Timeline from './timeline';
import StepperWithStatus from './stepper';
import CountryStatesList from './country-state-list';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';

import {
    KeyboardDatePicker,
    MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { useSnackbar } from 'notistack';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    itemBusinessProcess: {
        margin: '20px',
    },
    businessProcess: {
        backgroundColor: theme.palette.background.paper,
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

    const { enqueueSnackbar } = useSnackbar();

    const loadMerges = useCallback(
        (date) => {
            // load merges for the whole day so from 00:00 to 23:59
            const maxDate = new Date(date);
            maxDate.setMinutes(maxDate.getMinutes() + 60 * 24 - 1);
            fetchMergesByProcessAndDate(config.process, date, maxDate)
                .then((newMerges) => {
                    dispatch(updateMerges(props.index, newMerges));
                })
                .catch((error) => {
                    enqueueSnackbar(error.message, {
                        variant: 'error',
                    });
                });
        },
        [dispatch, config.process, props.index, enqueueSnackbar]
    );

    const update = useCallback(
        (message) => {
            const headers = message.headers;
            const mergeDate = new Date(headers.date);

            // we need to directly access the store to get current process date as the wensocket message handler cannot
            // use react hooks
            const state = store.getState();
            const processDate = state.processes[props.index].date;

            // if same day as selected, reload merges from server
            if (removeTime(mergeDate).getTime() === processDate.getTime()) {
                loadMerges(processDate);
            }
        },
        [props.index, loadMerges]
    );

    const connectNotifications = useCallback(
        (processName, businessProcess) => {
            console.info(
                `Connecting to notifications for process : '${processName}' and business process : '${businessProcess}' ...`
            );

            const ws = connectNotificationsWebsocket(
                processName,
                businessProcess
            );
            ws.onmessage = function (event) {
                const message = JSON.parse(event.data);
                update(message);
            };
            ws.onclose = function (event) {
                console.info(
                    `Disconnecting from notifications for process : '${processName}' and business process : '${businessProcess}' ...`
                );
            };
            ws.onerror = function (event) {
                console.error('Unexpected Notification WebSocket error', event);
                enqueueSnackbar(event, { variant: 'error' });
            };
            return ws;
        },
        [update, enqueueSnackbar]
    );

    useEffect(() => {
        loadMerges(date);
    }, [config.process, date, loadMerges]);

    useEffect(() => {
        const ws = connectNotifications(config.process, config.businessProcess);

        return function () {
            ws.close();
        };
    }, [config.process, config.businessProcess, connectNotifications]);

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
    if (!mergeIndex || mergeIndex === -1) {
        mergeIndex = 0;
    }
    const merge = merges[mergeIndex];

    return (
        <Grid container direction="row" justify="space-around">
            <Grid item xs={12} md={10} key="map">
                <Grid container direction="row" justify="center">
                    <Grid
                        item
                        xs={12}
                        md={2}
                        key="businessProcess"
                        className={classes.itemBusinessProcess}
                    >
                        <Chip
                            label={config.businessProcess}
                            className={classes.businessProcess}
                        />
                    </Grid>
                    <Grid item xs={12} md={2} key="datePicker">
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
                </Grid>
                <Timeline
                    merges={merges}
                    mergeIndex={mergeIndex}
                    onMergeIndexChange={mergeIndexChangeHandler}
                />
                <MergeMap tsos={config.tsos} merge={merge} />
                <StepperWithStatus tsos={config.tsos} merge={merge} />
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
