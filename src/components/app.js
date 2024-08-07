/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Navigate, Routes, Route, useNavigate, useLocation, useParams, useMatch } from 'react-router-dom';

import { selectTheme, selectTimelineDiagonalLabels, selectLanguage, selectComputedLanguage } from '../redux/actions';

import {
    AuthenticationRouter,
    CardErrorBoundary,
    getPreLoginPath,
    initializeAuthenticationProd,
} from '@gridsuite/commons-ui';
import { FormattedMessage } from 'react-intl';

import Process from './process';

import {
    connectNotificationsWsUpdateConfig,
    fetchAuthorizationCodeFlowFeatureFlag,
    fetchConfigParameter,
    fetchConfigParameters,
    fetchValidateUser,
} from '../utils/rest-api';

import {
    APP_NAME,
    COMMON_APP_NAME,
    PARAM_THEME,
    PARAM_LANGUAGE,
    PARAM_TIMELINE_DIAGONAL_LABELS,
} from '../utils/config-params';
import { getComputedLanguage } from '../utils/language';
import { useSnackMessage } from '@gridsuite/commons-ui';
import AppTopBar, { PREFIX_URL_PROCESSES } from './app-top-bar';

const noUserManager = { instance: null, error: null };

const ProcessRouteElement = () => {
    const configs = useSelector((state) => state.configs);
    const params = useParams();
    const processName = params.processName;

    function getProcessIndex(processName) {
        return configs.findIndex((c) => c.process === processName);
    }
    let index = getProcessIndex(processName);
    return index !== -1 ? (
        <Process index={index} />
    ) : (
        <h1>
            <FormattedMessage id="pageNotFound" />{' '}
        </h1>
    );
};

const App = () => {
    const { snackError } = useSnackMessage();

    const configs = useSelector((state) => state.configs);

    const user = useSelector((state) => state.user);

    const signInCallbackError = useSelector((state) => state.signInCallbackError);
    const authenticationRouterError = useSelector((state) => state.authenticationRouterError);
    const showAuthenticationRouterLogin = useSelector((state) => state.showAuthenticationRouterLogin);

    const [userManager, setUserManager] = useState(noUserManager);

    const navigate = useNavigate();

    const dispatch = useDispatch();

    const location = useLocation();

    // Can't use lazy initializer because useMatch is a hook
    const [initialMatchSilentRenewCallbackUrl] = useState(
        useMatch({
            path: '/silent-renew-callback',
        })
    );

    const [initialMatchSigninCallbackUrl] = useState(
        useMatch({
            path: '/sign-in-callback',
        })
    );

    const updateParams = useCallback(
        (params) => {
            console.debug('received UI parameters : ', params);
            params.forEach((param) => {
                switch (param.name) {
                    case PARAM_THEME:
                        dispatch(selectTheme(param.value));
                        break;
                    case PARAM_TIMELINE_DIAGONAL_LABELS:
                        dispatch(selectTimelineDiagonalLabels(param.value === 'true'));
                        break;
                    case PARAM_LANGUAGE:
                        dispatch(selectLanguage(param.value));
                        dispatch(selectComputedLanguage(getComputedLanguage(param.value)));
                        break;
                    default:
                }
            });
        },
        [dispatch]
    );

    useEffect(() => {
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    });

    useEffect(() => {
        fetchAuthorizationCodeFlowFeatureFlag()
            .then((authorizationCodeFlowEnabled) => {
                return initializeAuthenticationProd(
                    dispatch,
                    initialMatchSilentRenewCallbackUrl != null,
                    fetch('idpSettings.json'),
                    fetchValidateUser,
                    authorizationCodeFlowEnabled,
                    initialMatchSigninCallbackUrl != null
                );
            })
            .then((userManager) => {
                setUserManager({ instance: userManager, error: null });
            })
            .catch(function (error) {
                setUserManager({ instance: null, error: error.message });
            });
        // Note: initialMatchSilentRenewCallbackUrl and dispatch don't change
    }, [initialMatchSilentRenewCallbackUrl, dispatch, initialMatchSigninCallbackUrl]);

    const connectNotificationsUpdateConfig = useCallback(() => {
        const ws = connectNotificationsWsUpdateConfig();

        ws.onmessage = function (event) {
            let eventData = JSON.parse(event.data);
            if (eventData.headers && eventData.headers['parameterName']) {
                fetchConfigParameter(eventData.headers['parameterName'])
                    .then((param) => updateParams([param]))
                    .catch((error) =>
                        snackError({
                            messageTxt: error.message,
                            headerId: 'paramsRetrievingError',
                        })
                    );
            }
        };
        ws.onerror = function (event) {
            console.error('Unexpected Notification WebSocket error', event);
        };
        return ws;
    }, [updateParams, snackError]);

    useEffect(() => {
        if (user !== null) {
            fetchConfigParameters(COMMON_APP_NAME)
                .then((params) => updateParams(params))
                .catch((error) =>
                    snackError({
                        messageTxt: error.message,
                        headerId: 'paramsRetrievingError',
                    })
                );

            fetchConfigParameters(APP_NAME)
                .then((params) => updateParams(params))
                .catch((error) =>
                    snackError({
                        messageTxt: error.message,
                        headerId: 'paramsRetrievingError',
                    })
                );

            const ws = connectNotificationsUpdateConfig();
            return function () {
                ws.close();
            };
        }
    }, [user, dispatch, updateParams, connectNotificationsUpdateConfig, snackError]);

    return (
        <>
            <AppTopBar user={user} userManager={userManager} />
            <CardErrorBoundary>
                {user !== null ? (
                    <>
                        <Routes>
                            <Route
                                path={'/'}
                                element={
                                    configs.length > 0 && (
                                        <Navigate replace to={PREFIX_URL_PROCESSES + '/' + configs[0].process} />
                                    )
                                }
                            />
                            <Route
                                path="/sign-in-callback"
                                element={<Navigate replace to={getPreLoginPath() || '/'} />}
                            />
                            <Route
                                path="/logout-callback"
                                element={<h1>Error: logout failed; you are still logged in.</h1>}
                            />
                            <Route path={PREFIX_URL_PROCESSES + '/:processName'} element={<ProcessRouteElement />} />
                            <Route
                                path="*"
                                element={
                                    <h1>
                                        <FormattedMessage id="pageNotFound" />
                                    </h1>
                                }
                            />
                        </Routes>
                    </>
                ) : (
                    <AuthenticationRouter
                        userManager={userManager}
                        signInCallbackError={signInCallbackError}
                        authenticationRouterError={authenticationRouterError}
                        showAuthenticationRouterLogin={showAuthenticationRouterLogin}
                        dispatch={dispatch}
                        navigate={navigate}
                        location={location}
                    />
                )}
            </CardErrorBoundary>
        </>
    );
};

export default App;
