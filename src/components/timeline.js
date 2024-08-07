/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Slider, withStyles } from '@mui/material';
import ClockIcon from '../images/clock.svg';
import PropTypes from 'prop-types';
import moment from 'moment';
import { PARAM_TIMELINE_DIAGONAL_LABELS } from '../utils/config-params';

const styles = {
    customSlider: {
        padding: '10px 20px',
        width: '100%',
        height: '60px',
    },
    obliqueLabels: {
        '& span.MuiSlider-markLabel': {
            transform: 'rotate(300deg)',
            width: 'auto',
            margin: '15px 0 0 -25px',
        },
    },
};

const EmptySlider = withStyles((theme) => ({
    root: {
        color: '#676767',
        height: 9,
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
    thumb: {
        backgroundColor: theme.palette.background.default,
    },
    markLabel: {
        top: 40,
        width: 40,
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        lineHeight: 1,
        textAlign: 'center',
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

const ClockSlider = withStyles((theme) => ({
    thumb: {
        height: 34,
        width: 34,
        zIndex: 3,
        backgroundColor: '#2f2f2f',
        backgroundSize: 'contain',
        backgroundImage: `url(${ClockIcon})`,
        marginTop: -12,
        marginLeft: -16,
        '&:focus,&:hover,&$active': {
            boxShadow: 'inherit',
        },
    },
}))(EmptySlider);

const Timeline = (props) => {
    const [marks, setMarks] = useState([]);

    const [value, setValue] = useState(null);

    const timelineDiagonalLabels = useSelector((state) => state[PARAM_TIMELINE_DIAGONAL_LABELS]);

    function findMergeIndex(value) {
        return marks.findIndex((mark) => mark.value === value);
    }

    function findMerge(value) {
        const mergeIndex = findMergeIndex(value);
        return props.merges[mergeIndex];
    }

    const formatMergeDate = (date) => {
        return moment(date).format('HH:mm');
    };

    const getValueLabelFormat = (value) => {
        const merge = findMerge(value);
        return merge ? formatMergeDate(new Date(merge.date)) : null;
    };

    /**
     * Handler click when change slider position
     */
    const handleSliderChange = (e, value) => {
        setValue(value);
        const newMergeIndex = findMergeIndex(value);
        props.onMergeIndexChange(newMergeIndex);
    };

    useEffect(() => {
        const marks = props.merges.map((merge) => {
            const date = new Date(merge.date);
            const hour = date.getHours();
            const min = date.getMinutes();
            return {
                value: hour * 60 + min,
                label: formatMergeDate(date),
            };
        });
        setMarks(marks);
    }, [props.merges]);

    useEffect(() => {
        setValue(props.merges.length > 0 && props.mergeIndex < marks.length ? marks[props.mergeIndex].value : null);
    }, [marks, props.mergeIndex, props.merges.length]);

    const empty = props.merges.length === 0;
    const TheSlider = empty ? EmptySlider : ClockSlider;

    return (
        <Box sx={styles.customSlider}>
            <TheSlider
                sx={timelineDiagonalLabels ? styles.obliqueLabels : undefined}
                value={value}
                marks={marks}
                onChangeCommitted={handleSliderChange}
                min={0}
                step={null}
                max={24 * 60 - 1}
                valueLabelFormat={getValueLabelFormat}
                disabled={empty}
            />
        </Box>
    );
};

Timeline.propTypes = {
    merges: PropTypes.arrayOf(
        PropTypes.shape({
            date: PropTypes.string,
        })
    ),
    mergeIndex: PropTypes.number.isRequired,
    onMergeIndexChange: PropTypes.func.isRequired,
};

export default Timeline;
