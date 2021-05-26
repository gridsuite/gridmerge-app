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
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import {
    createProcess,
    deleteProcess,
    fetchMergeConfigs,
    fetchTsosList,
    fetchBusinessProcessesList,
    fetchBoundariesList,
} from '../utils/rest-api';
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
    tsosList,
    processIndex,
    handleProcessTsosChanged,
    authorizedTsosCodes,
}) => {
    const intl = useIntl();

    const handleTsoSourcingActorChanged = (newValue, index) => {
        const processTsosCopy = [...tsosList];
        processTsosCopy[index].name = newValue;
        handleProcessTsosChanged(processIndex, processTsosCopy);
    };

    const handleAddProcessTso = () => {
        const processTsosCopy = [...tsosList];
        processTsosCopy.push({ name: '', reactKey: keyGenerator() });
        handleProcessTsosChanged(processIndex, processTsosCopy);
    };

    const handleRemoveProcessTso = (index) => {
        const processTsosCopy = [...tsosList];
        processTsosCopy.splice(index, 1);
        handleProcessTsosChanged(processIndex, processTsosCopy);
    };

    return (
        <>
            {tsosList.map((tso, index) => (
                <Grid container spacing={2} key={tso.reactKey}>
                    <Grid item xs={12} sm={10}>
                        <Autocomplete
                            id="select_tsos_process"
                            value={authorizedTsosCodes.indexOf(tso.name)}
                            disableClearable
                            autoHighlight
                            onChange={(event, newValue) => {
                                handleTsoSourcingActorChanged(
                                    authorizedTsosCodes[newValue],
                                    index
                                );
                            }}
                            options={Object.keys(authorizedTsosCodes)}
                            getOptionLabel={(code) =>
                                code !== -1 ? authorizedTsosCodes[code] : ''
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

const ProcessBoundarySet = ({
    process,
    processIndex,
    handleProcessUseBoundarySetChanged,
    handleProcessEqBoundarySetChanged,
    handleProcessTpBoundarySetChanged,
    boundaries,
}) => {
    const intl = useIntl();

    const [disabledBoundaries, setDisabledBoundaries] = useState(true);

    useEffect(() => {
        setDisabledBoundaries(process.useLastBoundarySet);
    }, [process.useLastBoundarySet]);

    return (
        <>
            <RadioGroup
                row
                aria-label="useBoundarySet"
                name="useBoundarySet"
                value={
                    process.useLastBoundarySet !== null
                        ? process.useLastBoundarySet + ''
                        : 'true'
                }
                onChange={(e) => {
                    handleProcessUseBoundarySetChanged(e, processIndex);
                    setDisabledBoundaries(e.target.value === 'true');
                }}
            >
                <FormControlLabel
                    row="true"
                    value="true"
                    control={<Radio />}
                    label={intl.formatMessage({
                        id: 'lastBoundarySet',
                    })}
                />
                <FormControlLabel
                    row="true"
                    value="false"
                    control={<Radio />}
                    label={intl.formatMessage({
                        id: 'specificBoundarySet',
                    })}
                />
            </RadioGroup>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={10}>
                    <Autocomplete
                        disabled={disabledBoundaries}
                        id="select_eq_boundary"
                        value={
                            process.eqBoundary !== null
                                ? process.eqBoundary
                                : null
                        }
                        disableClearable
                        autoHighlight
                        onChange={(event, newValue) => {
                            handleProcessEqBoundarySetChanged(
                                newValue,
                                processIndex
                            );
                        }}
                        options={boundaries.filter((b) =>
                            b.filename.match(/^.*__ENTSOE_EQBD.*$/)
                        )}
                        getOptionLabel={(boundary) => boundary.filename}
                        getOptionSelected={(option, value) =>
                            option.filename === value.filename
                        }
                        size="small"
                        renderInput={(props) => (
                            <TextField
                                {...props}
                                variant="outlined"
                                placeholder={intl.formatMessage({
                                    id: 'eqBoundary',
                                })}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={10}>
                    <Autocomplete
                        disabled={disabledBoundaries}
                        id="select_tp_boundary"
                        value={
                            process.tpBoundary !== null
                                ? process.tpBoundary
                                : null
                        }
                        disableClearable
                        autoHighlight
                        onChange={(event, newValue) => {
                            handleProcessTpBoundarySetChanged(
                                newValue,
                                processIndex
                            );
                        }}
                        options={boundaries.filter((b) =>
                            b.filename.match(/^.*__ENTSOE_TPBD.*$/)
                        )}
                        getOptionLabel={(boundary) => boundary.filename}
                        getOptionSelected={(option, value) =>
                            option.filename === value.filename
                        }
                        size="small"
                        renderInput={(props) => (
                            <TextField
                                {...props}
                                variant="outlined"
                                placeholder={intl.formatMessage({
                                    id: 'tpBoundary',
                                })}
                            />
                        )}
                    />
                </Grid>
            </Grid>
        </>
    );
};

const ProcessesContainer = ({ handleProcessesChanged, currentProcess }) => {
    const classes = useStyles();
    const intl = useIntl();

    const [authorizedTsosCodes, setAuthorizedTsosCodes] = useState([]);
    const [
        authorizedBusinessProcesses,
        setAuthorizedBusinessProcesses,
    ] = useState([]);
    const [boundaries, setBoundaries] = useState([]);

    function handleAddProcess() {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy.push({
            processUuid: keyGenerator(),
            process: '',
            businessProcess: '',
            tsos: [{ name: '', reactKey: keyGenerator() }],
            runBalancesAdjustment: false,
            useLastBoundarySet: true,
        });
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleProcessNameChanged(e, index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ process: e.target.value },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleBusinessProcessChanged(newValue, index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ businessProcess: newValue },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleProcessAlgorithmChanged(e, index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ runBalancesAdjustment: e.target.value },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleProcessUseBoundarySetChanged(e, index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ useLastBoundarySet: e.target.value === 'true' },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleProcessEqBoundarySetChanged(value, index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ eqBoundary: value },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleProcessTpBoundarySetChanged(value, index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ tpBoundary: value },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleDeleteProcess(index) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy.splice(index, 1);
        handleProcessesChanged(currentProcessesCopy);
    }

    function handleProcessTsosChanged(index, tsosList) {
        const currentProcessesCopy = [...currentProcess];
        currentProcessesCopy[index] = {
            ...currentProcessesCopy[index],
            ...{ tsos: tsosList },
        };
        handleProcessesChanged(currentProcessesCopy);
    }

    useEffect(() => {
        // fetching list of authorized business processes and tsos codes
        fetchBusinessProcessesList().then((res) => {
            setAuthorizedBusinessProcesses(res);
        });
        fetchTsosList().then((res) => {
            setAuthorizedTsosCodes(res);
        });
        // fetching list of boundaries
        fetchBoundariesList().then((res) => {
            setBoundaries(res);
        });
    }, []);

    return (
        <div>
            <Grid container className={classes.newTsoContainerLabel}>
                <Grid item xs={12} sm={7}>
                    <FormattedMessage id="processes" />
                </Grid>
                <Grid item xs={12} sm={5}>
                    <FormattedMessage id="tsos" />
                </Grid>
            </Grid>
            {currentProcess.map((process, index) => (
                <Grid
                    container
                    spacing={1}
                    className={classes.addNewTso}
                    key={process.processUuid}
                >
                    {/* Process input*/}
                    <Grid container item xs={12} sm={7}>
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
                                value={authorizedBusinessProcesses.indexOf(
                                    process.businessProcess
                                )}
                                disableClearable
                                autoHighlight
                                onChange={(event, newValue) => {
                                    handleBusinessProcessChanged(
                                        authorizedBusinessProcesses[newValue],
                                        index
                                    );
                                }}
                                options={Object.keys(
                                    authorizedBusinessProcesses
                                )}
                                size="small"
                                style={{ marginTop: 15, marginBottom: 5 }}
                                getOptionLabel={(code) =>
                                    code !== -1
                                        ? authorizedBusinessProcesses[code]
                                        : ''
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
                                row
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
                            <ProcessBoundarySet
                                process={process}
                                processIndex={index}
                                handleProcessUseBoundarySetChanged={
                                    handleProcessUseBoundarySetChanged
                                }
                                handleProcessEqBoundarySetChanged={
                                    handleProcessEqBoundarySetChanged
                                }
                                handleProcessTpBoundarySetChanged={
                                    handleProcessTpBoundarySetChanged
                                }
                                boundaries={boundaries}
                            />
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
                    <Grid item xs={12} sm={5}>
                        <ProcessTsos
                            tsosList={process.tsos}
                            processIndex={index}
                            handleProcessTsosChanged={handleProcessTsosChanged}
                            authorizedTsosCodes={authorizedTsosCodes}
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

function addReactKeyToProcesses(list) {
    return list.map(({ tsos, ...item }) => {
        return {
            ...item,
            tsos: tsos.map((tso) => {
                return {
                    name: tso,
                    reactKey: keyGenerator(),
                };
            }),
        };
    });
}

const ProcessesConfigurationDialog = ({ open, onClose, matchProcess }) => {
    const configs = useSelector((state) => state.configs);
    const [processes, setProcesses] = useState([]);
    const [confirmSave, setConfirmSave] = useState(false);
    const dispatch = useDispatch();
    const history = useHistory();

    useEffect(() => {
        setConfirmSave(false);
    }, [open]);

    useEffect(() => setProcesses(addReactKeyToProcesses(configs)), [configs]);

    const saveButtonClicked = () => {
        if (processesToBeDeleted().length === 0) {
            handleSave();
        } else {
            setConfirmSave(true);
        }
    };

    const processesToBeDeleted = useCallback(() => {
        const initialProcesses = configs.map((e) => {
            return { processUuid: e.processUuid, process: e.process };
        });
        const currentProcesses = processes
            .filter((e) => e.process !== '')
            .map((e) => {
                return { processUuid: e.processUuid, process: e.process };
            });
        let toBeDeleted = [];

        for (let i = 0; i < initialProcesses.length; i++) {
            if (
                !currentProcesses.find(
                    (e) => e.processUuid === initialProcesses[i].processUuid
                )
            ) {
                toBeDeleted.push(initialProcesses[i]);
            }
        }
        return toBeDeleted;
    }, [configs, processes]);

    const processDto = (process) => {
        return {
            processUuid: process.processUuid,
            process: process.process,
            businessProcess: process.businessProcess,
            runBalancesAdjustment: process.runBalancesAdjustment,
            useLastBoundarySet: process.useLastBoundarySet,
            eqBoundary: !process.useLastBoundarySet
                ? process.eqBoundary
                : undefined,
            tpBoundary: !process.useLastBoundarySet
                ? process.tpBoundary
                : undefined,
            tsos: process.tsos.map((tso) => tso.name),
        };
    };

    const isBoundaryIdentical = (initialBoundary, currentBoundary) => {
        return (
            (initialBoundary == null && currentBoundary == null) ||
            (initialBoundary !== null &&
                currentBoundary !== null &&
                initialBoundary.filename === currentBoundary.filename)
        );
    };

    const areDifferent = (initialProcess, currentProcess) => {
        const initialsTSOs = new Set(initialProcess.tsos);
        const currentTSOs = new Set(
            [...currentProcess.tsos].map((tso) => tso.name)
        );
        const areTsoListsIdentical =
            initialsTSOs.size === currentTSOs.size &&
            [...currentTSOs].every((tso) => initialsTSOs.has(tso));

        const isEqBoundaryIdentical = isBoundaryIdentical(
            initialProcess.eqBoundary,
            currentProcess.eqBoundary
        );
        const isTpBoundaryIdentical = isBoundaryIdentical(
            initialProcess.tpBoundary,
            currentProcess.tpBoundary
        );

        return (
            !areTsoListsIdentical ||
            initialProcess.useLastBoundarySet !==
                currentProcess.useLastBoundarySet ||
            !isEqBoundaryIdentical ||
            !isTpBoundaryIdentical ||
            initialProcess.runBalancesAdjustment !==
                currentProcess.runBalancesAdjustment ||
            initialProcess.businessProcess !== currentProcess.businessProcess ||
            initialProcess.process !== currentProcess.process
        );
    };

    const handleSave = () => {
        let promises = [];
        const listProcessesToBeDeleted = processesToBeDeleted();

        // DELETE PROCESSES
        listProcessesToBeDeleted.forEach((p) => {
            promises.push(deleteProcess(p.processUuid));
        });
        for (let i = 0; i < processes.length; i++) {
            // ignore processes with no name, and also processes using specific boundary and no EQ and TP boundary giver
            if (
                processes[i].process === '' ||
                processes[i].businessProcess === '' ||
                (!processes[i].useLastBoundarySet &&
                    (processes[i].eqBoundary == null ||
                        processes[i].tpBoundary == null))
            ) {
                continue;
            }

            let initialProcess = configs.find(
                (element) => element.processUuid === processes[i].processUuid
            );

            if (initialProcess == null) {
                let newProcess = processes[i];
                newProcess.processUuid = null;
                // ADD NEW PROCESSES
                promises.push(createProcess(processDto(newProcess)));
                continue;
            }

            if (areDifferent(initialProcess, processes[i])) {
                // UPDATE PROCESSES
                promises.push(createProcess(processDto(processes[i])));
            }
        }

        Promise.all(promises)
            .then(fetchMergeConfigs)
            .then((configs) => {
                dispatch(initProcesses(configs));
                if (
                    matchProcess !== null &&
                    (listProcessesToBeDeleted.includes(
                        matchProcess.params.processName
                    ) ||
                        !configs.includes(matchProcess.params.processName))
                ) {
                    history.replace('/');
                }
                onClose();
            });
    };

    const handleProcessesChanged = (processes) => {
        setProcesses(processes);
    };

    const cancel = () => {
        setProcesses(addReactKeyToProcesses(configs));
        onClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={cancel}
                maxWidth={'lg'}
                fullWidth={true}
            >
                <CustomDialogTitle id="form-dialog-title" onClose={cancel}>
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
                            currentProcess={processes}
                            handleProcessesChanged={handleProcessesChanged}
                        />
                    )}
                    {confirmSave &&
                        processesToBeDeleted().map((e) => (
                            <h3 key={e.processUuid}>{e.process}</h3>
                        ))}
                </DialogContent>
                <DialogActions>
                    <Button autoFocus size="small" onClick={cancel}>
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

ProcessesConfigurationDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    matchProcess: PropTypes.object,
};
export default ProcessesConfigurationDialog;
