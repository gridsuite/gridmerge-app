/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { FormattedMessage } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getExportMergeUrl } from '../utils/api';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
    download: {
        display: 'grid',
        float: 'right',
        position: 'absolute',
        bottom: '0',
        padding: '10px 10px 10px 10px',
        backgroundColor: theme.palette.background.paper,
    },
    downloadLabel: {
        fontSize: '15px',
    },
    downloadLabelDisabled: {
        color: '#ffffff4d',
    },
}));

const DownloadButton = (props) => {
    const DownloadIframe = 'downloadIframe';

    const classes = useStyles();

    const handleClickExport = () => {
        console.info('Downloading merge ' + props.merge.process + '...');
        // The getTimezoneOffset() method returns the difference, in minutes, between UTC and local time.
        // The offset is positive if the local timezone is behind UTC and negative if it is ahead
        // On service side, the opposite behaviour is expected (offset is expected to be negative if the local timezone is behind UTC and positive if it is ahead)
        // This explains the "-" sign to get the expected offset value for the service
        window.open(
            getExportMergeUrl(
                props.merge.process,
                new Date(props.merge.date).toISOString(),
                -new Date().getTimezoneOffset()
            ),
            DownloadIframe
        );
    };

    const disabled = !props.merge;

    return (
        <div className={classes.download}>
            <IconButton
                aria-label="download"
                onClick={handleClickExport}
                disabled={disabled}
            >
                <GetAppIcon fontSize="large" />
            </IconButton>
            <span className={disabled ? classes.downloadLabelDisabled : ''}>
                <FormattedMessage id="download" />
                <span> CGM</span>
            </span>
            <iframe
                title="download"
                id={DownloadIframe}
                name={DownloadIframe}
                style={{ visibility: 'hidden', width: 0, height: 0 }}
            />
        </div>
    );
};

DownloadButton.propTypes = {
    merge: PropTypes.shape({
        process: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
    }),
};

export default DownloadButton;
