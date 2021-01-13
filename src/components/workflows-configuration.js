/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
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
import { createProcess, deleteProcess, fetchMergeConfigs } from '../utils/api';
import { initProcesses } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
    addNewTso: {
        border: '1px solid',
        padding: theme.spacing(1),
        margin: theme.spacing(2, 0, 2, 0),
    },
    newTsoContainerLabel: {
        fontWeight: 'bold',
    },
    input: {
        textOverflow: 'ellipsis',
    },
}));

const styles = () => ({
    // Link : https://material-ui.com/components/dialogs/#customized-dialogs
    // Material ui recommends position:absolute for the close button but we prefer display:flex  instead
    root: {
        display: 'flex',
    },
    closeButton: {
        marginLeft: 'auto',
        padding: 0,
    },
});

const CustomDialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
        <DialogTitle disableTypography className={classes.root} {...other}>
            <Typography variant="h6">{children}</Typography>
            {onClose && (
                <IconButton
                    aria-label="close"
                    className={classes.closeButton}
                    onClick={onClose}
                >
                    <CloseIcon />
                </IconButton>
            )}
        </DialogTitle>
    );
});

const keyGenerator = (() => {
    let key = 1;
    return () => key++;
})();

const WorkflowTsos = ({ initialTsos, areaIndex, handleAreaTsosChanged }) => {
    const classes = useStyles();
    const intl = useIntl();
    // areaTsos copies will be deleted in an upcoming PR
    const [areaTsos, setAreaTsos] = useState(
        initialTsos.map((e) => {
            return { id: keyGenerator(), ...e };
        })
    );

    useEffect(() => {
        handleAreaTsosChanged(areaIndex, areaTsos);
        // Do not add handleAreaTsosChanged as dependency to avoid infinite loop
        // To be changed
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
            id: keyGenerator(),
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
                <Grid container spacing={2} key={tso.id}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth={true}
                            placeholder={intl.formatMessage({
                                id: 'tsoLabelCode',
                            })}
                            value={tso.sourcingActor}
                            onChange={(event) =>
                                handleChangeTsoSourcingActor(index, event)
                            }
                            InputProps={{
                                classes: { input: classes.input },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth={true}
                            placeholder={intl.formatMessage({
                                id: 'tsoLabelCodeOptional',
                            })}
                            value={tso.alternativeSourcingActor}
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
                    <Grid item xs={12} sm={2} align="center">
                        <IconButton
                            onClick={() => handleRemoveFieldsTso(index)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}
            <Grid container direction="row" item xs={12} sm={10}>
                <Button
                    fullWidth={true}
                    variant="outlined"
                    onClick={() => handleAddAreaTso()}
                    startIcon={<AddCircleIcon />}
                >
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
            return { id: keyGenerator(), ...e };
        }),
        {
            id: keyGenerator(),
            process: '',
            tsos: [{ sourcingActor: '', alternativeSourcingActor: '' }],
            runBalancesAdjustment: false,
        },
    ]);

    function handleAddArea() {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy.push({
            id: keyGenerator(),
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
            businessProcess: configsCopy[index].businessProcess,
            tsos: configsCopy[index].tsos,
            runBalancesAdjustment: configsCopy[index].runBalancesAdjustment,
        };
        setAreasWorkFlows(configsCopy);
    }

    function handleAreaBusinessProcessChanged(e, index) {
        const configsCopy = [...areasWorkFlows];
        configsCopy[index] = {
            id: configsCopy[index].id,
            process: configsCopy[index].process,
            businessProcess: e.target.value,
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
            businessProcess: configsCopy[index].businessProcess,
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
            businessProcess: areasWorkFlowsCopy[index].businessProcess,
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
        <div>
            <Grid container className={classes.newTsoContainerLabel}>
                <Grid item xs={12} sm={5}>
                    <FormattedMessage id="process" />
                </Grid>
                <Grid item xs={12} sm={7}>
                    <FormattedMessage id="tso" />
                </Grid>
            </Grid>
            {areasWorkFlows.map((areasWorkFlow, index) => (
                <Grid
                    container
                    spacing={1}
                    className={classes.addNewTso}
                    key={areasWorkFlow.id}
                >
                    {/* Area input*/}
                    <Grid container item xs={12} sm={5}>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth={true}
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
                            <TextField
                                placeholder={intl.formatMessage({
                                    id: 'businessProcess',
                                })}
                                value={areasWorkFlow.businessProcess}
                                InputProps={{
                                    classes: { input: classes.input },
                                }}
                                onChange={(e) =>
                                    handleAreaBusinessProcessChanged(e, index)
                                }
                            />
                            <RadioGroup
                                aria-label="runBalancesAdjustment"
                                name="runBalancesAdjustment"
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
                        <Grid item xs={12} sm={4} align="center">
                            <IconButton onClick={() => handleDeleteArea(index)}>
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    {/* Tso inputs */}
                    <Grid item xs={12} sm={7}>
                        <WorkflowTsos
                            initialTsos={areasWorkFlow.tsos}
                            areaIndex={index}
                            handleAreaTsosChanged={handleAreaTsosChanged}
                        />
                    </Grid>
                </Grid>
            ))}
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <Button
                        fullWidth={true}
                        variant="outlined"
                        onClick={() => handleAddArea()}
                        startIcon={<AddCircleIcon />}
                    >
                        <FormattedMessage id="addNewProcess" />
                    </Button>
                </Grid>
            </Grid>
        </div>
    );
};

const WorkflowsConfiguration = ({ open, onClose, matchProcess }) => {
    const [areasWorkFlows, setAreasWorkFlows] = useState([]);
    const configs = useSelector((state) => state.configs);
    const [confirmSave, setConfirmSave] = useState(false);
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        setConfirmSave(false);
    }, [open]);

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

        for (let i = 0; i < initialProcesses.length; i++) {
            if (!currentProcesses.includes(initialProcesses[i])) {
                toBeDeleted.push(initialProcesses[i]);
            }
        }
        return toBeDeleted;
    }, [configs, areasWorkFlows]);

    const workFlowWithoutId = (workflow) => {
        return {
            process: workflow.process,
            businessProcess: workflow.businessProcess,
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

        areasWorkFlowTsosWithoutId.every((e) => {
            let index = initialWorkflow.tsos.findIndex(
                (res) =>
                    res.sourcingActor === e.sourcingActor &&
                    res.alternativeSourcingActor === e.alternativeSourcingActor
            );
            if (index === -1) {
                isDifferent = true;
                return false;
            }
            return true;
        });

        if (isDifferent) {
            return true;
        }

        initialWorkflow.tsos.every((e) => {
            let index = areasWorkFlowTsosWithoutId.findIndex(
                (res) =>
                    res.sourcingActor === e.sourcingActor &&
                    res.alternativeSourcingActor === e.alternativeSourcingActor
            );
            if (index === -1) {
                isDifferent = true;
                return false;
            }
            return true;
        });

        return (
            isDifferent ||
            initialWorkflow.runBalancesAdjustment !==
                areaWorkFlow.runBalancesAdjustment
        );
    };

    const handleSave = () => {
        let promises = [];
        const listProcessesToBeDeleted = processesToBeDeleted();

        // DELETE PROCESSES
        listProcessesToBeDeleted.forEach((p) => {
            promises.push(deleteProcess(p));
        });

        for (let i = 0; i < areasWorkFlows.length; i++) {
            // ignore processes with no name
            if (
                areasWorkFlows[i].process === '' ||
                areasWorkFlows[i].businessProcess === ''
            ) {
                continue;
            }

            let initialProcess = configs.find(
                (element) => element.process === areasWorkFlows[i].process
            );

            if (typeof initialProcess === 'undefined') {
                // ADD NEW PROCESSES
                promises.push(
                    createProcess(workFlowWithoutId(areasWorkFlows[i]))
                );
                continue;
            }

            if (areDifferent(initialProcess, areasWorkFlows[i])) {
                // UPDATE PROCESSES
                promises.push(
                    createProcess(workFlowWithoutId(areasWorkFlows[i]))
                );
            }
        }

        Promise.all(promises).then(() => {
            fetchMergeConfigs().then((configs) => {
                dispatch(initProcesses(configs));
                if (
                    matchProcess !== null &&
                    listProcessesToBeDeleted.includes(
                        matchProcess.params.processName
                    )
                ) {
                    history.replace('/');
                }
                onClose();
            });
        });
    };

    const handleAreasWorkFlowsChanged = (areas) => {
        setAreasWorkFlows(areas);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth={'lg'}
                fullWidth={true}
            >
                <CustomDialogTitle id="form-dialog-title" onClose={onClose}>
                    {confirmSave ? (
                        <FormattedMessage id="deletionWorkflowsTitle" />
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
                        onClick={confirmSave ? handleClosePopup : onClose}
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
            </Dialog>
        </>
    );
};

WorkflowsConfiguration.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    matchProcess: PropTypes.object,
};
export default WorkflowsConfiguration;
