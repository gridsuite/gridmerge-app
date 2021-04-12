/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import { Box, Divider, Grid, Typography } from '@material-ui/core';
import LensIcon from '@material-ui/icons/Lens';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { getIgmStatus, MergeType } from '../utils/rest-api';
import { getDetailsByCountryOrTso } from '../utils/tso-country-details';
import { tsoColor } from './merge-map';
import { useIntl } from 'react-intl';

const useStyles = makeStyles((theme) => ({
    tsosColumn: {
        flexGrow: 1,
        width: 80,
        whiteSpace: 'nowrap',
        marginLeft: 12,
    },
    textReplace: {
        flexGrow: 1,
        width: 80,
        whiteSpace: 'nowrap',
    },
    stateIcon: {
        height: 32,
        width: 32,
        marginTop: 8,
    },
    listItem: {
        backgroundColor: theme.palette.background.paper,
    },
    divider: {
        marginTop: 4,
        color: '#ECF5FD',
    },
    smallText: theme.typography.caption,
}));

const CountryStateItem = (props) => {
    const classes = useStyles();
    const intl = useIntl();

    const detail = getDetailsByCountryOrTso(props.tso.toUpperCase());

    const status = getIgmStatus(props.tso, props.merge);
    const color = tsoColor(status);
    const replacingDate = status.replacingDate
        ? new Date(status.replacingDate).toLocaleString()
        : undefined;

    return (
        <Box className={classes.listItem}>
            <Grid container>
                <Grid
                    item
                    xs={12}
                    style={{ display: 'flex', width: '100%', padding: 8 }}
                >
                    <LensIcon
                        className={classes.stateIcon}
                        style={{ color: color }}
                    />
                    <Box className={classes.tsosColumn}>
                        <Typography variant="body1">{props.tso}</Typography>
                        <Typography variant="caption">
                            {detail.countryName}
                        </Typography>
                    </Box>
                    {replacingDate && (
                        <Box className={classes.textReplace}>
                            <Typography
                                variant="body1"
                                className={classes.smallText}
                            >
                                {intl.formatMessage({ id: 'ReplacedWith' })}
                            </Typography>
                            <Typography variant="caption">
                                {replacingDate}
                            </Typography>
                        </Box>
                    )}
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
