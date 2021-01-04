/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import { List } from '@material-ui/core';
import PropTypes from 'prop-types';
import CountryStateItem from './country-state-item';
import { MergeType } from '../utils/api';

const CountryStatesList = (props) => {
    return (
        <List>
            {props.tsos.map((tso) => (
                <CountryStateItem
                    key={tso.sourcingActor}
                    tso={tso}
                    merge={props.merge}
                />
            ))}
        </List>
    );
};

CountryStatesList.propTypes = {
    tsos: PropTypes.arrayOf(PropTypes.object).isRequired,
    merge: MergeType,
};

export default CountryStatesList;
