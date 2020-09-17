/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import GetAppIcon from '@material-ui/icons/GetApp';
import IconButton from '@material-ui/core/IconButton';
import {FormattedMessage} from 'react-intl';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        position: 'absolute',
        bottom: '0'
    },
    stepper: {
        padding: '30px 20px 24px 20px'
    },
    download: {
        display : 'grid',
        marginTop: '-20px'
    },
    downloadLabel: {
        fontSize: '15px'
    },
    downloadLabelDisabled: {
        color: '#ffffff4d'
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

{/* It must be deleted after the branch with the back part */}
function getSteps() {
    return ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'];
}

const  HorizontalStepper = () => {
    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);
    const [completed, setCompleted] = React.useState(new Set());
    const [skipped, setSkipped] = React.useState(new Set());
    const [enableDownloadButton, setEnableDownloadButton] = React.useState(true);

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
            setEnableDownloadButton(false);
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

    return (
        <div className={classes.root}>
            <Stepper
                alternativeLabel
                nonLinear
                activeStep={activeStep}
                className={classes.stepper}>
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
                <div className={classes.download}>
                    <IconButton aria-label="delete" disabled={enableDownloadButton} >
                        <GetAppIcon fontSize="large" />
                    </IconButton>
                    <span className={enableDownloadButton ? classes.downloadLabelDisabled : ''}>
                        <FormattedMessage id="download" />
                        <span> "file name"</span> {/* To be replaced by the name of the file  */}
                    </span>
                </div>
            </Stepper>
        </div>
    );
};

export default HorizontalStepper;