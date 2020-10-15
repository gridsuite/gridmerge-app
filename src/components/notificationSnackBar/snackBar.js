/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { createRef } from 'react';

import { SnackbarProvider } from 'notistack';
import NotificationMessageSnackBar from './notificationSnackBar';
import Button from '@material-ui/core/Button';

const CustomNotificationSnackBar = (message) => {
    const notistackRef = createRef();

    const onClickDismiss = (key) => () => {
        notistackRef.current.closeSnackbar(key);
    };

    return (
        <SnackbarProvider
            maxSnack={0}
            anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
            hideIconVariant
            ref={notistackRef}
            action={(key) => (
                <Button
                    onClick={onClickDismiss(key)}
                    style={{ color: '#fff', fontSize: '20px' }}
                >
                    ✖
                </Button>
            )}
        >
            <NotificationMessageSnackBar message={message} />
        </SnackbarProvider>
    );
};

export default CustomNotificationSnackBar;
