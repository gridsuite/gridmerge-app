/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import { Box, Grid, Typography, ExpansionPanelSummary, Divider } from '@material-ui/core'
import DoneIcon from '@material-ui/icons/DoneOutlined';
import LoopIcon from '@material-ui/icons/LoopOutlined';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmptyOutlined';
import WarningIcon from '@material-ui/icons/WarningOutlined';
import MergeIcon from '@material-ui/icons/DoubleArrowOutlined';
import flagAL from '../images/flags/flags-iso/flat/svg/AL.svg';
import flagAT from '../images/flags/flags-iso/flat/svg/AT.svg';
import flagBA from '../images/flags/flags-iso/flat/svg/BA.svg';
import flagBE from '../images/flags/flags-iso/flat/svg/BE.svg';
import flagBG from '../images/flags/flags-iso/flat/svg/BG.svg';
import flagCH from '../images/flags/flags-iso/flat/svg/CH.svg';
import flagCZ from '../images/flags/flags-iso/flat/svg/CZ.svg';
import flagES from '../images/flags/flags-iso/flat/svg/ES.svg';
import flagFR from '../images/flags/flags-iso/flat/svg/FR.svg';
import flagDE from '../images/flags/flags-iso/flat/svg/DE.svg';
import flagGR from '../images/flags/flags-iso/flat/svg/GR.svg';
import flagHR from '../images/flags/flags-iso/flat/svg/HR.svg';
import flagHU from '../images/flags/flags-iso/flat/svg/HU.svg';
import flagIT from '../images/flags/flags-iso/flat/svg/IT.svg';
import flagME from '../images/flags/flags-iso/flat/svg/ME.svg';
import flagMK from '../images/flags/flags-iso/flat/svg/MK.svg';
import flagNL from '../images/flags/flags-iso/flat/svg/NL.svg';
import flagPL from '../images/flags/flags-iso/flat/svg/PL.svg';
import flagPT from '../images/flags/flags-iso/flat/svg/PT.svg';
import flagRO from '../images/flags/flags-iso/flat/svg/RO.svg';
import flagRS from '../images/flags/flags-iso/flat/svg/RS.svg';
import flagSI from '../images/flags/flags-iso/flat/svg/SI.svg';
import flagSK from '../images/flags/flags-iso/flat/svg/SK.svg';
import flagTR from '../images/flags/flags-iso/flat/svg/TR.svg';
import flagUA from '../images/flags/flags-iso/flat/svg/UA.svg';
import flagUnknown from '../images/flags/flags-iso/flat/svg/EU.svg';
import PropTypes from 'prop-types';
import './country-state-item.css';
import { withStyles } from '@material-ui/core/styles';

const styles = (theme) => ({
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
    flagIcon: {
        marginTop: 14,
        marginBottom: 14,
        verticalAlign: 'middle',
        marginRight: 8,
    },
    stateIcon: {
        backgroundColor: theme.palette.type === 'dark' ? '#303030' : '#FAFAFA',
        borderRadius:'50%',
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
        '-webkit-animation':'spin 1s linear infinite',
        '-moz-animation':'spin 1s linear infinite',
        animation: `spin 1s linear infinite`,
        color: '#009CD8'
    },
    waiting: {
        color: '#02538B',
    },
    divider: {
        marginTop: 4,
        color: '#ECF5FD'
    }
});

export const IgmStatus = {
    ABSENT: 'absent',
    AVAILABLE: 'available',
    VALID: 'valid',
    INVALID: 'invalid',
    MERGED: 'merged',
};

class CountryStateItem extends React.Component {

    detailsByCountry = (countryCode) => {
        switch (countryCode) {
            case "AL": return { countryName: "Albania", flagSrc: flagAL }
            case "AT": return { countryName: "Austria", flagSrc: flagAT }
            case "BA": return { countryName: "Bosnia and Herzegovina", flagSrc: flagBA }
            case "BE": return { countryName: "Belgium", flagSrc: flagBE }
            case "BG": return { countryName: "Bulgaria", flagSrc: flagBG }
            case "CH": return { countryName: "Switzerland", flagSrc: flagCH }
            case "CZ": return { countryName: "Czech Republic", flagSrc: flagCZ }
            case "DE": return { countryName: "Germany", flagSrc: flagDE }
            case "ES": return { countryName: "Spain", flagSrc: flagES }
            case "FR": return { countryName: "France", flagSrc: flagFR }
            case "GR": return { countryName: "Greece", flagSrc: flagGR }
            case "HR": return { countryName: "Croatia", flagSrc: flagHR }
            case "HU": return { countryName: "Hungary", flagSrc: flagHU }
            case "IT": return { countryName: "Italy", flagSrc: flagIT }
            case "ME": return { countryName: "Montenegro", flagSrc: flagME }
            case "MK": return { countryName: "North Macedonia", flagSrc: flagMK }
            case "NL": return { countryName: "Netherlands", flagSrc: flagNL }
            case "PL": return { countryName: "Poland", flagSrc: flagPL }
            case "PT": return { countryName: "Portugal", flagSrc: flagPT }
            case "RO": return { countryName: "Romania", flagSrc: flagRO }
            case "RS": return { countryName: "Serbia", flagSrc: flagRS }
            case "SI": return { countryName: "Slovenia", flagSrc: flagSI }
            case "SK": return { countryName: "Slovakia", flagSrc: flagSK }
            case "TR": return { countryName: "Turkey", flagSrc: flagTR }
            case "UA": return { countryName: "Ukraine", flagSrc: flagUA }
            default: return { countryName: "", flagSrc: flagUnknown }
        }
    }

    render() {
        const { classes } = this.props;
        return (
            <Box className={classes.listItem}>
                <Grid container>
                    <Grid item xs={12} style={{display: 'flex', width: '100%', padding: 8 }}>
                        {this.props.igm.status === IgmStatus.ABSENT ? <HourglassEmptyIcon className={`${classes.stateIcon} ${classes.waiting}`}/> :
                            this.props.igm.status === IgmStatus.AVAILABLE ? <LoopIcon className={`${classes.stateIcon} ${classes.loading}`}/> :
                                this.props.igm.status === IgmStatus.INVALID ? <WarningIcon className={`${classes.stateIcon} ${classes.error}`}/> :
                                    this.props.igm.status === IgmStatus.VALID ? <MergeIcon className={`${classes.stateIcon} ${classes.success}`}/> :
                                        this.props.igm.status === IgmStatus.MERGED ? <DoneIcon color="secondary" className={`${classes.stateIcon} ${classes.success}`}/> :
                                           ''}
                        <Box className={classes.textColumn}>
                            <Typography variant="body1">
                                {this.detailsByCountry(this.props.igm.tso.toUpperCase()).countryName}
                            </Typography>
                        </Box>
                        <img className={classes.flagIcon} alt="flag for country" height="23" width="32" src={this.detailsByCountry(this.props.igm.tso.toUpperCase()).flagSrc}/>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider className={classes.divider}/>
                    </Grid>
                </Grid>
            </Box>
        );
    }
}

CountryStateItem.propTypes = {
    classes: PropTypes.object.isRequired,
};

//eslint-disable-next-line
export default withStyles(styles)(CountryStateItem);