/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import { useSnackbar } from 'notistack';

const NotificationMessageSnackBar = (message) => {
    const { enqueueSnackbar } = useSnackbar();
    const data = message.message;

    useEffect(() => {
        window.__MUI_USE_NEXT_TYPOGRAPHY_VARIANTS__ = true;
        if (data.message) {
            enqueueSnackbar(data.message, { variant: 'error' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.message]);

    return <Paper></Paper>;
};

export default NotificationMessageSnackBar;
