/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react';
import { Box, Grid, IconButton, Step, StepLabel, Stepper } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { AccountTree as AccountTreeIcon, Build as BuildIcon, GetApp as GetAppIcon } from '@mui/icons-material';
import { ReportViewerDialog, useSnackMessage } from '@gridsuite/commons-ui';
import { ExportDialog } from '../utils/dialogs';
import { CgmStatus, fetchReport, getExportMergeUrl, getIgmStatus, IgmStatus, replaceIGM } from '../utils/rest-api';
import PropTypes from 'prop-types';

const baseStyles = {
    stepperGridMargins: {
        marginLeft: '2px',
        marginRight: '2px',
    },
};
const styles = {
    stepper: {
        '& .MuiStepper-root': {
            padding: '30px 15px 25px 15px',
        },
    },
    stepperGridContainer: {
        position: 'absolute',
        bottom: '15px',
    },
    stepperGridMargins: baseStyles.stepperGridMargins,
    stepperButtonContainer: (theme) => ({
        ...baseStyles.stepperGridMargins,
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
    }),
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
    downloadContainer: (theme) => ({
        [theme.breakpoints.down('sm')]: {
            minHeight: '120px',
        },
    }),
    replaceIGMContainer: (theme) => ({
        [theme.breakpoints.down('sm')]: {
            minHeight: '120px',
        },
    }),
};

const StepperWithStatus = (props) => {
    const intl = useIntl();
    const DownloadIframe = 'downloadIframe';
    const availableFormats = ['CGMES', 'XIIDM'];
    const [availableStep, setAvailableStep] = useState(false);
    const [validStep, setValidStep] = useState(false);
    const [mergedStep, setMergedStep] = useState(false);
    const [replaceIGMEnabled, setReplaceIGMEnabled] = useState(false);
    const { snackError, snackInfo } = useSnackMessage();

    const [openExportDialog, setOpenExport] = useState(false);

    const [openReportViewer, setOpenReportViewer] = useState(false);
    const [report, setReport] = useState(null);

    const handleCloseExport = () => {
        setOpenExport(false);
    };

    const handleCloseReport = () => {
        setReport(null);
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
            .catch((error) =>
                snackError({
                    messageTxt: error.message,
                })
            );
    };

    const handleReplaceIGM = () => {
        console.info('Replacing IGM ' + props.merge.processUuid + '...');
        replaceIGM(props.merge.processUuid, props.merge.date)
            .then((res) => {
                if (Object.keys(res).length === 0) {
                    const errorMessage = intl.formatMessage({
                        id: 'noReplacingIGMAvailable',
                    });
                    snackInfo({
                        messageTxt: errorMessage,
                    });
                }
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
    };

    const allStatusEqualValueArray = (arr) => arr.every((v) => v.status === arr[0].status);

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
                    setStepsStatus(true, true, status.cgmStatus !== CgmStatus.INVALID);
                } else if (status.status === IgmStatus.VALID) {
                    setStepsStatus(true, true, false);
                }
            } else if (allStatus.some((s) => s.status === IgmStatus.AVAILABLE || s.status === IgmStatus.VALID)) {
                setStepsStatus(true, false, false);
            }

            if (
                allStatus.some((s) => s.status === IgmStatus.INVALID || s.status === IgmStatus.ABSENT) &&
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
        <Grid container direction="row" sx={styles.stepperGridContainer}>
            <Grid item xs={12} md={2} />
            <Grid item xs={12} md={1} sx={styles.stepperButtonContainer}>
                <IconButton
                    aria-label="replace"
                    sx={styles.stepperButton}
                    onClick={handleReplaceIGM}
                    disabled={!replaceIGMEnabled}
                >
                    <BuildIcon fontSize="large" sx={styles.stepperButtonIcon} />
                </IconButton>
                <Box component="span" sx={replaceIGMEnabled ? styles.buttonLabelEnabled : styles.buttonLabelDisabled}>
                    <FormattedMessage id="replaceIGM" />
                </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={styles.stepperGridMargins}>
                <Stepper sx={styles.stepper}>
                    <Step active={availableStep}>
                        <StepLabel sx={styles.stepLabel}>
                            <FormattedMessage id="igmReception" />
                        </StepLabel>
                    </Step>
                    <Step active={validStep}>
                        <StepLabel sx={styles.stepLabel}>
                            <FormattedMessage id="imgMerged" />
                        </StepLabel>
                    </Step>
                    <Step active={mergedStep}>
                        <StepLabel sx={styles.stepLabel}>
                            <FormattedMessage id="cgmValid" />
                        </StepLabel>
                    </Step>
                </Stepper>
            </Grid>
            <Grid item xs={12} md={1} sx={styles.stepperButtonContainer}>
                <IconButton
                    aria-label="report"
                    sx={styles.stepperButton}
                    onClick={handleClickShowReport}
                    disabled={!mergedStep}
                >
                    <AccountTreeIcon fontSize="large" sx={styles.stepperButtonIcon} />
                </IconButton>
                <Box component="span" sx={mergedStep ? styles.buttonLabelEnabled : styles.buttonLabelDisabled}>
                    <FormattedMessage id="showReport" />
                </Box>
            </Grid>
            <Grid item xs={12} md={1} sx={styles.stepperButtonContainer}>
                <IconButton
                    aria-label="download"
                    sx={styles.stepperButton}
                    onClick={handleOpenExport}
                    disabled={!mergedStep}
                >
                    <GetAppIcon fontSize="large" sx={styles.stepperButtonIcon} />
                </IconButton>
                <Box component="iframe" title="download" id={DownloadIframe} name={DownloadIframe} sx={styles.iframe} />
                <Box component="span" sx={mergedStep ? styles.buttonLabelEnabled : styles.buttonLabelDisabled}>
                    <FormattedMessage id="downloadCgm" />
                </Box>
            </Grid>
            <Grid item xs={12} md={2} />
            {report && (
                <ReportViewerDialog
                    title={intl.formatMessage(
                        { id: 'logsTitle' },
                        {
                            title: props.processName + ' - ' + props.merge.date,
                        }
                    )}
                    open={openReportViewer}
                    onClose={handleCloseReport}
                    jsonReport={report}
                />
            )}
            <ExportDialog
                open={openExportDialog}
                onClose={handleCloseExport}
                onClick={handleClickExport}
                processUuid={props.merge?.processUuid}
                date={props.merge?.date}
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
