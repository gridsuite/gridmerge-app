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
import { FormattedMessage, useIntl } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getExportMergeUrl, getIgmStatus, IgmStatus } from '../utils/api';
import { ExportDialog } from '../utils/dialogs';
import PropTypes from 'prop-types';

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
    const DownloadIframe = 'downloadIframe';
    const classes = useStyles();
    const [availableStep, setAvailableStep] = useState(false);
    const [validStep, setValidStep] = useState(false);
    const [mergedStep, setMergedStep] = useState(false);

    const [openExportDialog, setOpenExport] = React.useState(false);

    const handleCloseExport = () => {
        setOpenExport(false);
    };

    const handleClickExport = (url) => {
        window.open(url, DownloadIframe);
        handleCloseExport();
    };

    const handleOpenExport = () => {
        setOpenExport(true);
    };

    const allEqualValueArray = (arr) => arr.every((v) => v === arr[0]);

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
            if (allEqualValueArray(allStatus)) {
                if (allStatus[allStatus.length - 1] === IgmStatus.MERGED) {
                    enableDisabledAllSteps(true);
                } else if (
                    allStatus[allStatus.length - 1] === IgmStatus.VALID
                ) {
                    getStepsStatus(true, true, false);
                }
            } else if (
                allStatus.includes(IgmStatus.AVAILABLE) ||
                allStatus.includes(IgmStatus.VALID)
            ) {
                getStepsStatus(true, false, false);
            }
            // TODO : error cases
        } else {
            enableDisabledAllSteps(false);
        }
    }, [props.merge, props.tsos]);

    useEffect(() => {
        stepper();
    }, [stepper]);

    return (
        <Grid container direction="row" className={classes.stepperContainer}>
            <Grid item xs={12} md={2}></Grid>
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
                    onClick={handleOpenExport}
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
            <ExportDialog
                open={openExportDialog}
                onClose={handleCloseExport}
                onClick={handleClickExport}
                url={props.merge === undefined ? '' : getExportMergeUrl(
                    props.merge.process,
                    new Date(props.merge.date).toISOString(),
                    -new Date().getTimezoneOffset()
                )}
                process={props.merge === undefined ? '' :props.merge.process}
                date={props.merge === undefined ? '' :props.merge.date}
                title={useIntl().formatMessage({ id: 'exportNetwork' })}
            />
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
