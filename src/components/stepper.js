/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useState } from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import IconButton from '@material-ui/core/IconButton';
import Grid from '@material-ui/core/Grid';
import WarningOutlinedIcon from '@material-ui/icons/WarningOutlined';
import { FormattedMessage } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getExportMergeUrl, getIgmStatus, IgmStatus } from '../utils/api';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
    stepperContainer: {
        position: 'absolute',
        bottom: 0,
    },
    downloadLabelDisabled: {
        color: '#b5b5b5',
    },
    downloadBtn: {
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
    },
}));

const CustomStepper = withStyles({
    root: {
        padding: '53px 25px 35px 25px;',
    },
})(Stepper);

const StepperWithStatus = (props) => {
    const DownloadIframe = 'downloadIframe';
    const classes = useStyles();
    const [availableStep, setAvailableStep] = useState(false);
    const [validStep, setValidStep] = useState(false);
    const [mergedStep, setMergedStep] = useState(false);
    const [invalidStep, setInvalidStep] = useState(false);

    const handleClickExport = () => {
        console.info('Downloading merge ' + props.merge.process + '...');
        // The getTimezoneOffset() method returns the difference, in minutes, between UTC and local time.
        // The offset is positive if the local timezone is behind UTC and negative if it is ahead
        // On service side, the opposite behaviour is expected (offset is expected to be negative if the local timezone is behind UTC and positive if it is ahead)
        // This explains the "-" sign to get the expected offset value for the service
        window.open(
            getExportMergeUrl(
                props.merge.process,
                new Date(props.merge.date).toISOString(),
                -new Date().getTimezoneOffset()
            ),
            DownloadIframe
        );
    };

    const enableDisabledAllSteps = (value) => {
        setAvailableStep(value);
        setValidStep(value);
        setMergedStep(value);
        setInvalidStep(false);
    };

    const getStepsStatus = (available, valid, merge) => {
        setAvailableStep(available);
        setValidStep(valid);
        setMergedStep(merge);
    };

    const stepper = useCallback(() => {
        if (props.merge) {
            props.tsos.map((tso) => {
                const status = getIgmStatus(tso, props.merge);
                setInvalidStep(false);
                if (status === IgmStatus.MERGED) {
                    enableDisabledAllSteps(true);
                } else {
                    if (status === IgmStatus.AVAILABLE) {
                        getStepsStatus(true, false, false);
                    } else if (status === IgmStatus.VALID) {
                        getStepsStatus(true, true, false);
                    } else if (status === IgmStatus.INVALID) {
                        setAvailableStep(true);
                        setInvalidStep(true);
                        setMergedStep(false);
                    }
                }
                return status;
            });
        } else {
            enableDisabledAllSteps(false);
        }
    }, [props.merge, props.tsos]);

    useEffect(() => {
        stepper();
    }, [props.merge, stepper]);

    return (
        <Grid container direction="row" className={classes.stepperContainer}>
            <Grid item xs={12} md={10}>
                <CustomStepper>
                    <Step active={availableStep}>
                        <StepLabel>
                            <FormattedMessage id="available" />
                        </StepLabel>
                    </Step>
                    <Step active={validStep}>
                        {!invalidStep && (
                            <StepLabel>
                                <FormattedMessage id="validationSucceed" />
                            </StepLabel>
                        )}
                        {invalidStep && (
                            <StepLabel
                                StepIconComponent={WarningOutlinedIcon}
                                style={{ color: 'red' }}
                            >
                                <FormattedMessage id="validationFailed" />
                            </StepLabel>
                        )}
                    </Step>
                    <Step active={mergedStep}>
                        <StepLabel>
                            <FormattedMessage id="merged" />
                        </StepLabel>
                    </Step>
                </CustomStepper>
            </Grid>
            <Grid item xs={12} md={2} className={classes.downloadBtn}>
                <IconButton
                    aria-label="download"
                    style={{ width: '50px' }}
                    onClick={handleClickExport}
                    disabled={!mergedStep}
                >
                    <GetAppIcon fontSize="large" />
                </IconButton>
                <span
                    className={!mergedStep ? classes.downloadLabelDisabled : ''}
                    style={{ display: 'block' }}
                >
                    <FormattedMessage id="download" />
                    <span> CGM</span>
                </span>
                <iframe
                    title="download"
                    id={DownloadIframe}
                    name={DownloadIframe}
                    style={{ visibility: 'hidden', width: 0, height: 0 }}
                />
            </Grid>
        </Grid>
    );
};

StepperWithStatus.propTypes = {
    merge: PropTypes.shape({
        process: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
    }),
};

export default StepperWithStatus;
