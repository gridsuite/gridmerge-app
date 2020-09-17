/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import IconButton from '@material-ui/core/IconButton';
import { FormattedMessage } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getExportMergeUrl } from '../utils/api';
import { IgmStatus } from './merge-map';

const useStyles = makeStyles((theme) => ({
    downloadBtn: {
        textAlign: 'center',
        top: '-20px',
        position: 'relative',
    },
    downloadLabelEnabled: {
        display: 'block',
    },
    downloadLabel: {
        fontSize: '15px',
    },
    downloadLabelDisabled: {
        color: '#ffffff4d',
        display: 'block',
    },
    root: {
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    stepper: {
        padding: '30px 20px 0 20px',
    },
    button: {
        marginRight: theme.spacing(1),
    },
    backButton: {
        marginRight: theme.spacing(1),
    },
    completed: {
        display: 'inline-block',
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

function getSteps() {
    return ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'];
}

const DownloadButton = (props) => {
    const DownloadIframe = 'downloadIframe';

    const classes = useStyles();

    const merge = useSelector((state) => state.merge);

    const [isDisabled, setDisabled] = useState(true);

    const [activeStep, setActiveStep] = React.useState(0);

    const [completed, setCompleted] = React.useState(new Set());

    const [skipped] = React.useState(new Set());

    const steps = getSteps();

    const totalSteps = () => {
        return getSteps().length;
    };

    const skippedSteps = () => {
        return skipped.size;
    };

    const completedSteps = () => {
        return completed.size;
    };

    const allStepsCompleted = () => {
        return completedSteps() === totalSteps() - skippedSteps();
    };

    const isLastStep = () => {
        return activeStep === totalSteps() - 1;
    };

    const handleNext = () => {
        const newActiveStep =
            isLastStep() && !allStepsCompleted()
                ? steps.findIndex((step, i) => !completed.has(i))
                : activeStep + 1;
        setActiveStep(newActiveStep);
    };

    const handleStep = (step) => () => {
        setActiveStep(step);
        handleComplete();
        if (step === totalSteps() - 1) {
            setDisabled(false);
        }
    };

    const handleComplete = () => {
        const newCompleted = new Set(completed);
        newCompleted.add(activeStep);
        setCompleted(newCompleted);

        if (completed.size !== totalSteps() - skippedSteps()) {
            handleNext();
        }
    };

    const isStepSkipped = (step) => {
        return skipped.has(step);
    };

    function isStepComplete(step) {
        return completed.has(step);
    }

    useEffect(() => {
        let disabled = !(merge.date && merge.process);
        merge.igms.forEach((igm) => {
            if (igm.status !== IgmStatus.MERGED) {
                disabled = true;
            }
        });
        setDisabled(disabled);
    }, [merge]);

    const handleClickExport = () => {
        console.info(' Downloading merge ' + merge.process + '...');
        window.open(
            getExportMergeUrl(merge.process, merge.date.toISOString()),
            DownloadIframe
        );
    };

    return (
        <div className={classes.root}>
            <Stepper
                alternativeLabel
                nonLinear
                activeStep={activeStep}
                className={classes.stepper}
            >
                {steps.map((label, index) => {
                    const stepProps = {};
                    const buttonProps = {};
                    if (isStepSkipped(index)) {
                        stepProps.completed = false;
                    }
                    return (
                        <Step key={label} {...stepProps}>
                            <StepButton
                                onClick={handleStep(index)}
                                completed={isStepComplete(index)}
                                {...buttonProps}
                            >
                                {label}
                            </StepButton>
                        </Step>
                    );
                })}
                <div className={classes.downloadBtn}>
                    <IconButton
                        aria-label="download"
                        onClick={handleClickExport}
                        disabled={isDisabled}
                    >
                        <GetAppIcon fontSize="large" />
                    </IconButton>
                    <span
                        className={
                            isDisabled
                                ? classes.downloadLabelDisabled
                                : classes.downloadLabelEnabled
                        }
                    >
                        <FormattedMessage id="download" />
                        <span> CGM</span>
                    </span>
                    <iframe
                        title="downloadFile"
                        id={DownloadIframe}
                        name={DownloadIframe}
                        style={{ visibility: 'hidden', width: 0, height: 0 }}
                    />
                </div>
            </Stepper>
        </div>
    );
};

export default DownloadButton;
