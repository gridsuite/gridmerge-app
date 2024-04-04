/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    Switch,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { updateConfigParameter } from '../utils/rest-api';
import { PARAM_TIMELINE_DIAGONAL_LABELS } from '../utils/config-params';
import { useSnackMessage } from '@gridsuite/commons-ui';

const classes = {
    controlItem: {
        justifyContent: 'flex-end',
    },
    button: {
        marginBottom: '30px',
    },
};

export function useParameterState(paramName) {
    const { snackError } = useSnackMessage();

    const paramGlobalState = useSelector((state) => state[paramName]);

    const [paramLocalState, setParamLocalState] = useState(paramGlobalState);

    useEffect(() => {
        setParamLocalState(paramGlobalState);
    }, [paramGlobalState]);

    const handleChangeParamLocalState = useCallback(
        (value) => {
            setParamLocalState(value);
            updateConfigParameter(paramName, value).catch((error) => {
                setParamLocalState(paramGlobalState);
                snackError({
                    messageTxt: error.message,
                    headerId: 'paramsChangingError',
                });
            });
        },
        [paramName, snackError, setParamLocalState, paramGlobalState]
    );

    return [paramLocalState, handleChangeParamLocalState];
}

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

function GUITab() {
    const [timelineDiagonalLabelLocal, handleChangeTimelineDiagonalLabelLocal] =
        useParameterState(PARAM_TIMELINE_DIAGONAL_LABELS);

    return (
        <Grid container spacing={2} sx={classes.grid}>
            <Grid item xs={8}>
                <Typography component="span" variant="body1">
                    <Box fontWeight="fontWeightBold" m={1}>
                        <FormattedMessage id="timelineDiagonalLabels" />
                    </Box>
                </Typography>
            </Grid>
            <Grid item container xs={4} sx={classes.controlItem}>
                <Switch
                    checked={timelineDiagonalLabelLocal}
                    onChange={(event) => {
                        handleChangeTimelineDiagonalLabelLocal(
                            event.target.value !== 'true'
                        );
                    }}
                    value={timelineDiagonalLabelLocal}
                    color="primary"
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                />
            </Grid>
        </Grid>
    );
}

const Parameters = ({ showParameters, hideParameters }) => {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <Dialog
            open={showParameters}
            onClose={hideParameters}
            aria-labelledby="form-dialog-title"
            maxWidth={'md'}
            fullWidth={true}
        >
            <DialogTitle id="form-dialog-title">
                <Typography component="span" variant="h5" sx={classes.title}>
                    <FormattedMessage id="parameters" />
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Container maxWidth="md">
                    <Tabs
                        value={tabIndex}
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        onChange={(event, newValue) => setTabIndex(newValue)}
                        aria-label="parameters"
                    >
                        <Tab label={<FormattedMessage id="gui" />} />
                    </Tabs>

                    <TabPanel value={tabIndex} index={0}>
                        <GUITab />
                    </TabPanel>

                    <Grid item xs={12}>
                        <Button
                            onClick={hideParameters}
                            variant="contained"
                            color="primary"
                            sx={classes.button}
                        >
                            <FormattedMessage id="close" />
                        </Button>
                    </Grid>
                </Container>
            </DialogContent>
        </Dialog>
    );
};

export default Parameters;
