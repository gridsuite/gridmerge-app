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

    const [fieldsTso, setFieldsTso] = useState([
        { sourcingActor: '', alternativeSourcingActor: '' },
    ]);

    useEffect(() => {
        handleAreaTsosChanged(areaIndex, fieldsTso);
    }, [fieldsTso]);

    useEffect(() => {
        if (initialTsos.length !== 0) {
            setFieldsTso(initialTsos);
        }
    }, [initialTsos]);

    const handleChangeTsoSourcingActor = (index, event) => {
        const values = [...fieldsTso];
        values[index].sourcingActor = event.target.value;
        setFieldsTso(values);
    };

    const handleChangeTsoAlternativeSourcingActor = (index, event) => {
        const values = [...fieldsTso];
        values[index].alternativeSourcingActor = event.target.value;
        setFieldsTso(values);
    };

    const handleAddFieldsTso = () => {
        const values = [...fieldsTso];
        values.push({ sourcingActor: '', alternativeSourcingActor: '' });
        setFieldsTso(values);
    };

    const handleRemoveFieldsTso = (index) => {
        const input = [...fieldsTso];
        input.splice(index, 1);
        setFieldsTso(input);
    };

    return (
        <>
            {fieldsTso.map((tso, index) => (
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
                    onClick={() => handleAddFieldsTso()}
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

const AreasContainer = ({ handleAreasWorkFlowsChanged }) => {
    const classes = useStyles();
    const intl = useIntl();

    const [areasWorkFlows, setAreasWorkFlows] = useState([
        { areaName: '', tsos: [] },
    ]);

    function handleAddArea() {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy.push({ areaName: '', tsos: [] });
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    function handleAreaNameChanged(e, index) {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy[index].areaName = e.target.value;
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    function handleDeleteArea(index) {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy.splice(index, 1);
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    function handleAreaTsosChanged(index, tsosList) {
        const areasWorkFlowsCopy = [...areasWorkFlows];
        areasWorkFlowsCopy[index].tsos = tsosList;
        setAreasWorkFlows(areasWorkFlowsCopy);
    }

    useEffect(() => {
        handleAreasWorkFlowsChanged(areasWorkFlows);
    }, [areasWorkFlows]);

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
                                value={areasWorkFlow.areaName}
                                InputProps={{
                                    classes: { input: classes.input },
                                }}
                                onChange={(e) =>
                                    handleAreaNameChanged(e, index)
                                }
                            />
                        </Grid>
                        <Grid item xs={12} sm={3} align="center">
                            <IconButton>
                                <DeleteIcon
                                    onClick={() => handleDeleteArea(index)}
                                />
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

const WorkflowsConfiguration = ({ open, onClose }) => {
    const [areasWorkFlows, setAreasWorkFlows] = useState([]);

    const handleClose = () => {
        onClose();
    };

    const handleSave = () => {
        console.log('Save: ', areasWorkFlows);
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

WorkflowsConfiguration.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
export default WorkflowsConfiguration;
