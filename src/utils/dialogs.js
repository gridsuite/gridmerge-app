/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import { FormattedMessage, useIntl } from 'react-intl';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Alert from '@material-ui/lab/Alert';
import { getExportMergeUrl } from './api';

/**
 * Dialog to export the network case #TODO To be moved in the common-ui repository once it has been created
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the export
 * @param studyName the name of the study to export
 * @param {String} title Title of the dialog
 * @param {String} message Message of the dialog
 */
const ExportDialog = ({ open, onClose, onClick, process, date, title }) => {
    const availableFormats = ['CGMES', 'XIIDM'];
    const [selectedFormat, setSelectedFormat] = React.useState(availableFormats);
    const [loading, setLoading] = React.useState(false);
    const [downloadUrl, setDownloadUrl] = React.useState('');
    const [exportStudyErr, setExportStudyErr] = React.useState('');

    const useStyles = makeStyles(() => ({
        formControl: {
            minWidth: 300,
        },
    }));

    const handleClick = () => {
        console.debug('Request for exporting in format: ' + selectedFormat);
        if (selectedFormat) {
            setLoading(true);
            onClick(downloadUrl);
        } else {
            setExportStudyErr(
                intl.formatMessage({ id: 'exportStudyErrorMsg' })
            );
        }
    };

    const handleClose = () => {
        setExportStudyErr('');
        setLoading(false);
        onClose();
    };

    const handleExited = () => {
        setExportStudyErr('');
        setSelectedFormat('');
        setLoading(false);
        setDownloadUrl('');
    };

    const handleChange = (event) => {
        console.log('BEGIN Download url =>', downloadUrl);
        let selected = event.target.value;
        console.log('selected=>', selected);
        setSelectedFormat(selected);
        console.log('selectedFormat=>', selectedFormat);
        const url = getExportMergeUrl(
            process,
            new Date(date).toISOString(),
            -new Date().getTimezoneOffset(),
            selected
        );
        console.log('BUILD URL =>', url);
        setDownloadUrl(url);
        console.log('END Download url =>', downloadUrl);
    };

    const classes = useStyles();
    const intl = useIntl();

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
                        onChange={handleChange}
                        inputProps={{
                            id: 'select-format',
                        }}
                    >
                        {availableFormats !== '' &&
                            availableFormats.map(function (element) {
                                return (
                                    <MenuItem key={element} value={element}>
                                        {element}
                                    </MenuItem>
                                );
                            })}
                    </Select>
                </FormControl>
                {exportStudyErr !== '' && (
                    <Alert severity="error">{exportStudyErr}</Alert>
                )}
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '5px',
                        }}
                    >
                        <CircularProgress />
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
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
