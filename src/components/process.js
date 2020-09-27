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
import { connectNotificationsWebsocket, fetchMergesByProcessAndDate } from '../utils/api';
import {
    updateAllIgmsStatus,
    updateIgmStatus,
    updateMergeDate,
    currentMergesList
} from '../redux/actions';

import { withStyles,makeStyles } from '@material-ui/styles';
import Slider from '@material-ui/core/Slider';
import ClockIcon from '../images/icons/clock.svg';
import TextField from '@material-ui/core/TextField';

import {FormattedMessage} from 'react-intl';

const marks = [
    { value: 60 },
    { value: 120 },
    { value: 180 },
    { value: 240 },
    { value: 300 },
    { value: 360 },
    { value: 420 },
    { value: 480 },
    { value: 540 },
    { value: 600 },
    { value: 660 },
    { value: 720 },
    { value: 780 },
    { value: 840 },
    { value: 900 },
    { value: 960 },
    { value: 1020 },
    { value: 1080 },
    { value: 1140 },
    { value: 1200 },
    { value: 1260 },
    { value: 1320 },
    { value: 1320 },
    { value: 1380 },
    { value: 1439 }
];

const useStyles = makeStyles((theme) => ({
    datePicker: {
        textAlign:'center',
        marginBottom: 20,
        position: 'absolute',
        top: 75,
        width: '100%',
        zIndex: 99
    },
    customSlider: {
        background: '#303030',
        padding: '50px 25px 20px 15px',
        position: 'absolute',
        top: 70,
        width: '100%'
    },
    emptyMerge : {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        top: 160,
        zIndex: 1,
        color: 'red'
    }
}));

const CustomSlider = withStyles((theme) => ({
    root: {
        color: '#676767',
        height: 9,
    },
    thumb: {
        height: 34,
        width: 34,
        zIndex: 3,
        backgroundColor: '#2f2f2f',
        backgroundImage: `url(${ClockIcon})`,
        backgroundSize: 'contain',
        marginTop: -12,
        marginLeft: -12,
        '&:focus,&:hover,&$active': {
            boxShadow: 'inherit',
        },
    },
    active: {},
    track: {
        height: 12,
        border: '1px solid white',
        zIndex: 2
    },
    mark: {
        backgroundColor: 'white',
        height: 20,
        width: 3,
        marginTop: -3,
        zIndex: 3
    },
    rail: {
        height: 12,
        border: '1px solid white',
        opacity: 1,
        backgroundColor: '#b5b5b5',
        zIndex: 2
    },
    markLabel: {
        top: 40,
        width: 35,
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        lineHeight: 1,
        textAlign: 'center',
        marginLeft: 4
    },
    valueLabel: {
        left : 0
    },
    [theme.breakpoints.down('xs')]: {
        root: {
            marginTop: 30
        },
        mark: {
            display: 'none'
        },
        track: {
            height: 9,
            borderTopWidth: 0,
        }
    }
}))(Slider);

let mergeListByHours = [];

let showMessage = false;

let firstStep = [];

const Process = (props) => {
    const merge = useSelector((state) => state.merge);

    const merges = useSelector((state) => state.merges);

    const websocketExpectedCloseRef = useRef();

    const dispatch = useDispatch();

    const classes = useStyles();

    const minHour = 'T00:00:00Z';

    const maxHour = 'T23:59:59Z';

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
            fetchMergesByProcessAndDate(processName, currentDateFormat() + minHour, currentDateFormat() + maxHour).then((merges) => {
                mergesForTimeline(merges);
                dispatch(currentMergesList(merges));
            });
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

    /**
     * Return current date in format YYYY-MM-DD, example: 2020-09-23
     * @returns {string}
     */
    const currentDateFormat = () => {
        const date = new Date();
        return date.toISOString().substr(0, 19).split('T')[0];
    }

    /**
     * Return array with hours convert to minutes
     */
    const mergesForTimeline = (merges) => {
        mergeListByHours = [];
        if (merges) {
            showMessage = false;
            merges.forEach((merge) => {
                const hour = merge.date.split('T')[1].split(':')[0];
                const min = merge.date.split('T')[1].split(':')[1];
                const marks = {
                    value: (hour * 60) + parseInt(min),
                    label: hour + 'h' + min
                };
                mergeListByHours.push(marks);
            });
            firstStep.push(mergeListByHours[0].value);
            return mergeListByHours;
        }
    }

    /**
     * Fetch merges by process name, min date and max date
     */
    const getMergesByProcessAndDate = (minDate, maxDate) => {
        mergeListByHours = [];
        firstStep.splice(0);
        fetchMergesByProcessAndDate(props.name, minDate, maxDate).then((merges) => {
            if (merges.length > 0) {
                showMessage = false;
                dispatch(currentMergesList(merges));
                mergesForTimeline(merges);

                const lastMerge = merges[merges.length - 1];

                dispatch(updateMergeDate(props.name, new Date(lastMerge.date)));
                lastMerge.igms.forEach((igm) => {
                    const status = lastMerge.status
                        ? lastMerge.status
                        : igm.status;
                    updateIgm(igm.tso, toIgmStatus(status));
                });
            } else {
                showMessage = true;
                firstStep.splice(0);
                firstStep.push(0);
                dispatch(updateMergeDate(props.name, new Date()));
            }
        })
    }

    /**
     * Send the new selected date in datepicker to fetch merges
     * @param e
     */
    const fetchMergesOnChangeDate = (e) => {
        const minDate = e.target.value + minHour;
        const maxDate = e.target.value + maxHour;
        mergeListByHours = [];
        dispatch(currentMergesList(''));
        getMergesByProcessAndDate(minDate, maxDate);
    }

    /**
     * Send the current date to fetch merges
     */
    const fetchMergesByCurrentDay = () => {
        const minDate = currentDateFormat() + minHour;
        const maxDate = currentDateFormat() + maxHour;
        getMergesByProcessAndDate(minDate, maxDate);
    }

    /**
     * Handler click when change slider position
     */
    const handleChangeSlider = (e, val) => {
        merges.forEach(merge => {
            firstStep=[];
            const convertHour = convertHoursToMinutes(merge);
            if (convertHour == val) {
                dispatch(updateMergeDate(props.name, new Date(merge.date)));
                if( merge.igms) {
                    merge.igms.forEach((igm) => {
                        const status = merge.status ? merge.status : igm.status;
                        updateIgm(igm.tso, toIgmStatus(status));
                    })
                }
            }
        });
    }

    /**
     * Convert total minutes to hours and minutes
     * @param value
     * @returns {string}
     */
    const valueLabelFormat = (value) => {
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return hours + 'h' + minutes;
    }

    /**
     * Convert simple hour to total minutes
     * @param merge
     * @returns {number}
     */
    const convertHoursToMinutes= (merge) => {
        const hour = merge.date.split('T')[1].split(':')[0];
        const min = merge.date.split('T')[1].split(':')[1];
        const convertHour = hour * 60 + parseInt(min);
        return convertHour;
    }

    useEffect(() => {
        fetchMergesByCurrentDay();

        const ws = connectNotifications(props.name);

        return function () {
            websocketExpectedCloseRef.current = true;
            ws.close();
        };
    }, [props.name]);

    return (
        <>
            <div className={classes.datePicker}>
                <TextField
                    id="date"
                    type="date"
                    onChange={fetchMergesOnChangeDate}
                    defaultValue={currentDateFormat()}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
            <div className={classes.customSlider}>
                <CustomSlider
                    defaultValue={firstStep}
                    marks={mergeListByHours}
                    onChangeCommitted={handleChangeSlider}
                    min={0}
                    step={null}
                    max={1439}
                    valueLabelFormat={valueLabelFormat}
                />
            </div>
            <div className={classes.emptyMerge}>
                { showMessage && (
                    <FormattedMessage id="MergesByDateIsEmpty" ></FormattedMessage>
                )}
            </div>
            <MergeMap igms={merge.igms}></MergeMap>
        </>
    );
};

Process.propTypes = {
    name: PropTypes.string.isRequired,
};

export default Process;
