/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';

import { FormattedMessage } from 'react-intl';

import { useDispatch, useSelector } from 'react-redux';

import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';

import { DARK_THEME, LIGHT_THEME, selectTheme } from '../redux/actions';

import { Popup } from '@gridsuite/commons-ui';

const useStyles = makeStyles((theme) => ({
    controlItem: {
        justifyContent: 'flex-end',
    },
}));

const Parameters = ({ showParameters, hideParameters }) => {
    const dispatch = useDispatch();

    const classes = useStyles();

    const [tabIndex, setTabIndex] = React.useState(0);

    const theme = useSelector((state) => state.theme);

    const handleChangeTheme = (event) => {
        const theme = event.target.value;
        dispatch(selectTheme(theme));
    };

    function TabPanel(props) {
        const { children, value, index, ...other } = props;

        return (
            <Typography
                component="div"
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
            >
                {value === index && <Box p={3}>{children}</Box>}
            </Typography>
        );
    }

    function GeneralTab() {
        return (
            <Grid container spacing={2} className={classes.grid}>
                <Grid item xs={6}>
                    <Typography component="span" variant="body1">
                        <Box fontWeight="fontWeightBold" m={1}>
                            <FormattedMessage id="theme" />:
                        </Box>
                    </Typography>
                </Grid>
                <Grid item container xs={6} className={classes.controlItem}>
                    <RadioGroup row value={theme} onChange={handleChangeTheme}>
                        <FormControlLabel
                            value={DARK_THEME}
                            control={<Radio color="primary" />}
                            label={DARK_THEME}
                        />
                        <FormControlLabel
                            value={LIGHT_THEME}
                            control={<Radio color="primary" />}
                            label={LIGHT_THEME}
                        />
                    </RadioGroup>
                </Grid>
            </Grid>
        );
    }

    function PopupContent() {
        return (
            <Container maxWidth="md">
                <Tabs
                    value={tabIndex}
                    indicatorColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    onChange={(event, newValue) => setTabIndex(newValue)}
                    aria-label="parameters"
                >
                    <Tab label={<FormattedMessage id="General" />} />
                </Tabs>

                <TabPanel value={tabIndex} index={0}>
                    <GeneralTab />
                </TabPanel>
            </Container>
        );
    }

    return (
        <Popup
            open={showParameters}
            setOpen={hideParameters}
            onClose={hideParameters}
            maxWidth={'md'}
            fullWidth={true}
            popupTitle={<FormattedMessage id="parameters" />}
            popupContent={<PopupContent />}
            showPopupTitle={true}
            showPopupActions={true}
            showSingleBtn={true}
            showSingleBtnInLeft={true}
            customTextCancelBtn={<FormattedMessage id="close" />}
        ></Popup>
    );
};

export default Parameters;
