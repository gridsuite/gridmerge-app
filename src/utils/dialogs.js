/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import React from 'react';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Alert from '@material-ui/lab/Alert';

/**
 * Dialog to export the network case #TODO To be moved in the common-ui repository once it has been created
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the export
 * @param studyName the name of the study to export
 * @param {String} title Title of the dialog
 * @param {String} message Message of the dialog
 */
const ExportDialog = ({
    open,
    onClose,
    onClick,
    process,
    date,
    title,
    getDownloadUrl,
    formats,
    errorMessage,
}) => {
    const [selectedFormat, setSelectedFormat] = React.useState('');
    const [exportStudyErr, setExportStudyErr] = React.useState('');

    const useStyles = makeStyles(() => ({
        formControl: {
            minWidth: 300,
        },
    }));

    const classes = useStyles();

    const handleClick = () => {
        console.debug('Request for exporting in format: ' + selectedFormat);
        if (selectedFormat) {
            const url = getDownloadUrl(
                process,
                new Date(date).toISOString(),
                selectedFormat
            );
            onClick(url);
        } else {
            setExportStudyErr(errorMessage);
        }
    };

    const handleClose = () => {
        setExportStudyErr('');
        onClose();
    };

    const handleExited = () => {
        setExportStudyErr('');
        setSelectedFormat('');
    };

    const handleChange = (event) => {
        setSelectedFormat(event.target.value);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            onExited={handleExited}
            aria-labelledby="dialog-title-export"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <FormControl className={classes.formControl}>
                    <InputLabel id="select-format-label">
                        <FormattedMessage id="exportFormat" />
                    </InputLabel>
                    <Select
                        labelId="select-format-label"
                        id="controlled-select-format"
                        defaultValue=""
                        onChange={handleChange}
                        inputProps={{
                            id: 'select-format',
                        }}
                    >
                        {formats &&
                            formats.map(function (element) {
                                return (
                                    <MenuItem key={element} value={element}>
                                        {element}
                                    </MenuItem>
                                );
                            })}
                    </Select>
                </FormControl>
                {exportStudyErr && (
                    <Alert severity="error">{exportStudyErr}</Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleClick}
                    variant="outlined"
                    disabled={!selectedFormat}
                >
                    <FormattedMessage id="export" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ExportDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export { ExportDialog };
