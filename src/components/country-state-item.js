/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import { Box, Divider, Grid, Typography } from '@material-ui/core';
import DoneIcon from '@material-ui/icons/DoneOutlined';
import LoopIcon from '@material-ui/icons/LoopOutlined';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmptyOutlined';
import WarningIcon from '@material-ui/icons/WarningOutlined';
import MergeIcon from '@material-ui/icons/DoubleArrowOutlined';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
    getIgmStatus,
    IgmStatus,
    MergeType,
    CgmStatus,
} from '../utils/rest-api';
import { getDetailsByCountryOrTso } from '../utils/tso-country-details';

const useStyles = makeStyles((theme) => ({
    textColumn: {
        flexGrow: 1,
        width: 80,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        marginTop: 14,
        marginLeft: 16,
    },
    success: {
        color: '#37AE4B',
    },
    error: {
        color: '#D8404D',
    },
    warning: {
        color: '#FFA500',
    },
    flagIcon: {
        marginTop: 14,
        marginBottom: 14,
        verticalAlign: 'middle',
        marginRight: 8,
    },
    stateIcon: {
        backgroundColor: theme.palette.type === 'dark' ? '#303030' : '#FAFAFA',
        borderRadius: '50%',
        height: 48,
        width: 48,
        padding: 8,
        marginTop: 4,
        marginLeft: 4,
    },
    listItem: {
        backgroundColor: theme.palette.background.paper,
    },
    loading: {
        animation: '$spin 1000ms infinite',
        color: '#009CD8',
    },
    '@keyframes spin': {
        '0%': {
            transform: 'rotate(0deg)',
        },
        '100%': {
            transform: 'rotate(-360deg)',
        },
    },
    waiting: {
        color: '#02538B',
    },
    divider: {
        marginTop: 4,
        color: '#ECF5FD',
    },
}));

const CountryStateIcon = (props) => {
    const classes = useStyles();

    const status = props.status.status;
    const cgmStatus = props.status.cgmStatus;

    let colorClass = classes.success;
    if (cgmStatus === CgmStatus.VALID_WARNING) {
        colorClass = classes.warning;
    } else if (cgmStatus === CgmStatus.INVALID) {
        colorClass = classes.error;
    }

    return status === IgmStatus.ABSENT ? (
        <HourglassEmptyIcon
            className={`${classes.stateIcon} ${classes.waiting}`}
        />
    ) : status === IgmStatus.AVAILABLE ? (
        <LoopIcon className={`${classes.stateIcon} ${classes.loading}`} />
    ) : status === IgmStatus.INVALID ? (
        <WarningIcon className={`${classes.stateIcon} ${classes.error}`} />
    ) : status === IgmStatus.VALID ? (
        <MergeIcon className={`${classes.stateIcon} ${classes.success}`} />
    ) : status === IgmStatus.MERGED ? (
        <DoneIcon
            color="secondary"
            className={`${classes.stateIcon} ${colorClass}`}
        />
    ) : (
        ''
    );
};

const CountryStateItem = (props) => {
    const classes = useStyles();

    const detail = getDetailsByCountryOrTso(props.tso.toUpperCase());

    const status = getIgmStatus(props.tso, props.merge);

    return (
        <Box className={classes.listItem}>
            <Grid container>
                <Grid
                    item
                    xs={12}
                    style={{ display: 'flex', width: '100%', padding: 8 }}
                >
                    <CountryStateIcon status={status} />
                    <Box className={classes.textColumn}>
                        <Typography variant="body1">
                            {detail.countryName}
                        </Typography>
                    </Box>
                    <img
                        className={classes.flagIcon}
                        alt="flag for country"
                        height="23"
                        width="32"
                        src={detail.flagSrc}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Divider className={classes.divider} />
                </Grid>
            </Grid>
        </Box>
    );
};

CountryStateItem.propTypes = {
    tso: PropTypes.string.isRequired,
    merge: MergeType,
};

export default CountryStateItem;
