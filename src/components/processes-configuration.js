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
import { createProcess, deleteProcess, fetchMergeConfigs } from '../utils/api';
import { initProcesses } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import { useHistory } from 'react-router-dom';
import Autocomplete from '@material-ui/lab/Autocomplete';

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

let businessProcessList;
let tsosCodesList;

fetch('business_processes.txt')
    .then((data) => {
        return data.text();
    })
    .then((data) => {
        businessProcessList = data.split('\n').sort();
    });

fetch('tsos_codes.txt')
    .then((data) => {
        return data.text();
    })
    .then((data) => {
        tsosCodesList = data.split('\n').sort();
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

const ProcessTsos = ({
    initialTsos,
    processIndex,
    handleProcessTsosChanged,
}) => {
    const intl = useIntl();
    // processTsos copies will be deleted in an upcoming PR
    const [processTsos, setProcessTsos] = useState(
        initialTsos.map((e) => {
            return {
                id: keyGenerator(),
                sourcingActor: e,
            };
        })
    );

    useEffect(() => {
        handleProcessTsosChanged(processIndex, processTsos);
        // Do not add handleProcessTsosChanged as dependency to avoid infinite loop
        // To be changed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processTsos]);

    const handleTsoSourcingActorChanged = (newValue, index) => {
        const processTsosCopy = [...processTsos];
        processTsosCopy[index] = {
            id: processTsosCopy[index].id,
            sourcingActor: newValue,
        };
        setProcessTsos(processTsosCopy);
    };

    const handleAddProcessTso = () => {
        const processTsosCopy = [...processTsos];
        processTsosCopy.push({
            id: keyGenerator(),
            sourcingActor: '',
        });
        setProcessTsos(processTsosCopy);
    };

    const handleRemoveProcessTso = (index) => {
        const processTsosCopy = [...processTsos];
        processTsosCopy.splice(index, 1);
        setProcessTsos(processTsosCopy);
    };

    return (
        <>
            {processTsos.map((tso, index) => (
                <Grid container spacing={2} key={tso.id}>
                    <Grid item xs={12} sm={10}>
                        <Autocomplete
                            id="select_tsos_process"
                            value={tsosCodesList.indexOf(tso.sourcingActor)}
                            disableClearable
                            autoHighlight
                            onChange={(event, newValue) => {
                                handleTsoSourcingActorChanged(
                                    tsosCodesList[newValue],
                                    index
                                );
                            }}
                            options={Object.keys(tsosCodesList)}
                            getOptionLabel={(code) =>
                                code !== -1 ? tsosCodesList[code] : ''
                            }
                            getOptionSelected={(option, value) =>
                                option.value === value.value
                            }
                            size="small"
                            renderInput={(props) => (
                                <TextField
                                    {...props}
                                    variant="outlined"
                                    placeholder={intl.formatMessage({
                                        id: 'sourcingActorCode',
                                    })}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} align="center">
                        <IconButton
                            onClick={() => handleRemoveProcessTso(index)}
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
                    onClick={() => handleAddProcessTso()}
                    startIcon={<AddCircleIcon />}
                >
                    <FormattedMessage id="addNewTso" />
                </Button>
            </Grid>
        </>
    );
};

const ProcessesContainer = ({ handleProcessesChanged, initialConfigs }) => {
    const classes = useStyles();
    const intl = useIntl();

    const [currentProcesses, setCurrentProcesses] = useState([
        ...initialConfigs.map((e) => {
            return { id: keyGenerator(), ...e };
        }),
        {
            id: keyGenerator(),
            process: '',
            businessProcess: '',
            tsos: [''],
            runBalancesAdjustment: false,
        },
    ]);

    function handleAddProcess() {
        const currentProcessesCopy = [...currentProcesses];
        currentProcessesCopy.push({
            id: keyGenerator(),
            process: '',
            businessProcess: '',
            tsos: [''],
            runBalancesAdjustment: false,
        });
        setCurrentProcesses(currentProcessesCopy);
    }

    function handleProcessNameChanged(e, index) {
        const currentProcessesCopy = [...currentProcesses];
        currentProcessesCopy[index] = {
            id: currentProcessesCopy[index].id,
            process: e.target.value,
            businessProcess: currentProcessesCopy[index].businessProcess,
            tsos: currentProcessesCopy[index].tsos,
            runBalancesAdjustment:
                currentProcessesCopy[index].runBalancesAdjustment,
        };
        setCurrentProcesses(currentProcessesCopy);
    }

    function handleBusinessProcessChanged(newValue, index) {
        const currentProcessesCopy = [...currentProcesses];
        currentProcessesCopy[index] = {
            id: currentProcessesCopy[index].id,
            process: currentProcessesCopy[index].process,
            businessProcess: newValue,
            tsos: currentProcessesCopy[index].tsos,
            runBalancesAdjustment:
                currentProcessesCopy[index].runBalancesAdjustment,
        };
        setCurrentProcesses(currentProcessesCopy);
    }

    function handleProcessAlgorithmChanged(e, index) {
        const currentProcessesCopy = [...currentProcesses];
        currentProcessesCopy[index] = {
            id: currentProcessesCopy[index].id,
            process: currentProcessesCopy[index].process,
            businessProcess: currentProcessesCopy[index].businessProcess,
            tsos: currentProcessesCopy[index].tsos,
            runBalancesAdjustment: e.target.value,
        };
        setCurrentProcesses(currentProcessesCopy);
    }

    function handleDeleteProcess(index) {
        const currentProcessesCopy = [...currentProcesses];
        currentProcessesCopy.splice(index, 1);
        setCurrentProcesses(currentProcessesCopy);
    }

    function handleProcessTsosChanged(index, tsosList) {
        const currentProcessesCopy = [...currentProcesses];
        currentProcessesCopy[index] = {
            id: currentProcessesCopy[index].id,
            process: currentProcessesCopy[index].process,
            businessProcess: currentProcessesCopy[index].businessProcess,
            tsos: tsosList.map((tso) => {
                return tso.sourcingActor;
            }),
            runBalancesAdjustment:
                currentProcessesCopy[index].runBalancesAdjustment,
        };
        setCurrentProcesses(currentProcessesCopy);
    }

    useEffect(() => {
        handleProcessesChanged(currentProcesses);
    }, [handleProcessesChanged, currentProcesses]);

    return (
        <div>
            <Grid container className={classes.newTsoContainerLabel}>
                <Grid item xs={12} sm={5}>
                    <FormattedMessage id="processes" />
                </Grid>
                <Grid item xs={12} sm={7}>
                    <FormattedMessage id="tsos" />
                </Grid>
            </Grid>
            {currentProcesses.map((process, index) => (
                <Grid
                    container
                    spacing={1}
                    className={classes.addNewTso}
                    key={process.id}
                >
                    {/* Process input*/}
                    <Grid container item xs={12} sm={5}>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth={true}
                                placeholder={intl.formatMessage({
                                    id: 'name',
                                })}
                                value={process.process}
                                InputProps={{
                                    classes: { input: classes.input },
                                }}
                                onChange={(e) =>
                                    handleProcessNameChanged(e, index)
                                }
                            />
                            <Autocomplete
                                id="select_business_process"
                                value={businessProcessList.indexOf(
                                    process.businessProcess
                                )}
                                disableClearable
                                autoHighlight
                                onChange={(event, newValue) => {
                                    handleBusinessProcessChanged(
                                        businessProcessList[newValue],
                                        index
                                    );
                                }}
                                options={Object.keys(businessProcessList)}
                                size="small"
                                style={{ marginTop: 15, marginBottom: 5 }}
                                getOptionLabel={(code) =>
                                    code !== -1 ? businessProcessList[code] : ''
                                }
                                getOptionSelected={(option, value) =>
                                    option.value === value.value
                                }
                                renderInput={(props) => (
                                    <TextField
                                        {...props}
                                        variant="outlined"
                                        placeholder={intl.formatMessage({
                                            id: 'businessProcess',
                                        })}
                                    />
                                )}
                            />

                            <RadioGroup
                                aria-label="runBalancesAdjustment"
                                name="runBalancesAdjustment"
                                value={process.runBalancesAdjustment + ''}
                                onChange={(e) =>
                                    handleProcessAlgorithmChanged(e, index)
                                }
                            >
                                <FormControlLabel
                                    value="true"
                                    control={<Radio />}
                                    label={intl.formatMessage({
                                        id: 'balanceAdjustment',
                                    })}
                                />
                                <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label={intl.formatMessage({
                                        id: 'loadflow',
                                    })}
                                />
                            </RadioGroup>
                        </Grid>
                        <Grid item xs={12} sm={4} align="center">
                            <IconButton
                                onClick={() => handleDeleteProcess(index)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    {/* Tso inputs */}
                    <Grid item xs={12} sm={7}>
                        <ProcessTsos
                            initialTsos={process.tsos}
                            processIndex={index}
                            handleProcessTsosChanged={handleProcessTsosChanged}
                        />
                    </Grid>
                </Grid>
            ))}
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <Button
                        fullWidth={true}
                        variant="outlined"
                        onClick={() => handleAddProcess()}
                        startIcon={<AddCircleIcon />}
                    >
                        <FormattedMessage id="addNewProcess" />
                    </Button>
                </Grid>
            </Grid>
        </div>
    );
};

const ProcessesConfiguration = ({ open, onClose, matchProcess }) => {
    const [processes, setProcesses] = useState([]);
    const configs = useSelector((state) => state.configs);
    const [confirmSave, setConfirmSave] = useState(false);
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        setConfirmSave(false);
    }, [open]);

    const saveButtonClicked = () => {
        if (processesToBeDeleted().length === 0) {
            handleSave();
        } else {
            setConfirmSave(true);
        }
    };

    const processesToBeDeleted = useCallback(() => {
        const initialProcesses = configs.map((e) => e.process);
        const currentProcesses = processes
            .filter((e) => e.process !== '')
            .map((e) => e.process);
        let toBeDeleted = [];

        for (let i = 0; i < initialProcesses.length; i++) {
            if (!currentProcesses.includes(initialProcesses[i])) {
                toBeDeleted.push(initialProcesses[i]);
            }
        }
        return toBeDeleted;
    }, [configs, processes]);

    const processDto = (process) => {
        return {
            process: process.process,
            businessProcess: process.businessProcess,
            runBalancesAdjustment: process.runBalancesAdjustment,
            tsos: process.tsos,
        };
    };

    const areDifferent = (initialProcess, currentProcess) => {
        let isDifferent = false;
        let processTsosWithoutId = currentProcess.tsos;

        processTsosWithoutId.every((e) => {
            let index = initialProcess.tsos.findIndex((res) => res === e);
            if (index === -1) {
                isDifferent = true;
                return false;
            }
            return true;
        });

        if (isDifferent) {
            return true;
        }

        initialProcess.tsos.every((e) => {
            let index = processTsosWithoutId.findIndex((res) => res === e);
            if (index === -1) {
                isDifferent = true;
                return false;
            }
            return true;
        });

        return (
            isDifferent ||
            initialProcess.runBalancesAdjustment !==
                currentProcess.runBalancesAdjustment ||
            initialProcess.businessProcess !== currentProcess.businessProcess
        );
    };

    const handleSave = () => {
        let promises = [];
        const listProcessesToBeDeleted = processesToBeDeleted();

        // DELETE PROCESSES
        listProcessesToBeDeleted.forEach((p) => {
            promises.push(deleteProcess(p));
        });

        for (let i = 0; i < processes.length; i++) {
            // ignore processes with no name
            if (
                processes[i].process === '' ||
                processes[i].businessProcess === ''
            ) {
                continue;
            }

            let initialProcess = configs.find(
                (element) => element.process === processes[i].process
            );

            if (typeof initialProcess === 'undefined') {
                // ADD NEW PROCESSES
                promises.push(createProcess(processDto(processes[i])));
                continue;
            }

            if (areDifferent(initialProcess, processes[i])) {
                // UPDATE PROCESSES
                promises.push(createProcess(processDto(processes[i])));
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

    const handleProcessesChanged = (processes) => {
        setProcesses(processes);
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
                        <FormattedMessage id="deletionProcessesTitle" />
                    ) : (
                        <FormattedMessage id="mergingProcessConfigurationTitle" />
                    )}
                </CustomDialogTitle>
                <DialogContent dividers>
                    {confirmSave ? (
                        <h3>
                            <FormattedMessage id="confirmMessage" />
                        </h3>
                    ) : (
                        <ProcessesContainer
                            initialConfigs={configs}
                            handleProcessesChanged={handleProcessesChanged}
                        />
                    )}
                    {confirmSave &&
                        processesToBeDeleted().map((e) => <h3 key={e}>{e}</h3>)}
                </DialogContent>
                <DialogActions>
                    <Button autoFocus size="small" onClick={onClose}>
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

ProcessesConfiguration.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    matchProcess: PropTypes.object,
};
export default ProcessesConfiguration;
