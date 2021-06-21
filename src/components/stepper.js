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
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import { ExportDialog } from '../utils/dialogs';
import BuildIcon from '@material-ui/icons/Build';
import {
    CgmStatus,
    fetchReport,
    getExportMergeUrl,
    getIgmStatus,
    IgmStatus,
    replaceIGM,
} from '../utils/rest-api';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { displayErrorMessageWithSnackbar } from '../utils/messages';
import ReportViewer from './report-viewer/report-viewer';

const useStyles = makeStyles((theme) => ({
    stepperGridContainer: {
        position: 'absolute',
        bottom: '15px',
    },
    stepperGridMargins: {
        marginLeft: '2px',
        marginRight: '2px',
    },
    stepperButtonContainer: {
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
    },
    stepperButton: {
        padding: '3px',
    },
    stepperButtonIcon: {
        fontSize: '50px',
    },
    buttonLabelDisabled: {
        color: '#b5b5b5',
        display: 'block',
        fontSize: '14px',
        lineHeight: '1',
    },
    buttonLabelEnabled: {
        display: 'block',
        fontSize: '14px',
        lineHeight: '1',
    },
    stepLabel: {
        fontSize: '16px',
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
    const availableFormats = ['CGMES', 'XIIDM'];
    const classes = useStyles();
    const [availableStep, setAvailableStep] = useState(false);
    const [validStep, setValidStep] = useState(false);
    const [mergedStep, setMergedStep] = useState(false);
    const [replaceIGMEnabled, setReplaceIGMEnabled] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const [openExportDialog, setOpenExport] = React.useState(false);
    const [openReportViewer, setOpenReportViewer] = React.useState(false);
    const [report, setReport] = React.useState(null);

    const handleCloseExport = () => {
        setOpenExport(false);
    };

    const handleCloseReport = () => {
        setOpenReportViewer(false);
    };

    const handleClickExport = (url) => {
        console.info('Downloading merge ' + props.merge.processUuid + '...');
        window.open(url, DownloadIframe);
        handleCloseExport();
    };

    const handleOpenExport = () => {
        setOpenExport(true);
    };

    const handleClickShowReport = () => {
        console.info('Show report for : ' + props.merge.processUuid + '...');
        fetchReport(props.merge.processUuid, props.merge.date)
            .then((report) => {
                setReport(report);
                setOpenReportViewer(true);
            })
            .catch((errorMessage) =>
                displayErrorMessageWithSnackbar({
                    errorMessage: errorMessage,
                    enqueueSnackbar: enqueueSnackbar,
                })
            );
    };

    const handleReplaceIGM = () => {
        console.info('Replacing IGM ' + props.merge.processUuid + '...');
        replaceIGM(props.merge.processUuid, props.merge.date).then((res) => {
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

    const setStepsStatus = (available, valid, merge) => {
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
                let status = allStatus[allStatus.length - 1];
                if (status.status === IgmStatus.MERGED) {
                    setStepsStatus(
                        true,
                        true,
                        status.cgmStatus !== CgmStatus.INVALID
                    );
                } else if (status.status === IgmStatus.VALID) {
                    setStepsStatus(true, true, false);
                }
            } else if (
                allStatus.some(
                    (s) =>
                        s.status === IgmStatus.AVAILABLE ||
                        s.status === IgmStatus.VALID
                )
            ) {
                setStepsStatus(true, false, false);
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
            setStepsStatus(false, false, false);
            setReplaceIGMEnabled(false);
        }
    }, [props.merge, props.tsos]);

    useEffect(() => {
        stepper();
    }, [stepper]);

    return (
        <Grid
            container
            direction="row"
            className={classes.stepperGridContainer}
        >
            <Grid item xs={12} md={2} />
            <Grid
                item
                xs={12}
                md={1}
                className={
                    classes.stepperButtonContainer +
                    ' ' +
                    classes.stepperGridMargins
                }
            >
                <IconButton
                    aria-label="replace"
                    className={classes.stepperButton}
                    onClick={handleReplaceIGM}
                    disabled={!replaceIGMEnabled}
                >
                    <BuildIcon
                        fontSize="large"
                        className={classes.stepperButtonIcon}
                    />
                </IconButton>
                <span
                    className={
                        !replaceIGMEnabled
                            ? classes.buttonLabelDisabled
                            : classes.buttonLabelEnabled
                    }
                >
                    <FormattedMessage id="replaceIGM" />
                </span>
            </Grid>
            <Grid item xs={12} md={5} className={classes.stepperGridMargins}>
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
            <Grid
                item
                xs={12}
                md={1}
                className={
                    classes.stepperButtonContainer +
                    ' ' +
                    classes.stepperGridMargins
                }
            >
                <IconButton
                    aria-label="report"
                    className={classes.stepperButton}
                    onClick={handleClickShowReport}
                    disabled={!mergedStep}
                >
                    <AccountTreeIcon
                        fontSize="large"
                        className={classes.stepperButtonIcon}
                    />
                </IconButton>
                <span
                    className={
                        !mergedStep
                            ? classes.buttonLabelDisabled
                            : classes.buttonLabelEnabled
                    }
                >
                    <FormattedMessage id="showReport" />
                </span>
            </Grid>
            <Grid
                item
                xs={12}
                md={1}
                className={
                    classes.stepperButtonContainer +
                    ' ' +
                    classes.stepperGridMargins
                }
            >
                <IconButton
                    aria-label="download"
                    className={classes.stepperButton}
                    onClick={handleOpenExport}
                    disabled={!mergedStep}
                >
                    <GetAppIcon
                        fontSize="large"
                        className={classes.stepperButtonIcon}
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
                            ? classes.buttonLabelDisabled
                            : classes.buttonLabelEnabled
                    }
                >
                    <FormattedMessage id="downloadCgm" />
                </span>
            </Grid>
            <Grid item xs={12} md={2} />
            {report && (
                <ReportViewer
                    title={
                        'Logs : ' + props.processName + ' - ' + props.merge.date
                    }
                    open={openReportViewer}
                    onClose={handleCloseReport}
                    report={report}
                />
            )}
            <ExportDialog
                open={openExportDialog}
                onClose={handleCloseExport}
                onClick={handleClickExport}
                processUuid={props.merge && props.merge.processUuid}
                date={props.merge && props.merge.date}
                title={intl.formatMessage({ id: 'exportNetwork' })}
                getDownloadUrl={getExportMergeUrl}
                formats={availableFormats}
                errorMessage={intl.formatMessage({ id: 'exportStudyErrorMsg' })}
            />
        </Grid>
    );
};

StepperWithStatus.propTypes = {
    merge: PropTypes.shape({
        processUuid: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
    }),
};

export default StepperWithStatus;
