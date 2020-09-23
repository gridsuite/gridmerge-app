/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';

import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { FormattedMessage } from 'react-intl';
import GetAppIcon from '@material-ui/icons/GetApp';

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

const DownloadButton = () => {
    const classes = useStyles();
    return (
        <div className={classes.download}>
            <IconButton aria-label="download">
                <GetAppIcon fontSize="large" />
            </IconButton>
            <span>
                <FormattedMessage id="download" />
                <span> CGM</span>
            </span>
        </div>
    );
};

export default DownloadButton;
