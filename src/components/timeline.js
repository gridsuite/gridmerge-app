/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { withStyles, makeStyles } from '@material-ui/styles';
import Slider from '@material-ui/core/Slider';
import ClockIcon from '../images/icons/clock.svg';
import TextField from '@material-ui/core/TextField';

import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { fetchMergesByProcessAndDate } from '../utils/api';
import {
    currentMergesList,
    updateIgmStatus,
    updateMergeDate,
    currentSearchDateByProcess,
} from '../redux/actions';
import { getLocalStorageDateByProcess } from '../redux/local-storage';
import { toIgmStatus } from './process';

// eslint-disable-next-line
const useStyles = makeStyles((theme) => ({
    datePicker: {
        textAlign: 'center',
        marginBottom: 20,
        position: 'absolute',
        top: 75,
        width: '100%',
        zIndex: 99,
    },
    customSlider: {
        padding: '50px 25px 20px 15px',
        position: 'absolute',
        top: 70,
        width: '100%',
        background: '#303030',
    },
    emptyMerge: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        top: 125,
        zIndex: 1,
        color: 'red',
    },
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
        zIndex: 2,
    },
    mark: {
        backgroundColor: 'white',
        height: 20,
        width: 3,
        marginTop: -3,
        zIndex: 3,
    },
    rail: {
        height: 12,
        border: '1px solid white',
        opacity: 1,
        backgroundColor: '#b5b5b5',
        zIndex: 2,
    },
    markLabel: {
        top: 40,
        width: 35,
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        lineHeight: 1,
        textAlign: 'center',
        marginLeft: 4,
    },
    valueLabel: {
        left: 0,
    },
    [theme.breakpoints.down('xs')]: {
        root: {
            marginTop: 30,
        },
        mark: {
            display: 'none',
        },
        track: {
            height: 9,
            borderTopWidth: 0,
        },
    },
}))(Slider);

let mergeListByHours = [];
let firstStep = 0;

/**
 * Return array with hours convert to minutes
 */
export function mergesForTimeline(merges) {
    if (merges) {
        merges.forEach((merge) => {
            const date = new Date(merge.date.toLocaleString());
            const hour = date.getHours();
            const min = date.getMinutes();
            const marks = {
                value: hour * 60 + parseInt(min),
                label: hour + 'h' + min,
            };
            mergeListByHours.push(marks);
        });
        return mergeListByHours;
    }
}

/**
 * Return current date in format YYYY-MM-DD, example: 2020-09-23
 * @returns {string}
 */
export function currentDateFormat() {
    const date = new Date();
    return date.toISOString().substr(0, 19).split('T')[0];
}

/**
 * Get date from timestamp format with momentjs
 * @param selectedDate
 * @returns {*|string}
 */
export function convertSearchDate(selectedDate) {
    return moment(selectedDate).format('YYYY-MM-DD');
}

const Timeline = (props) => {
    const merges = useSelector((state) => state.merges);
    const configs = useSelector((state) => state.configs);
    const [showMessage, setShowMessage] = useState(false);
    const dispatch = useDispatch();
    const classes = useStyles();
    const minHour = 'T00:00:00Z';
    const maxHour = 'T23:59:59Z';

    function updateIgm(tso, status) {
        dispatch(updateIgmStatus(props.name, tso.toLowerCase(), status));
    }

    /**
     * Get TSO by merge
     */
    /*eslint array-callback-return: */
    const getTsoByMerge = () => {
        configs.map((item) => {
            if (item.process === props.name) {
                item.tsos.map((status) => {
                    return updateIgm(status, 'LOADFLOW_FAILED');
                });
            }
        });
    };

    /**
     * Fetch merges by process name, min date and max date
     */
    const getMergesByProcessAndDate = (minDate, maxDate) => {
        mergeListByHours = [];
        fetchMergesByProcessAndDate(props.name, minDate, maxDate).then(
            (merges) => {
                if (merges.length > 0) {
                    setShowMessage(false);
                    dispatch(currentMergesList(merges));
                    mergesForTimeline(merges);
                    firstStep = convertHoursToMinutes(merges[0]);

                    const lastMerge = merges[merges.length - 1];
                    dispatch(
                        updateMergeDate(props.name, new Date(lastMerge.date))
                    );
                    lastMerge.igms.forEach((igm) => {
                        const status = lastMerge.status
                            ? lastMerge.status
                            : igm.status;
                        updateIgm(igm.tso, toIgmStatus(status));
                    });
                } else {
                    setShowMessage(true);
                    dispatch(updateMergeDate(props.name, null));
                    getTsoByMerge();
                }
            }
        );
    };

    /**
     * Send the new selected date in datepicker to fetch merges
     * @param e
     */
    const fetchMergesOnChangeDate = (e) => {
        const minDate = e.target.value + minHour;
        const maxDate = e.target.value + maxHour;
        getMergesByProcessAndDate(minDate, maxDate);
        dispatch(
            currentSearchDateByProcess(e.target.value + minHour, props.name)
        );
    };

    /**
     * Send the current date to fetch merges
     */
    const fetchMergesByCurrentDay = () => {
        const getProcessFromLocalStorage = getLocalStorageDateByProcess();
        if (getProcessFromLocalStorage) {
            let currentProcessExist = JSON.parse(
                getProcessFromLocalStorage
            ).find((item) => item.name === props.name);
            if (currentProcessExist) {
                const minDate =
                    convertSearchDate(currentProcessExist.date) + minHour;
                const maxDate =
                    convertSearchDate(currentProcessExist.date) + maxHour;
                getMergesByProcessAndDate(minDate, maxDate);
            }
        } else {
            const minDate = currentDateFormat() + minHour;
            const maxDate = currentDateFormat() + maxHour;
            getMergesByProcessAndDate(minDate, maxDate);
        }
    };

    /**
     * Handler click when change slider position
     */
    const handleChangeSlider = (e, val) => {
        firstStep = val;
        merges.forEach((merge) => {
            const convertHour = convertHoursToMinutes(merge);
            if (convertHour === val) {
                dispatch(updateMergeDate(props.name, new Date(merge.date)));
                if (merge.igms) {
                    merge.igms.forEach((igm) => {
                        const status = merge.status ? merge.status : igm.status;
                        updateIgm(igm.tso, toIgmStatus(status));
                    });
                }
            }
        });
    };

    /**
     * Convert total minutes to hours and minutes
     * @param value
     * @returns {string}
     */
    const valueLabelFormat = (value) => {
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return hours + 'h' + minutes;
    };

    /**
     * Convert simple hour to total minutes
     * @param merge
     * @returns {number}
     */
    const convertHoursToMinutes = (merge) => {
        const date = new Date(merge.date.toLocaleString());
        const hour = date.getHours();
        const min = date.getMinutes();
        const convertHour = hour * 60 + parseInt(min);
        return convertHour;
    };

    /**
     * Set date to datepicker from localstorage if not empty else set current date
     * @returns {string|*}
     */
    const setDateToDatePicker = () => {
        const getProcessFromLocalStorage = getLocalStorageDateByProcess();
        if (getProcessFromLocalStorage) {
            const processExist = JSON.parse(getProcessFromLocalStorage).find(
                (item) => item.name === props.name
            );
            if (processExist) {
                return convertSearchDate(processExist.date);
            }
        } else {
            return currentDateFormat();
        }
    };

    useEffect(() => {
        fetchMergesByCurrentDay();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.name]);

    return (
        <>
            <div className={classes.datePicker}>
                <TextField
                    id="date"
                    type="date"
                    onChange={fetchMergesOnChangeDate}
                    value={setDateToDatePicker()}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
            {showMessage ? (
                <div className={classes.emptyMerge}>
                    <FormattedMessage id="MergesByDateIsEmpty"></FormattedMessage>
                </div>
            ) : (
                <div className={classes.customSlider}>
                    <CustomSlider
                        value={firstStep}
                        marks={mergeListByHours}
                        onChangeCommitted={handleChangeSlider}
                        min={0}
                        step={null}
                        max={1439}
                        valueLabelFormat={valueLabelFormat}
                    />
                </div>
            )}
        </>
    );
};

export default Timeline;
