/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import PropTypes from 'prop-types';

const classes = {
    formControl: {
        minWidth: 300,
    },
};

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
    processUuid,
    date,
    title,
    getDownloadUrl,
    formats,
    errorMessage,
}) => {
    const [selectedFormat, setSelectedFormat] = useState('');
    const [exportStudyErr, setExportStudyErr] = useState('');

    const handleClick = () => {
        console.debug('Request for exporting in format: ' + selectedFormat);
        if (selectedFormat) {
            const url = getDownloadUrl(
                processUuid,
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
                <FormControl sx={classes.formControl}>
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
                        {formats?.map(function (element) {
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
