/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box, Divider, Grid, Typography } from '@mui/material';
import LensIcon from '@mui/icons-material/Lens';
import PropTypes from 'prop-types';
import { getIgmStatus, MergeType } from '../utils/rest-api';
import { getDetailsByCountryOrTso } from '../utils/tso-country-details';
import { tsoColor } from './merge-map';
import { useIntl } from 'react-intl';

const styles = {
    tsosColumn: {
        flexGrow: 1,
        width: 80,
        whiteSpace: 'nowrap',
        marginLeft: 12,
    },
    textReplace: {
        flexGrow: 1,
        width: 120,
        whiteSpace: 'nowrap',
    },
    stateIcon: {
        height: 32,
        width: 32,
        marginTop: 8,
    },
    listItem: (theme) => ({
        backgroundColor: theme.palette.background.paper,
    }),
    divider: {
        marginTop: 4,
        color: '#ECF5FD',
    },
    smallText: (theme) => theme.typography.caption,
};

const CountryStateItem = (props) => {
    const intl = useIntl();

    const detail = getDetailsByCountryOrTso(props.tso.toUpperCase());

    const status = getIgmStatus(props.tso, props.merge);
    const color = tsoColor(status);

    let replacedWith = status.replacingBusinessProcess ? status.replacingBusinessProcess + ' ' : '';
    if (status.replacingDate) {
        replacedWith += new Date(status.replacingDate).toLocaleString();
    }
    return (
        <Box sx={styles.listItem}>
            <Grid container>
                <Grid item xs={12} style={{ display: 'flex', width: '100%', padding: 8 }}>
                    <LensIcon sx={styles.stateIcon} style={{ color: color }} />
                    <Box sx={styles.tsosColumn}>
                        <Typography variant="body1">{props.tso}</Typography>
                        <Typography variant="caption">{detail.countryName}</Typography>
                    </Box>
                    {replacedWith && (
                        <Box sx={styles.textReplace}>
                            <Typography variant="body1" sx={styles.smallText}>
                                {intl.formatMessage({ id: 'ReplacedWith' })}
                            </Typography>
                            <Typography variant="body1" sx={styles.smallText}>
                                {replacedWith}
                            </Typography>
                        </Box>
                    )}
                </Grid>
                <Grid item xs={12}>
                    <Divider sx={styles.divider} />
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
