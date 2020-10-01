/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { FormattedMessage } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getExportMergeUrl } from '../utils/api';
import { IgmStatus } from './merge-map';

const useStyles = makeStyles(() => ({
    download: {
        display: 'grid',
        float: 'right',
        position: 'absolute',
        bottom: '0',
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

    const merge = useSelector((state) => state.merge);

    const [isDisabled, setDisabled] = useState(true);

    useEffect(() => {
        let disabled = !(merge.date && merge.process);
        merge.igms.forEach((igm) => {
            if (igm.status !== IgmStatus.MERGED) {
                disabled = true;
            }
        });
        setDisabled(disabled);
    }, [merge]);

    const handleClickExport = () => {
        console.info('Downloading merge' + merge.process + '...');
        window.open(
            getExportMergeUrl(merge.process, merge.date.toISOString()),
            DownloadIframe
        );
    };

    return (
        <div className={classes.download}>
            <IconButton
                aria-label="download"
                onClick={handleClickExport}
                disabled={isDisabled}
            >
                <GetAppIcon fontSize="large" />
            </IconButton>
            <span className={isDisabled ? classes.downloadLabelDisabled : ''}>
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

export default DownloadButton;
