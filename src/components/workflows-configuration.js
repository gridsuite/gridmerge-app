/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import DeleteIcon from '@material-ui/icons/Delete';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { withStyles, makeStyles } from '@material-ui/core/styles';
import { FormattedMessage } from 'react-intl';
import { addProcess, deleteProcess, fetchMergeConfigs } from '../utils/api';
import { initProcesses } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import { v4 as uuidv4 } from 'uuid';

const useStyles = makeStyles(() => ({
    addNewTso: {
        border: '1px solid #ccc',
        padding: '5px 0 20px 15px',
        margin: '15px 0',
    },
    newTsoContainerLabel: {
        fontWeight: 'bold',
        padding: '10px 10px 0px 5px',
    },
    newTsoLabel: {
        paddingLeft: '10px',
    },
    input: {
        '&::placeholder': {
            fontSize: '12px',
        },
    },
    addNewArea: {
        margin: '10px 0px 20px 0px',
        width: '100%',
    },
}));

const styles = (theme) => ({
    root: {
        margin: 0,
        padding: theme.spacing(2),
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(1),
        color: theme.palette.grey[500],
    },
});

const CustomDialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <DialogTitle
            disableTypography
            className={classes.root}
            {...other}
            style={{ padding: '15px' }}
        >
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton
                    aria-label="close"
                    className={classes.closeButton}
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </DialogTitle>
    );
});

const CustomDialog = withStyles(() => ({
    paperScrollPaper: {
        minWidth: '850px',
    },
}))(Dialog);

const WorkflowTsos = ({ initialTsos, areaIndex, handleAreaTsosChanged }) => {
    const classes = useStyles();
    const intl = useIntl();

    const [areaTsos, setAreaTsos] = useState(
        initialTsos.map((e) => {
            return { id: uuidv4(), ...e };
        })
    );

    useEffect(() => {
        handleAreaTsosChanged(areaIndex, areaTsos);
        // Do not add handleAreaTsosChanged as dep because if
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areaTsos]);

    const handleChangeTsoSourcingActor = (index, event) => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy[index] = {
            id: areaTsosCopy[index].id,
            sourcingActor: event.target.value,
            alternativeSourcingActor:
                areaTsosCopy[index].alternativeSourcingActor,
        };
        setAreaTsos(areaTsosCopy);
    };

    const handleChangeTsoAlternativeSourcingActor = (index, event) => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy[index] = {
            id: areaTsosCopy[index].id,
            sourcingActor: areaTsosCopy[index].sourcingActor,
            alternativeSourcingActor: event.target.value,
        };
        setAreaTsos(areaTsosCopy);
    };

    const handleAddAreaTso = () => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy.push({
            id: uuidv4(),
            sourcingActor: '',
            alternativeSourcingActor: '',
        });
        setAreaTsos(areaTsosCopy);
    };

    const handleRemoveFieldsTso = (index) => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy.splice(index, 1);
        setAreaTsos(areaTsosCopy);
    };

    return (
        <>
            {areaTsos.map((tso, index) => (
                <Grid container spacing={2} key={`${tso.id}`}>
                    <Grid item={true} xs={12} sm={5}>
                        <TextField
                            placeholder={intl.formatMessage({
                                id: 'tsoLabelCode',
                            })}
                            value={
                                tso.sourcingActor != null
                                    ? tso.sourcingActor
                                    : ''
                            }
                            onChange={(event) =>
                                handleChangeTsoSourcingActor(index, event)
                            }
                            InputProps={{
                                classes: { input: classes.input },
                            }}
                        />
                    </Grid>
                    <Grid item={true} xs={12} sm={5}>
                        <TextField
                            placeholder={intl.formatMessage({
                                id: 'tsoLabelCodeOptional',
                            })}
                            value={
                                tso.alternativeSourcingActor != null
                                    ? tso.alternativeSourcingActor
                                    : ''
                            }
                            onChange={(event) =>
                                handleChangeTsoAlternativeSourcingActor(
                                    index,
                                    event
                                )
                            }
                            InputProps={{
                                classes: { input: classes.input },
                            }}
                        />
                    </Grid>
                    <Grid item={true} xs={12} sm={2} align="center">
                        <IconButton
                            onClick={() => handleRemoveFieldsTso(index)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}
            <Grid direction="row" container item xs={12} sm={10}>
                <Button
                    style={{ width: '100%', maxHeight: '35px' }}
                    variant="outlined"
                    onClick={() => handleAddAreaTso()}
                >
                    <AddCircleIcon
                        fontSize="default"
                        style={{ marginRight: '10px' }}
                    />
                    <FormattedMessage id="addNewTso" />
                </Button>
            </Grid>
        </>
    );
};

const WorkflowsContainer = ({
    handleAreasWorkFlowsChanged,
    initialConfigs,
}) => {
    const classes = useStyles();
    const intl = useIntl();

    const [areasWorkFlows, setAreasWorkFlows] = useState([
        ...initialConfigs.map((e) => {
            return { id: uuidv4(), ...e };
        }),
        {
            id: uuidv4(),
            process: '',
            tsos: [{ sourcingActor: '', alternativeSourcingActor: '' }],
            runBalancesAdjustment: false,
        },
    ]);

    function handleAddArea() {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy.push({
            id: uuidv4(),
            process: '',
            tsos: [{ sourcingActor: '', alternativeSourcingActor: '' }],
            runBalancesAdjustment: false,
        });
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    function handleAreaNameChanged(e, index) {
        const configsCopy = [...areasWorkFlows];
        configsCopy[index] = {
            id: configsCopy[index].id,
            process: e.target.value,
            tsos: configsCopy[index].tsos,
            runBalancesAdjustment: configsCopy[index].runBalancesAdjustment,
        };
        setAreasWorkFlows(configsCopy);
    }

    function handleSwitchChange(e, index) {
        const configsCopy = [...areasWorkFlows];
        configsCopy[index] = {
            id: configsCopy[index].id,
            process: configsCopy[index].process,
            tsos: configsCopy[index].tsos,
            runBalancesAdjustment: e.target.value,
        };
        setAreasWorkFlows(configsCopy);
    }

    function handleDeleteArea(index) {
        const configsCopy = [...areasWorkFlows];
        configsCopy.splice(index, 1);
        setAreasWorkFlows(configsCopy);
    }

    function handleAreaTsosChanged(index, tsosList) {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy[index] = {
            id: areasWorkFlowsCopy[index].id,
            process: areasWorkFlowsCopy[index].process,
            tsos: tsosList,
            runBalancesAdjustment:
                areasWorkFlowsCopy[index].runBalancesAdjustment,
        };
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    useEffect(() => {
        handleAreasWorkFlowsChanged(areasWorkFlows);
    }, [handleAreasWorkFlowsChanged, areasWorkFlows]);

    return (
        <Grid>
            <Grid container className={classes.newTsoContainerLabel}>
                <Grid
                    item={true}
                    xs={12}
                    sm={5}
                    className={classes.newTsoLabel}
                >
                    <FormattedMessage id="process" />
                </Grid>
                <Grid
                    item={true}
                    xs={12}
                    sm={7}
                    className={classes.newTsoLabel}
                >
                    <FormattedMessage id="tso" />
                </Grid>
            </Grid>
            {areasWorkFlows.map((areasWorkFlow, index) => (
                <Grid
                    container
                    className={classes.addNewTso}
                    key={`${areasWorkFlow.id}`}
                >
                    {/* Area input*/}
                    <Grid container item xs={12} sm={5}>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                placeholder={intl.formatMessage({
                                    id: 'name',
                                })}
                                value={areasWorkFlow.process}
                                InputProps={{
                                    classes: { input: classes.input },
                                }}
                                onChange={(e) =>
                                    handleAreaNameChanged(e, index)
                                }
                            />
                            <RadioGroup
                                aria-label="gender"
                                name="gender1"
                                value={areasWorkFlow.runBalancesAdjustment + ''}
                                onChange={(e) => handleSwitchChange(e, index)}
                            >
                                <FormControlLabel
                                    value="true"
                                    control={<Radio />}
                                    label="balance adjustment"
                                />
                                <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label="loadflow"
                                />
                            </RadioGroup>
                        </Grid>
                        <Grid item xs={12} sm={3} align="center">
                            <IconButton onClick={() => handleDeleteArea(index)}>
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    {/* Tso inputs */}
                    <Grid container item xs={12} sm={7} spacing={1}>
                        <WorkflowTsos
                            initialTsos={areasWorkFlow.tsos}
                            areaIndex={index}
                            handleAreaTsosChanged={handleAreaTsosChanged}
                        />
                    </Grid>
                </Grid>
            ))}
            <Grid container item xs={12} sm={6}>
                <Button
                    className={classes.addNewArea}
                    variant="outlined"
                    onClick={() => handleAddArea()}
                >
                    <AddCircleIcon
                        fontSize="default"
                        style={{ marginRight: '10px' }}
                    />
                    <FormattedMessage id="addNewProcess" />
                </Button>
            </Grid>
        </Grid>
    );
};

const WorkflowsConfiguration = ({ open, onClose }) => {
    const [areasWorkFlows, setAreasWorkFlows] = useState([]);
    const configs = useSelector((state) => state.configs);
    const [confirmSave, setConfirmSave] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        setConfirmSave(false);
    }, [open]);

    const handleClose = () => {
        onClose();
    };

    const handleClosePopup = () => {
        setConfirmSave(false);
    };

    const saveButtonClicked = () => {
        if (processesToBeDeleted().length === 0) {
            handleSave();
        } else {
            setConfirmSave(true);
        }
    };

    const processesToBeDeleted = useCallback(() => {
        const initialProcesses = configs.map((e) => e.process);
        const currentProcesses = areasWorkFlows
            .filter((e) => e.process !== '')
            .map((e) => e.process);

        let toBeDeleted = [];
        // PROCESSES
        for (let i = 0; i < initialProcesses.length; i++) {
            if (!currentProcesses.includes(initialProcesses[i])) {
                toBeDeleted.push(initialProcesses[i]);
            }
        }
        return toBeDeleted;
    }, [configs, areasWorkFlows]);

    const handleSave = () => {
        const initialProcesses = configs.map((e) => e.process);
        const currentProcesses = areasWorkFlows
            .filter((e) => e.process !== '')
            .map((e) => e.process);

        let promises = [];
        let i = 0;

        // DELETE PROCESSES
        for (i; i < initialProcesses.length; i++) {
            if (!currentProcesses.includes(initialProcesses[i])) {
                promises.push(deleteProcess(initialProcesses[i]));
            }
        }

        const WorkFlowWithoutId = (workflow) => {
            return {
                process: workflow.process,
                runBalancesAdjustment: workflow.runBalancesAdjustment,
                tsos: workflow.tsos.map((tso) => {
                    return {
                        sourcingActor: tso.sourcingActor,
                        alternativeSourcingActor: tso.alternativeSourcingActor,
                    };
                }),
            };
        };

        const areDifferent = (initialWorkflow, areaWorkFlow) => {
            let isDifferent = false;
            let areasWorkFlowTsosWithoutId = areaWorkFlow.tsos.map((tso) => {
                return {
                    sourcingActor: tso.sourcingActor,
                    alternativeSourcingActor: tso.alternativeSourcingActor,
                };
            });

            areasWorkFlowTsosWithoutId.forEach((e) => {
                let index = initialWorkflow.tsos.findIndex(
                    (res) =>
                        res.sourcingActor === e.sourcingActor &&
                        res.alternativeSourcingActor ===
                            e.alternativeSourcingActor
                );
                if (index === -1) {
                    isDifferent = true;
                }
            });

            initialWorkflow.tsos.forEach((e) => {
                let index = areasWorkFlowTsosWithoutId.findIndex(
                    (res) =>
                        res.sourcingActor === e.sourcingActor &&
                        res.alternativeSourcingActor ===
                            e.alternativeSourcingActor
                );
                if (index === -1) {
                    isDifferent = true;
                }
            });

            if (isDifferent) {
                return true;
            }

            return (
                initialWorkflow.runBalancesAdjustment !==
                areaWorkFlow.runBalancesAdjustment
            );
        };

        for (let i = 0; i < areasWorkFlows.length; i++) {
            if (areasWorkFlows[i].process === '') {
                continue;
            }
            if (!initialProcesses.includes(areasWorkFlows[i].process)) {
                // ADD NEW PROCESSES
                promises.push(addProcess(WorkFlowWithoutId(areasWorkFlows[i])));
                continue;
            }

            let intialProcess = configs.find(
                (element) => element.process === areasWorkFlows[i].process
            );
            if (areDifferent(intialProcess, areasWorkFlows[i])) {
                // UPDATE PROCESSES
                promises.push(addProcess(WorkFlowWithoutId(areasWorkFlows[i])));
            }
        }
        Promise.all(promises).then(() => {
            fetchMergeConfigs().then((configs) => {
                dispatch(initProcesses(configs));
                onClose();
            });
        });
    };

    const handleAreasWorkFlowsChanged = (areas) => {
        setAreasWorkFlows(areas);
    };

    return (
        <>
            <CustomDialog open={open} onClose={handleClose}>
                <CustomDialogTitle id="form-dialog-title" onClose={handleClose}>
                    {confirmSave ? (
                        <FormattedMessage id="deletionWorkflowsitle" />
                    ) : (
                        <FormattedMessage id="configurationWorkflowsTitle" />
                    )}
                </CustomDialogTitle>
                <DialogContent dividers>
                    {confirmSave ? (
                        <h3>
                            <FormattedMessage id="confirmMessage" />
                        </h3>
                    ) : (
                        <WorkflowsContainer
                            initialConfigs={configs}
                            handleAreasWorkFlowsChanged={
                                handleAreasWorkFlowsChanged
                            }
                        />
                    )}
                    {confirmSave &&
                        processesToBeDeleted().map((e) => <h3 key={e}>{e}</h3>)}
                </DialogContent>
                <DialogActions>
                    <Button
                        autoFocus
                        size="small"
                        onClick={confirmSave ? handleClosePopup : handleClose}
                    >
                        <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={confirmSave ? handleSave : saveButtonClicked}
                    >
                        <FormattedMessage id="confirm" />
                    </Button>
                </DialogActions>
            </CustomDialog>
        </>
    );
};

WorkflowsConfiguration.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
export default WorkflowsConfiguration;
