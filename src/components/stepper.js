/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';

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

const CustomStepLabel = withStyles({
    label: {
        color: 'red',
    },
})(StepLabel);

const StepperWithStatus = (props) => {
    const DownloadIframe = 'downloadIframe';

    const classes = useStyles();
    const [steps, setSteps] = useState([]);

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

    /**
     * Check if all countries status is equal
     * @param arr
     * @returns {boolean}
     */
    const allEqual = (arr) => arr.every((v) => v === arr[0]);

    /**
     * Get status if all countries status is equal
     * @returns {string}
     */
    const getStatus = () => {
        if (allEqual(steps)) {
            switch (steps[0]) {
                case IgmStatus.ABSENT:
                    return IgmStatus.ABSENT;

                case IgmStatus.AVAILABLE:
                    return IgmStatus.AVAILABLE;

                case IgmStatus.INVALID:
                    return IgmStatus.INVALID;

                case IgmStatus.VALID:
                    return IgmStatus.VALID;

                case IgmStatus.MERGED:
                    return IgmStatus.MERGED;

                default:
                    return IgmStatus.ABSENT;
            }
        }
    };

    /**
     * Check if the available step is active
     * @returns {boolean}
     */
    const isAvailableStep = () => {
        if (allEqual(steps)) {
            return getStatus() === IgmStatus.AVAILABLE ||
                getStatus() === IgmStatus.VALID ||
                getStatus() === IgmStatus.MERGED
                ? true
                : false;
        }
    };

    /**
     * Check if the valid step is active
     * @returns {boolean}
     */
    const isValidStep = () => {
        if (allEqual(steps)) {
            return getStatus() === IgmStatus.VALID ||
                getStatus() === IgmStatus.MERGED
                ? true
                : false;
        }
    };

    /**
     * Check if merged step is active
     * @returns {boolean}
     */
    const isMergedStep = () => {
        if (allEqual(steps)) {
            return getStatus() === IgmStatus.MERGED ? true : false;
        }
    };

    useEffect(() => {
        const allEqual = (arr) => arr.every((v) => v === arr[0]);
        const steps = props.tsos.map((tso) => {
            if (tso) {
                const status = getIgmStatus(tso, props.merge);
                if (status) {
                    return status;
                }
            }
        });
        setSteps(steps);
    }, [props.merge]);

    return (
        <Grid container direction="row" className={classes.stepperContainer}>
            <Grid item xs={12} md={10}>
                <CustomStepper activeStep={isAvailableStep ? 0 : -1}>
                    <Step active={isAvailableStep()}>
                        <StepLabel>
                            <FormattedMessage id="available" />
                        </StepLabel>
                    </Step>
                    <Step active={isValidStep()}>
                        <StepLabel>
                            <FormattedMessage id="valid" />
                        </StepLabel>
                    </Step>
                    <Step active={isMergedStep() === true}>
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
                    disabled={!isMergedStep()}
                >
                    <GetAppIcon fontSize="large" />
                </IconButton>
                <span
                    className={
                        !isMergedStep() ? classes.downloadLabelDisabled : ''
                    }
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
