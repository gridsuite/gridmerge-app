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
import { FormattedMessage } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';
import BuildIcon from '@material-ui/icons/Build';
import {
    getExportMergeUrl,
    getIgmStatus,
    IgmStatus,
    replaceIGM,
} from '../utils/api';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useIntl } from 'react-intl';

const useStyles = makeStyles((theme) => ({
    stepperContainer: {
        position: 'absolute',
        bottom: '15px',
    },
    downloadLabelDisabled: {
        color: '#b5b5b5',
        display: 'block',
        fontSize: '14px',
        lineHeight: '1',
    },
    downloadLabelEnable: {
        display: 'block',
        fontSize: '14px',
        lineHeight: '1',
    },
    downloadContainer: {
        textAlign: 'center',
        marginLeft: '5px',
        backgroundColor: theme.palette.background.paper,
    },
    stepLabel: {
        fontSize: '16px',
    },
    downloadIcon: {
        fontSize: '50px',
    },
    downloadButton: {
        padding: '3px',
    },
    iframe: {
        visibility: 'hidden',
        width: 0,
        height: 0,
    },
    [theme.breakpoints.down('xs') && theme.breakpoints.down('sm')]: {
        downloadContainer: {
            minHeight: '120px',
        },
        replaceIGMContainer: {
            minHeight: '120px',
        },
    },
    replaceIGMContainer: {
        textAlign: 'center',
        marginRight: '5px',
        backgroundColor: theme.palette.background.paper,
    },
    replaceIGMButton: {
        padding: '3px',
    },
    replaceIGMIcon: {
        fontSize: '50px',
    },
    replaceIGMLabelDisabled: {
        color: '#b5b5b5',
        display: 'block',
        fontSize: '14px',
        lineHeight: '1',
    },
    replaceIGMLabelEnabled: {
        display: 'block',
        fontSize: '14px',
        lineHeight: '1',
    },
}));

const CustomStepper = withStyles({
    root: {
        padding: '30px 15px 25px 15px',
    },
})(Stepper);

const CustomStepLabel = withStyles({
    label: {
        fontSize: '16px',
    },
})(StepLabel);

const StepperWithStatus = (props) => {
    const intl = useIntl();
    const DownloadIframe = 'downloadIframe';
    const classes = useStyles();
    const [availableStep, setAvailableStep] = useState(false);
    const [validStep, setValidStep] = useState(false);
    const [mergedStep, setMergedStep] = useState(false);
    const [replaceIGMEnabled, setReplaceIGMEnabled] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

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

    const handleReplaceIGM = () => {
        console.info('Replacing IGM ' + props.merge.process + '...');
        replaceIGM(props.merge.process, props.merge.date).then((res) => {
            if (res == null || Object.keys(res).length === 0) {
                const errorMessage = intl.formatMessage({
                    id: 'noReplacingIGMAvailable',
                });
                enqueueSnackbar(errorMessage, {
                    variant: 'info',
                });
            }
        });
    };

    const allStatusEqualValueArray = (arr) =>
        arr.every((v) => v.status === arr[0].status);

    const enableDisabledAllSteps = (value) => {
        setAvailableStep(value);
        setValidStep(value);
        setMergedStep(value);
    };

    const getStepsStatus = (available, valid, merge) => {
        setAvailableStep(available);
        setValidStep(valid);
        setMergedStep(merge);
    };

    const stepper = useCallback(() => {
        if (props.merge) {
            const allStatus = props.tsos.map((tso) => {
                return getIgmStatus(tso, props.merge);
            });
            if (allStatusEqualValueArray(allStatus)) {
                if (
                    allStatus[allStatus.length - 1].status === IgmStatus.MERGED
                ) {
                    enableDisabledAllSteps(true);
                } else if (
                    allStatus[allStatus.length - 1].status === IgmStatus.VALID
                ) {
                    getStepsStatus(true, true, false);
                }
            } else if (
                allStatus.some(
                    (s) =>
                        s.status === IgmStatus.AVAILABLE ||
                        s.status === IgmStatus.VALID
                )
            ) {
                getStepsStatus(true, false, false);
            }

            if (
                allStatus.some(
                    (s) =>
                        s.status === IgmStatus.INVALID ||
                        s.status === IgmStatus.ABSENT
                ) &&
                !allStatus.some((s) => s.status === IgmStatus.AVAILABLE)
            ) {
                setReplaceIGMEnabled(true);
            } else {
                setReplaceIGMEnabled(false);
            }
            // TODO : error cases
        } else {
            enableDisabledAllSteps(false);
            setReplaceIGMEnabled(false);
        }
    }, [props.merge, props.tsos]);

    useEffect(() => {
        stepper();
    }, [stepper]);

    return (
        <Grid container direction="row" className={classes.stepperContainer}>
            <Grid item xs={12} md={2}></Grid>
            <Grid item xs={12} md={1} className={classes.replaceIGMContainer}>
                <IconButton
                    aria-label="replace"
                    className={classes.replaceIGMButton}
                    onClick={handleReplaceIGM}
                    disabled={!replaceIGMEnabled}
                >
                    <BuildIcon
                        fontSize="large"
                        className={classes.replaceIGMIcon}
                    />
                </IconButton>
                <span
                    className={
                        !replaceIGMEnabled
                            ? classes.replaceIGMLabelDisabled
                            : classes.replaceIGMLabelEnabled
                    }
                >
                    <FormattedMessage id="replaceIGM" />
                </span>
            </Grid>
            <Grid item xs={12} md={7}>
                <CustomStepper>
                    <Step active={availableStep}>
                        <CustomStepLabel className={classes.stepLabel}>
                            <FormattedMessage id="igmReception" />
                        </CustomStepLabel>
                    </Step>
                    <Step active={validStep}>
                        <CustomStepLabel className={classes.stepLabel}>
                            <FormattedMessage id="imgMerged" />
                        </CustomStepLabel>
                    </Step>
                    <Step active={mergedStep}>
                        <CustomStepLabel className={classes.stepLabel}>
                            <FormattedMessage id="cgmValid" />
                        </CustomStepLabel>
                    </Step>
                </CustomStepper>
            </Grid>
            <Grid item xs={12} md={1} className={classes.downloadContainer}>
                <IconButton
                    aria-label="download"
                    className={classes.downloadButton}
                    onClick={handleClickExport}
                    disabled={!mergedStep}
                >
                    <GetAppIcon
                        fontSize="large"
                        className={classes.downloadIcon}
                    />
                </IconButton>
                <iframe
                    title="download"
                    id={DownloadIframe}
                    name={DownloadIframe}
                    className={classes.iframe}
                />
                <span
                    className={
                        !mergedStep
                            ? classes.downloadLabelDisabled
                            : classes.downloadLabelEnable
                    }
                >
                    <FormattedMessage id="downloadCgm" />
                </span>
            </Grid>
            <Grid item xs={12} md={2}></Grid>
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
