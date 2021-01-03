/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';

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
import { addConfigs, fetchMergeConfigs } from '../utils/api';
import { initProcesses } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

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
        minWidth: '800px',
    },
}))(Dialog);

const AreaTsos = ({ initialTsos, areaIndex, handleAreaTsosChanged }) => {
    const classes = useStyles();
    const intl = useIntl();

    const [areaTsos, setAreaTsos] = useState(
        initialTsos.length === 0
            ? [
                  ...initialTsos,
                  { sourcingActor: '', alternativeSourcingActor: '' },
              ]
            : initialTsos
    );

    useEffect(() => {
        console.log('handleAreaTsosChanged');
        handleAreaTsosChanged(areaIndex, areaTsos);
        // Do not add handleAreaTsosChanged as dep because if
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areaTsos]);

    const handleChangeTsoSourcingActor = (index, event) => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy[index] = {
            sourcingActor: event.target.value,
            alternativeSourcingActor:
                areaTsosCopy[index].alternativeSourcingActor,
        };
        setAreaTsos(areaTsosCopy);
    };

    const handleChangeTsoAlternativeSourcingActor = (index, event) => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy[index] = {
            sourcingActor: areaTsosCopy[index].sourcingActor,
            alternativeSourcingActor: event.target.value,
        };
        setAreaTsos(areaTsosCopy);
    };

    const handleAddAreaTso = () => {
        const areaTsosCopy = [...areaTsos];
        areaTsosCopy.push('');
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
                <Grid container spacing={2} key={`${index}`}>
                    <Grid item={true} xs={12} sm={5}>
                        <TextField
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
                    <Grid item={true} xs={12} sm={5}>
                        <TextField
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
                    <Grid item={true} xs={12} sm={2} align="center">
                        <IconButton onClick={() => handleRemoveFieldsTso()}>
                            <DeleteIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            ))}
            <Grid direction="row" container item xs={12} sm={10}>
                <Button
                    style={{ width: '100%' }}
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

const AreasContainer = ({ handleAreasWorkFlowsChanged, initialConfigs }) => {
    const classes = useStyles();
    const intl = useIntl();

    const [areasWorkFlows, setAreasWorkFlows] = useState([
        ...initialConfigs,
        {
            process: '',
            tsos: [],
            runBalancesAdjustment: false,
        },
    ]);

    function handleAddArea() {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy.push({
            process: '',
            tsos: [],
            runBalancesAdjustment: false,
        });
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    function handleAreaNameChanged(e, index) {
        const configsCopy = [...areasWorkFlows];
        configsCopy[index] = {
            process: e.target.value,
            tsos: configsCopy[index].tsos,
            runBalancesAdjustment: configsCopy[index].runBalancesAdjustment,
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
            process: areasWorkFlowsCopy[index].process,
            tsos: tsosList,
            runBalancesAdjustment:
                areasWorkFlowsCopy[index].runBalancesAdjustment,
        };
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    useEffect(() => {
        console.log('handleAreasWorkFlowsChanged');
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
                    <FormattedMessage id="area" />
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
                <Grid container className={classes.addNewTso} key={`${index}`}>
                    {/* Area input*/}
                    <Grid container item xs={12} sm={5}>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                placeholder={intl.formatMessage({ id: 'area' })}
                                value={areasWorkFlow.process}
                                InputProps={{
                                    classes: { input: classes.input },
                                }}
                                onChange={(e) =>
                                    handleAreaNameChanged(e, index)
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={3} align="center">
                            <IconButton onClick={() => handleDeleteArea(index)}>
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                    {/* Tso inputs */}
                    <Grid container item xs={12} sm={7} spacing={1}>
                        <AreaTsos
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
                    <FormattedMessage id="addNewArea" />
                </Button>
            </Grid>
        </Grid>
    );
};

const WorkFlowsConfiguration = ({ open, onClose }) => {
    const [areasWorkFlows, setAreasWorkFlows] = useState([]);
    const configs = useSelector((state) => state.configs);
    const dispatch = useDispatch();
    const history = useHistory();

    const handleClose = () => {
        onClose();
    };

    const handleSave = () => {
        addConfigs(areasWorkFlows).then(() => {
            fetchMergeConfigs().then((configs) => {
                dispatch(initProcesses(configs));
                onClose();
                history.replace('/');
            });
        });
    };

    const handleAreasWorkFlowsChanged = (areas) => {
        setAreasWorkFlows(areas);
    };

    return (
        <CustomDialog open={open} onClose={handleClose}>
            <CustomDialogTitle id="form-dialog-title" onClose={handleClose}>
                <FormattedMessage id="configurationWorkflowsTitle" />
            </CustomDialogTitle>
            <DialogContent dividers>
                <AreasContainer
                    initialConfigs={configs}
                    handleAreasWorkFlowsChanged={handleAreasWorkFlowsChanged}
                />
            </DialogContent>
            <DialogActions>
                <Button autoFocus size="small" onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button variant="outlined" size="small" onClick={handleSave}>
                    <FormattedMessage id="save" />
                </Button>
            </DialogActions>
        </CustomDialog>
    );
};

WorkFlowsConfiguration.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
export default WorkFlowsConfiguration;